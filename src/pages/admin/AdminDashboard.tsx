import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { Event } from '../../types/database.types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { ConfigWarning } from '../../components/common/ConfigWarning';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalEvents: 0,
    publishedEvents: 0,
    totalStudents: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
    totalWaitlisted: 0,
    totalAttendance: 0,
  });

  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    try {
      // 1. Total events count
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // 2. Published events count
      const { count: pubCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      // 3. Total students count
      const { count: studentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      // 4. Total confirmed registrations
      const { count: regCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed');

      // 5. Total revenue calculated from payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('payment_status', 'successful');

      const revenueSum = paymentsData?.reduce((acc, p) => acc + (Number(p.amount) || 0), 0) || 0;

      // 6. Total active waitlisted students
      const { count: waitCount } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting');

      // 7. Total attendance checked in
      const { count: attCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalEvents: eventsCount || 0,
        publishedEvents: pubCount || 0,
        totalStudents: studentCount || 0,
        totalRegistrations: regCount || 0,
        totalRevenue: revenueSum,
        totalWaitlisted: waitCount || 0,
        totalAttendance: attCount || 0,
      });

      // Fetch recent 5 events
      const { data: eventsList } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentEvents((eventsList as Event[]) || []);
    } catch (err) {
      console.error('Error loading admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen font-sans flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-stack-md lg:p-stack-lg overflow-y-auto max-w-container-max">
        <ConfigWarning />

        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-stack-lg gap-4">
          <div>
            <h1 className="text-headline-lg font-headline-lg text-primary">Overview Dashboard</h1>
            <p className="text-body-md text-on-surface-variant mt-1">
              Real-time analytics and event operational metrics from Supabase.
            </p>
          </div>

          <Link
            to="/admin/events/create"
            className="bg-secondary text-on-secondary px-4 py-2.5 rounded-lg text-label-md font-label-md font-semibold flex items-center gap-2 shadow-sm hover:bg-on-secondary-fixed-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Create Event
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-stack-lg">
          <div className="bg-surface p-stack-md rounded-xl border border-outline-variant shadow-sm flex items-center justify-between">
            <div>
              <p className="text-label-sm font-label-sm text-on-surface-variant uppercase">Total Events</p>
              <p className="text-headline-lg font-headline-lg font-bold text-primary mt-1">
                {loading ? '...' : stats.totalEvents}
              </p>
              <p className="text-label-sm text-secondary font-semibold mt-1">
                {stats.publishedEvents} Published
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">event</span>
            </div>
          </div>

          <div className="bg-surface p-stack-md rounded-xl border border-outline-variant shadow-sm flex items-center justify-between">
            <div>
              <p className="text-label-sm font-label-sm text-on-surface-variant uppercase">Total Students</p>
              <p className="text-headline-lg font-headline-lg font-bold text-primary mt-1">
                {loading ? '...' : stats.totalStudents}
              </p>
              <p className="text-label-sm text-on-surface-variant mt-1">Registered Profiles</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-surface-container-high text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">group</span>
            </div>
          </div>

          <div className="bg-surface p-stack-md rounded-xl border border-outline-variant shadow-sm flex items-center justify-between">
            <div>
              <p className="text-label-sm font-label-sm text-on-surface-variant uppercase">Total Registrations</p>
              <p className="text-headline-lg font-headline-lg font-bold text-primary mt-1">
                {loading ? '...' : stats.totalRegistrations}
              </p>
              <p className="text-label-sm text-amber-700 font-semibold mt-1">
                {stats.totalWaitlisted} Waitlisted
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">how_to_reg</span>
            </div>
          </div>

          <div className="bg-surface p-stack-md rounded-xl border border-outline-variant shadow-sm flex items-center justify-between">
            <div>
              <p className="text-label-sm font-label-sm text-on-surface-variant uppercase">Total Revenue</p>
              <p className="text-headline-lg font-headline-lg font-bold text-emerald-700 mt-1">
                {loading ? '...' : formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-label-sm text-emerald-800 font-semibold mt-1">
                {stats.totalAttendance} Checked-In
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">payments</span>
            </div>
          </div>
        </div>

        {/* Recent Events Table */}
        <section className="bg-surface rounded-xl border border-outline-variant p-stack-md md:p-stack-lg shadow-sm">
          <div className="flex justify-between items-center mb-stack-md">
            <h2 className="text-title-lg font-title-lg text-primary">Recent University Events</h2>
            <Link to="/admin/events" className="text-label-md font-label-md text-secondary hover:underline">
              Manage All Events
            </Link>
          </div>

          {recentEvents.length === 0 ? (
            <p className="text-body-md text-on-surface-variant py-8 text-center">
              No events found. Click "Create Event" to publish your first college event.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-body-sm">
                <thead>
                  <tr className="border-b border-outline-variant text-label-sm font-label-sm uppercase text-on-surface-variant bg-surface-container-low">
                    <th className="py-3 px-4">Event Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Fee</th>
                    <th className="py-3 px-4">Capacity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {recentEvents.map((e) => (
                    <tr key={e.id} className="hover:bg-surface-container-low/50">
                      <td className="py-3 px-4 font-semibold text-primary">{e.title}</td>
                      <td className="py-3 px-4">{e.category}</td>
                      <td className="py-3 px-4">{formatDate(e.event_date)}</td>
                      <td className="py-3 px-4">{formatCurrency(e.fee)}</td>
                      <td className="py-3 px-4">{e.capacity}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-label-sm font-bold uppercase ${
                            e.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : e.status === 'draft'
                              ? 'bg-surface-container-high text-on-surface-variant'
                              : 'bg-error-container text-on-error-container'
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/admin/events/${e.id}`}
                          className="text-secondary font-semibold hover:underline"
                        >
                          View Audit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
