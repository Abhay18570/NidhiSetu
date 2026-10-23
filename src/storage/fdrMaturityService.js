/**
 * NidhiSetu FDR Maturity Tracking & Alert Service
 * Calendar-date-safe calculations for deposit tenure, maturity badges,
 * and idempotent client-side renewal notifications.
 */

import { notificationRepository } from './notificationRepository';

export const MATURITY_CATEGORY = {
  ACTIVE: 'ACTIVE',
  APPROACHING: 'APPROACHING',
  MATURES_SOON: 'MATURES_SOON',
  MATURED: 'MATURED',
};

/**
 * Normalizes a date string or Date object to a UTC midnight calendar timestamp.
 * Eliminates daylight savings and timezone off-by-one errors.
 */
export function normalizeToCalendarDate(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/**
 * Calculates calendar days remaining until maturity
 * Negative number indicates deposit has already matured.
 */
export function getDaysUntilMaturity(maturityDateStr, referenceDate = new Date()) {
  const maturityCal = normalizeToCalendarDate(maturityDateStr);
  const todayCal = normalizeToCalendarDate(referenceDate);
  if (!maturityCal || !todayCal) return 0;

  const diffMs = maturityCal.getTime() - todayCal.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Classifies an FDR's maturity status into one of four standard categories
 */
export function getMaturityCategory(maturityDateStr, referenceDate = new Date()) {
  const days = getDaysUntilMaturity(maturityDateStr, referenceDate);
  if (days < 0) return MATURITY_CATEGORY.MATURED;
  if (days <= 30) return MATURITY_CATEGORY.MATURES_SOON;
  if (days <= 90) return MATURITY_CATEGORY.APPROACHING;
  return MATURITY_CATEGORY.ACTIVE;
}

/**
 * Returns UI badge styling and human-readable text for maturity state
 */
export function getMaturityBadgeConfig(maturityDateStr, referenceDate = new Date()) {
  const days = getDaysUntilMaturity(maturityDateStr, referenceDate);
  const category = getMaturityCategory(maturityDateStr, referenceDate);

  switch (category) {
    case MATURITY_CATEGORY.MATURED:
      return {
        category,
        days,
        label: `Matured (${Math.abs(days)}d ago)`,
        badgeVariant: 'red',
        colorClass: 'text-rose-700 bg-rose-50 border-rose-200',
        alertLevel: 'urgent',
      };
    case MATURITY_CATEGORY.MATURES_SOON:
      return {
        category,
        days,
        label: `Matures in ${days} days`,
        badgeVariant: 'saffron',
        colorClass: 'text-amber-800 bg-amber-50 border-amber-200',
        alertLevel: 'high',
      };
    case MATURITY_CATEGORY.APPROACHING:
      return {
        category,
        days,
        label: `Approaching (${days}d)`,
        badgeVariant: 'blue',
        colorClass: 'text-[#174EA6] bg-[#E8F0FE] border-[#B5C7DF]',
        alertLevel: 'medium',
      };
    case MATURITY_CATEGORY.ACTIVE:
    default:
      return {
        category,
        days,
        label: `Active (${days}d remaining)`,
        badgeVariant: 'green',
        colorClass: 'text-[#13805E] bg-[#E6F4EA] border-[#A8DAB5]',
        alertLevel: 'normal',
      };
  }
}

/**
 * Evaluates active FDR records and creates idempotent in-app maturity reminders.
 * Scans once per session threshold (90, 60, 30 days, or matured) to prevent notification spam.
 */
export async function evaluateAndGenerateMaturityReminders(fdrs = [], userId = null) {
  if (!Array.isArray(fdrs) || fdrs.length === 0) return 0;

  let generatedCount = 0;
  const existingNotifications = await notificationRepository.getNotificationsForRole('institution');

  for (const fdr of fdrs) {
    // Only accepted or submitted FDRs are relevant for deposit maturity
    if (!['REVIEW_ACCEPTED', 'SUBMITTED', 'UNDER_REVIEW'].includes(fdr.status)) {
      continue;
    }

    const days = getDaysUntilMaturity(fdr.maturityDate);
    let thresholdKey = null;

    if (days < 0) {
      thresholdKey = 'matured';
    } else if (days <= 30) {
      thresholdKey = '30d';
    } else if (days <= 60) {
      thresholdKey = '60d';
    } else if (days <= 90) {
      thresholdKey = '90d';
    }

    if (!thresholdKey) continue;

    // Check if a reminder for this fdrId + threshold already exists
    const alreadySent = existingNotifications.some(
      (n) => n.category === 'renewal' && n.metadata?.fdrId === fdr.id && n.metadata?.threshold === thresholdKey
    );

    if (!alreadySent) {
      const title = thresholdKey === 'matured'
        ? `FDR Matured: ${fdr.referenceNumber || fdr.fdrNumber}`
        : `Maturity Notice: ${fdr.referenceNumber || fdr.fdrNumber} (${days} days left)`;

      const message = thresholdKey === 'matured'
        ? `Security deposit receipt #${fdr.fdrNumber} (${fdr.bankName}) has matured. Please initiate renewal or discharge submission.`
        : `Security deposit receipt #${fdr.fdrNumber} issued by ${fdr.bankName} approaches maturity on ${new Date(fdr.maturityDate).toLocaleDateString()}.`;

      await notificationRepository.createNotification({
        userId: userId || fdr.submittedBy || null,
        role: 'institution',
        title,
        message,
        category: 'renewal',
      });

      generatedCount++;
    }
  }

  return generatedCount;
}
