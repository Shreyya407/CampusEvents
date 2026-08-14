import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { Event } from '../../types/database.types';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils';
import { QRCodeSVG } from 'qrcode.react';

export const AdminEventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchEventAudit();
  }, [id]);

  const fetchEventAudit = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 1. Fetch Event
      const { data: eventData } = await supabase.from('events').select('*').eq('id', id).single();
      if (eventData) setEvent(eventData as Event);

      // 2. Fetch Registrations
      const { data: regData } = await supabase
        .from('registrations')
        .select('*, student:profiles(*)')
        .eq('event_id', id)
        .order('registered_at', { ascending: false });
      setRegistrations(regData || []);

      // 3. Fetch Waitlists
      const { data: waitData } = await supabase
        .from('waitlist')
        .select('*, student:profiles(*)')
        .eq('event_id', id)
        .order('position', { ascending: true });
      setWaitlistEntries(waitData || []);

      // 4. Fetch Attendance Records
      const { data: attData } = await supabase
        .from('attendance')
        .select('*, student:profiles(*)')
        .eq('event_id', id)
        .order('checked_in_at', { ascending: false });
      setAttendanceRecords(attData || []);
    } catch (err) {
      console.error('Error fetching event audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !event) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const confirmedRegs = registrations.filter((r) => r.status === 'confirmed');
  const confirmedCount = confirmedRegs.length;
  const attendanceCount = attendanceRecords.length;
  const attendanceRate = confirmedCount > 0 ? Math.round((attendanceCount / confirmedCount) * 100) : 0;
  const totalRevenue = confirmedRegs.length * event.fee;

  return (
    <div className="bg-background text-on-background min-h-screen font-sans flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-stack-md lg:p-stack-lg overflow-y-auto max-w-container-max">
        <Link to="/admin/events" className="inline-flex items-center gap-1 text-label-md text-secondary hover:underline mb-stack-md">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Events Management
        </Link>

        {/* Event Header Banner */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-stack-md md:p-stack-lg shadow-sm mb-stack-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-secondary text-on-secondary px-2.5 py-0.5 rounded text-label-sm font-semibold uppercase">
                {event.category}
              </span>
              <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-label-sm font-bold uppercase">
                {event.status}
              </span>
            </div>
            <h1 className="text-headline-lg font-headline-lg text-primary">{event.title}</h1>
            <p className="text-body-md text-on-surface-variant mt-1">
              {formatDate(event.event_date)} • {formatTime(event.start_time)} - {formatTime(event.end_time)} • {event.venue}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-stack-md mb-stack-lg">
          <div className="bg-surface p-4 rounded-xl border border-outline-variant">
            <p className="text-label-sm text-on-surface-variant uppercase">Capacity</p>
            <p className="text-headline-md font-bold text-primary mt-1">{event.capacity}</p>
          </div>
          <div className="bg-surface p-4 rounded-xl border border-outline-variant">
            <p className="text-label-sm text-on-surface-variant uppercase">Confirmed</p>
            <p className="text-headline-md font-bold text-secondary mt-1">{confirmedCount}</p>
          </div>
          <div className="bg-surface p-4 rounded-xl border border-outline-variant">
            <p className="text-label-sm text-on-surface-variant uppercase">Waitlisted</p>
            <p className="text-headline-md font-bold text-amber-700 mt-1">{waitlistEntries.filter(w => w.status === 'waiting').length}</p>
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
              <h2 className="text-title-lg font-title-lg text-primary font-semibold">Official Event Check-in QR Code</h2>
            </div>
            <p className="text-body-md text-on-surface-variant">
              Display this official QR code at the event venue. Students scan this QR code using their student portal to record attendance.
            </p>
            <div className="pt-2">
              <p className="text-label-sm font-label-sm text-on-surface-variant">
                Secure Check-in Token: <code className="bg-surface-container-high px-2 py-1 rounded text-primary font-mono select-all">{event.check_in_token}</code>
              </p>
            </div>
          </div>
        </div>

        {/* Confirmed Roster */}
        <section className="bg-surface rounded-xl border border-outline-variant p-stack-md md:p-stack-lg shadow-sm mb-stack-lg">
          <h2 className="text-title-lg font-title-lg text-primary mb-stack-md">Confirmed Roster ({confirmedCount})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-outline-variant text-label-sm uppercase text-on-surface-variant bg-surface-container-low">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Register Number</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Department & Year</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {confirmedRegs.map((reg) => (
                  <tr key={reg.id} className="hover:bg-surface-container-low/50">
                    <td className="py-3 px-4 font-semibold text-primary">{reg.student?.full_name}</td>
                    <td className="py-3 px-4 font-mono">{reg.student?.register_number}</td>
                    <td className="py-3 px-4">{reg.student?.email}</td>
                    <td className="py-3 px-4">{reg.student?.department} (Yr {reg.student?.year})</td>
                    <td className="py-3 px-4">{formatDate(reg.registered_at)}</td>
                    <td className="py-3 px-4 uppercase font-semibold text-emerald-700">{reg.payment_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};
