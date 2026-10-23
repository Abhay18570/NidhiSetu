import Button from '../components/common/Button';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16 bg-[#F5F7FB]">
      <div className="max-w-md w-full bg-white rounded-xl border border-[#D3DDEB] p-8 text-center gov-shadow-md space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#FEF7EC] text-[#E89B24] flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="font-mono text-3xl font-extrabold text-[#0B1F54]">404</div>
        <h1 className="text-xl font-bold text-[#0B1F54]">Page Not Found</h1>

        <p className="text-xs sm:text-sm text-[#505F79] leading-relaxed">
          The requested institutional page or resource could not be located on the NidhiSetu portal. Please verify the URL or return to the main dashboard.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Button to="/" variant="primary" size="md" icon={Home}>
            Return Home
          </Button>
          <Button to="/faq" variant="outline" size="md">
            Help & FAQs
          </Button>
        </div>
      </div>
    </div>
  );
}
