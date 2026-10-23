import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import {
  initializeStorage,
  storageService,
  STORAGE_KEYS,
  authRepository,
  userRepository,
  institutionRepository,
  notificationRepository,
  auditRepository,
  sessionRepository
} from '../storage';

import { LanguageProvider } from '../i18n/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { useLanguage } from '../i18n/useLanguage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import RoleGuard from '../components/auth/RoleGuard';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import HomePage from '../pages/HomePage';

function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <LanguageProvider>
        <AuthProvider>
          {ui}
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

describe('Module 02: Storage Layer & Repository Tests', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await initializeStorage(true);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('1. Demo seed idempotency: multiple calls do not duplicate records', async () => {
    const usersBefore = await userRepository.getAllUsers();
    const instsBefore = await institutionRepository.getAllInstitutions();
    
    // Call seed again without force reset
    await initializeStorage(false);
    const usersAfter = await userRepository.getAllUsers();
    const instsAfter = await institutionRepository.getAllInstitutions();

    expect(usersBefore.length).toBe(usersAfter.length);
    expect(instsBefore.length).toBe(instsAfter.length);
  });

  it('2. Corrupted localStorage recovery: safeJsonParse gracefully falls back to default', () => {
    localStorage.setItem(STORAGE_KEYS.USERS, 'INVALID_JSON_CORRUPT{{{');
    const result = storageService.getItem(STORAGE_KEYS.USERS, [{ fallback: true }]);
    expect(result).toEqual([{ fallback: true }]);
  });

  it('3. Demo login authentication: validates correct and rejects incorrect access codes', async () => {
    // Valid login for institution
    const validResult = await authRepository.authenticate({
      email: 'principal@coep-pune.demo',
      accessCode: 'demo@123',
      role: 'institution',
      rememberMe: true
    });
    expect(validResult.user.role).toBe('institution');
    expect(validResult.session).toBeDefined();

    // Invalid access code
    await expect(
      authRepository.authenticate({
        email: 'principal@coep-pune.demo',
        accessCode: 'wrong_code',
        role: 'institution',
        rememberMe: true
      })
    ).rejects.toThrow(/invalid.*access code/i);

    // Invalid role mismatch
    await expect(
      authRepository.authenticate({
        email: 'principal@coep-pune.demo',
        accessCode: 'demo@123',
        role: 'officer',
        rememberMe: true
      })
    ).rejects.toThrow(/access denied/i);
  });

  it('4. Session persistence: handles session storage and logout', async () => {
    const { session } = await authRepository.authenticate({
      email: 'scrutiny.west@aicte.demo',
      accessCode: 'officer@123',
      role: 'officer',
      rememberMe: false // tab only
    });

    const activeSession = await sessionRepository.getActiveSession();
    expect(activeSession).not.toBeNull();
    expect(activeSession.userId).toBe(session.userId);

    // Logout
    await authRepository.logout();
    const sessionAfterLogout = await sessionRepository.getActiveSession();
    expect(sessionAfterLogout).toBeNull();
  });

  it('5. Audit event creation across lifecycle actions', async () => {
    const initialEvents = await auditRepository.getAuditLogs();
    const countBefore = initialEvents.length;

    await auditRepository.logEvent({
      eventType: 'DEMO_TEST_EVENT',
      actorRole: 'admin',
      targetEntityId: 'SYSTEM',
      summary: 'Test audit log creation'
    });

    const eventsAfter = await auditRepository.getAuditLogs();
    expect(eventsAfter.length).toBe(countBefore + 1);
    expect(eventsAfter[0].eventType).toBe('DEMO_TEST_EVENT');
  });

  it('6. Notification repository: filtering and mark as read persistence', async () => {
    const notifs = await notificationRepository.getNotificationsForRole('institution');
    expect(notifs.length).toBeGreaterThan(0);
    const firstNotifId = notifs[0].id;

    await notificationRepository.markAsRead(firstNotifId);
    const updatedNotifs = await notificationRepository.getNotificationsForRole('institution');
    const updatedItem = updatedNotifs.find((n) => n.id === firstNotifId);
    expect(updatedItem.isRead).toBe(true);

    await notificationRepository.markAllAsRead('institution');
    const unreadCount = await notificationRepository.getUnreadCount('institution');
    expect(unreadCount).toBe(0);
  });

  it('7. Admin user management & last active admin protection', async () => {
    const admins = (await userRepository.getAllUsers()).filter((u) => u.role === 'admin');
    expect(admins.length).toBe(1);

    // Attempting to deactivate the sole admin should fail
    await expect(
      userRepository.updateUserStatus(admins[0].id, 'inactive')
    ).rejects.toThrow(/cannot deactivate the last/i);

    // Can deactivate institution user
    const instUsers = (await userRepository.getAllUsers()).filter((u) => u.role === 'institution');
    const updated = await userRepository.updateUserStatus(instUsers[0].id, 'inactive');
    expect(updated.status).toBe('inactive');
  });

  it('8. Duplicate institution AISHE and email check', async () => {
    await expect(
      institutionRepository.createInstitution({
        aisheCode: 'C-41290', // Already exists in demo seed
        name: 'Duplicate College',
        representativeEmail: 'unique@example.com'
      })
    ).rejects.toThrow(/already registered/i);

    await expect(
      institutionRepository.createInstitution({
        aisheCode: 'C-99999',
        name: 'New College',
        representativeEmail: 'principal@coep-pune.demo' // Already exists
      })
    ).rejects.toThrow(/already registered/i);
  });

  it('9. Institution profile updates and persistence', async () => {
    const inst = await institutionRepository.getInstitutionByAishe('C-41290');
    expect(inst).not.toBeNull();

    const updated = await institutionRepository.updateInstitution(inst.id, {
      city: 'Pune Metropolitan',
      representativePhone: '+91 99999 11111'
    });

    expect(updated.city).toBe('Pune Metropolitan');
    expect(updated.representativePhone).toBe('+91 99999 11111');

    const retrieved = await institutionRepository.getInstitutionById(inst.id);
    expect(retrieved.city).toBe('Pune Metropolitan');
  });
});

describe('Module 02: React UI & Authentication Workflows', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await initializeStorage(true);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('10. Login Page renders all 3 role tabs and auto-fill helper', async () => {
    renderWithProviders(<LoginPage />, { route: '/login' });

    expect(screen.getByRole('tab', { name: /institutions/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /aicte officers/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /administrators/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /auto-fill demo/i })).toBeInTheDocument();
  });

  it('11. Login Page shows captcha mismatch error on submit', async () => {
    renderWithProviders(<LoginPage />, { route: '/login' });

    const emailInput = screen.getByPlaceholderText(/principal@coep-pune.demo/i);
    const accessCodeInput = screen.getByPlaceholderText(/enter access code/i);
    const captchaInput = screen.getByPlaceholderText(/enter captcha/i);

    fireEvent.change(emailInput, { target: { value: 'principal@coep-pune.demo' } });
    fireEvent.change(accessCodeInput, { target: { value: 'demo@123' } });
    fireEvent.change(captchaInput, { target: { value: 'WRONG_CAPTCHA' } });

    const submitBtn = screen.getByRole('button', { name: /sign in to portal/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/captcha characters do not match/i)).toBeInTheDocument();
  });

  it('12. Auto-fill button populates credentials and captcha answer', async () => {
    renderWithProviders(<LoginPage />, { route: '/login' });

    const autoFillBtn = screen.getByRole('button', { name: /auto-fill demo/i });
    fireEvent.click(autoFillBtn);

    const emailInput = screen.getByPlaceholderText(/principal@coep-pune.demo/i);
    expect(emailInput.value).toBe('principal@coep-pune.demo');

    const accessCodeInput = screen.getByPlaceholderText(/enter access code/i);
    expect(accessCodeInput.value).toBe('demo@123');
  });

  it('13. Multi-step Institution Registration Workflow step-by-step', async () => {
    renderWithProviders(<RegisterPage />, { route: '/register' });

    // Step 1: Details
    expect(screen.getByText(/step 1: institutional legal identity/i)).toBeInTheDocument();
    
    // Auto-fill synthetic test institution data
    const autofillBtn = screen.getByRole('button', { name: /auto-fill demo data/i });
    fireEvent.click(autofillBtn);

    // Proceed to Step 2
    const nextBtn1 = screen.getByRole('button', { name: /continue to step 2/i });
    fireEvent.click(nextBtn1);

    // Step 2: Representative
    expect(await screen.findByText(/step 2: authorized signatory credentials/i)).toBeInTheDocument();
    const nextBtn2 = screen.getByRole('button', { name: /continue to step 3/i });
    fireEvent.click(nextBtn2);

    // Step 3: Regulatory
    expect(await screen.findByText(/step 3: regulatory category/i)).toBeInTheDocument();
    const nextBtn3 = screen.getByRole('button', { name: /continue to step 4/i });
    fireEvent.click(nextBtn3);

    // Step 4: Review
    expect(await screen.findByText(/step 4: review registration dossier/i)).toBeInTheDocument();
    
    // Submit registration
    const submitBtn = screen.getByRole('button', { name: /complete & generate repository/i });
    fireEvent.click(submitBtn);

    // Step 5: Confirmation
    expect(await screen.findByText(/institution profile created/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enter institution dashboard/i })).toBeInTheDocument();
  });

  it('14. Registration validation prevents advancing with invalid required fields', async () => {
    renderWithProviders(<RegisterPage />, { route: '/register' });

    const nextBtn = screen.getByRole('button', { name: /continue to step 2/i });
    fireEvent.click(nextBtn);

    expect(await screen.findByText(/institution name is required/i)).toBeInTheDocument();
  });

  it('15. Protected Route redirects unauthenticated visitor to /login', async () => {
    render(
      <MemoryRouter initialEntries={['/institution/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>LOGIN_PAGE_REDIRECTED</div>} />
            <Route
              path="/institution/dashboard"
              element={
                <ProtectedRoute>
                  <div>PROTECTED_CONTENT</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('LOGIN_PAGE_REDIRECTED')).toBeInTheDocument();
    expect(screen.queryByText('PROTECTED_CONTENT')).not.toBeInTheDocument();
  });

  it('16. RoleGuard restricts cross-role portal access', async () => {
    // Authenticate as institution user
    await authRepository.authenticate({
      email: 'principal@coep-pune.demo',
      accessCode: 'demo@123',
      role: 'institution',
      rememberMe: true
    });

    render(
      <MemoryRouter initialEntries={['/officer/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route
              path="/officer/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['officer']}>
                    <div>OFFICER_SECRET_DASHBOARD</div>
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/restricted workspace access/i)).toBeInTheDocument();
    expect(screen.queryByText('OFFICER_SECRET_DASHBOARD')).not.toBeInTheDocument();
  });

  it('17. Multilingual language switching renders translated strings', async () => {
    function LangTestComponent() {
      const { language, setLanguage, t } = useLanguage();
      return (
        <div>
          <span data-testid="current-lang">{language}</span>
          <span data-testid="translated-title">{t('hero.title')}</span>
          <button onClick={() => setLanguage('hi')}>Switch to Hindi</button>
          <button onClick={() => setLanguage('mr')}>Switch to Marathi</button>
        </div>
      );
    }

    render(
      <LanguageProvider>
        <LangTestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
    
    // Switch to Hindi
    fireEvent.click(screen.getByRole('button', { name: /switch to hindi/i }));
    expect(screen.getByTestId('current-lang')).toHaveTextContent('hi');

    // Switch to Marathi
    fireEvent.click(screen.getByRole('button', { name: /switch to marathi/i }));
    expect(screen.getByTestId('current-lang')).toHaveTextContent('mr');
  });

  it('18. Module 01 Regression: Public homepage renders with navigation landmarks', async () => {
    renderWithProviders(<HomePage />, { route: '/' });

    // Header landmarks from Module 01
    expect(screen.getByText(/secure, transparent & intelligent fdr management/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /institution login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /explore services/i })).toBeInTheDocument();
  });
});
