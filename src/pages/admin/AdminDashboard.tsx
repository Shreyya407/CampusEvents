import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils';
import { Event } from '../../types/database.types';

export const AdminDashboard: React.FC = () => {
  const [totalEvents, setTotalEvents] = useState(0);
  const [activeEvents, setActiveEvents] = useState(0);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCheckIns, setTotalCheckIns] = useState(0);

  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    try {
      // 1. Total Events
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });
      setTotalEvents(eventsCount || 0);

      // 2. Active Published Events
      const { count: activeCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');
      setActiveEvents(activeCount || 0);

      // 3. Total Confirmed Registrations
      const { count: regCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed');
      setTotalRegistrations(regCount || 0);

      // 4. Total Revenue Collected
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('payment_status', 'successful');

      const revenue = (paymentsData || []).reduce((sum, p) => sum + Number(p.amount), 0);
      setTotalRevenue(revenue);

      // 5. Total Attendance Check-ins
      const { count: attCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'present');
      setTotalCheckIns(attCount || 0);

      // Fetch Recent Events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);
      setRecentEvents(eventsData || []);

      // Fetch Recent Registrations
      const { data: regList } = await supabase
        .from('registrations')
        .select(`
          id,
          registered_at,
          status,
          student:profiles (full_name, register_number, email),
          event:events (title)
        `)
        .order('registered_at', { ascending: false })
        .limit(5);
      setRecentRegistrations(regList || []);
    } catch (err: any) {
      console.error('Error fetching admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen font-sans flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-stack-md lg:p-stack-lg overflow-y-auto max-w-container-max">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-stack-lg gap-4">
          <div>
            <h1 className="text-headline-lg font-headline-lg text-primary">University Management Dashboard</h1>
            <p className="text-body-md text-on-surface-variant mt-1">
              Live overview of campus events, registrations, revenue, and student check-ins.
            </p>
          </div>

          <Link
            to="/admin/events/create"
            className="bg-secondary text-on-secondary px-5 py-2.5 rounded-lg font-label-md font-semibold flex items-center gap-2 shadow-sm hover:bg-on-secondary-fixed-variant transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Create New Event</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-md mb-stack-lg">
              <div className="bg-surface rounded-xl border border-outline-variant p-stack-md shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-label-md font-label-md text-on-surface-variant font-semibold">Total Events</span>
                  <span className="material-symbols-outlined text-secondary bg-secondary/10 p-2 rounded-lg text-[22px]">
                    event
                  </span>
                </div>
                <p className="text-headline-lg font-headline-lg font-bold text-primary">{totalEvents}</p>
                <p className="text-label-sm text-on-surface-variant mt-1">{activeEvents} Currently Active</p>
              </div>

              <div className="bg-surface rounded-xl border border-outline-variant p-stack-md shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-label-md font-label-md text-on-surface-variant font-semibold">Confirmed Registrations</span>
                  <span className="material-symbols-outlined text-emerald-600 bg-emerald-100 p-2 rounded-lg text-[22px]">
                    how_to_reg
                  </span>
                </div>
                <p className="text-headline-lg font-headline-lg font-bold text-primary">{totalRegistrations}</p>
                <p className="text-label-sm text-emerald-700 mt-1">Confirmed Student Passes</p>
              </div>

              <div className="bg-surface rounded-xl border border-outline-variant p-stack-md shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-label-md font-label-md text-on-surface-variant font-semibold">Total Revenue</span>
                  <span className="material-symbols-outlined text-secondary bg-secondary/10 p-2 rounded-lg text-[22px]">
                    payments
                  </span>
                </div>
                <p className="text-headline-lg font-headline-lg font-bold text-primary">{formatCurrency(totalRevenue)}</p>
                <p className="text-label-sm text-on-surface-variant mt-1">Paid Event Collections</p>
              </div>

              <div className="bg-surface rounded-xl border border-outline-variant p-stack-md shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-label-md font-label-md text-on-surface-variant font-semibold">Attendance Check-ins</span>
                  <span className="material-symbols-outlined text-indigo-600 bg-indigo-100 p-2 rounded-lg text-[22px]">
                    fact_check
                  </span>
                </div>
                <p className="text-headline-lg font-headline-lg font-bold text-primary">{totalCheckIns}</p>
                <p className="text-label-sm text-indigo-700 mt-1">Verified Venue Check-ins</p>
              </div>
            </div>

            {/* Quick Audit Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-stack-lg">
              {/* Recent Events */}
              <div className="bg-surface rounded-xl border border-outline-variant p-stack-md shadow-sm">
                <div className="flex justify-between items-center mb-stack-md">
                  <h3 className="text-title-lg font-title-lg text-primary">Recent Events</h3>
                  <Link to="/admin/events" className="text-label-sm text-secondary hover:underline font-semibold">
                    View All
                  </Link>
                </div>

                <div className="space-y-stack-sm">
                  {recentEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/60 flex justify-between items-center"
                    >
                      <div>
                        <h4 className="text-label-md font-label-md text-primary font-semibold">{ev.title}</h4>
                        <p className="text-body-sm text-on-surface-variant">
                          {formatDate(ev.event_date)} • {ev.venue}
                        </p>
                      </div>
                      <span className="text-label-sm font-bold uppercase px-2.5 py-0.5 rounded bg-surface text-primary">
                        {ev.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Student Registrations */}
              <div className="bg-surface rounded-xl border border-outline-variant p-stack-md shadow-sm">
                <div className="flex justify-between items-center mb-stack-md">
                  <h3 className="text-title-lg font-title-lg text-primary">Recent Registrations</h3>
                  <Link to="/admin/registrations" className="text-label-sm text-secondary hover:underline font-semibold">
                    View All
                  </Link>
                </div>

                <div className="space-y-stack-sm">
                  {recentRegistrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/60 flex justify-between items-center"
                    >
                      <div>
                        <h4 className="text-label-md font-label-md text-primary font-semibold">
                          {reg.student?.full_name || 'Student'} ({reg.student?.register_number || 'N/A'})
                        </h4>
                        <p className="text-body-sm text-on-surface-variant">{reg.event?.title}</p>
                      </div>
                      <span className="text-label-sm bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase">
                        {reg.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
