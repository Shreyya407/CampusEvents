import React from 'react';
import { Link } from 'react-router-dom';
import { AdminSidebar } from '../../components/layout/AdminSidebar';

export const WaitlistList: React.FC = () => {
  return (
    <div className="bg-background text-on-background min-h-screen font-sans flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-stack-md lg:p-stack-lg overflow-y-auto max-w-container-max flex flex-col items-center justify-center text-center">
        <div className="bg-surface rounded-2xl border border-outline-variant p-8 shadow-sm max-w-md">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-3">
            do_not_disturb_on
          </span>
          <h2 className="text-headline-md font-headline-md text-primary mb-2">Waitlists Disabled</h2>
          <p className="text-body-md text-on-surface-variant mb-6">
            Waitlist functionality has been removed. Events operate strictly on confirmed seat capacity limits.
          </p>
          <Link to="/admin/events" className="px-6 py-2.5 bg-secondary text-on-secondary rounded-lg font-label-md font-semibold">
            Back to Events Management
          </Link>
        </div>
      </main>
    </div>
  );
};
