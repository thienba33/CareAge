// Hình minh hoạ trang đăng nhập (SVG, không tải ảnh ngoài): màn hình theo dõi nhịp tim, thẻ thuốc, thẻ lịch khám,
// chậu cây, vòng tròn đứt nét — tông xanh ngọc của CareAge.
export default function LoginIllustration() {
  return (
    <svg viewBox="0 0 860 600" role="img" aria-label="Minh hoạ theo dõi sức khỏe người cao tuổi" className="h-auto w-full max-w-[780px]">
      <defs>
        <linearGradient id="screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B5E52" />
          <stop offset="1" stopColor="#063F37" />
        </linearGradient>
        <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5EEAD4" stopOpacity="0" />
          <stop offset="0.5" stopColor="#5EEAD4" stopOpacity="0.9" />
          <stop offset="1" stopColor="#5EEAD4" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Vòng tròn đứt nét trang trí */}
      <circle cx="660" cy="150" r="96" fill="none" stroke="#FFFFFF" strokeOpacity="0.16" strokeWidth="22" strokeDasharray="26 16" />
      <circle cx="660" cy="150" r="40" fill="#FFFFFF" fillOpacity="0.12" />
      <circle cx="120" cy="470" r="66" fill="none" stroke="#FFFFFF" strokeOpacity="0.14" strokeWidth="18" strokeDasharray="20 14" />

      {/* Mặt bàn */}
      <rect x="40" y="540" width="780" height="10" rx="5" fill="#FFFFFF" fillOpacity="0.22" />

      {/* Màn hình */}
      <rect x="190" y="70" width="440" height="330" rx="26" fill="#E6FBF6" />
      <rect x="212" y="92" width="396" height="270" rx="14" fill="url(#screen)" />
      <rect x="370" y="400" width="80" height="80" fill="#CDEFE8" />
      <rect x="320" y="474" width="180" height="16" rx="8" fill="#FFFFFF" />

      {/* Đường nhịp tim */}
      <rect x="212" y="214" width="396" height="3" fill="url(#glow)" />
      <polyline
        points="232,216 300,216 322,216 338,170 356,262 374,196 388,216 450,216 466,190 480,240 494,216 588,216"
        fill="none"
        stroke="#5EEAD4"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="338" cy="170" r="7" fill="#FFFFFF" />

      {/* Chỉ số trên màn hình */}
      <g fill="#FFFFFF">
        <rect x="236" y="290" width="150" height="48" rx="12" fillOpacity="0.1" />
        <rect x="250" y="302" width="60" height="10" rx="5" fillOpacity="0.5" />
        <rect x="250" y="320" width="100" height="8" rx="4" fillOpacity="0.25" />
        <rect x="400" y="290" width="186" height="48" rx="12" fillOpacity="0.1" />
        <rect x="414" y="302" width="80" height="10" rx="5" fillOpacity="0.5" />
        <rect x="414" y="320" width="140" height="8" rx="4" fillOpacity="0.25" />
      </g>
      <path d="M262 132c-8-12-28-8-28 8 0 14 28 28 28 28s28-14 28-28c0-16-20-20-28-8z" fill="#F87171" />

      {/* Thẻ thuốc (trái) */}
      <g>
        <rect x="70" y="250" width="200" height="200" rx="22" fill="#FFFFFF" />
        <circle cx="110" cy="292" r="20" fill="#E6FBF6" />
        <rect x="100" y="285" width="20" height="14" rx="7" fill="#0FAE94" />
        <rect x="140" y="282" width="100" height="10" rx="5" fill="#0B8C79" />
        <rect x="140" y="300" width="70" height="8" rx="4" fill="#CBD5D1" />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(0 ${i * 40})`}>
            <rect x="94" y="334" width="22" height="22" rx="7" fill={i < 2 ? "#0FAE94" : "#E3E1DA"} />
            {i < 2 ? <polyline points="99,345 104,350 112,340" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" /> : null}
            <rect x="128" y="341" width={i === 1 ? 90 : 110} height="9" rx="4.5" fill="#CBD5D1" />
          </g>
        ))}
      </g>

      {/* Thẻ lịch khám (phải) */}
      <g transform="translate(-50 0)">
        <rect x="560" y="300" width="230" height="160" rx="22" fill="#FFFFFF" />
        <circle cx="604" cy="344" r="22" fill="#EAF2FB" />
        <polyline points="594,345 602,353 616,336" fill="none" stroke="#0284C7" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="640" y="332" width="120" height="11" rx="5.5" fill="#0B5E52" />
        <rect x="640" y="352" width="80" height="9" rx="4.5" fill="#94A3B8" />
        <rect x="584" y="390" width="182" height="10" rx="5" fill="#E2E8F0" />
        <rect x="584" y="390" width="130" height="10" rx="5" fill="#0FAE94" />
        <rect x="584" y="414" width="182" height="10" rx="5" fill="#E2E8F0" />
        <rect x="584" y="414" width="60" height="10" rx="5" fill="#F4A261" />
      </g>

      {/* Chậu cây — đặt cạnh thẻ lịch khám, không che nội dung thẻ */}
      <g transform="translate(58 0)">
        <path d="M720 470 C 690 420, 690 380, 700 350 C 715 390, 725 420, 722 470 Z" fill="#6EE7B7" />
        <path d="M728 470 C 760 420, 785 395, 800 370 C 790 410, 760 450, 734 472 Z" fill="#34D399" />
        <path d="M724 470 C 715 430, 728 400, 745 380 C 742 420, 735 450, 730 472 Z" fill="#10B981" />
        <rect x="700" y="470" width="56" height="70" rx="10" fill="#A7F3D0" />
      </g>
    </svg>
  );
}
