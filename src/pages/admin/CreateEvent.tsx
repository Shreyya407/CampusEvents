import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { generate4DigitToken } from '../../lib/utils';

export const CreateEvent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Academic');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [fee, setFee] = useState(0);

  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('13:00');

  const [regOpenAt, setRegOpenAt] = useState('');
  const [regCloseAt, setRegCloseAt] = useState('');
  const [cancellationDeadline, setCancellationDeadline] = useState('');

  const [checkInStartAt, setCheckInStartAt] = useState('');
  const [checkInEndAt, setCheckInEndAt] = useState('');
  const [checkInToken, setCheckInToken] = useState(generate4DigitToken());

  const [rules, setRules] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [posterFile, setPosterFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerateToken = () => {
    setCheckInToken(generate4DigitToken());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let posterUrl: string | null = null;

      // 1. Upload Poster File if provided
      if (posterFile) {
        const fileExt = posterFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `posters/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('event-posters')
          .upload(filePath, posterFile);

        if (!uploadErr) {
          const { data: publicUrlData } = supabase.storage
            .from('event-posters')
            .getPublicUrl(filePath);

          posterUrl = publicUrlData.publicUrl;
        }
      }

      // Default dates formatting if unselected
      const now = new Date();
      const defaultOpen = regOpenAt ? new Date(regOpenAt).toISOString() : now.toISOString();
      const defaultClose = regCloseAt ? new Date(regCloseAt).toISOString() : new Date(now.getTime() + 7 * 86400000).toISOString();
      const defaultCancel = cancellationDeadline ? new Date(cancellationDeadline).toISOString() : defaultClose;

      // 2. Insert into events table
      const { data, error: insertErr } = await supabase
        .from('events')
        .insert({
          title,
          description,
          category,
          venue,
          capacity: Number(capacity),
          fee: Number(fee),
          event_date: eventDate || now.toISOString().split('T')[0],
          start_time: startTime,
          end_time: endTime,
          registration_open_at: defaultOpen,
          registration_close_at: defaultClose,
          cancellation_deadline: defaultCancel,
          check_in_start_at: checkInStartAt ? new Date(checkInStartAt).toISOString() : null,
          check_in_end_at: checkInEndAt ? new Date(checkInEndAt).toISOString() : null,
          check_in_token: checkInToken || generate4DigitToken(),
          rules,
          status,
          poster_url: posterUrl,
          created_by: user?.id || null,
        })
        .select('id')
        .single();

      if (insertErr) throw insertErr;

      navigate('/admin/events');
    } catch (err: any) {
      setError(err.message || 'Failed to create event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen font-sans flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-stack-md lg:p-stack-lg overflow-y-auto max-w-container-max">
        <Link
          to="/admin/events"
          className="inline-flex items-center gap-1 text-label-md text-secondary hover:underline mb-stack-md"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Events Management
        </Link>

        <div className="bg-surface rounded-2xl border border-outline-variant p-stack-md md:p-stack-lg shadow-sm max-w-4xl">
          <h1 className="text-headline-lg font-headline-lg text-primary mb-1">Create New College Event</h1>
          <p className="text-body-md text-on-surface-variant mb-stack-lg">
            Configure event capacity, fees (₹ INR), registration timelines, poster imagery, and 4-digit check-in PIN.
          </p>

          {error && (
            <div className="mb-stack-md p-3 bg-error-container text-on-error-container text-body-sm rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-stack-md">
            {/* Title & Category */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              <div className="md:col-span-2">
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual AI & Robotics Symposium 2026"
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

            {/* Description */}
            <div>
              <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                Full Event Description
              </label>
              <textarea
                required
                rows={4}
                placeholder="Provide event details, schedule, highlights..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md"
              />
            </div>

            {/* Date, Times & Venue */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
              <div>
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  Event Date
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
                  Venue / Location
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Auditorium"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md"
                />
              </div>
            </div>

            {/* Capacity & Fee in INR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              <div>
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  Total Seat Capacity
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
                  Registration Fee (₹ INR)
                </label>
                <input
                  type="number"
                  min={0}
                  step="1"
                  required
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md"
                />
                <p className="text-label-sm text-on-surface-variant mt-1">Set ₹0 for Free Events</p>
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
                </select>
              </div>
            </div>

            {/* Registration & Cancellation Timelines */}
            <div className="p-stack-md bg-surface-container-low rounded-xl border border-outline-variant space-y-stack-md">
              <h3 className="text-title-lg font-title-lg text-primary">Registration & Cancellation Timelines</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                <div>
                  <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
                    Registration Opens
                  </label>
                  <input
                    type="datetime-local"
                    value={regOpenAt}
                    onChange={(e) => setRegOpenAt(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm"
                  />
                </div>
                <div>
                  <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
                    Registration Closes
                  </label>
                  <input
                    type="datetime-local"
                    value={regCloseAt}
                    onChange={(e) => setRegCloseAt(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm"
                  />
                </div>
                <div>
                  <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
                    Cancellation Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={cancellationDeadline}
                    onChange={(e) => setCancellationDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm"
                  />
                </div>
              </div>
            </div>

            {/* Check-in QR Window & 4-Digit PIN */}
            <div className="p-stack-md bg-surface-container-low rounded-xl border border-outline-variant space-y-stack-md">
              <div className="flex justify-between items-center">
                <h3 className="text-title-lg font-title-lg text-primary">Check-in Window & 4-Digit Token PIN</h3>
                <button
                  type="button"
                  onClick={handleRegenerateToken}
                  className="px-3 py-1 bg-surface border border-outline-variant rounded text-label-sm text-secondary font-semibold hover:bg-surface-container-high"
                >
                  Regenerate 4-Digit Token
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                <div>
                  <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
                    4-Digit Check-in PIN / Token
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={checkInToken}
                    onChange={(e) => setCheckInToken(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-mono font-bold text-center text-title-lg text-secondary"
                  />
                </div>

                <div>
                  <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
                    Check-in Window Opens
                  </label>
                  <input
                    type="datetime-local"
                    value={checkInStartAt}
                    onChange={(e) => setCheckInStartAt(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm"
                  />
                </div>

                <div>
                  <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
                    Check-in Window Closes
                  </label>
                  <input
                    type="datetime-local"
                    value={checkInEndAt}
                    onChange={(e) => setCheckInEndAt(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm"
                  />
                </div>
              </div>
            </div>

            {/* Poster Upload */}
            <div>
              <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                Event Poster Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm"
              />
            </div>

            {/* Rules */}
            <div>
              <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                Event Rules & Guidelines
              </label>
              <textarea
                rows={3}
                placeholder="Entry guidelines, dress code, required items..."
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
                {submitting ? 'Creating Event...' : 'Create & Save Event'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
