import { Suspense } from "react";
import { Avatar, Content, Hero, ListSkeleton } from "@/components/ui";
import EditStaffButton from "@/app/(admin)/bac-si/EditStaffButton";
import { requireStaff } from "@/lib/auth";
import { getStaff } from "@/lib/data";
import { ACADEMIC_TITLE_LABEL, DEGREE_LABEL, formatDoctorName } from "@/lib/labels";

// Hồ sơ chuyên môn của bác sĩ đang đăng nhập — bệnh nhân và người nhà thấy thông tin này trên app.
export default function MyProfilePage() {
  return (
    <>
      <Hero title="Hồ sơ của tôi" subtitle="Thông tin chuyên môn hiển thị với bệnh nhân và người nhà" />
      <Suspense fallback={<ListSkeleton rows={4} />}>
        <ProfileContent />
      </Suspense>
    </>
  );
}

async function ProfileContent() {
  const me = await requireStaff();
  const [s] = await getStaff(me.id);
  if (!s) return null;
  const p = s.profile;
  const degree = [p.academicTitle ? ACADEMIC_TITLE_LABEL[p.academicTitle] : null, p.degree ? DEGREE_LABEL[p.degree] : null]
    .filter(Boolean)
    .join(", ");

  const rows: [string, string | null][] = [
    ["Email", s.email],
    ["Điện thoại", s.phone],
    ["Học hàm, học vị", degree || null],
    ["Chuyên khoa", p.specialty],
    ["Kinh nghiệm", p.yearsExperience !== null ? `${p.yearsExperience} năm` : null],
    ["Chứng chỉ hành nghề", p.licenseNumber],
    ["Cơ sở y tế", s.workplace],
    ["Hotline cơ sở", s.workplacePhone],
    ["Khoa", p.department],
    ["Phòng khám", p.room],
    ["Giờ làm việc", p.workingHours],
  ];

  return (
    <Content>
      <section className="max-w-4xl overflow-hidden card">
        <div className="flex flex-wrap items-center gap-4 border-b border-line px-5 py-4">
          <Avatar name={s.name} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-ink">{formatDoctorName(s.name, p.academicTitle, p.degree)}</h2>
            <p className="text-sm text-muted">
              {p.specialty ?? "Chưa khai chuyên khoa"}, {s.activePatients} bệnh nhân đang theo dõi
            </p>
          </div>
          <EditStaffButton staff={s} />
        </div>
        <dl className="grid gap-x-8 gap-y-2.5 px-5 py-4 text-sm sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex min-w-0 gap-3">
              <dt className="w-36 shrink-0 text-muted">{label}</dt>
              <dd className={`min-w-0 ${value ? "text-ink" : "text-muted"}`}>{value || "Chưa cập nhật"}</dd>
            </div>
          ))}
        </dl>
        <div className="border-t border-line px-5 py-4 text-sm">
          <div className="mb-1 text-muted">Giới thiệu</div>
          <p className={`whitespace-pre-line ${p.bio ? "text-ink" : "text-muted"}`}>{p.bio || "Chưa có phần giới thiệu."}</p>
        </div>
        {!p.degree || !p.specialty ? (
          <div className="border-t border-line bg-warning-light/50 px-5 py-3 text-xs text-warning-dark">
            Hồ sơ chưa đầy đủ. Bấm Sửa hồ sơ để bổ sung học vị và chuyên khoa.
          </div>
        ) : null}
      </section>
    </Content>
  );
}
