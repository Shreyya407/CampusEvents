import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { Event } from '../../types/database.types';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils';

export const AdminEventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [event, setEvent] = useState<Event | null>(null);
  const [confirmedRoster, setConfirmedRoster] = useState<any[]>([]);
  const [attendanceCount, setAttendanceCount] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 1. Event metadata
      const { data: evData, error: evErr } = await supabase.from('events').select('*').eq('id', id).single();
      if (evErr || !evData) throw new Error('Event not found.');
      setEvent(evData as Event);

      // 2. Confirmed Roster
      const { data: regData } = await supabase
        .from('registrations')
        .select(`
          *,
          student:profiles (*)
        `)
        .eq('event_id', id)
        .eq('status', 'confirmed')
        .order('registered_at', { ascending: true });
      setConfirmedRoster(regData || []);

      // 3. Attendance Count
      const { count: attCount } = await supabase
        .from('attendance')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', id);
      setAttendanceCount(attCount || 0);

      // 4. Revenue Calculation
      const { data: payData } = await supabase
        .from('payments')
        .select('amount')
        .eq('event_id', id)
        .eq('payment_status', 'successful');
      const sumFee = (payData || []).reduce((acc, p) => acc + Number(p.amount), 0);
      setTotalRevenue(sumFee);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="bg-background min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-headline-md text-error mb-2">Error Loading Event</h2>
        <p className="text-body-md text-on-surface-variant mb-4">{error}</p>
        <Link to="/admin/events" className="px-4 py-2 bg-secondary text-on-secondary rounded-lg">
          Back to Events List
        </Link>
      </div>
    );
  }

  const confirmedCount = confirmedRoster.length;
  const attendanceRate = confirmedCount > 0 ? Math.round((attendanceCount / confirmedCount) * 100) : 0;

  return (
    <div className="bg-background text-on-background min-h-screen font-sans flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-stack-md lg:p-stack-lg overflow-y-auto max-w-container-max">
        <Link to="/admin/events" className="inline-flex items-center gap-1 text-label-md text-secondary hover:underline mb-stack-md">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Events Management
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-stack-lg gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-secondary/10 text-secondary text-label-sm font-semibold px-2.5 py-0.5 rounded uppercase">
                {event.category}
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-label-sm font-semibold px-2.5 py-0.5 rounded uppercase">
                {event.status}
              </span>
            </div>
            <h1 className="text-headline-lg font-headline-lg text-primary">{event.title}</h1>
            <p className="text-body-sm text-on-surface-variant mt-1">
              {formatDate(event.event_date)} • {formatTime(event.start_time)} - {formatTime(event.end_time)} • Venue: {event.venue}
            </p>
          </div>

          <Link
            to={`/admin/events/${event.id}/edit`}
            className="px-4 py-2 bg-secondary/10 text-secondary hover:bg-secondary/20 rounded-lg text-label-md font-semibold"
          >
            Edit Event
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-md mb-stack-lg">
          <div className="bg-surface p-4 rounded-xl border border-outline-variant">
            <p className="text-label-sm text-on-surface-variant uppercase">Capacity</p>
            <p className="text-headline-md font-bold text-primary mt-1">{event.capacity}</p>
          </div>
          <div className="bg-surface p-4 rounded-xl border border-outline-variant">
            <p className="text-label-sm text-on-surface-variant uppercase">Confirmed</p>
            <p className="text-headline-md font-bold text-secondary mt-1">{confirmedCount}</p>
          </div>
          <div className="bg-surface p-4 rounded-xl border border-outline-variant">
            <p className="text-label-sm text-on-surface-variant uppercase">Checked In</p>
            <p className="text-headline-md font-bold text-emerald-700 mt-1">{attendanceCount} ({attendanceRate}%)</p>
          </div>
          <div className="bg-surface p-4 rounded-xl border border-outline-variant">
            <p className="text-label-sm text-on-surface-variant uppercase">Revenue</p>
            <p className="text-headline-md font-bold text-emerald-700 mt-1">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        {/* Check-in QR Code Generator Display */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-stack-md md:p-stack-lg shadow-sm mb-stack-lg flex flex-col md:flex-row items-center gap-stack-lg">
          <div className="p-4 bg-white rounded-xl border border-outline-variant shadow-sm shrink-0">
            <QRCodeSVG
              value={JSON.stringify({
                eventId: event.id,
                checkInToken: event.check_in_token,
              })}
              size={180}
              level="H"
            />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[24px]">qr_code_2</span>
              <h2 className="text-title-lg font-title-lg text-primary font-semibold">Official Event Check-in QR & 4-Digit PIN</h2>
            </div>
            <p className="text-body-md text-on-surface-variant">
              Display this official QR code or 4-digit PIN at the event venue. Students scan this QR code or enter the 4-digit PIN to mark attendance.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <span className="text-label-sm font-label-sm text-on-surface-variant">4-Digit Check-in PIN:</span>
              <code className="bg-secondary text-on-secondary px-4 py-1.5 rounded-lg text-title-lg font-mono font-bold tracking-widest select-all shadow-sm">
                {event.check_in_token}
              </code>
            </div>
          </div>
        </div>

        {/* Confirmed Roster */}
        <section className="bg-surface rounded-xl border border-outline-variant p-stack-md md:p-stack-lg shadow-sm mb-stack-lg">
          <h2 className="text-title-lg font-title-lg text-primary mb-stack-md">Confirmed Roster ({confirmedCount})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-outline-variant text-on-surface-variant font-label-sm">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Register Number</th>
                  <th className="py-3 px-4">Department & Year</th>
                  <th className="py-3 px-4">Registration Date</th>
                  <th className="py-3 px-4">Payment</th>
                </tr>
              </thead>
              <tbody>
                {confirmedRoster.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-on-surface-variant">
                      No confirmed registrations for this event yet.
                    </td>
                  </tr>
                ) : (
                  confirmedRoster.map((r) => (
                    <tr key={r.id} className="border-b border-outline-variant/40 hover:bg-surface-container-low">
                      <td className="py-3 px-4 font-semibold text-primary">{r.student?.full_name || 'N/A'}</td>
                      <td className="py-3 px-4 font-mono">{r.student?.register_number || 'N/A'}</td>
                      <td className="py-3 px-4">{r.student?.department} ({r.student?.year})</td>
                      <td className="py-3 px-4">{formatDate(r.registered_at)}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-700 uppercase">{r.payment_status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};
