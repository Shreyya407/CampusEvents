import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Registration, WaitlistEntry } from '../../types/database.types';
import { StudentNavbar } from '../../components/layout/StudentNavbar';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { cancelRegistrationRPC } from '../../lib/rpc';
import { QRCodeSVG } from 'qrcode.react';

export const MyRegistrations: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'tickets' | 'waitlist'>('tickets');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Selected QR modal ticket
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyData();
    }
  }, [user]);

  const fetchMyData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch Confirmed Registrations
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

      // 2. Fetch Waitlist Entries
      const { data: waitData, error: waitErr } = await supabase
        .from('waitlist')
        .select(`
          *,
          event:events (*)
        `)
        .eq('student_id', user.id)
        .order('joined_at', { ascending: false });

      if (waitErr) throw waitErr;
      setWaitlistEntries(waitData || []);
    } catch (err: any) {
      console.error('Error fetching student data:', err);
    } finally {
      setLoading(false);
    }
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

      setActionMessage('Registration cancelled successfully. Seat released.');
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
              Manage your confirmed event tickets, QR check-ins, and waitlist positions.
            </p>
          </div>

          <Link
            to="/scan"
            className="bg-secondary text-on-secondary px-4 py-2.5 rounded-lg text-label-md font-label-md font-semibold flex items-center gap-2 shadow-sm hover:bg-on-secondary-fixed-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
            <span>Scan QR for Attendance</span>
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

        {/* Tabs */}
        <div className="flex border-b border-outline-variant mb-stack-lg">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-3 px-6 text-label-md font-label-md font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'tickets'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
            <span>Confirmed Tickets ({registrations.filter((r) => r.status === 'confirmed').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('waitlist')}
            className={`py-3 px-6 text-label-md font-label-md font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'waitlist'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">hourglass_empty</span>
            <span>Waitlist Queue ({waitlistEntries.filter((w) => w.status === 'waiting').length})</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activeTab === 'tickets' ? (
          /* Confirmed Tickets Tab */
          registrations.length === 0 ? (
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
                      </div>
                    </div>

                    <div className="pt-stack-sm border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-2">
                      {!isCancelled && (
                        <button
                          onClick={() => setSelectedTicket(reg)}
                          className="px-4 py-2 bg-secondary/10 text-secondary hover:bg-secondary/20 rounded-lg text-label-sm font-label-sm font-semibold flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[18px]">qr_code</span>
                          <span>Show Check-in QR</span>
                        </button>
                      )}

                      {canCancel && (
                        <button
                          onClick={() => handleCancelRegistration(reg.id)}
                          disabled={cancellingId === reg.id}
                          className="px-3 py-1.5 text-error hover:bg-error-container/30 rounded text-label-sm font-label-sm transition-colors"
                        >
                          {cancellingId === reg.id ? 'Cancelling...' : 'Cancel Registration'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Waitlist Queue Tab */
          waitlistEntries.length === 0 ? (
            <div className="text-center py-16 bg-surface border border-outline-variant rounded-xl p-6">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-2">
                hourglass_empty
              </span>
              <h3 className="text-title-lg font-title-lg text-primary mb-1">No Active Waitlist Entries</h3>
              <p className="text-body-md text-on-surface-variant">
                You are currently not on any event waitlists.
              </p>
            </div>
          ) : (
            <div className="space-y-stack-md">
              {waitlistEntries.map((wait) => {
                const event = wait.event;
                if (!event) return null;

                return (
                  <div
                    key={wait.id}
                    className="bg-surface rounded-xl border border-outline-variant p-stack-md shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-amber-100 text-amber-900 font-bold px-3 py-0.5 rounded-full text-label-sm">
                          Waitlist Position #{wait.position}
                        </span>
                        <span className="text-label-sm text-on-surface-variant uppercase font-semibold">
                          {wait.status}
                        </span>
                      </div>
                      <h3 className="text-title-lg font-title-lg text-primary">{event.title}</h3>
                      <p className="text-body-sm text-on-surface-variant mt-1">
                        Joined: {formatDate(wait.joined_at)} • Event Date: {formatDate(event.event_date)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {wait.status === 'waiting' && (
                        <div className="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200 text-label-sm max-w-xs">
                          If a seat opens before deadline, you will be auto-confirmed into position #1!
                        </div>
                      )}
                      {wait.status === 'confirmed' && (
                        <div className="bg-emerald-100 text-emerald-900 px-3 py-2 rounded-lg text-label-sm font-bold">
                          🎉 Promoted to Confirmed Seat!
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>

      {/* QR Code Modal Display */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-outline-variant p-6 max-w-sm w-full flex flex-col items-center text-center shadow-2xl relative">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[28px]">qr_code_2</span>
            </div>

            <h3 className="text-title-lg font-title-lg text-primary mb-1">Event Entry Pass</h3>
            <p className="text-body-sm text-on-surface-variant mb-4">
              {selectedTicket.event?.title}
            </p>

            {/* QR Code Graphic */}
            <div className="p-4 bg-white rounded-xl border border-outline-variant shadow-inner mb-4">
              <QRCodeSVG
                value={JSON.stringify({
                  eventId: selectedTicket.event_id,
                  studentId: selectedTicket.student_id,
                  checkInToken: selectedTicket.event?.check_in_token,
                })}
                size={180}
                level="H"
              />
            </div>

            <p className="text-label-sm text-on-surface-variant">
              Show this QR code at the event check-in kiosk to mark attendance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

