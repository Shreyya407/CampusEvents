import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { StudentNavbar } from '../../components/layout/StudentNavbar';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { cancelRegistrationRPC } from '../../lib/rpc';

export const MyRegistrations: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyData();
      subscribeToRealtime();
    }
  }, [user]);

  const fetchMyData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: regData, error: regErr } = await supabase
        .from('registrations')
        .select(`
          *,
          event:events (*)
        `)
        .eq('student_id', user.id)
        .order('registered_at', { ascending: false });

      if (regErr) throw regErr;
      setRegistrations(regData || []);
    } catch (err: any) {
      console.error('Error fetching student registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRealtime = () => {
    if (!user) return;
    const channel = supabase
      .channel('my_registrations_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registrations', filter: `student_id=eq.${user.id}` },
        () => fetchMyData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleCancelRegistration = async (regId: string) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) return;

    setCancellingId(regId);
    setActionMessage(null);
    setActionError(null);

    try {
      const res = await cancelRegistrationRPC(regId);
      if (!res.success) {
        throw new Error(res.message || 'Cancellation failed.');
      }

      setActionMessage('Registration cancelled successfully.');
      await fetchMyData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-on-background">
      <StudentNavbar />

      <main className="flex-grow max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg pt-20 md:pt-24 pb-32 md:pb-stack-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-stack-lg gap-4">
          <div>
            <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-primary">
              My Event Registrations
            </h1>
            <p className="text-body-md text-on-surface-variant mt-1">
              View your confirmed event passes and ticket details.
            </p>
          </div>

          <Link
            to="/scan"
            className="bg-secondary text-on-secondary px-4 py-2.5 rounded-lg text-label-md font-label-md font-semibold flex items-center gap-2 shadow-sm hover:bg-on-secondary-fixed-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
            <span>Scan Event QR for Check-in</span>
          </Link>
        </div>

        {/* Action Banners */}
        {actionMessage && (
          <div className="mb-stack-md p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 text-body-md rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-600 text-[24px]">check_circle</span>
            <span>{actionMessage}</span>
          </div>
        )}

        {actionError && (
          <div className="mb-stack-md p-4 bg-error-container text-on-error-container text-body-md rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px]">error</span>
            <span>{actionError}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-16 bg-surface border border-outline-variant rounded-xl p-6">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-2">
              confirmation_number
            </span>
            <h3 className="text-title-lg font-title-lg text-primary mb-1">No Registrations Yet</h3>
            <p className="text-body-md text-on-surface-variant mb-6">
              You haven't registered for any campus events yet.
            </p>
            <Link to="/events" className="px-6 py-2.5 bg-secondary text-on-secondary rounded-lg font-label-md">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
            {registrations.map((reg) => {
              const event = reg.event;
              if (!event) return null;
              const isCancelled = reg.status === 'cancelled';
              const canCancel = !isCancelled && new Date() <= new Date(event.cancellation_deadline);

              return (
                <div
                  key={reg.id}
                  className={`bg-surface rounded-xl border p-stack-md shadow-sm flex flex-col justify-between transition-all ${
                    isCancelled ? 'opacity-60 border-outline-variant' : 'border-outline-variant hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-label-sm font-label-sm uppercase px-2.5 py-1 bg-surface-container-high text-primary rounded font-semibold">
                        {event.category}
                      </span>
                      <span
                        className={`text-label-sm font-label-sm px-2.5 py-1 rounded-full font-bold uppercase ${
                          isCancelled
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {reg.status}
                      </span>
                    </div>

                    <h3 className="text-title-lg font-title-lg text-primary mb-2 line-clamp-1">
                      {event.title}
                    </h3>

                    <div className="text-body-sm text-on-surface-variant space-y-1.5 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-secondary">
                          calendar_month
                        </span>
                        <span>
                          {formatDate(event.event_date)} • {formatTime(event.start_time)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-secondary">
                          location_on
                        </span>
                        <span>{event.venue}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-secondary">
                          receipt
                        </span>
                        <span>
                          Fee: {formatCurrency(event.fee)} ({reg.payment_status})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-label-sm text-on-surface-variant font-mono">
                        <span className="material-symbols-outlined text-[18px] text-secondary">badge</span>
                        <span>Ticket Pass ID: {reg.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-stack-sm border-t border-outline-variant/30 flex items-center justify-between gap-2">
                    <span className="text-label-sm text-on-surface-variant">
                      Scan event QR at venue to check-in
                    </span>

                    {canCancel && (
                      <button
                        onClick={() => handleCancelRegistration(reg.id)}
                        disabled={cancellingId === reg.id}
                        className="px-3 py-1.5 text-error hover:bg-error-container/30 rounded text-label-sm font-label-sm transition-colors font-semibold"
                      >
                        {cancellingId === reg.id ? 'Cancelling...' : 'Cancel Registration'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
