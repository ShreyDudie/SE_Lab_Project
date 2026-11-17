import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFlash } from './FlashMessage';
import ConfirmDialog from './ConfirmDialog';
import TornTicket from './TornTicket';
import { getCommitteeAccent } from '../utils/committeeThemes';
import { ticketNumber, venueFromDetails, buildScanUrl } from '../utils/ticket';
import { playSound } from '../utils/sound';

function toIcsDate(dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-');
  const [hh, mm] = (timeStr || '00:00').split(':');
  return `${y}${m}${d}T${hh}${mm}00`;
}

function downloadIcs(event, ticketNo, venue) {
  const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//VJTI Committee Manager//EN', 'BEGIN:VEVENT',
    `UID:${ticketNo}@vjti-committee-manager`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${toIcsDate(event.date, event.start_time)}`,
    `DTEND:${toIcsDate(event.date, event.end_time || event.start_time)}`,
    `SUMMARY:${esc(`${event.title} (${event.committee_name})`)}`,
    `LOCATION:${esc(venue)}`,
    `DESCRIPTION:${esc(`Ticket ${ticketNo}. ${event.details || ''}`)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const TEAR_MS = 2900;   // scan tear (stub rips off), then settles into the "torn" state
const CANCEL_MS = 2700; // cancel tear (whole ticket rips in two and falls away)

/**
 * Digital event ticket for a registered student.
 *  - The QR code is real: it opens /verify/<signed token> on any phone on the same Wi-Fi.
 *  - When the QR is scanned, this open ticket notices (polling) and tears live.
 *  - Scanned tickets stay torn (the scan is saved on the server).
 * `event` must include registration_id (provided by the API for my_events).
 */
export default function TicketModal({ show, onClose, event, onCancelled }) {
  const { user } = useAuth();
  const flash = useFlash();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ticketState, setTicketState] = useState('whole'); // whole | tearing | torn | cancel
  const [token, setToken] = useState(null);
  const [scanUrl, setScanUrl] = useState('');
  const [scannedAt, setScannedAt] = useState(null);
  const timers = useRef([]);

  const regId = event?.registration_id;

  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); };
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  // Load the signed token (for the QR) + current scan state whenever the modal opens
  useEffect(() => {
    if (!show || !regId) return undefined;
    let alive = true;
    setToken(null); setScanUrl(''); setScannedAt(null); setTicketState('whole');
    playSound('paper');
    fetch(`/api/tickets/${regId}`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(async (d) => {
        if (!alive || !d) return;
        setToken(d.token);
        setScanUrl(await buildScanUrl(d.token));
        if (d.scanned_at) { setScannedAt(d.scanned_at); setTicketState('torn'); }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [show, regId]);

  // While the ticket is intact, watch for a scan from a phone and tear live when it happens
  useEffect(() => {
    if (!show || !regId || !token || ticketState !== 'whole') return undefined;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/tickets/${regId}`, { credentials: 'include' });
        if (!res.ok) return;
        const d = await res.json();
        if (d.scanned_at) {
          setScannedAt(d.scanned_at);
          setTicketState('tearing');
          playSound('admit');
          playSound('scanTear');
          flash('Ticket scanned at the entrance. Enjoy the event!', 'success');
          later(() => setTicketState(s => (s === 'tearing' ? 'torn' : s)), TEAR_MS);
        }
      } catch { /* try again on the next tick */ }
    }, 1800);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, regId, token, ticketState]);

  useEffect(() => {
    if (!show) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && !confirming && ticketState !== 'cancel') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, onClose, confirming, ticketState]);

  if (!show || !event) return null;

  const accent = getCommitteeAccent(event.committee_name);
  const ticketNo = ticketNumber(event.committee_name, event.id, regId);
  const venue = venueFromDetails(event.details);
  const attended = event.registration_status === 'Attended';
  const scanned = ticketState === 'tearing' || ticketState === 'torn';

  const cancelRegistration = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/unregister/${regId}`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      flash(data.message || data.error, res.ok ? 'success' : 'error');
      if (res.ok) {
        setConfirming(false);
        setTicketState('cancel'); // the whole ticket is ripped in two and falls away
        playSound('tearHalf');
        later(() => { onClose(); onCancelled?.(); }, CANCEL_MS);
      }
    } catch {
      flash('Could not cancel right now. Please try again.', 'error');
    }
    setBusy(false);
  };

  const resetScan = async () => {
    try {
      const res = await fetch(`/api/tickets/${regId}/reset_scan`, { method: 'POST', credentials: 'include' });
      if (res.ok) { setScannedAt(null); setTicketState('whole'); flash('Ticket reset. It can be scanned again.', 'success'); }
    } catch { flash('Could not reset the ticket.', 'error'); }
  };

  return (
    <>
      <div className="modal-backdrop ticket-backdrop" onClick={ticketState === 'cancel' ? undefined : onClose} style={{ zIndex: 1000 }}>
        <div className={`ticket-modal ${ticketState === 'cancel' ? 'is-cancelling' : ''}`} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Ticket for ${event.title}`}>
          <button type="button" className="ticket-close" onClick={onClose} aria-label="Close ticket"><i className="fas fa-times"></i></button>

          <div className="tt-stage">
            <TornTicket
              event={event}
              attendee={user?.username}
              department={user?.department}
              ticketNo={ticketNo}
              venue={venue}
              qrValue={scanUrl}
              state={ticketState}
              scannedAt={scannedAt}
              accent={accent}
              status={attended ? 'Attended' : 'Confirmed'}
            />
          </div>

          {ticketState === 'cancel' && <div className="ticket-cancelled-note"><i className="fas fa-check-circle"></i> Registration cancelled</div>}

          {ticketState === 'whole' && scanUrl && (
            <p className="ticket-scan-hint"><i className="fas fa-mobile-alt"></i> Scan the QR with your phone camera (same Wi-Fi) to admit this ticket.</p>
          )}
          {ticketState === 'torn' && (
            <p className="ticket-scan-hint ok"><i className="fas fa-check-circle"></i> This ticket has been scanned and used for entry.</p>
          )}

          <div className="ticket-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => downloadIcs(event, ticketNo, venue)}>
              <i className="far fa-calendar-plus"></i> Add to calendar
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => window.print()}>
              <i className="fas fa-print"></i> Print
            </button>
            {ticketState === 'whole' && scanUrl && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => window.open(scanUrl, '_blank', 'noopener')}>
                <i className="fas fa-qrcode"></i> Open scan page
              </button>
            )}
            {ticketState === 'torn' && (
              <button type="button" className="btn btn-outline btn-sm" onClick={resetScan}>
                <i className="fas fa-undo"></i> Reset scan (demo)
              </button>
            )}
            {regId && !attended && !scanned && ticketState !== 'cancel' && (
              <button type="button" className="btn btn-sm ticket-cancel" onClick={() => setConfirming(true)}>
                <i className="fas fa-ban"></i> Cancel registration
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        show={confirming}
        danger
        title="Cancel your registration?"
        message={`You will lose your spot in "${event.title}". You can register again later.`}
        confirmLabel={busy ? 'Cancelling...' : 'Yes, cancel'}
        cancelLabel="Keep my spot"
        onConfirm={cancelRegistration}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
