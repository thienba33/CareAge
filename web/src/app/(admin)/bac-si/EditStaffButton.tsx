"use client";

import Modal from "@/components/Modal";
import { Field, FormMessage, Input, Select, SubmitButton, Textarea } from "@/components/form";
import { saveStaffProfile } from "@/lib/actions";
import { useModalAction } from "@/components/useModalAction";
import { ACADEMIC_TITLE_LABEL, DEGREE_LABEL, type AcademicTitle, type StaffDegree } from "@/lib/labels";
import type { StaffRow } from "@/lib/data";

const DEGREES = Object.keys(DEGREE_LABEL) as StaffDegree[];
const TITLES = Object.keys(ACADEMIC_TITLE_LABEL) as AcademicTitle[];

// Sửa hồ sơ chuyên môn + nơi làm việc của một bác sĩ.
export default function EditStaffButton({ staff }: { staff: StaffRow }) {
  const { open, setOpen, state, action, pending } = useModalAction(saveStaffProfile);
  const p = staff.profile;

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-xl border border-line px-3 py-1.5 text-sm text-ink hover:bg-canvas">
        Sửa hồ sơ
      </button>
      <Modal open={open} title={`Hồ sơ ${staff.name}`} onClose={() => setOpen(false)}>
        <form action={action} className="space-y-4">
          <input type="hidden" name="staffId" value={staff.id} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Học vị">
              <Select name="degree" defaultValue={p.degree ?? ""}>
                <option value="">—</option>
                {DEGREES.map((d) => (
                  <option key={d} value={d}>
                    {DEGREE_LABEL[d]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Học hàm">
              <Select name="academicTitle" defaultValue={p.academicTitle ?? ""}>
                <option value="">—</option>
                {TITLES.map((t) => (
                  <option key={t} value={t}>
                    {ACADEMIC_TITLE_LABEL[t]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Chuyên khoa">
            <Input name="specialty" defaultValue={p.specialty ?? ""} maxLength={100} placeholder="Nội tổng quát" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Kinh nghiệm (năm)">
              <Input name="yearsExperience" defaultValue={p.yearsExperience ?? ""} inputMode="numeric" maxLength={2} />
            </Field>
            <div className="col-span-2">
              <Field label="Số chứng chỉ hành nghề">
                <Input name="licenseNumber" defaultValue={p.licenseNumber ?? ""} maxLength={50} />
              </Field>
            </div>
          </div>
          <Field label="Cơ sở y tế">
            <Input name="workplace" defaultValue={staff.workplace ?? ""} maxLength={200} placeholder="Phenikaamec" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Khoa">
              <Input name="department" defaultValue={p.department ?? ""} maxLength={100} />
            </Field>
            <Field label="Phòng khám">
              <Input name="room" defaultValue={p.room ?? ""} maxLength={50} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hotline cơ sở y tế">
              <Input name="workplacePhone" defaultValue={staff.workplacePhone ?? ""} maxLength={30} />
            </Field>
            <Field label="Giờ làm việc">
              <Input name="workingHours" defaultValue={p.workingHours ?? ""} maxLength={200} />
            </Field>
          </div>
          <Field label="Giới thiệu">
            <Textarea name="bio" defaultValue={p.bio ?? ""} maxLength={1000} />
          </Field>
          <FormMessage state={state} />
          <SubmitButton pending={pending}>Lưu hồ sơ</SubmitButton>
        </form>
      </Modal>
    </>
  );
}
