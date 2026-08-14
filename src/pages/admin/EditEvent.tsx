import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { Event } from '../../types/database.types';

export const EditEvent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Academic');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [fee, setFee] = useState(0);
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [rules, setRules] = useState('');
  const [status, setStatus] = useState<Event['status']>('published');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error: err } = await supabase.from('events').select('*').eq('id', id).single();
      if (err || !data) throw new Error('Event not found.');

      const ev = data as Event;
      setEvent(ev);
      setTitle(ev.title);
      setDescription(ev.description);
      setCategory(ev.category);
      setVenue(ev.venue);
      setCapacity(ev.capacity);
      setFee(ev.fee);
      setEventDate(ev.event_date);
      setStartTime(ev.start_time);
      setEndTime(ev.end_time);
      setRules(ev.rules || '');
      setStatus(ev.status);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    setError(null);

    try {
      const { error: updateErr } = await supabase
        .from('events')
        .update({
          title,
          description,
          category,
          venue,
          capacity: Number(capacity),
          fee: Number(fee),
          event_date: eventDate,
          start_time: startTime,
          end_time: endTime,
          rules,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateErr) throw updateErr;

      navigate('/admin/events');
    } catch (err: any) {
      setError(err.message || 'Failed to update event.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen font-sans flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-stack-md lg:p-stack-lg overflow-y-auto max-w-container-max">
        <Link to="/admin/events" className="inline-flex items-center gap-1 text-label-md text-secondary hover:underline mb-stack-md">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Events Management
        </Link>

        <div className="bg-surface rounded-2xl border border-outline-variant p-stack-md md:p-stack-lg shadow-sm max-w-4xl">
          <h1 className="text-headline-lg font-headline-lg text-primary mb-1">Edit Event Details</h1>
          <p className="text-body-md text-on-surface-variant mb-stack-lg">
            Update event information, seat capacity, fees, or status.
          </p>

          {error && (
            <div className="mb-stack-md p-3 bg-error-container text-on-error-container text-body-sm rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-stack-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              <div className="md:col-span-2">
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md"
                />
              </div>

              <div>
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md"
                >
                  <option value="Academic">Academic</option>
                  <option value="Technology">Technology & Coding</option>
                  <option value="Career">Career & Placement</option>
                  <option value="Social">Social & Cultural</option>
                  <option value="Sports">Sports & Fitness</option>
                  <option value="Workshop">Workshop</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                Description
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
              <div>
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md"
                />
              </div>
              <div>
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md"
                />
              </div>
              <div>
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md"
                />
              </div>
              <div>
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  Venue
                </label>
                <input
                  type="text"
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              <div>
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md"
                />
              </div>
              <div>
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  Fee ($)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md"
                />
              </div>
              <div>
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                Rules & Guidelines
              </label>
              <textarea
                rows={3}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md"
              />
            </div>

            <div className="pt-stack-md flex justify-end gap-4">
              <Link
                to="/admin/events"
                className="px-6 py-2.5 bg-surface border border-outline-variant rounded-lg text-label-md text-on-surface-variant hover:bg-surface-container-high"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-2.5 bg-secondary text-on-secondary rounded-lg font-label-md font-semibold hover:bg-on-secondary-fixed-variant transition-colors shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
