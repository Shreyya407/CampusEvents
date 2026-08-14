import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Event, Registration } from '../../types/database.types';
import { StudentNavbar } from '../../components/layout/StudentNavbar';
import { EventCard } from '../../components/events/EventCard';
import { useAuth } from '../../context/AuthContext';
import { ConfigWarning } from '../../components/common/ConfigWarning';

export const BrowseEvents: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [userRegistrations, setUserRegistrations] = useState<Record<string, boolean>>({});
  const [userWaitlists, setUserWaitlists] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedFeeType, setSelectedFeeType] = useState('Any');

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // 1. Fetch published events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .order('event_date', { ascending: true });

      if (eventsError) throw eventsError;
      const loadedEvents = (eventsData as Event[]) || [];
      setEvents(loadedEvents);

      if (loadedEvents.length > 0) {
        const eventIds = loadedEvents.map((e) => e.id);

        // 2. Fetch confirmed registration counts per event
        const { data: regData } = await supabase
          .from('registrations')
          .select('event_id')
          .eq('status', 'confirmed')
          .in('event_id', eventIds);

        const counts: Record<string, number> = {};
        regData?.forEach((r) => {
          counts[r.event_id] = (counts[r.event_id] || 0) + 1;
        });
        setRegistrationCounts(counts);

        // 3. If student is logged in, fetch user's active registrations & waitlists
        if (user) {
          const { data: myRegs } = await supabase
            .from('registrations')
            .select('event_id')
            .eq('student_id', user.id)
            .eq('status', 'confirmed');

          const userRegMap: Record<string, boolean> = {};
          myRegs?.forEach((r) => {
            userRegMap[r.event_id] = true;
          });
          setUserRegistrations(userRegMap);

          const { data: myWaitlists } = await supabase
            .from('waitlist')
            .select('event_id')
            .eq('student_id', user.id)
            .eq('status', 'waiting');

          const userWaitMap: Record<string, boolean> = {};
          myWaitlists?.forEach((w) => {
            userWaitMap[w.event_id] = true;
          });
          setUserWaitlists(userWaitMap);
        }
      }
    } catch (err: any) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || event.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesDate = !selectedDate || event.event_date === selectedDate;

    const matchesFee =
      selectedFeeType === 'Any' ||
      (selectedFeeType === 'Free' && event.fee === 0) ||
      (selectedFeeType === 'Paid' && event.fee > 0);

    return matchesSearch && matchesCategory && matchesDate && matchesFee;
  });

  const categories = ['All', 'Academic', 'Social', 'Career', 'Technology', 'Sports', 'Workshop'];

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedDate('');
    setSelectedFeeType('Any');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-on-background">
      <StudentNavbar />
      <ConfigWarning />

      <main className="flex-grow max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg pt-20 md:pt-24 pb-32 md:pb-stack-lg">
        {/* Header Section */}
        <section className="mb-stack-lg">
          <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-primary mb-stack-sm">
            Discover Events
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant mb-stack-lg max-w-2xl">
            Find academic seminars, social gatherings, and professional workshops happening across campus.
          </p>

          {/* Filter Controls Bar */}
          <div className="bg-surface rounded-xl border border-outline-variant shadow-sm p-stack-md flex flex-col md:flex-row gap-stack-md items-end md:items-center">
            {/* Search Input */}
            <div className="w-full md:flex-grow">
              <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                Search
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by event title, keyword, or venue..."
                  className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md font-body-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors"
                />
              </div>
            </div>

            {/* Filters Group */}
            <div className="w-full md:w-auto flex flex-wrap gap-stack-md">
              <div className="min-w-[140px]">
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full py-2 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md font-body-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-on-surface"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-[140px]">
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full py-2 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md font-body-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-on-surface"
                />
              </div>

              <div className="min-w-[120px]">
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  Fee
                </label>
                <select
                  value={selectedFeeType}
                  onChange={(e) => setSelectedFeeType(e.target.value)}
                  className="w-full py-2 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md font-body-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-on-surface"
                >
                  <option value="Any">Any Price</option>
                  <option value="Free">Free</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mt-stack-lg">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-80 bg-surface-container-low rounded-xl border border-outline-variant animate-pulse p-4 flex flex-col justify-between"
              >
                <div className="h-40 bg-surface-container-high rounded-lg mb-4" />
                <div className="h-6 bg-surface-container-high rounded w-3/4 mb-2" />
                <div className="h-4 bg-surface-container-high rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          /* Empty State Container */
          <section className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-outline-variant rounded-xl bg-surface-container-low min-h-[380px]">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 text-on-surface-variant">
              <span className="material-symbols-outlined text-[36px]">event_busy</span>
            </div>
            <h2 className="text-title-lg font-title-lg text-primary mb-2 text-center">
              No published events available
            </h2>
            <p className="text-body-md font-body-md text-on-surface-variant text-center max-w-md mb-stack-lg">
              We couldn't find any events matching your criteria. Try clearing your filters or check back later.
            </p>
            <button
              onClick={handleClearFilters}
              className="bg-surface-container-lowest text-secondary border border-secondary px-6 py-2 rounded-lg text-label-md font-label-md hover:bg-surface-container-highest transition-colors shadow-sm"
            >
              Clear All Filters
            </button>
          </section>
        ) : (
          /* Events Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                confirmedCount={registrationCounts[event.id] || 0}
                isRegistered={userRegistrations[event.id]}
                isWaitlisted={userWaitlists[event.id]}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
