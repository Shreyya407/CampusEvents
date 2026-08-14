import { supabase } from './supabase';

export interface RPCResponse {
  success: boolean;
  message?: string;
  is_full?: boolean;
  requires_payment?: boolean;
  fee?: number;
  registration_id?: string;
  payment_id?: string;
  waitlist_id?: string;
  position?: number;
  attendance_id?: string;
  auto_promoted?: boolean;
  already_checked_in?: boolean;
}

export async function registerForEventRPC(eventId: string): Promise<RPCResponse> {
  const { data, error } = await supabase.rpc('register_for_event', {
    p_event_id: eventId,
  });

  if (error) {
    throw new Error(error.message);
  }
  return data as RPCResponse;
}

export async function completeMockPaymentRPC(
  registrationId: string,
  amount: number,
  txRef: string
): Promise<RPCResponse> {
  const { data, error } = await supabase.rpc('complete_mock_payment', {
    p_registration_id: registrationId,
    p_amount: amount,
    p_tx_ref: txRef,
  });

  if (error) {
    throw new Error(error.message);
  }
  return data as RPCResponse;
}

export async function cancelRegistrationRPC(registrationId: string): Promise<RPCResponse> {
  const { data, error } = await supabase.rpc('cancel_registration', {
    p_registration_id: registrationId,
  });

  if (error) {
    throw new Error(error.message);
  }
  return data as RPCResponse;
}

export async function joinEventWaitlistRPC(
  eventId: string,
  amount: number,
  txRef: string
): Promise<RPCResponse> {
  const { data, error } = await supabase.rpc('join_event_waitlist', {
    p_event_id: eventId,
    p_amount: amount,
    p_tx_ref: txRef,
  });

  if (error) {
    throw new Error(error.message);
  }
  return data as RPCResponse;
}

export async function checkInStudentRPC(
  eventId: string,
  checkInToken: string
): Promise<RPCResponse> {
  const { data, error } = await supabase.rpc('check_in_student', {
    p_event_id: eventId,
    p_check_in_token: checkInToken,
  });

  if (error) {
    throw new Error(error.message);
  }
  return data as RPCResponse;
}
