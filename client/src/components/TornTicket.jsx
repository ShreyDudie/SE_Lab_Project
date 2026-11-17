import { useEffect, useMemo, useState } from 'react';
import QrCode from './QrCode';
import { seededRandom, formatScanTime } from '../utils/ticket';

/**
 * A ticket made of two physical pieces joined along a jagged, perforated line:
 *   - the MAIN piece (event details), which always stays,
 *   - the STUB piece (the QR code), which is torn off when the ticket is scanned.
 *
 * state:  'whole'   - intact
 *         'tearing' - the stub rips off along the perforation (hinged, peeling from the top)
 *         'torn'    - final: only the main piece remains, stamped ADMITTED
 *         'cancel'  - the whole ticket is ripped in two along a jagged diagonal and falls away
 *
 * Pieces are clipped with complementary jagged polygons generated from the ticket
 * number, so they fit together perfectly until they separate.
 */

function useMedia(query) {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}

const N = 26; // points along a torn edge
const OVERLAP = 8; // px each piece extends past the perforation
const f = (n) => n.toFixed(2);

function buildEdge(seed, salt) {
  const rnd = seededRandom(seed + salt);
  const pts = [];
  for (let i = 0; i <= N; i++) {
    let t = (rnd() * 2 - 1) * 3.4;
    if (rnd() > 0.82) t *= 1.7; // occasional fibre spike
    if (rnd() > 0.93) t *= 1.5; // and the odd bigger bite
    t = Math.max(-7, Math.min(7, t));
    pts.push({ p: (i / N) * 100, t });
  }
  return pts;
}

function Barcode({ seed }) {
  const bars = useMemo(() => {
    const rnd = seededRandom(seed + 'bar');
    let x = 0;
    const out = [];
    for (let i = 0; i < 46; i++) {
      const w = 1 + Math.floor(rnd() * 3);
      if (i % 2 === 0) out.push({ x, w });
      x += w;
    }
    return { out, total: x };
  }, [seed]);
  return (
    <svg viewBox={`0 0 ${bars.total} 24`} preserveAspectRatio="none" className="tt-barcode" aria-hidden="true">
      {bars.out.map((b, i) => <rect key={i} x={b.x} y="0" width={b.w} height="24" fill="currentColor" />)}
    </svg>
  );
}

export default function TornTicket({
  event, attendee, department, ticketNo, venue, qrValue, state = 'whole',
  scannedAt, accent = '#C5973B', status = 'Confirmed', printable = true,
}) {
  const vertical = useMedia('(max-width: 680px)');
  const edge = useMemo(() => buildEdge(ticketNo, 'tear'), [ticketNo]);
  const cancelEdge = useMemo(() => buildEdge(ticketNo, 'rip'), [ticketNo]);

  const flakes = useMemo(() => {
    const rnd = seededRandom(ticketNo + 'flake');
    return Array.from({ length: 22 }, (_, i) => ({
      p: 4 + rnd() * 92,
      dx: (vertical ? (rnd() - 0.5) * 140 : (rnd() - 0.3) * 200),
      dy: (vertical ? 30 + rnd() * 140 : (rnd() - 0.2) * 220),
      r: (rnd() - 0.5) * 720,
      s: 2.5 + rnd() * 6,
      d: 0.6 + rnd() * 0.7 + (i % 3) * 0.02,
    }));
  }, [ticketNo, vertical]);

  // ---- perforation tear: complementary jagged polygons ----
  const { mainClip, stubClip } = useMemo(() => {
    if (!vertical) {
      const main = ['0 0', ...edge.map(({ p, t }) => `calc(100% - ${OVERLAP}px + ${f(t + 0.5)}px) ${f(p)}%`), '0 100%'];
      const stubEdge = edge.map(({ p, t }) => `calc(${OVERLAP}px + ${f(t - 0.5)}px) ${f(p)}%`);
      const stub = [stubEdge[0], '100% 0', '100% 100%', ...stubEdge.slice(1).reverse()];
      return { mainClip: `polygon(${main.join(',')})`, stubClip: `polygon(${stub.join(',')})` };
    }
    const mainEdge = edge.map(({ p, t }) => `${f(p)}% calc(100% - ${OVERLAP}px + ${f(t + 0.5)}px)`);
    const main = ['0 0', '100% 0', ...mainEdge.slice().reverse()];
    const stubTop = edge.map(({ p, t }) => `${f(p)}% calc(${OVERLAP}px + ${f(t - 0.5)}px)`);
    const stub = [...stubTop, '100% 100%', '0 100%'];
    return { mainClip: `polygon(${main.join(',')})`, stubClip: `polygon(${stub.join(',')})` };
  }, [edge, vertical]);

  const fiber = useMemo(
    () => edge.map(({ p, t }) => (vertical ? `${f(p)},${f(12 + t)}` : `${f(12 + t)},${f(p)}`)).join(' '),
    [edge, vertical]
  );

  // ---- cancel tear: a diagonal rip through the whole ticket (percent based, works in both layouts) ----
  const cancel = useMemo(() => {
    const X = (p) => 46 + (p - 50) * 0.14; // nearly vertical, leaning slightly
    const left = ['0 0', ...cancelEdge.map(({ p, t }) => `calc(${f(X(p))}% + ${f(t + 0.5)}px) ${f(p)}%`), '0 100%'];
    const rightEdge = cancelEdge.map(({ p, t }) => `calc(${f(X(p))}% + ${f(t - 0.5)}px) ${f(p)}%`);
    const right = [...rightEdge, '100% 100%', '100% 0'];
    const line = cancelEdge.map(({ p, t }) => `${f(X(p) + t * 0.13)},${f(p)}`).join(' ');
    return { leftClip: `polygon(${left.join(',')})`, rightClip: `polygon(${right.join(',')})`, line, hinge: `${f(X(100))}% 100%` };
  }, [cancelEdge]);

  const d = new Date(event.date + 'T00:00:00');
  const fmtTime = (s) => {
    if (!s) return '';
    const [h, m] = s.split(':');
    const hr = parseInt(h, 10);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };
  const attended = status === 'Attended';
  const admitted = state === 'tearing' || state === 'torn';
  const viewBox = vertical ? '0 0 100 24' : '0 0 24 100';

  // The two physical pieces. Rendered once normally, and (for the cancel rip) once more inside each half.
  const pieces = (copy) => (
    <>
      <div className="tt-piece tt-main" style={{ clipPath: mainClip, WebkitClipPath: mainClip }}>
        <div className="tt-main-body">
          <div className="ticket-top">
            <span className="ticket-chip"><i className="fas fa-shield-alt"></i> {event.committee_name}</span>
            <span className={`ticket-status ${attended || admitted ? 'attended' : ''}`}>
              <i className={`fas ${attended || admitted ? 'fa-user-check' : 'fa-check-circle'}`}></i>{' '}
              {admitted ? 'Admitted' : attended ? 'Attended' : 'Confirmed'}
            </span>
          </div>
          <div className="ticket-label">Admit one</div>
          <h2 className="ticket-title">{event.title}</h2>
          <div className="ticket-grid">
            <div><span>Date</span><strong>{d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>
            <div><span>Time</span><strong>{fmtTime(event.start_time)}{event.end_time ? ` – ${fmtTime(event.end_time)}` : ''}</strong></div>
            <div><span>Venue</span><strong>{venue}</strong></div>
            <div><span>Attendee</span><strong>{attendee}{department ? ` · ${department}` : ''}</strong></div>
          </div>
          <div className="ticket-no"><span>Ticket No.</span> {ticketNo}</div>
        </div>

        {!copy && admitted && (
          <div className="tt-stamp" aria-label="Admitted">
            <strong>ADMITTED</strong>
            {scannedAt && <span>{formatScanTime(scannedAt)}</span>}
          </div>
        )}

        <svg className="tt-fiber tt-fiber-main" viewBox={viewBox} preserveAspectRatio="none" aria-hidden="true">
          <polyline points={fiber} />
        </svg>
      </div>

      <div className="tt-piece tt-stub" style={{ clipPath: stubClip, WebkitClipPath: stubClip }}>
        <div className="tt-stub-body">
          <div className="tt-qr">
            <QrCode value={qrValue} label={`QR code for ticket ${ticketNo}`} />
          </div>
          <div className="tt-stub-side">
            <Barcode seed={ticketNo} />
            <div className="tt-stub-note">Scan at the entrance to admit</div>
          </div>
        </div>
        <svg className="tt-fiber tt-fiber-stub" viewBox={viewBox} preserveAspectRatio="none" aria-hidden="true">
          <polyline points={fiber} />
        </svg>
      </div>
    </>
  );

  return (
    <div
      className={`tt ${printable ? 'ticket-print-area' : ''}`}
      data-state={state}
      data-dir={vertical ? 'v' : 'h'}
      style={{ '--accent': accent }}
    >
      {pieces(false)}

      {/* Cancel: two full copies of the ticket, each clipped to one side of a jagged diagonal rip */}
      {state === 'cancel' && (
        <>
          <div className="tt-half tt-half-a" style={{ clipPath: cancel.leftClip, WebkitClipPath: cancel.leftClip, transformOrigin: cancel.hinge }} aria-hidden="true">
            <div className="tt-copy">{pieces(true)}</div>
            <svg className="tt-rip" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={cancel.line} /></svg>
          </div>
          <div className="tt-half tt-half-b" style={{ clipPath: cancel.rightClip, WebkitClipPath: cancel.rightClip, transformOrigin: cancel.hinge }} aria-hidden="true">
            <div className="tt-copy">{pieces(true)}</div>
            <svg className="tt-rip" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={cancel.line} /></svg>
          </div>
        </>
      )}

      {/* paper flakes that fly off the tear line */}
      <div className="tt-flakes" aria-hidden="true">
        {flakes.map((fl, i) => (
          <i
            key={i}
            style={{
              '--p': `${fl.p}%`, '--dx': `${fl.dx}px`, '--dy': `${fl.dy}px`, '--r': `${fl.r}deg`,
              '--s': `${fl.s}px`, '--d': `${fl.d}s`,
            }}
          ></i>
        ))}
      </div>
    </div>
  );
}
