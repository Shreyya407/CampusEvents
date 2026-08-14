export type UserRole = 'student' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  register_number: string;
  email: string;
  department: string;
  year: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  poster_url: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  capacity: number;
  registration_open_at: string;
  registration_close_at: string;
  cancellation_deadline: string;
  fee: number;
  rules: string | null;
  status: EventStatus;
  created_by: string | null;
  check_in_start_at: string | null;
  check_in_end_at: string | null;
  check_in_token: string;
  created_at: string;
  updated_at: string;
}

export type RegistrationStatus = 'confirmed' | 'cancelled';
export type PaymentStatus = 'not_required' | 'pending' | 'successful' | 'failed' | 'refunded';

export interface Registration {
  id: string;
  event_id: string;
  student_id: string;
  status: RegistrationStatus;
  payment_status: PaymentStatus;
  registered_at: string;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  event?: Event;
  student?: Profile;
}

export interface Payment {
  id: string;
  registration_id: string | null;
  student_id: string;
  event_id: string;
  amount: number;
  payment_status: PaymentStatus;
  transaction_reference: string;
  paid_at: string;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
  event?: Event;
  student?: Profile;
}

export type WaitlistStatus = 'waiting' | 'confirmed' | 'not_confirmed' | 'refunded' | 'cancelled';

export interface WaitlistEntry {
  id: string;
  event_id: string;
  student_id: string;
  position: number;
  payment_id: string | null;
  status: WaitlistStatus;
  joined_at: string;
  confirmed_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
  event?: Event;
  student?: Profile;
  payment?: Payment;
}

export interface Attendance {
  id: string;
  event_id: string;
  student_id: string;
  registration_id: string | null;
  checked_in_at: string;
  status: 'present';
  created_at: string;
  event?: Event;
  student?: Profile;
}
