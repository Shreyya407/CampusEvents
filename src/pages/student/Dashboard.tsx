import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Event } from '../../types/database.types';
import { StudentNavbar } from '../../components/layout/StudentNavbar';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatTime } from '../../lib/utils';

export const StudentDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [myUpcomingEvents, setMyUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (!profile) return;
      const { data } = await supabase
        .from('registrations')
        .select('event_id, event:events(*)')
        .eq('student_id', profile.id)
        .eq('status', 'confirmed');

      if (data) {
        const events = data.map((d: any) => d.event).filter(Boolean) as Event[];
        setMyUpcomingEvents(events);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-on-background">
      <StudentNavbar />

      <main className="flex-grow max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg pt-20 md:pt-24 pb-32 md:pb-stack-lg">
        {/* Welcome Header */}
        <div className="bg-primary text-on-primary rounded-2xl p-stack-lg shadow-md mb-stack-lg relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-label-sm uppercase font-semibold text-primary-fixed tracking-wider">
              Student Portal Home
            </span>
            <h1 className="text-headline-lg font-headline-lg mt-1">
              Welcome back, {profile?.full_name || 'Student'}!
            </h1>
            <p className="text-body-md text-primary-fixed mt-1">
              {profile?.department} • Year {profile?.year} • Reg #{profile?.register_number}
            </p>
          </div>
        </div>

        {/* Quick Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-stack-lg">
          <Link
            to="/events"
            className="bg-surface p-stack-md rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">travel_explore</span>
            </div>
            <div>
              <h3 className="text-title-lg font-title-lg text-primary font-semibold">Discover Events</h3>
              <p className="text-body-sm text-on-surface-variant">Browse & register for upcoming events</p>
            </div>
          </Link>

          <Link
            to="/my-registrations"
            className="bg-surface p-stack-md rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-full bg-surface-container-high text-secondary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">confirmation_number</span>
            </div>
            <div>
              <h3 className="text-title-lg font-title-lg text-primary font-semibold">My Event Passes</h3>
              <p className="text-body-sm text-on-surface-variant">View confirmed tickets & waitlists</p>
            </div>
          </Link>

          <Link
            to="/scan"
            className="bg-surface p-stack-md rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
            </div>
            <div>
              <h3 className="text-title-lg font-title-lg text-primary font-semibold">Scan QR Check-in</h3>
              <p className="text-body-sm text-on-surface-variant">Mark your attendance at the venue</p>
            </div>
          </Link>
        </div>

        {/* My Registered Events Section */}
        <section className="bg-surface rounded-xl border border-outline-variant p-stack-md md:p-stack-lg shadow-sm">
          <div className="flex justify-between items-center mb-stack-md">
            <h2 className="text-headline-md font-headline-md text-primary">My Upcoming Registered Events</h2>
            <Link to="/my-registrations" className="text-label-md font-label-md text-secondary hover:underline">
              View All
            </Link>
          </div>

          {loading ? (
            <p className="text-body-md text-on-surface-variant py-4">Loading your registered events...</p>
          ) : myUpcomingEvents.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-outline-variant rounded-lg bg-surface-container-low">
              <p className="text-body-md text-on-surface-variant mb-4">
                You haven't registered for any events yet.
              </p>
              <Link to="/events" className="px-6 py-2.5 bg-secondary text-on-secondary rounded-lg text-label-md">
                Browse Campus Events
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
              {myUpcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-surface-container-low border border-outline-variant rounded-lg p-stack-md flex justify-between items-center"
                >
                  <div>
                    <span className="text-label-sm font-label-sm uppercase font-semibold text-secondary">
                      {event.category}
                    </span>
                    <h3 className="text-title-lg font-title-lg text-primary font-semibold mt-0.5">
                      {event.title}
                    </h3>
                    <p className="text-body-sm text-on-surface-variant mt-1">
                      {formatDate(event.event_date)} • {formatTime(event.start_time)} • {event.venue}
                    </p>
                  </div>
                  <Link
                    to={`/events/${event.id}`}
                    className="px-4 py-2 bg-secondary text-on-secondary rounded-lg text-label-sm font-label-sm"
                  >
                    Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
