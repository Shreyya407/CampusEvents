import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { formatDate } from '../../lib/utils';

export const WaitlistList: React.FC = () => {
  const [waitlists, setWaitlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWaitlists();
  }, []);

  const fetchWaitlists = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('waitlist')
        .select(`
          *,
          event:events(*),
          student:profiles(*)
        `)
        .order('joined_at', { ascending: false });

      setWaitlists(data || []);
    } catch (err) {
      console.error('Error loading waitlist:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen font-sans flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-stack-md lg:p-stack-lg overflow-y-auto max-w-container-max">
        <div className="mb-stack-lg">
          <h1 className="text-headline-lg font-headline-lg text-primary">Smart Waitlist Queue Management</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Monitor FIFO waitlist positions (Max 4 per event) and automatic confirmation promotions.
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
                    <th className="py-3.5 px-4">FIFO Position</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Event</th>
                    <th className="py-3.5 px-4">Joined Date</th>
                    <th className="py-3.5 px-4">Waitlist Status</th>
                    <th className="py-3.5 px-4">Confirmed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {waitlists.map((w) => (
                    <tr key={w.id} className="hover:bg-surface-container-low/50">
                      <td className="py-3.5 px-4 font-bold text-amber-700">
                        Pos #{w.position}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-primary">{w.student?.full_name}</td>
                      <td className="py-3.5 px-4">{w.event?.title}</td>
                      <td className="py-3.5 px-4">{formatDate(w.joined_at)}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-label-sm font-bold uppercase ${
                            w.status === 'waiting'
                              ? 'bg-amber-100 text-amber-900'
                              : w.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{w.confirmed_at ? formatDate(w.confirmed_at) : '—'}</td>
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
