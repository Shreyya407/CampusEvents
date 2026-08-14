import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Event } from '../../types/database.types';
import { StudentNavbar } from '../../components/layout/StudentNavbar';
import { checkInStudentRPC } from '../../lib/rpc';
import { useAuth } from '../../context/AuthContext';
import { Html5QrcodeScanner } from 'html5-qrcode';

export const ScanQR: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [tokenInput, setTokenInput] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  useEffect(() => {
    fetchRegisteredEvents();
  }, [user]);

  const fetchRegisteredEvents = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('registrations')
        .select('event_id, event:events(*)')
        .eq('student_id', user.id)
        .eq('status', 'confirmed');

      if (data) {
        const myEvents = data.map((d: any) => d.event).filter(Boolean) as Event[];
        setEvents(myEvents);
        if (myEvents.length > 0) {
          setSelectedEventId(myEvents[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching registered events for scanner:', err);
    }
  };

  useEffect(() => {
    // Initialize html5-qrcode camera scanner
    let scanner: Html5QrcodeScanner | null = null;
    const element = document.getElementById('qr-reader');
    if (element) {
      scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          handleScannedResult(decodedText);
        },
        (_errorMessage) => {
          // ignore scan errors until valid code scanned
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [selectedEventId]);

  const handleScannedResult = async (scannedText: string) => {
    try {
      let eventId = selectedEventId;
      let token = scannedText;

      // Check if scanned JSON structure
      try {
        const parsed = JSON.parse(scannedText);
        if (parsed.eventId && parsed.checkInToken) {
          eventId = parsed.eventId;
          token = parsed.checkInToken;
        }
      } catch {
        // Plain text token scanned
      }

      if (!eventId) {
        setResultError('Please select the event you are attending.');
        return;
      }

      executeCheckIn(eventId, token);
    } catch (err: any) {
      setResultError(err.message);
    }
  };

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      setResultError('Please select an event.');
      return;
    }
    if (!tokenInput.trim()) {
      setResultError('Please enter the event check-in token.');
      return;
    }

    executeCheckIn(selectedEventId, tokenInput.trim());
  };

  const executeCheckIn = async (eventId: string, token: string) => {
    setLoading(true);
    setResultMessage(null);
    setResultError(null);

    try {
      const res = await checkInStudentRPC(eventId, token);

      if (!res.success) {
        if (res.already_checked_in) {
          setResultError(res.message || 'Already checked in.');
        } else {
          setResultError(res.message || 'Check-in failed. Invalid QR code or time window.');
        }
      } else {
        setResultMessage(res.message || 'Attendance marked PRESENT!');
      }
    } catch (err: any) {
      setResultError(err.message || 'Network error during check-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-on-background">
      <StudentNavbar />

      <main className="flex-grow max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg pt-20 md:pt-24 pb-32 md:pb-stack-lg flex flex-col items-center">
        <div className="w-full max-w-lg text-center mb-stack-lg">
          <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mx-auto mb-stack-md border border-outline-variant">
            <span className="material-symbols-outlined text-[36px]">qr_code_scanner</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg text-primary">Event QR Attendance Check-in</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Scan the official event QR code displayed by campus management or enter the check-in token.
          </p>
        </div>

        {/* Results Feedback Banner */}
        {resultMessage && (
          <div className="w-full max-w-lg mb-stack-md p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 text-body-md rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-600 text-[28px]">verified</span>
            <div>
              <p className="font-bold">Check-in Success!</p>
              <p className="text-body-sm">{resultMessage}</p>
            </div>
          </div>
        )}

        {resultError && (
          <div className="w-full max-w-lg mb-stack-md p-4 bg-error-container text-on-error-container text-body-md rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-[28px]">gpp_bad</span>
            <div>
              <p className="font-bold">Check-in Rejected</p>
              <p className="text-body-sm">{resultError}</p>
            </div>
          </div>
        )}

        {/* Event Selector */}
        <div className="w-full max-w-lg bg-surface rounded-xl border border-outline-variant p-stack-md shadow-sm mb-stack-md">
          <label className="block text-label-md font-label-md text-on-surface-variant mb-2">
            1. Select Event You Are Attending
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full p-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface"
          >
            {events.length === 0 ? (
              <option value="">No confirmed event registrations found</option>
            ) : (
              events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} ({e.venue})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Scanner Card */}
        <div className="w-full max-w-lg bg-surface rounded-xl border border-outline-variant p-stack-md shadow-sm mb-stack-md">
          <h3 className="text-title-lg font-title-lg text-primary mb-3">2. Scan Event QR Code</h3>
          <div id="qr-reader" className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low" />
        </div>

        {/* Manual Token Entry Fallback */}
        <div className="w-full max-w-lg bg-surface rounded-xl border border-outline-variant p-stack-md shadow-sm">
          <h3 className="text-title-lg font-title-lg text-primary mb-3">3. Or Enter Check-in Token Manually</h3>
          <form onSubmit={handleManualCheckIn} className="flex gap-2">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="e.g. event-token-uuid-123"
              className="flex-1 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-secondary text-on-secondary font-label-md font-semibold rounded-lg hover:bg-on-secondary-fixed-variant transition-colors disabled:opacity-50"
            >
              {loading ? 'Validating...' : 'Submit'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
