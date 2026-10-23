export default function HeroIllustration() {

  return (
    <div className="relative w-full max-w-lg lg:max-w-xl mx-auto select-none" aria-label="NidhiSetu Ecosystem Illustration">
      <div className="relative bg-white rounded-2xl border border-[#D3DDEB] gov-shadow-md p-4 sm:p-6 overflow-hidden">
        {/* Subtle decorative grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#174EA6_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

        <svg
          viewBox="0 0 520 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto drop-shadow-sm"
          role="img"
          aria-label="Illustration showing an educational institution, secure FDR document, AI verification shield, and commercial bank connected digitally"
        >
          {/* DEFINITIONS & GRADIENTS */}
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#174EA6" />
              <stop offset="100%" stopColor="#0B1F54" />
            </linearGradient>
            <linearGradient id="docGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F8FAFC" />
            </linearGradient>
            <linearGradient id="saffronGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFB347" />
              <stop offset="100%" stopColor="#E89B24" />
            </linearGradient>
            <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0B1F54" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* CONNECTIVITY LINES (DIGITAL SETU / BRIDGE) */}
          {/* Institution to Center */}
          <path
            d="M100 190 Q 180 130 260 170"
            stroke="#174EA6"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            className="animate-pulse"
          />
          {/* Center to Bank */}
          <path
            d="M260 170 Q 340 130 420 190"
            stroke="#E89B24"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            className="animate-pulse"
          />
          {/* Base Bridge Line */}
          <path
            d="M70 330 C 180 280, 340 280, 450 330"
            stroke="#0B1F54"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M130 315 L130 335 M200 300 L200 335 M260 295 L260 335 M320 300 L320 335 M390 315 L390 335"
            stroke="#0B1F54"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* 1. LEFT NODE: EDUCATIONAL INSTITUTION */}
          <g transform="translate(30, 140)" filter="url(#softShadow)">
            <rect width="130" height="135" rx="8" fill="#FFFFFF" stroke="#0B1F54" strokeWidth="2" />
            {/* Header bar */}
            <rect width="130" height="26" rx="8" fill="#0B1F54" />
            <rect y="16" width="130" height="10" fill="#0B1F54" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="9" fontWeight="700" textAnchor="middle">
              COLLEGE / CAMPUS
            </text>

            {/* Institution Building Facade */}
            {/* Roof pediment / triangle */}
            <polygon points="65,34 25,52 105,52" fill="#E89B24" />
            {/* Pillars */}
            <rect x="35" y="56" width="10" height="50" rx="2" fill="#174EA6" />
            <rect x="52" y="56" width="10" height="50" rx="2" fill="#174EA6" />
            <rect x="68" y="56" width="10" height="50" rx="2" fill="#174EA6" />
            <rect x="85" y="56" width="10" height="50" rx="2" fill="#174EA6" />
            {/* Base */}
            <rect x="25" y="106" width="80" height="6" rx="1" fill="#0B1F54" />

            {/* Sub-label */}
            <text x="65" y="125" fill="#505F79" fontSize="8" fontWeight="600" textAnchor="middle">
              AISHE Code: C-24901
            </text>
          </g>

          {/* 2. RIGHT NODE: SCHEDULED COMMERCIAL BANK */}
          <g transform="translate(360, 140)" filter="url(#softShadow)">
            <rect width="130" height="135" rx="8" fill="#FFFFFF" stroke="#0B1F54" strokeWidth="2" />
            {/* Header bar */}
            <rect width="130" height="26" rx="8" fill="#174EA6" />
            <rect y="16" width="130" height="10" fill="#174EA6" />
            <text x="65" y="18" fill="#FFFFFF" fontSize="9" fontWeight="700" textAnchor="middle">
              SCHEDULED BANK
            </text>

            {/* Bank Facade / Vault */}
            <polygon points="65,34 25,52 105,52" fill="#13805E" />
            {/* Pillars */}
            <rect x="35" y="56" width="10" height="50" rx="2" fill="#0B1F54" />
            <rect x="52" y="56" width="10" height="50" rx="2" fill="#0B1F54" />
            <rect x="68" y="56" width="10" height="50" rx="2" fill="#0B1F54" />
            <rect x="85" y="56" width="10" height="50" rx="2" fill="#0B1F54" />
            {/* Base */}
            <rect x="25" y="106" width="80" height="6" rx="1" fill="#0B1F54" />

            {/* Sub-label */}
            <text x="65" y="125" fill="#13805E" fontSize="8" fontWeight="600" textAnchor="middle">
              Lien Marking Authorized
            </text>
          </g>

          {/* 3. CENTERPIECE: SECURE FDR DOCUMENT */}
          <g transform="translate(180, 50)" filter="url(#softShadow)">
            {/* Outer Certificate Paper */}
            <rect width="160" height="220" rx="8" fill="url(#docGrad)" stroke="#174EA6" strokeWidth="2.5" />
            {/* Decorative Ornamental Certificate Border */}
            <rect x="6" y="6" width="148" height="208" rx="4" fill="none" stroke="#E89B24" strokeWidth="1" strokeDasharray="4 2" />

            {/* Certificate Header */}
            <rect x="12" y="14" width="136" height="24" rx="4" fill="#0B1F54" />
            <text x="80" y="27" fill="#FFFFFF" fontSize="8.5" fontWeight="800" textAnchor="middle">
              FIXED DEPOSIT RECEIPT
            </text>
            <text x="80" y="35" fill="#E89B24" fontSize="6.5" fontWeight="600" textAnchor="middle">
              JOINT LIEN ACCOUNT
            </text>

            {/* Certificate Fields (Simulated text lines) */}
            <g transform="translate(16, 48)">
              {/* FDR Number */}
              <text x="0" y="8" fill="#505F79" fontSize="6.5" fontWeight="600">FDR No:</text>
              <text x="45" y="8" fill="#0B1F54" fontSize="6.5" fontWeight="700">FDR-2026-981240</text>

              {/* Deposit Amount */}
              <text x="0" y="20" fill="#505F79" fontSize="6.5" fontWeight="600">Deposit:</text>
              <text x="45" y="20" fill="#13805E" fontSize="7.5" fontWeight="800">₹ 35,00,000 /-</text>

              {/* Beneficiary */}
              <text x="0" y="32" fill="#505F79" fontSize="6.5" fontWeight="600">Lien Holder:</text>
              <text x="45" y="32" fill="#0B1F54" fontSize="6" fontWeight="700">AICTE Regulatory Cell</text>

              {/* Joint Holder */}
              <text x="0" y="44" fill="#505F79" fontSize="6.5" fontWeight="600">Joint Name:</text>
              <text x="45" y="44" fill="#0B1F54" fontSize="6" fontWeight="600">Apex Institute of Tech</text>

              {/* Tenure & Maturity */}
              <text x="0" y="56" fill="#505F79" fontSize="6.5" fontWeight="600">Tenure:</text>
              <text x="45" y="56" fill="#0B1F54" fontSize="6" fontWeight="600">10 Years (Non-Callable)</text>

              {/* Watermark / Seal Lines */}
              <line x1="0" y1="68" x2="128" y2="68" stroke="#D3DDEB" strokeWidth="1" />
            </g>

            {/* Digital QR Code Stamp */}
            <g transform="translate(20, 134)">
              <rect width="36" height="36" rx="4" fill="#FFFFFF" stroke="#0B1F54" strokeWidth="1.5" />
              {/* QR pixel patterns */}
              <rect x="4" y="4" width="10" height="10" fill="#0B1F54" />
              <rect x="6" y="6" width="6" height="6" fill="#FFFFFF" />
              <rect x="22" y="4" width="10" height="10" fill="#0B1F54" />
              <rect x="24" y="6" width="6" height="6" fill="#FFFFFF" />
              <rect x="4" y="22" width="10" height="10" fill="#0B1F54" />
              <rect x="6" y="24" width="6" height="6" fill="#FFFFFF" />
              <rect x="18" y="18" width="6" height="6" fill="#0B1F54" />
              <rect x="26" y="24" width="6" height="6" fill="#0B1F54" />
            </g>

            {/* Bank Branch Red Wax Seal Graphic */}
            <g transform="translate(100, 142)">
              <circle cx="18" cy="18" r="16" fill="url(#saffronGrad)" stroke="#C67C11" strokeWidth="1.5" />
              <circle cx="18" cy="18" r="12" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3 1.5" />
              <text x="18" y="16" fill="#FFFFFF" fontSize="6" fontWeight="800" textAnchor="middle">BANK</text>
              <text x="18" y="23" fill="#FFFFFF" fontSize="5.5" fontWeight="700" textAnchor="middle">VERIFIED</text>
            </g>

            {/* Bottom Status Ribbon */}
            <rect x="12" y="188" width="136" height="20" rx="3" fill="#E6F4EA" stroke="#13805E" strokeWidth="1" />
            <circle cx="24" cy="198" r="4" fill="#13805E" />
            <path d="M22 198 L23.5 199.5 L26 196.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <text x="34" y="201" fill="#13805E" fontSize="7.5" fontWeight="800">
              TAMPER-EVIDENT HASH VERIFIED
            </text>
          </g>

          {/* 4. OVERLAID AI VERIFICATION BADGE & SHIELD */}
          <g transform="translate(225, 230)" filter="url(#softShadow)">
            <circle cx="35" cy="35" r="34" fill="#FFFFFF" stroke="#0B1F54" strokeWidth="3" />
            <circle cx="35" cy="35" r="28" fill="url(#shieldGrad)" />
            {/* Inner Shield outline */}
            <path
              d="M35 15 L48 21 V30 C48 39 35 46 35 46 C35 46 22 39 22 30 V21 Z"
              fill="#13805E"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            {/* Bold Checkmark */}
            <path
              d="M28 30 L33 35 L42 25"
              stroke="#FFFFFF"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* TOP FLOATING AI ENGINE TAG */}
          <g transform="translate(195, 12)" filter="url(#softShadow)">
            <rect width="130" height="24" rx="12" fill="#0B1F54" stroke="#E89B24" strokeWidth="1.5" />
            <circle cx="16" cy="12" r="5" fill="#E89B24" />
            <text x="70" y="16" fill="#FFFFFF" fontSize="8.5" fontWeight="700" textAnchor="middle">
              NIDHISETU AI VERIFIER
            </text>
          </g>
        </svg>

        {/* Legend under illustration */}
        <div className="mt-4 pt-3 border-t border-[#D3DDEB] grid grid-cols-3 gap-2 text-center text-[10px] text-[#505F79]">
          <div className="font-semibold text-[#0B1F54]">1. Institutional Submission</div>
          <div className="font-semibold text-[#174EA6]">2. Dual-Layer AI Scrutiny</div>
          <div className="font-semibold text-[#13805E]">3. Bank Lien Endorsement</div>
        </div>
      </div>
    </div>
  );
}
