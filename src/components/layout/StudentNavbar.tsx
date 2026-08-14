import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const StudentNavbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop TopNavBar */}
      <nav className="hidden md:flex fixed top-0 w-full z-50 justify-between items-center px-gutter h-16 bg-surface border-b border-outline-variant shadow-sm docked">
        <div className="max-w-container-max mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-stack-lg">
            <Link to="/events" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[28px]">school</span>
              <span className="text-title-lg font-title-lg font-bold text-primary tracking-tight">
                CampusEvents
              </span>
            </Link>

            <div className="flex gap-stack-md text-label-md font-label-md ml-stack-lg">
              <Link
                to="/events"
                className={`pb-1 transition-colors ${
                  isActive('/events')
                    ? 'text-secondary border-b-2 border-secondary font-semibold'
                    : 'text-on-surface-variant hover:text-secondary'
                }`}
              >
                Browse Events
              </Link>
              <Link
                to="/my-registrations"
                className={`pb-1 transition-colors ${
                  isActive('/my-registrations')
                    ? 'text-secondary border-b-2 border-secondary font-semibold'
                    : 'text-on-surface-variant hover:text-secondary'
                }`}
              >
                My Registrations
              </Link>
              <Link
                to="/scan"
                className={`pb-1 transition-colors flex items-center gap-1 ${
                  isActive('/scan')
                    ? 'text-secondary border-b-2 border-secondary font-semibold'
                    : 'text-on-surface-variant hover:text-secondary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                Scan QR
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-stack-md">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-on-surface hover:text-secondary transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-label-md font-bold border border-outline-variant">
                    {profile?.full_name?.charAt(0) || 'S'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-label-md font-label-md leading-tight text-on-surface">
                      {profile?.full_name || 'Student'}
                    </p>
                    <p className="text-label-sm font-label-sm text-on-surface-variant">
                      {profile?.register_number}
                    </p>
                  </div>
                </Link>

                {profile?.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className="bg-primary text-on-primary px-3 py-1.5 rounded text-label-sm font-label-sm hover:bg-primary-container transition-colors"
                  >
                    Admin Portal
                  </Link>
                )}

                <button
                  onClick={handleSignOut}
                  className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-full transition-colors"
                  title="Log out"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-secondary hover:bg-surface-container-low rounded-lg text-label-md font-label-md transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-secondary text-on-secondary hover:bg-on-secondary-fixed-variant rounded-lg text-label-md font-label-md transition-colors shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile BottomNavBar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface border-t border-outline-variant shadow-lg docked rounded-t-xl">
        <Link
          to="/student/dashboard"
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
            isActive('/student/dashboard')
              ? 'text-secondary font-semibold'
              : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined">home</span>
          <span className="text-label-sm font-label-sm mt-0.5">Home</span>
        </Link>

        <Link
          to="/events"
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
            isActive('/events')
              ? 'text-secondary font-semibold'
              : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined">search</span>
          <span className="text-label-sm font-label-sm mt-0.5">Explore</span>
        </Link>

        <Link
          to="/scan"
          className="flex flex-col items-center justify-center bg-secondary text-on-secondary rounded-full w-12 h-12 -mt-4 shadow-md active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">qr_code_scanner</span>
        </Link>

        <Link
          to="/my-registrations"
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
            isActive('/my-registrations')
              ? 'text-secondary font-semibold'
              : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined">confirmation_number</span>
          <span className="text-label-sm font-label-sm mt-0.5">Tickets</span>
        </Link>

        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
            isActive('/profile')
              ? 'text-secondary font-semibold'
              : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined">account_circle</span>
          <span className="text-label-sm font-label-sm mt-0.5">Profile</span>
        </Link>
      </nav>
    </>
  );
};
