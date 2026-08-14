import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { formatCurrency } from '../../lib/utils';
import { Event } from '../../types/database.types';

export const Analytics: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [totalConfirmed, setTotalConfirmed] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalAttendance, setTotalAttendance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // 1. Fetch Events
      const { data: eventsData } = await supabase.from('events').select('*');
      const loadedEvents = (eventsData as Event[]) || [];
      setEvents(loadedEvents);

      const capSum = loadedEvents.reduce((acc, e) => acc + (e.capacity || 0), 0);
      setTotalCapacity(capSum);

      // Category counts
      const catMap: Record<string, number> = {};
      loadedEvents.forEach((e) => {
        catMap[e.category] = (catMap[e.category] || 0) + 1;
      });
      setCategoryStats(catMap);

      // 2. Fetch Confirmed Registrations
      const { count: confCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed');
      setTotalConfirmed(confCount || 0);

      // 3. Fetch Payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('payment_status', 'successful');

      const rev = paymentsData?.reduce((acc, p) => acc + (Number(p.amount) || 0), 0) || 0;
      setTotalRevenue(rev);

      // 4. Fetch Attendance
      const { count: attCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true });
      setTotalAttendance(attCount || 0);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const utilizationPercent = totalCapacity > 0 ? Math.round((totalConfirmed / totalCapacity) * 100) : 0;
  const attendancePercent = totalConfirmed > 0 ? Math.round((totalAttendance / totalConfirmed) * 100) : 0;

  return (
    <div className="bg-background text-on-background min-h-screen font-sans flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-stack-md lg:p-stack-lg overflow-y-auto max-w-container-max">
        <div className="mb-stack-lg">
          <h1 className="text-headline-lg font-headline-lg text-primary">University Analytics & Performance</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Data-driven reports calculated live from active Supabase database records.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          </div>
        ) : (
          <div className="space-y-stack-lg">
            {/* Key KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
              <div className="bg-surface p-stack-md rounded-xl border border-outline-variant shadow-sm">
                <p className="text-label-sm uppercase text-on-surface-variant">Capacity Utilization</p>
                <p className="text-headline-lg font-bold text-secondary mt-1">{utilizationPercent}%</p>
                <div className="w-full bg-surface-container-high h-2 rounded-full mt-2 overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: `${utilizationPercent}%` }} />
                </div>
                <p className="text-label-sm text-on-surface-variant mt-2">
                  {totalConfirmed} confirmed out of {totalCapacity} seats
                </p>
              </div>

              <div className="bg-surface p-stack-md rounded-xl border border-outline-variant shadow-sm">
                <p className="text-label-sm uppercase text-on-surface-variant">Attendance Turnout</p>
                <p className="text-headline-lg font-bold text-emerald-700 mt-1">{attendancePercent}%</p>
                <div className="w-full bg-surface-container-high h-2 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${attendancePercent}%` }} />
                </div>
                <p className="text-label-sm text-on-surface-variant mt-2">
                  {totalAttendance} student check-ins verified
                </p>
              </div>

              <div className="bg-surface p-stack-md rounded-xl border border-outline-variant shadow-sm">
                <p className="text-label-sm uppercase text-on-surface-variant">Total Event Revenue</p>
                <p className="text-headline-lg font-bold text-primary mt-1">{formatCurrency(totalRevenue)}</p>
                <p className="text-label-sm text-emerald-800 font-semibold mt-2">Paid Registrations + Waitlists</p>
              </div>

              <div className="bg-surface p-stack-md rounded-xl border border-outline-variant shadow-sm">
                <p className="text-label-sm uppercase text-on-surface-variant">Total Managed Events</p>
                <p className="text-headline-lg font-bold text-primary mt-1">{events.length}</p>
                <p className="text-label-sm text-on-surface-variant mt-2">Across all categories</p>
              </div>
            </div>

            {/* Category Breakdown Progress Bars */}
            <div className="bg-surface rounded-xl border border-outline-variant p-stack-md md:p-stack-lg shadow-sm">
              <h2 className="text-title-lg font-title-lg text-primary mb-stack-md">Events by Category</h2>
              <div className="space-y-4">
                {Object.entries(categoryStats).map(([cat, count]) => {
                  const percent = events.length > 0 ? Math.round((count / events.length) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-body-sm font-semibold text-primary">
                        <span>{cat}</span>
                        <span>{count} events ({percent}%)</span>
                      </div>
                      <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
