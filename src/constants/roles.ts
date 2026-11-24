import type { ComponentType } from "react";
import type { Role } from "../types/auth";
import {
  AdminUnsupportedScreen,
  AppointmentsScreen,
  CaregiverHomeScreen,
  EmergencyScreen,
  HomeScreen,
  MedicationScreen,
  PatientsScreen,
  ProfileScreen,
  StaffAppointmentsScreen,
  StaffHomeScreen,
  StaffProfileScreen,
  VitalsScreen,
} from "../screens";

export type RoleTabConfig = {
  name: string;
  label: string;
  component: ComponentType<any>;
  icon: string;
};

// Bộ tab điều hướng cho từng role, theo skill elderly-health-mobile-app mục 6.
// ADMIN dùng chủ yếu Website Admin nên mobile chỉ hiển thị thông báo + hồ sơ để đăng xuất.
// MEDICAL_STAFF không có tab Sức khỏe riêng: chỉ số của từng bệnh nhân nằm trong màn Hồ sơ bệnh nhân (từ tab Bệnh nhân).
export const ROLE_TABS: Record<Role, RoleTabConfig[]> = {
  ELDERLY: [
    { name: "Home", label: "Trang chủ", component: HomeScreen, icon: "home" },
    { name: "Medications", label: "Chăm sóc", component: MedicationScreen, icon: "medkit" },
    { name: "Appointments", label: "Lịch khám", component: AppointmentsScreen, icon: "calendar" },
    { name: "Vitals", label: "Sức khỏe", component: VitalsScreen, icon: "pulse" },
    { name: "Emergency", label: "Khẩn cấp", component: EmergencyScreen, icon: "alert-circle" },
  ],
  CAREGIVER: [
    { name: "Home", label: "Trang chủ", component: CaregiverHomeScreen, icon: "home" },
    { name: "Vitals", label: "Sức khỏe", component: VitalsScreen, icon: "pulse" },
    { name: "Medications", label: "Chăm sóc", component: MedicationScreen, icon: "medkit" },
    { name: "Appointments", label: "Lịch khám", component: AppointmentsScreen, icon: "calendar" },
    { name: "Profile", label: "Hồ sơ", component: ProfileScreen, icon: "person" },
  ],
  MEDICAL_STAFF: [
    { name: "Home", label: "Trang chủ", component: StaffHomeScreen, icon: "home" },
    { name: "Patients", label: "Bệnh nhân", component: PatientsScreen, icon: "people" },
    { name: "Appointments", label: "Lịch khám", component: StaffAppointmentsScreen, icon: "calendar" },
    { name: "Profile", label: "Hồ sơ", component: StaffProfileScreen, icon: "person" },
  ],
  ADMIN: [
    { name: "AdminInfo", label: "Thông tin", component: AdminUnsupportedScreen, icon: "desktop" },
    { name: "Profile", label: "Hồ sơ", component: ProfileScreen, icon: "person" },
  ],
};
