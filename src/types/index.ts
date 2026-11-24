export type Reminder = {
  id: string;
  title: string;
  time: string;
  done: boolean;
};

export type EmergencyContact = {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  phone: string;
};
