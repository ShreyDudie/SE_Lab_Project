// Shared helpers for digital tickets + QR scanning.

const CODES = { COC: 'COC', Enthusia: 'ENT', Technovanza: 'TNV', Pratibimb: 'PRT' };

export function ticketNumber(committeeName, eventId, registrationId) {
  const pad = (n, l) => String(n).padStart(l, '0');
  return `VJTI-${CODES[committeeName] || 'EVT'}-${pad(eventId, 3)}-${pad(registrationId || 0, 4)}`;
}

export function venueFromDetails(details) {
  const m = (details || '').match(/Venue:\s*([^\n]+)/i);
  return m ? m[1].trim() : 'VJTI Main Campus, Matunga';
}

/** Small deterministic PRNG: the same ticket always renders the same torn edge. */
export function seededRandom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

const isLocalHost = (h) => h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1';
let cachedBase = null;

/**
 * Base URL a phone can open. When the app is opened on localhost the phone cannot
 * reach it, so we swap in this computer's Wi-Fi (LAN) address from the backend.
 */
export async function getScanBase() {
  if (cachedBase) return cachedBase;
  const { protocol, hostname, port, origin } = window.location;
  if (!isLocalHost(hostname)) { cachedBase = origin; return cachedBase; }
  try {
    const res = await fetch('/api/network_info');
    const data = await res.json();
    if (data.lan_ip) {
      cachedBase = `${protocol}//${data.lan_ip}${port ? `:${port}` : ''}`;
      return cachedBase;
    }
  } catch { /* fall back to origin */ }
  cachedBase = origin;
  return cachedBase;
}

export async function buildScanUrl(token) {
  return `${await getScanBase()}/verify/${token}`;
}

/** Backend timestamps are naive UTC; make them proper local times. */
export function toLocalDate(iso) {
  if (!iso) return null;
  return new Date(iso + (iso.endsWith('Z') ? '' : 'Z'));
}

export function formatScanTime(iso) {
  const d = toLocalDate(iso);
  if (!d) return '';
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}
