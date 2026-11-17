const KEY = 'vjti_welcome';

/** Remember (for one page load after signup) that we should greet the new user. */
export function markWelcome(role) {
  try { sessionStorage.setItem(KEY, role || 'student'); } catch { /* storage unavailable */ }
}

export function clearWelcome() {
  try { sessionStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}

export function consumeWelcome() {
  try {
    const v = sessionStorage.getItem(KEY);
    if (v) sessionStorage.removeItem(KEY);
    return v;
  } catch { return null; }
}
