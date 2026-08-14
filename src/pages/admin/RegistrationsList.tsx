import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { formatDate } from '../../lib/utils';

export const RegistrationsList: React.FC = () => {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('registrations')
        .select(`
          *,
          event:events(*),
          student:profiles(*)
        `)
        .order('registered_at', { ascending: false });

      setRegistrations(data || []);
    } catch (err) {
      console.error('Error loading registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen font-sans flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-stack-md lg:p-stack-lg overflow-y-auto max-w-container-max">
        <div className="mb-stack-lg">
          <h1 className="text-headline-lg font-headline-lg text-primary">Student Registrations Database</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Complete real-time log of student registrations across all university events.
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
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Register Number</th>
                    <th className="py-3.5 px-4">Event</th>
                    <th className="py-3.5 px-4">Registered Date</th>
                    <th className="py-3.5 px-4">Registration Status</th>
                    <th className="py-3.5 px-4">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-surface-container-low/50">
                      <td className="py-3.5 px-4 font-semibold text-primary">{reg.student?.full_name}</td>
                      <td className="py-3.5 px-4 font-mono">{reg.student?.register_number}</td>
                      <td className="py-3.5 px-4">{reg.event?.title}</td>
                      <td className="py-3.5 px-4">{formatDate(reg.registered_at)}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-label-sm font-bold uppercase ${
                            reg.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-error-container text-on-error-container'
                          }`}
                        >
                          {reg.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold uppercase">{reg.payment_status}</td>
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
