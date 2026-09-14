export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Patient {
  id: string;
  name: string;
  whatsapp: string;
  cpf: string | null;
  birthDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Procedure {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  active: boolean;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'DONE';

export interface Appointment {
  id: string;
  patientId: string;
  procedureId: string;
  scheduledAt: string;
  status: AppointmentStatus;
  notes: string | null;
  patient?: Patient;
  procedure?: Procedure;
}

export interface DashboardSummary {
  stats: {
    totalToday: number;
    confirmed: number;
    pending: number;
  };
  today: Appointment[];
}

export interface ClinicSettings {
  id: string;
  openHour: number;
  closeHour: number;
  slotMinutes: number;
  weekdays: string;
  updatedAt: string;
}
