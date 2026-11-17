import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import TornTicket from '../components/TornTicket';
import ErrorState from '../components/ErrorState';
import { getCommitteeAccent } from '../utils/committeeThemes';
import { ticketNumber, venueFromDetails, buildScanUrl, formatScanTime } from '../utils/ticket';
import { playSound, audioReady, unlockAudio } from '../utils/sound';

/**
 * Public page opened by scanning a ticket's QR code (usually on a phone).
 * Records the scan (single-use) and plays the "ticket torn at the QR" animation.
 */
export default function VerifyTicketPage() {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [firstScan, setFirstScan] = useState(false);
  const [state, setState] = useState('whole');
  const [qrValue, setQrValue] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [needTap, setNeedTap] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return undefined; // StrictMode runs effects twice in dev: scan only once
    started.current = true;
    const timers = [];
    (async () => {
      try {
        const res = await fetch(`/api/verify_ticket/${token}/scan`, { method: 'POST' });
        if (!res.ok) { setError(true); setLoading(false); return; }
        const d = await res.json();
        setInfo(d);
        setFirstScan(d.first_scan);
        setQrValue(await buildScanUrl(token));
        setLoading(false);
        if (d.first_scan) {
          playSound('admit');
          timers.push(setTimeout(() => { if (!audioReady()) setNeedTap(true); }, 1300));
          // let the intact ticket register with the eye for a moment, then tear it
          timers.push(setTimeout(() => { setState('tearing'); playSound('scanTear'); }, 900));
          timers.push(setTimeout(() => setState('torn'), 900 + 2900));
        } else {
          setState('torn');
        }
      } catch {
        setError(true); setLoading(false);
      }
    })();
    return () => { /* timers intentionally left to finish (StrictMode remount) */ };
  }, [token]);

  if (loading) {
    return (
      <div className="main-content verify-page">
        <div className="verify-loading"><span className="btn-spinner dark"></span> Verifying ticket…</div>
      </div>
    );
  }
  if (error || !info) {
    return <ErrorState kind="notfound" title="Ticket not recognised" text="This QR code is invalid or has been tampered with. Please ask the organisers for help." />;
  }

  const ev = info.event;
  const done = state === 'torn';

  return (
    <div className="main-content verify-page">
      <div className="verify-head">
        <span className="verify-eyebrow"><i className="fas fa-shield-alt"></i> VJTI entry check</span>
        <h1>{firstScan ? 'Ticket verified' : 'Ticket already used'}</h1>
      </div>

      <div className="verify-stage">
        <TornTicket
          event={ev}
          attendee={info.attendee}
          department={info.department}
          ticketNo={ticketNumber(ev.committee_name, ev.id, info.registration_id)}
          venue={venueFromDetails(ev.details)}
          qrValue={qrValue}
          state={state}
          scannedAt={info.scanned_at}
          accent={getCommitteeAccent(ev.committee_name)}
          status={info.status}
          printable={false}
        />
      </div>

      {needTap && (
        <button type="button" className="verify-sound" onClick={async () => { await unlockAudio(); setNeedTap(false); playSound('admit'); playSound('scanTear', { delay: 0.35 }); }}>
          <i className="fas fa-volume-up"></i> Tap to hear the scan
        </button>
      )}

      {firstScan ? (
        <div className={`verify-result ok ${done ? 'show' : ''}`} role="status">
          <i className="fas fa-check-circle"></i>
          <div>
            <strong>Admitted. Enjoy {ev.title}!</strong>
            <span>Entry recorded at {formatScanTime(info.scanned_at)}</span>
          </div>
        </div>
      ) : (
        <div className="verify-result warn show" role="status">
          <i className="fas fa-exclamation-triangle"></i>
          <div>
            <strong>This ticket was already scanned</strong>
            <span>First used on {formatScanTime(info.scanned_at)}. Each ticket admits one entry.</span>
          </div>
        </div>
      )}
    </div>
  );
}
