import React from 'react';
import { Link } from 'react-router-dom';
import { Event } from '../../types/database.types';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils';

interface EventCardProps {
  event: Event;
  confirmedCount?: number;
  isRegistered?: boolean;
  isWaitlisted?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  confirmedCount = 0,
  isRegistered = false,
  isWaitlisted = false,
}) => {
  const isFull = confirmedCount >= event.capacity;
  const availableSeats = Math.max(0, event.capacity - confirmedCount);
  const capacityPercent = Math.min(100, Math.round((confirmedCount / event.capacity) * 100));

  const fallbackPoster = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
      {/* Poster Header */}
      <div className="h-48 bg-surface-container-highest relative overflow-hidden">
        <img
          src={event.poster_url || fallbackPoster}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackPoster;
          }}
        />
        <div className="absolute top-3 left-3 bg-primary-container/90 backdrop-blur-sm text-on-primary-container px-2.5 py-1 rounded text-label-sm font-label-sm uppercase tracking-wider">
          {event.category}
        </div>
        <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur-sm text-secondary font-bold px-3 py-1 rounded-full text-label-md shadow-sm">
          {formatCurrency(event.fee)}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-stack-md flex-grow flex flex-col justify-between gap-3">
        <div>
          <h3 className="text-title-lg font-title-lg text-primary line-clamp-2 mb-2 group-hover:text-secondary transition-colors">
            {event.title}
          </h3>

          <div className="text-body-sm font-body-sm text-on-surface-variant space-y-1.5 mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                calendar_today
              </span>
              <span>
                {formatDate(event.event_date)} • {formatTime(event.start_time)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                location_on
              </span>
              <span className="truncate">{event.venue}</span>
            </div>
          </div>
        </div>

        {/* Capacity Indicator Progress Bar */}
        <div className="space-y-1 pt-2 border-t border-outline-variant/30">
          <div className="flex justify-between text-label-sm font-label-sm text-on-surface-variant">
            <span>Seats: {confirmedCount} / {event.capacity}</span>
            <span className={isFull ? 'text-error font-semibold' : 'text-secondary font-semibold'}>
              {isFull ? 'Event Full' : `${availableSeats} left`}
            </span>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isFull ? 'bg-error' : 'bg-secondary'
              }`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Link
            to={`/events/${event.id}`}
            className={`w-full py-2.5 px-4 rounded-lg text-label-md font-label-md font-semibold text-center flex items-center justify-center gap-2 transition-all ${
              isRegistered
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : isWaitlisted
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : isFull
                ? 'bg-primary-container text-on-primary-container hover:bg-primary'
                : 'bg-secondary text-on-secondary hover:bg-on-secondary-fixed-variant'
            }`}
          >
            {isRegistered ? (
              <>
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Registered
              </>
            ) : isWaitlisted ? (
              <>
                <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                On Waitlist
              </>
            ) : isFull ? (
              <>
                <span className="material-symbols-outlined text-[18px]">queue</span>
                Join Waitlist
              </>
            ) : (
              <>
                <span>View & Register</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
};
