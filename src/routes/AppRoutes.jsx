import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import RoleGuard from '../components/auth/RoleGuard';

// Public Module 01 Pages
import HomePage from '../pages/HomePage';
import AboutPage from '../pages/AboutPage';
import ServicesPage from '../pages/ServicesPage';
import HowItWorksPage from '../pages/HowItWorksPage';
import FaqPage from '../pages/FaqPage';
import ContactPage from '../pages/ContactPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import { PrivacyPolicyPage, TermsOfUsePage, AccessibilityPage } from '../pages/LegalPages';
import NotFoundPage from '../pages/NotFoundPage';

// Institution Pages
import InstitutionDashboard from '../pages/institution/InstitutionDashboard';
import InstitutionProfilePage from '../pages/institution/InstitutionProfilePage';
import InstitutionApplicationsPage from '../pages/institution/InstitutionApplicationsPage';
import InstitutionFdrRecordsPage from '../pages/institution/InstitutionFdrRecordsPage';
import FdrSubmissionWizard from '../pages/institution/FdrSubmissionWizard';
import InstitutionFdrDetailPage from '../pages/institution/InstitutionFdrDetailPage';
import InstitutionNotificationsPage from '../pages/institution/InstitutionNotificationsPage';
import InstitutionSettingsPage from '../pages/institution/InstitutionSettingsPage';

// Officer Pages
import OfficerDashboard from '../pages/officer/OfficerDashboard';
import OfficerInstitutionsPage from '../pages/officer/OfficerInstitutionsPage';
import OfficerQueuePage from '../pages/officer/OfficerQueuePage';
import OfficerFdrDetailPage from '../pages/officer/OfficerFdrDetailPage';
import OfficerCasesPage from '../pages/officer/OfficerCasesPage';
import OfficerActivityPage from '../pages/officer/OfficerActivityPage';
const OfficerDocumentIntelligencePage = lazy(() => import('../pages/officer/OfficerDocumentIntelligencePage'));
const OfficerIntelligenceDetailPage = lazy(() => import('../pages/officer/OfficerIntelligenceDetailPage'));
const OfficerBankVerificationsPage = lazy(() => import('../pages/officer/OfficerBankVerificationsPage'));
const OfficerBankVerificationDetailPage = lazy(() => import('../pages/officer/OfficerBankVerificationDetailPage'));
const AdminBankMonitoringPage = lazy(() => import('../pages/admin/AdminBankMonitoringPage'));

// Module 06 Lazy Pages
const InstitutionCompliancePage = lazy(() => import('../pages/institution/InstitutionCompliancePage'));
const OfficerCompliancePage = lazy(() => import('../pages/officer/OfficerCompliancePage'));
const OfficerComplianceDetailPage = lazy(() => import('../pages/officer/OfficerComplianceDetailPage'));
const AdminComplianceRulesPage = lazy(() => import('../pages/admin/AdminComplianceRulesPage'));
const AdminComplianceMonitoringPage = lazy(() => import('../pages/admin/AdminComplianceMonitoringPage'));

// Module 07 Lazy Pages
const InstitutionRenewalsPage = lazy(() => import('../pages/institution/InstitutionRenewalsPage'));
const RenewalRequestWizard = lazy(() => import('../pages/institution/RenewalRequestWizard'));
const InstitutionReleaseRequestsPage = lazy(() => import('../pages/institution/InstitutionReleaseRequestsPage'));
const OfficerRenewalsPage = lazy(() => import('../pages/officer/OfficerRenewalsPage'));
const OfficerRenewalDetailPage = lazy(() => import('../pages/officer/OfficerRenewalDetailPage'));
const OfficerReleaseRequestsPage = lazy(() => import('../pages/officer/OfficerReleaseRequestsPage'));
const OfficerReleaseRequestDetailPage = lazy(() => import('../pages/officer/OfficerReleaseRequestDetailPage'));
const AdminRenewalMonitoringPage = lazy(() => import('../pages/admin/AdminRenewalMonitoringPage'));

// Module 08 Lazy Pages
const OfficerCommandCenterPage = lazy(() => import('../pages/officer/OfficerCommandCenterPage'));
const AdminCommandCenterPage = lazy(() => import('../pages/admin/AdminCommandCenterPage'));
const InstitutionPortfolioPage = lazy(() => import('../pages/institution/InstitutionPortfolioPage'));
const OfficerActionInboxPage = lazy(() => import('../pages/officer/OfficerActionInboxPage'));
const OfficerInstitutionIntelligencePage = lazy(() => import('../pages/officer/OfficerInstitutionIntelligencePage'));
const OfficerPortfolioAnalyticsPage = lazy(() => import('../pages/officer/OfficerPortfolioAnalyticsPage'));
const AdminDemoCenterPage = lazy(() => import('../pages/admin/AdminDemoCenterPage'));

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminInstitutionsPage from '../pages/admin/AdminInstitutionsPage';
import AdminAuditLogsPage from '../pages/admin/AdminAuditLogsPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/about" element={<Layout><AboutPage /></Layout>} />
        <Route path="/services" element={<Layout><ServicesPage /></Layout>} />
        <Route path="/how-it-works" element={<Layout><HowItWorksPage /></Layout>} />
        <Route path="/faq" element={<Layout><FaqPage /></Layout>} />
        <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
        <Route path="/login" element={<Layout><LoginPage /></Layout>} />
        <Route path="/register" element={<Layout><RegisterPage /></Layout>} />
        <Route path="/privacy" element={<Layout><PrivacyPolicyPage /></Layout>} />
        <Route path="/terms" element={<Layout><TermsOfUsePage /></Layout>} />
        <Route path="/accessibility" element={<Layout><AccessibilityPage /></Layout>} />

        {/* ================= INSTITUTION WORKSPACE ================= */}
        <Route
          path="/institution/dashboard"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['institution']}>
                <DashboardLayout>
                  <InstitutionDashboard />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/institution/profile"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['institution']}>
                <DashboardLayout>
                  <InstitutionProfilePage />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/institution/applications"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['institution']}>
                <DashboardLayout>
                  <InstitutionApplicationsPage />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/institution/fdr-records"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['institution']}>
                <DashboardLayout>
                  <InstitutionFdrRecordsPage />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/institution/fdr/new"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['institution']}>
                <DashboardLayout>
                  <FdrSubmissionWizard />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/institution/fdr/:id"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['institution']}>
                <DashboardLayout>
                  <InstitutionFdrDetailPage />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/institution/notifications"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['institution']}>
                <DashboardLayout>
                  <InstitutionNotificationsPage />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/institution/settings"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['institution']}>
                <DashboardLayout>
                  <InstitutionSettingsPage />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/institution/compliance"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['institution']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Compliance Overview...</div>}>
                    <InstitutionCompliancePage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/institution/renewals"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['institution']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Renewals Console...</div>}>
                    <InstitutionRenewalsPage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/institution/renewals/new"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['institution']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Renewal Wizard...</div>}>
                    <RenewalRequestWizard />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/institution/renewals/new/:fdrId"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['institution']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Renewal Wizard...</div>}>
                    <RenewalRequestWizard />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/institution/release-requests"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['institution']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Release Requests...</div>}>
                    <InstitutionReleaseRequestsPage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />


        <Route
          path="/institution/portfolio"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['institution']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Portfolio Overview...</div>}>
                    <InstitutionPortfolioPage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* ================= AICTE OFFICER WORKSPACE ================= */}
        <Route
          path="/officer/dashboard"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer']}>
                <DashboardLayout>
                  <OfficerDashboard />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/institutions"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer']}>
                <DashboardLayout>
                  <OfficerInstitutionsPage />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/verification-queue"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer']}>
                <DashboardLayout>
                  <OfficerQueuePage />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/fdr/:id"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer']}>
                <DashboardLayout>
                  <OfficerFdrDetailPage />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/cases"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer']}>
                <DashboardLayout>
                  <OfficerCasesPage />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/activity"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer']}>
                <DashboardLayout>
                  <OfficerActivityPage />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/document-intelligence"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer', 'admin']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Document Intelligence...</div>}>
                    <OfficerDocumentIntelligencePage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/document-intelligence/:fdrId"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer', 'admin']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Intelligence Dossier...</div>}>
                    <OfficerIntelligenceDetailPage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/bank-verifications"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer', 'admin']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Bank Verifications...</div>}>
                    <OfficerBankVerificationsPage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/bank-verifications/:requestId"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer', 'admin']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Verification Dossier...</div>}>
                    <OfficerBankVerificationDetailPage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/compliance"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer', 'admin']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Compliance Console...</div>}>
                    <OfficerCompliancePage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/compliance/:institutionId"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer', 'admin']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Compliance Dossier...</div>}>
                    <OfficerComplianceDetailPage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/renewals"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer', 'admin']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Renewal Applications...</div>}>
                    <OfficerRenewalsPage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/renewals/:renewalRequestId"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer', 'admin']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Renewal Scrutiny Dossier...</div>}>
                    <OfficerRenewalDetailPage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/release-requests"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer', 'admin']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Release Requests...</div>}>
                    <OfficerReleaseRequestsPage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/release-requests/:requestId"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer', 'admin']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Release Dossier...</div>}>
                    <OfficerReleaseRequestDetailPage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />


        <Route
          path="/officer/command-center"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer', 'admin']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Command Center...</div>}>
                    <OfficerCommandCenterPage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/action-inbox"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer', 'admin']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Action Inbox...</div>}>
                    <OfficerActionInboxPage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/portfolio-analytics"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer', 'admin']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Portfolio Analytics...</div>}>
                    <OfficerPortfolioAnalyticsPage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/institution-intelligence/:institutionId"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer', 'admin']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Intelligence Dossier...</div>}>
                    <OfficerInstitutionIntelligencePage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* ================= ADMINISTRATOR WORKSPACE ================= */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminUsersPage />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/institutions"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminInstitutionsPage />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminAuditLogsPage />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminSettingsPage />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bank-monitoring"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Simulator Monitoring...</div>}>
                    <AdminBankMonitoringPage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/compliance-rules"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Regulatory Rules...</div>}>
                    <AdminComplianceRulesPage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/compliance-monitoring"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Compliance Telemetry...</div>}>
                    <AdminComplianceMonitoringPage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/renewal-monitoring"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Renewal Telemetry...</div>}>
                    <AdminRenewalMonitoringPage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />


        <Route
          path="/admin/command-center"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Admin Command Center...</div>}>
                    <AdminCommandCenterPage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/demo-center"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <DashboardLayout>
                  <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Demonstration Center...</div>}>
                    <AdminDemoCenterPage />
                  </Suspense>
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* ================= 404 CATCH-ALL ================= */}
        <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
      </Routes>
    </>
  );
}
