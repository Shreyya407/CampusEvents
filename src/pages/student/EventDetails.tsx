import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Event } from '../../types/database.types';
import { StudentNavbar } from '../../components/layout/StudentNavbar';
import { formatCurrency, formatDate, formatTime, generateTransactionReference } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { registerForEventRPC, completeMockPaymentRPC, joinEventWaitlistRPC, getEventCountsRPC } from '../../lib/rpc';
import { MockPaymentModal } from '../../components/payment/MockPaymentModal';

export const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [confirmedCount, setConfirmedCount] = useState<number>(0);
  const [waitlistCount, setWaitlistCount] = useState<number>(0);
  const [myRegistration, setMyRegistration] = useState<any>(null);
  const [myWaitlist, setMyWaitlist] = useState<any>(null);
  const [forcedIsFull, setForcedIsFull] = useState<boolean>(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal payment state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'registration' | 'waitlist'>('registration');
  const [pendingRegId, setPendingRegId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
      subscribeRealtime();
    }
  }, [id, user]);

  const fetchEventDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Event
      const { data: eventData, error: eventErr } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventErr || !eventData) throw new Error('Event not found.');
      const ev = eventData as Event;
      setEvent(ev);

      // 2. Fetch seat & waitlist counts via RPC (bypasses RLS filtering)
      const counts = await getEventCountsRPC(id);
      setConfirmedCount(counts.confirmed_count);
      setWaitlistCount(counts.waitlist_count);

      if (counts.confirmed_count >= ev.capacity) {
        setForcedIsFull(true);
      }

      // 3. Fetch student's own registration & waitlist status
      if (user) {
        const { data: reg } = await supabase
          .from('registrations')
          .select('*')
          .eq('event_id', id)
          .eq('student_id', user.id)
          .eq('status', 'confirmed')
          .maybeSingle();

        setMyRegistration(reg);

        const { data: wait } = await supabase
          .from('waitlist')
          .select('*')
          .eq('event_id', id)
          .eq('student_id', user.id)
          .eq('status', 'waiting')
          .maybeSingle();

        setMyWaitlist(wait);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribeRealtime = () => {
    if (!id) return;
    const channel = supabase
      .channel(`event_details_realtime_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations', filter: `event_id=eq.${id}` }, () => fetchEventDetails())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waitlist', filter: `event_id=eq.${id}` }, () => fetchEventDetails())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `id=eq.${id}` }, () => fetchEventDetails())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleRegisterClick = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!event) return;

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await registerForEventRPC(event.id);

      if (!res.success) {
        if (res.is_full || (res.message && res.message.toLowerCase().includes('full'))) {
          setForcedIsFull(true);
          setConfirmedCount(event.capacity);
          setError('Event capacity is full! Click "Join Smart Paid Waitlist" below to join the waitlist queue.');
        } else {
          throw new Error(res.message || 'Registration failed.');
        }
        return;
      }

      if (res.requires_payment && res.registration_id) {
        setPendingRegId(res.registration_id);
        setPaymentMode('registration');
        setPaymentModalOpen(true);
      } else {
        setSuccessMessage('Registration successful! Your ticket has been confirmed.');
        await fetchEventDetails();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinWaitlistClick = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!event) return;

    if (event.fee > 0) {
      setPaymentMode('waitlist');
      setPaymentModalOpen(true);
    } else {
      // Free Waitlist
      setSubmitting(true);
      setError(null);
      try {
        const txRef = generateTransactionReference();
        const res = await joinEventWaitlistRPC(event.id, 0, txRef);
        if (!res.success) throw new Error(res.message);
        setSuccessMessage(`Joined waitlist successfully! Your position is #${res.position}`);
        await fetchEventDetails();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handlePaymentSuccess = async (txRef: string) => {
    if (!event) return;

    if (paymentMode === 'registration' && pendingRegId) {
      const res = await completeMockPaymentRPC(pendingRegId, event.fee, txRef);
      if (!res.success) throw new Error(res.message);
      setSuccessMessage('Payment successful! Your registration is confirmed.');
    } else if (paymentMode === 'waitlist') {
      const res = await joinEventWaitlistRPC(event.id, event.fee, txRef);
      if (!res.success) throw new Error(res.message);
      setSuccessMessage(`Joined waitlist successfully! Your position is #${res.position}`);
    }

    await fetchEventDetails();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <StudentNavbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-body-sm font-label-md text-on-surface-variant">Loading event details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <StudentNavbar />
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <span className="material-symbols-outlined text-[48px] text-error mb-2">error</span>
          <h2 className="text-headline-md font-headline-md text-primary mb-2">Event Not Found</h2>
          <p className="text-body-md text-on-surface-variant max-w-md mb-6">{error}</p>
          <Link to="/events" className="px-6 py-2 bg-secondary text-on-secondary rounded-lg font-label-md">
            Back to Browse Events
          </Link>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const now = new Date();
  const regOpenAt = new Date(event.registration_open_at);
  const regCloseAt = new Date(event.registration_close_at);

  const isNotOpenYet = now < regOpenAt;
  const isClosed = now > regCloseAt;
  const isFull = forcedIsFull || confirmedCount >= event.capacity;
  const isWaitlistFull = waitlistCount >= 4;
  const availableSeats = Math.max(0, event.capacity - confirmedCount);
  const capacityPercent = Math.min(100, Math.round((confirmedCount / event.capacity) * 100));

  const fallbackPoster = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-on-background">
      <StudentNavbar />

      <main className="flex-grow max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg pt-20 md:pt-24 pb-32 md:pb-stack-lg">
        {/* Back Link */}
        <Link
          to="/events"
          className="inline-flex items-center gap-1 text-label-md font-label-md text-secondary hover:underline mb-stack-md"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Events
        </Link>

        {/* Hero Section Banner */}
        <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden mb-stack-lg">
          <div className="h-64 md:h-96 bg-primary relative overflow-hidden">
            <img
              src={event.poster_url || fallbackPoster}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackPoster;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent flex flex-col justify-end p-stack-md md:p-stack-lg text-on-primary">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="bg-secondary text-on-secondary px-3 py-1 rounded-full text-label-sm font-label-sm uppercase tracking-wider">
                  {event.category}
                </span>
                <span className="bg-surface/20 backdrop-blur-md px-3 py-1 rounded-full text-label-sm font-label-sm">
                  {formatCurrency(event.fee)}
                </span>
              </div>
              <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-on-primary tracking-tight">
                {event.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg">
          {/* Left Column: Details & Rules */}
          <div className="lg:col-span-2 space-y-stack-lg">
            {/* Alerts */}
            {error && (
              <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 text-body-md rounded-xl flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-600 text-[24px]">info</span>
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 text-body-md rounded-xl flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[24px]">check_circle</span>
                <span>{successMessage}</span>
              </div>
            )}

            {/* Description */}
            <div className="bg-surface rounded-xl border border-outline-variant p-stack-md md:p-stack-lg shadow-sm">
              <h2 className="text-title-lg font-title-lg text-primary mb-stack-md">About this Event</h2>
              <p className="text-body-md font-body-md text-on-surface-variant whitespace-pre-line leading-relaxed">
                {event.description}
              </p>
            </div>

            {/* Rules / Instructions */}
            {event.rules && (
              <div className="bg-surface rounded-xl border border-outline-variant p-stack-md md:p-stack-lg shadow-sm">
                <h2 className="text-title-lg font-title-lg text-primary mb-stack-md flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">gavel</span>
                  Event Rules & Guidelines
                </h2>
                <p className="text-body-md font-body-md text-on-surface-variant whitespace-pre-line leading-relaxed">
                  {event.rules}
                </p>
              </div>
            )}

            {/* Event Timeline Info */}
            <div className="bg-surface rounded-xl border border-outline-variant p-stack-md md:p-stack-lg shadow-sm space-y-stack-md">
              <h2 className="text-title-lg font-title-lg text-primary">Registration Timelines</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-stack-md text-body-sm">
                <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant">
                  <p className="text-label-sm font-label-sm text-on-surface-variant">Registration Opens</p>
                  <p className="text-label-md font-label-md text-primary font-semibold mt-1">
                    {formatDate(event.registration_open_at)}
                  </p>
                </div>

                <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant">
                  <p className="text-label-sm font-label-sm text-on-surface-variant">Registration Closes</p>
                  <p className="text-label-md font-label-md text-primary font-semibold mt-1">
                    {formatDate(event.registration_close_at)}
                  </p>
                </div>

                <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant">
                  <p className="text-label-sm font-label-sm text-on-surface-variant">Cancellation Deadline</p>
                  <p className="text-label-md font-label-md text-primary font-semibold mt-1">
                    {formatDate(event.cancellation_deadline)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Registration Card */}
          <div className="space-y-stack-md">
            <div className="bg-surface rounded-xl border border-outline-variant p-stack-md md:p-stack-lg shadow-sm sticky top-24 space-y-stack-md">
              {/* Event Date & Venue Info */}
              <div className="space-y-stack-sm border-b border-outline-variant pb-stack-md">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary text-[24px] mt-0.5">
                    calendar_month
                  </span>
                  <div>
                    <p className="text-label-sm font-label-sm text-on-surface-variant">Date & Time</p>
                    <p className="text-title-lg font-title-lg text-primary font-semibold">
                      {formatDate(event.event_date)}
                    </p>
                    <p className="text-body-sm text-on-surface-variant">
                      {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <span className="material-symbols-outlined text-secondary text-[24px] mt-0.5">
                    location_on
                  </span>
                  <div>
                    <p className="text-label-sm font-label-sm text-on-surface-variant">Venue</p>
                    <p className="text-body-md font-body-md text-primary font-semibold">{event.venue}</p>
                  </div>
                </div>
              </div>

              {/* Fee */}
              <div className="flex justify-between items-center py-1">
                <span className="text-body-md font-body-md text-on-surface-variant">Registration Fee</span>
                <span className="text-headline-md font-headline-md font-bold text-secondary">
                  {formatCurrency(event.fee)}
                </span>
              </div>

              {/* Live Capacity Progress Bar */}
              <div className="space-y-2 pt-2 border-t border-outline-variant/40">
                <div className="flex justify-between text-label-md font-label-md">
                  <span className="text-on-surface-variant">Confirmed Seats</span>
                  <span className={isFull ? 'text-error font-bold' : 'text-secondary font-bold'}>
                    {confirmedCount} / {event.capacity}
                  </span>
                </div>

                <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isFull ? 'bg-error' : 'bg-secondary'
                    }`}
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>

                <p className="text-label-sm font-label-sm text-on-surface-variant text-right">
                  {isFull ? '0 seats available' : `${availableSeats} seats remaining`}
                </p>
              </div>

              {/* Public Waitlist Status Banner */}
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-body-sm">
                <div className="flex items-center justify-between font-semibold mb-1">
                  <span>Smart Waitlist Queue</span>
                  <span>{waitlistCount} / 4 Spots Filled</span>
                </div>
                <p className="text-label-sm">
                  {isFull
                    ? isWaitlistFull
                      ? 'Waitlist is currently at max capacity (4/4).'
                      : 'Event is full! Join the waitlist for automatic seat promotion when someone cancels.'
                    : 'If event becomes full, a 4-person FIFO waitlist opens automatically.'}
                </p>
              </div>

              {/* Dynamic Action Button */}
              <div className="pt-2">
                {myRegistration ? (
                  <div className="space-y-2">
                    <button
                      disabled
                      className="w-full py-3 bg-emerald-600 text-white rounded-lg text-label-md font-label-md font-bold flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      <span>You Are Registered!</span>
                    </button>
                    <Link
                      to="/my-registrations"
                      className="block text-center text-label-sm font-label-sm text-secondary hover:underline py-1"
                    >
                      View Ticket Pass Info
                    </Link>
                  </div>
                ) : myWaitlist ? (
                  <div className="space-y-2">
                    <button
                      disabled
                      className="w-full py-3 bg-amber-600 text-white rounded-lg text-label-md font-label-md font-bold flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
                      <span>On Waitlist (Position #{myWaitlist.position})</span>
                    </button>
                    <Link
                      to="/my-registrations"
                      className="block text-center text-label-sm font-label-sm text-secondary hover:underline py-1"
                    >
                      View Waitlist Queue Status
                    </Link>
                  </div>
                ) : isNotOpenYet ? (
                  <button
                    disabled
                    className="w-full py-3 bg-surface-container-high text-on-surface-variant rounded-lg text-label-md font-label-md font-semibold cursor-not-allowed"
                  >
                    Registration Opens Soon
                  </button>
                ) : isClosed ? (
                  <button
                    disabled
                    className="w-full py-3 bg-surface-container-high text-on-surface-variant rounded-lg text-label-md font-label-md font-semibold cursor-not-allowed"
                  >
                    Registration Closed
                  </button>
                ) : isFull ? (
                  isWaitlistFull ? (
                    <button
                      disabled
                      className="w-full py-3 bg-surface-container-high text-on-surface-variant rounded-lg text-label-md font-label-md font-semibold cursor-not-allowed"
                    >
                      Waitlist Full (4/4)
                    </button>
                  ) : (
                    <button
                      onClick={handleJoinWaitlistClick}
                      disabled={submitting}
                      className="w-full py-3 bg-amber-600 text-white rounded-lg text-label-md font-label-md font-semibold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 shadow-sm animate-pulse"
                    >
                      <span className="material-symbols-outlined text-[20px]">queue</span>
                      <span>{event.fee > 0 ? 'Join Smart Paid Waitlist' : 'Join Smart Waitlist'}</span>
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleRegisterClick}
                    disabled={submitting}
                    className="w-full py-3 bg-secondary text-on-secondary rounded-lg text-label-md font-label-md font-semibold hover:bg-on-secondary-fixed-variant transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
                  >
                    {submitting ? (
                      'Processing...'
                    ) : (
                      <>
                        <span>{event.fee > 0 ? 'Register & Pay' : 'Register Now'}</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mock Payment Modal */}
      <MockPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        eventTitle={event.title}
        amount={event.fee}
        isWaitlist={paymentMode === 'waitlist'}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
