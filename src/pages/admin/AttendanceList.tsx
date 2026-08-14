import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { formatDate, formatTime } from '../../lib/utils';

export const AttendanceList: React.FC = () => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('attendance')
        .select(`
          *,
          event:events(*),
          student:profiles(*)
        `)
        .order('checked_in_at', { ascending: false });

      setAttendance(data || []);
    } catch (err) {
      console.error('Error loading attendance log:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen font-sans flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-stack-md lg:p-stack-lg overflow-y-auto max-w-container-max">
        <div className="mb-stack-lg">
          <h1 className="text-headline-lg font-headline-lg text-primary">QR Attendance Audit Log</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Real-time student check-ins verified via secure QR tokens.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-body-sm">
                <thead>
                  <tr className="border-b border-outline-variant text-label-sm uppercase text-on-surface-variant bg-surface-container-low">
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Register Number</th>
                    <th className="py-3.5 px-4">Event Title</th>
                    <th className="py-3.5 px-4">Venue</th>
                    <th className="py-3.5 px-4">Checked-In Timestamp</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {attendance.map((att) => (
                    <tr key={att.id} className="hover:bg-surface-container-low/50">
                      <td className="py-3.5 px-4 font-semibold text-primary">{att.student?.full_name}</td>
                      <td className="py-3.5 px-4 font-mono">{att.student?.register_number}</td>
                      <td className="py-3.5 px-4">{att.event?.title}</td>
                      <td className="py-3.5 px-4">{att.event?.venue}</td>
                      <td className="py-3.5 px-4 font-mono">
                        {formatDate(att.checked_in_at)} • {formatTime(new Date(att.checked_in_at).toTimeString())}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-label-sm font-bold uppercase bg-emerald-100 text-emerald-800">
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
