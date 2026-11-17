import { useMemo } from 'react';
import QRCode from 'qrcode';

/**
 * A real, scannable QR code (rendered as SVG, no images or network calls).
 * `value` is any text; here it is the ticket's verification URL.
 */
export default function QrCode({ value, className = '', label = 'QR code' }) {
  const qr = useMemo(() => {
    if (!value) return null;
    try {
      const q = QRCode.create(value, { errorCorrectionLevel: 'M' });
      const n = q.modules.size;
      let d = '';
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          if (q.modules.get(y, x)) d += `M${x} ${y}h1v1h-1z`;
        }
      }
      return { n, d };
    } catch {
      return null;
    }
  }, [value]);

  if (!qr) return <div className={`qr-placeholder ${className}`} aria-hidden="true"></div>;

  const margin = 2; // quiet zone, required by QR readers
  const size = qr.n + margin * 2;
  return (
    <svg
      className={className}
      viewBox={`${-margin} ${-margin} ${size} ${size}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
    >
      <rect x={-margin} y={-margin} width={size} height={size} fill="#fff" />
      <path d={qr.d} fill="#0F1B33" />
    </svg>
  );
}
