// Khóa cache theo người dùng — đổi tài khoản không bao giờ đọc nhầm dữ liệu của nhau.
export const queryKeys = {
  medications: (userId: string) => ["medications", userId] as const,
  doses: (userId: string, dateKey: string) => ["doses", userId, dateKey] as const,
  metrics: (userId: string) => ["metrics", userId] as const,
  appointments: (userId: string) => ["appointments", userId] as const,
  assignedDoctors: (elderlyId: string) => ["assignedDoctors", elderlyId] as const,
  alerts: (userId: string) => ["alerts", userId] as const,
  healthProfile: (userId: string) => ["healthProfile", userId] as const,
  emergencyContacts: (userId: string) => ["emergencyContacts", userId] as const,
  medicalConditions: (userId: string) => ["medicalConditions", userId] as const,
  linkedElderly: (caregiverId: string) => ["linkedElderly", caregiverId] as const,
  linkedCaregivers: (elderlyId: string) => ["linkedCaregivers", elderlyId] as const,
  assignedPatients: (staffId: string) => ["assignedPatients", staffId] as const,
  // Tiền tố chung để làm mới mọi ngày: ["staffDashboard"].
  staffDashboard: (staffId: string, dateKey: string) => ["staffDashboard", staffId, dateKey] as const,
  staffAppointments: (staffId: string) => ["staffAppointments", staffId] as const,
  formerPatients: (staffId: string) => ["formerPatients", staffId] as const,
  staffAlerts: (staffId: string) => ["staffAlerts", staffId] as const,
  staffProfile: (staffId: string) => ["staffProfile", staffId] as const,
  inbox: (recipientId: string) => ["inbox", recipientId] as const,
  // Tiền tố chung để làm mới mọi ngày: ["caregiverDashboard"].
  caregiverDashboard: (caregiverId: string, dateKey: string) => ["caregiverDashboard", caregiverId, dateKey] as const,
  alertThresholds: (userId: string, type: string) => ["alertThresholds", userId, type] as const,
};
