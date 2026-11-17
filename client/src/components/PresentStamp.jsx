/**
 * A big green rubber stamp that slams onto a participant's name.
 * Render it inside a `position: relative` row; the rough-edge SVG filter is
 * defined once alongside it (same id every time, harmless to repeat).
 */
export default function PresentStamp() {
  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <filter id="stamp-rough" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" />
        </filter>
      </svg>
      <span className="present-stamp" aria-hidden="true">PRESENT</span>
    </>
  );
}
