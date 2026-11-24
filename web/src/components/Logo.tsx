import Image from "next/image";

// Logo sản phẩm (biểu tượng trái tim CareAge, từ assets/logo.png của app) + tên.
export default function Logo({ subtitle = "Quản trị" }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Image src="/logo-mark.png" alt="" width={30} height={27} priority />
      <div className="leading-tight whitespace-nowrap md:group-data-[collapsed=true]/sb:hidden">
        <div className="text-[15px] font-semibold text-ink">CareAge</div>
        <div className="text-xs text-muted">{subtitle}</div>
      </div>
    </div>
  );
}
