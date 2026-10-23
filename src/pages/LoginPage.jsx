import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useLanguage } from '../i18n/useLanguage';
import { DEMO_ACCOUNTS_FOR_UI } from '../storage/demoData';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import {
  GraduationCap,
  ShieldCheck,
  ServerCog,
  KeyRound,
  RotateCw,
  Info,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles
} from 'lucide-react';

export default function LoginPage() {
  const { login, isAuthenticated, currentRole: activeUserRole } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Role tab state
  const urlRole = searchParams.get('role');
  const [selectedRole, setSelectedRole] = useState(
    urlRole && ['institution', 'officer', 'admin'].includes(urlRole) ? urlRole : 'institution'
  );

  // Form states
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaText, setCaptchaText] = useState('7K9M2');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // If already logged in, redirect to workspace
  useEffect(() => {
    if (isAuthenticated && activeUserRole) {
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        const dest =
          activeUserRole === 'institution'
            ? '/institution/dashboard'
            : activeUserRole === 'officer'
            ? '/officer/dashboard'
            : '/admin/dashboard';
        navigate(dest, { replace: true });
      }
    }
  }, [isAuthenticated, activeUserRole, navigate, location.state]);

  const breadcrumbs = [{ label: t('nav.login', 'Portal Login') }];

  const refreshCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let res = '';
    for (let i = 0; i < 5; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(res);
    setCaptchaInput('');
  };

  const switchRole = (newRole) => {
    setSelectedRole(newRole);
    setSearchParams({ role: newRole });
    setErrorMsg('');
    setEmail('');
    setAccessCode('');
  };

  const handleUseDemoAccount = (demoAcc) => {
    setEmail(demoAcc.email);
    setAccessCode(demoAcc.accessCode);
    setCaptchaInput(captchaText);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (captchaInput.trim().toUpperCase() !== captchaText.toUpperCase()) {
      setErrorMsg('Captcha characters do not match. Please try again.');
      refreshCaptcha();
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login({
        email,
        accessCode,
        role: selectedRole,
        rememberMe,
      });

      const dest =
        result.user.role === 'institution'
          ? '/institution/dashboard'
          : result.user.role === 'officer'
          ? '/officer/dashboard'
          : '/admin/dashboard';

      navigate(dest, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
      refreshCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeDemoInfo = DEMO_ACCOUNTS_FOR_UI.find((a) => a.role === selectedRole);

  const roleMeta = {
    institution: {
      title: 'Educational Institution Portal',
      subtitle: 'For Affiliated Technical Institutes, Polytechnics & Universities',
      icon: GraduationCap,
      badgeColor: 'blue',
      badgeText: 'Institutional Signatory',
      emailLabel: 'Official Institution Account Email',
      emailPlaceholder: 'e.g. principal@coep-pune.demo',
    },
    officer: {
      title: 'AICTE Scrutiny Officer Portal',
      subtitle: 'For Regional Officers, Scrutiny Committees & Approval Bureau',
      icon: ShieldCheck,
      badgeColor: 'saffron',
      badgeText: 'Regulatory Officer',
      emailLabel: 'Official AICTE Regional Email',
      emailPlaceholder: 'e.g. scrutiny.west@aicte.demo',
    },
    admin: {
      title: 'System Administrator Portal',
      subtitle: 'For Platform Custodians, Auditors & Technical Administration',
      icon: ServerCog,
      badgeColor: 'navy',
      badgeText: 'Security Administrator',
      emailLabel: 'Administrator System Email',
      emailPlaceholder: 'e.g. sysadmin@nidhisetu.demo',
    },
  };

  const currentRoleConfig = roleMeta[selectedRole] || roleMeta.institution;
  const RoleIcon = currentRoleConfig.icon;

  return (
    <div className="bg-[#F5F7FB] pb-16">
      <Breadcrumbs items={breadcrumbs} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {/* Prototype Advisory Banner */}
        <div className="mb-6 bg-[#FEF7EC] border border-[#E89B24] rounded-xl p-4 text-xs text-[#0B1F54] flex items-start gap-3">
          <Info className="w-5 h-5 text-[#C67C11] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold uppercase tracking-wider text-[#C67C11]">
              Smart India Hackathon (SIH) Prototype Simulation:{' '}
            </span>
            This authentication interface operates using simulated credentials stored in browser <code>localStorage</code>. For instant evaluation, click <strong>&quot;Auto-Fill Demo Account&quot;</strong> below to test any of the 3 role workspaces.
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#D3DDEB] gov-shadow-md overflow-hidden">
          {/* Role Tabs */}
          <div className="bg-[#0B1F54] p-2 flex flex-wrap gap-2 text-xs border-b border-white/10" role="tablist">
            <button
              type="button"
              onClick={() => switchRole('institution')}
              role="tab"
              aria-selected={selectedRole === 'institution'}
              className={`flex-1 py-2.5 px-3 rounded-lg text-center font-bold flex items-center justify-center gap-2 transition-colors ${
                selectedRole === 'institution'
                  ? 'bg-white text-[#0B1F54] shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-[#174EA6]" />
              <span>Institutions</span>
            </button>

            <button
              type="button"
              onClick={() => switchRole('officer')}
              role="tab"
              aria-selected={selectedRole === 'officer'}
              className={`flex-1 py-2.5 px-3 rounded-lg text-center font-bold flex items-center justify-center gap-2 transition-colors ${
                selectedRole === 'officer'
                  ? 'bg-white text-[#0B1F54] shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#E89B24]" />
              <span>AICTE Officers</span>
            </button>

            <button
              type="button"
              onClick={() => switchRole('admin')}
              role="tab"
              aria-selected={selectedRole === 'admin'}
              className={`flex-1 py-2.5 px-3 rounded-lg text-center font-bold flex items-center justify-center gap-2 transition-colors ${
                selectedRole === 'admin'
                  ? 'bg-white text-[#0B1F54] shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <ServerCog className="w-4 h-4 text-[#0B1F54]" />
              <span>Administrators</span>
            </button>
          </div>

          <div className="p-6 sm:p-10 max-w-xl mx-auto space-y-6">
            {/* Role Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#E8F0FE] text-[#174EA6] flex items-center justify-center mx-auto shadow-sm">
                <RoleIcon className="w-7 h-7" />
              </div>
              <Badge variant={currentRoleConfig.badgeColor} size="sm">
                {currentRoleConfig.badgeText}
              </Badge>
              <h1 className="text-2xl font-extrabold text-[#0B1F54]">
                {currentRoleConfig.title}
              </h1>
              <p className="text-xs text-[#505F79]">
                {currentRoleConfig.subtitle}
              </p>
            </div>

            {/* Quick Demo Credentials Assistant Box */}
            {activeDemoInfo && (
              <div className="p-3.5 bg-[#F5F7FB] border border-[#B5C7DF] rounded-xl flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-[#0B1F54] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#E89B24]" />
                    <span>Demo Profile: {activeDemoInfo.name}</span>
                  </div>
                  <div className="text-[11px] text-[#505F79] font-mono mt-0.5">
                    {activeDemoInfo.email} &bull; Code: {activeDemoInfo.accessCode}
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => handleUseDemoAccount(activeDemoInfo)}
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs font-bold"
                >
                  Auto-Fill Demo
                </Button>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B1F54] mb-1">
                  {currentRoleConfig.emailLabel} *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={currentRoleConfig.emailPlaceholder}
                  className="w-full px-3.5 py-2.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#0B1F54]">
                    Demo Access Code *
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(true)}
                    className="text-xs text-[#174EA6] hover:underline"
                  >
                    Forgot Code?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="Enter access code"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide access code' : 'Show access code'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Captcha Box */}
              <div>
                <label className="block text-xs font-bold text-[#0B1F54] mb-1">
                  Security Captcha Verification *
                </label>
                <div className="flex items-center gap-3">
                  <div className="bg-[#E8F0FE] border border-[#174EA6]/30 px-4 py-2 rounded-lg font-mono font-black text-xl tracking-widest text-[#0B1F54] select-none line-through decoration-[#E89B24]">
                    {captchaText}
                  </div>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    title="Reload Captcha"
                    className="p-2 text-[#174EA6] hover:bg-slate-100 rounded-lg border border-[#D3DDEB]"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    required
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder="Enter Captcha"
                    className="flex-1 px-3.5 py-2.5 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-sm font-mono uppercase text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
                  />
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#505F79]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#174EA6] focus:ring-[#174EA6] border-[#D3DDEB]"
                  />
                  <span>Remember session on this device</span>
                </label>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  icon={KeyRound}
                  className="w-full justify-center font-bold text-sm shadow-md"
                >
                  {isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}
                </Button>
              </div>

              {selectedRole === 'institution' && (
                <div className="text-center pt-2">
                  <span className="text-xs text-[#505F79]">
                    New educational institution?{' '}
                  </span>
                  <Link to="/register" className="text-xs font-bold text-[#174EA6] hover:underline">
                    Register Institution
                  </Link>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Forgot Code Modal */}
      {forgotModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-xl border border-[#D3DDEB] max-w-md w-full p-6 gov-shadow-lg space-y-4">
            <div className="flex items-center gap-3 text-[#174EA6]">
              <div className="w-10 h-10 rounded-full bg-[#E8F0FE] flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5 text-[#174EA6]" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1F54]">
                Demo Access Code Recovery
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-[#505F79] leading-relaxed">
              Because NidhiSetu currently operates in prototype evaluation mode, predefined demo access codes are provided for each role:
            </p>

            <div className="p-3 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-xs space-y-1.5 font-mono">
              <div><strong>Institution:</strong> principal@coep-pune.demo / <span className="text-[#174EA6]">demo@123</span></div>
              <div><strong>AICTE Officer:</strong> scrutiny.west@aicte.demo / <span className="text-[#E89B24]">officer@123</span></div>
              <div><strong>Admin:</strong> sysadmin@nidhisetu.demo / <span className="text-[#0B1F54]">admin@123</span></div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Button
                onClick={() => setForgotModalOpen(false)}
                variant="primary"
                size="sm"
              >
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
