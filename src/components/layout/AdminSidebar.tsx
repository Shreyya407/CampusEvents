import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AdminSidebar: React.FC = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Events', path: '/admin/events', icon: 'event' },
    { label: 'Registrations', path: '/admin/registrations', icon: 'how_to_reg' },
    { label: 'Finance & Payments', path: '/admin/payments', icon: 'payments' },
    { label: 'Waitlists', path: '/admin/waitlist', icon: 'hourglass_empty' },
    { label: 'Attendance Log', path: '/admin/attendance', icon: 'fact_check' },
    { label: 'Students Roster', path: '/admin/students', icon: 'group' },
    { label: 'Overall Analytics', path: '/admin/analytics', icon: 'monitoring' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-full lg:w-72 bg-surface-container-low border-r border-outline-variant flex flex-col h-auto lg:h-screen shrink-0 p-stack-md">
      <div className="mb-stack-lg flex flex-col gap-stack-md">
        <div className="flex items-center gap-stack-sm">
          <span className="material-symbols-outlined text-primary text-[32px] fill">
            event_available
          </span>
          <div>
            <h1 className="text-headline-md font-headline-md font-bold text-primary">
              Admin Portal
            </h1>
            <p className="text-label-sm font-label-sm text-on-surface-variant">
              University Operations
            </p>
          </div>
        </div>

        <Link
          to="/admin/events/create"
          className="w-full bg-secondary text-on-secondary text-label-md font-label-md font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-on-secondary-fixed-variant transition-all shadow-sm active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Create Event
        </Link>
      </div>

      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-label-md font-label-md transition-all ${
              isActive(item.path)
                ? 'bg-secondary-container text-on-secondary-container font-semibold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-stack-md border-t border-outline-variant flex flex-col gap-2">
        <div className="flex items-center justify-between px-3 py-2 bg-surface rounded-lg border border-outline-variant/50">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0">
              A
            </div>
            <div className="min-w-0">
              <p className="text-label-md font-label-md text-on-surface truncate">
                {profile?.full_name || 'Admin User'}
              </p>
              <p className="text-label-sm font-label-sm text-on-surface-variant">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1 text-on-surface-variant hover:text-error transition-colors"
            title="Log out"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>

        <Link
          to="/events"
          className="text-center text-label-sm font-label-sm text-secondary hover:underline py-1"
        >
          Switch to Student View
        </Link>
      </div>
    </aside>
  );
};
