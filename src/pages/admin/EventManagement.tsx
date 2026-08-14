import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { Event } from '../../types/database.types';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils';

export const EventManagement: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents((data as Event[]) || []);
    } catch (err) {
      console.error('Error fetching admin events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (eventId: string, newStatus: Event['status']) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', eventId);

      if (error) throw error;

      setActionMessage(`Event status updated to ${newStatus.toUpperCase()}`);
      await fetchEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const filteredEvents = events.filter((e) => {
    if (filterStatus === 'all') return true;
    return e.status === filterStatus;
  });

  return (
    <div className="bg-background text-on-background min-h-screen font-sans flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-stack-md lg:p-stack-lg overflow-y-auto max-w-container-max">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-stack-lg gap-4">
          <div>
            <h1 className="text-headline-lg font-headline-lg text-primary">Event Management</h1>
            <p className="text-body-md text-on-surface-variant mt-1">
              Create, publish, edit, and oversee college event lifecycles.
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

        {actionMessage && (
          <div className="mb-stack-md p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-body-sm rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex border-b border-outline-variant mb-stack-lg">
          {['all', 'published', 'draft', 'cancelled', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`py-3 px-5 text-label-md font-label-md font-semibold capitalize border-b-2 transition-all ${
                filterStatus === status
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Table / List */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-body-sm text-on-surface-variant">Loading events list...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-surface border border-outline-variant rounded-xl p-6">
            <p className="text-body-md text-on-surface-variant mb-4">No events found matching this status filter.</p>
            <Link to="/admin/events/create" className="px-6 py-2 bg-secondary text-on-secondary rounded-lg font-label-md">
              Create New Event
            </Link>
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-body-sm">
                <thead>
                  <tr className="border-b border-outline-variant text-label-sm font-label-sm uppercase text-on-surface-variant bg-surface-container-low">
                    <th className="py-3.5 px-4">Event</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Venue</th>
                    <th className="py-3.5 px-4">Fee</th>
                    <th className="py-3.5 px-4">Capacity</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {filteredEvents.map((e) => (
                    <tr key={e.id} className="hover:bg-surface-container-low/50">
                      <td className="py-3.5 px-4 font-semibold text-primary">{e.title}</td>
                      <td className="py-3.5 px-4">{e.category}</td>
                      <td className="py-3.5 px-4">
                        {formatDate(e.event_date)} ({formatTime(e.start_time)})
                      </td>
                      <td className="py-3.5 px-4">{e.venue}</td>
                      <td className="py-3.5 px-4 font-semibold">{formatCurrency(e.fee)}</td>
                      <td className="py-3.5 px-4">{e.capacity}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-label-sm font-bold uppercase ${
                            e.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : e.status === 'draft'
                              ? 'bg-surface-container-high text-on-surface-variant'
                              : e.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-error-container text-on-error-container'
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Link
                          to={`/admin/events/${e.id}`}
                          className="px-2.5 py-1 bg-surface-container-high text-primary hover:bg-surface-container-highest rounded text-label-sm font-semibold"
                        >
                          Audit
                        </Link>
                        <Link
                          to={`/admin/events/${e.id}/edit`}
                          className="px-2.5 py-1 bg-secondary/10 text-secondary hover:bg-secondary/20 rounded text-label-sm font-semibold"
                        >
                          Edit
                        </Link>
                        {e.status === 'draft' && (
                          <button
                            onClick={() => handleUpdateStatus(e.id, 'published')}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded text-label-sm font-semibold hover:bg-emerald-700"
                          >
                            Publish
                          </button>
                        )}
                        {e.status === 'published' && (
                          <button
                            onClick={() => handleUpdateStatus(e.id, 'cancelled')}
                            className="px-2.5 py-1 bg-error text-on-error rounded text-label-sm font-semibold hover:bg-error/90"
                          >
                            Cancel
                          </button>
                        )}
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
