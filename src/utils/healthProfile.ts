export function calculateAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export function calculateBmi(heightCm?: number, weightKg?: number): number | null {
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}
