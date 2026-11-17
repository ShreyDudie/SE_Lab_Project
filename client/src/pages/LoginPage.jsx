import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../components/FlashMessage';
import { markWelcome, clearWelcome } from '../utils/welcome';
import AuthSideDecor from '../components/AuthSideDecor';
import { playSound } from '../utils/sound';

// ─── Validation helpers ─────────────────────────────────────────────
const USERNAME_RE = /^[a-zA-Z0-9._-]+$/;

function validate(form, isLogin) {
  const e = {};
  const u = form.username.trim();
  if (!u) e.username = 'Please enter your username.';
  else if (!isLogin) {
    if (u.length < 3) e.username = 'Username must be at least 3 characters.';
    else if (u.length > 30) e.username = 'Username can be at most 30 characters.';
    else if (!USERNAME_RE.test(u)) e.username = 'Use only letters, numbers, dots, dashes and underscores.';
  }
  if (!form.password) e.password = 'Please enter your password.';
  else if (!isLogin && form.password.length < 6) e.password = 'Password must be at least 6 characters.';
  if (!isLogin) {
    if (!form.department) e.department = 'Select your department.';
    if (form.role === 'head' && !form.committee_id) e.committee_id = 'Select the committee you want to lead.';
  }
  return e;
}

function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: pw ? labels[score] : '' };
}

function Field({ label, error, touched, children, hint }) {
  const show = touched && error;
  return (
    <div className={`form-group ${show ? 'has-error' : ''}`}>
      <label className="form-label">{label}</label>
      {children}
      {show
        ? <p className="field-error" role="alert"><i className="fas fa-exclamation-circle"></i> {error}</p>
        : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', password: '', role: 'student', department: 'IT', committee_id: '' });
  const [touched, setTouched] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [committees, setCommittees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadedComms, setLoadedComms] = useState(false);
  const { login, signup } = useAuth();
  const flash = useFlash();
  const navigate = useNavigate();

  const errors = validate(form, isLogin);
  const strength = passwordStrength(form.password);

  useEffect(() => {
    fetch('/api/departments').then(r => r.json()).then(d => setDepartments(d.departments || [])).catch(() => {});
  }, []);

  const loadCommittees = async () => {
    if (loadedComms) return;
    try {
      const res = await fetch('/api/public/committees');
      if (res.ok) {
        const data = await res.json();
        setCommittees(data.committees || []);
      }
    } catch { /* ignore */ }
    setLoadedComms(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'role' && e.target.value === 'head') {
      loadCommittees();
    }
  };

  const handleBlur = (e) => setTouched(t => ({ ...t, [e.target.name]: true }));

  const switchMode = (login) => {
    setIsLogin(login);
    setTouched({});
    setShowPw(false);
    if (!login) loadCommittees();
  };

  const touchAll = () => setTouched({ username: true, password: true, department: true, committee_id: true });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (Object.keys(errors).length) { touchAll(); return; }
    setBusy(true);
    const result = await login(form.username.trim(), form.password);
    setBusy(false);
    if (result.ok) {
      playSound('welcome');
      flash(result.message, 'success');
      navigate('/dashboard');
    } else {
      flash(result.error || 'Login failed. Please try again.', 'error');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (Object.keys(errors).length) { touchAll(); return; }
    setBusy(true);
    markWelcome(form.role);
    const result = await signup({ ...form, username: form.username.trim() });
    setBusy(false);
    if (result.ok) {
      playSound('welcome');
      flash(result.message, 'success');
      navigate('/dashboard');
    } else {
      clearWelcome();
      flash(result.error || 'Could not create the account.', 'error');
    }
  };

  const pwInput = (autoComplete) => (
    <div className="input-with-action">
      <input
        className="form-input"
        type={showPw ? 'text' : 'password'}
        name="password"
        value={form.password}
        onChange={handleChange}
        onBlur={handleBlur}
        autoComplete={autoComplete}
        aria-invalid={!!(touched.password && errors.password)}
        required
      />
      <button type="button" className="input-action" onClick={() => setShowPw(s => !s)} aria-label={showPw ? 'Hide password' : 'Show password'} tabIndex={-1}>
        <i className={`fas ${showPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
      </button>
    </div>
  );

  return (
    <div className="login-wrapper-enhanced">
      {/* Floating shapes background */}
      <div className="hero-floating-shapes" style={{ position: 'absolute', inset: 0 }}>
        <span style={{ background: 'var(--gold)' }}></span>
        <span style={{ background: 'var(--burgundy)' }}></span>
        <span style={{ background: 'var(--gold-light)' }}></span>
        <span style={{ background: 'var(--navy-light)' }}></span>
        <span style={{ background: 'var(--gold)' }}></span>
        <span style={{ background: 'var(--burgundy)' }}></span>
      </div>

      <AuthSideDecor />

      <div className="login-card-enhanced">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="navbar-crest" style={{ width: 48, height: 48, fontSize: '1.1rem', margin: '0 auto 0.75rem', borderRadius: 'var(--radius)' }}>
            <i className="fas fa-university"></i>
          </div>
        </div>

        <div className="tab-bar">
          <button className={isLogin ? 'active' : ''} onClick={() => switchMode(true)}>Sign In</button>
          <button className={!isLogin ? 'active' : ''} onClick={() => switchMode(false)}>Register</button>
        </div>

        {isLogin ? (
          <>
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-sub">Access your VJTI portal</p>
            <form onSubmit={handleLogin} noValidate>
              <Field label="Username" error={errors.username} touched={touched.username}>
                <input className="form-input" type="text" name="username" value={form.username} onChange={handleChange} onBlur={handleBlur}
                  autoComplete="username" aria-invalid={!!(touched.username && errors.username)} required />
              </Field>
              <Field label="Password" error={errors.password} touched={touched.password}>
                {pwInput('current-password')}
              </Field>
              <button className="btn btn-primary btn-block mt-1" type="submit" disabled={busy}>
                {busy ? <><span className="btn-spinner"></span> Signing in...</> : 'Sign In'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="login-title">Create Account</h2>
            <p className="login-sub">Join the VJTI community</p>
            <form onSubmit={handleSignup} noValidate>
              <Field label="Username" error={errors.username} touched={touched.username} hint="3-30 characters: letters, numbers, . - _">
                <input className="form-input" type="text" name="username" value={form.username} onChange={handleChange} onBlur={handleBlur}
                  placeholder="e.g. shreyas_vjti" autoComplete="username" aria-invalid={!!(touched.username && errors.username)} required />
              </Field>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" name="role" value={form.role} onChange={handleChange}>
                    <option value="student">Student</option>
                    <option value="head">Committee Head</option>
                  </select>
                </div>
                <Field label="Department" error={errors.department} touched={touched.department}>
                  <select className="form-select" name="department" value={form.department} onChange={handleChange} onBlur={handleBlur}>
                    <option value="">Select...</option>
                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </Field>
              </div>

              {form.role === 'head' && (
                <div className={`form-group ${touched.committee_id && errors.committee_id ? 'has-error' : ''}`} style={{ background: 'var(--warning-bg)', padding: '0.85rem', borderRadius: 'var(--radius)', border: '1px solid #e6d9a8' }}>
                  <div className="gap-row mb-1">
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)', display: 'inline-block' }}></span>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--warning)' }}>Admin Verification Required</span>
                  </div>
                  <label className="form-label">Select Committee</label>
                  <select className="form-select" name="committee_id" value={form.committee_id} onChange={handleChange} onBlur={handleBlur}>
                    <option value="">Choose...</option>
                    {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {touched.committee_id && errors.committee_id && (
                    <p className="field-error" role="alert"><i className="fas fa-exclamation-circle"></i> {errors.committee_id}</p>
                  )}
                </div>
              )}

              <Field label="Password" error={errors.password} touched={touched.password}>
                {pwInput('new-password')}
                {form.password && (
                  <div className="pw-meter" aria-live="polite">
                    <div className="pw-bars">
                      {[1, 2, 3, 4].map(i => <i key={i} className={strength.score >= i ? `on s${strength.score}` : ''}></i>)}
                    </div>
                    <span className={`pw-label s${strength.score}`}>{strength.label}</span>
                  </div>
                )}
              </Field>
              <button className="btn btn-burgundy btn-block mt-1" type="submit" disabled={busy}>
                {busy ? <><span className="btn-spinner"></span> Creating account...</> : 'Create Account'}
              </button>
            </form>
          </>
        )}

        <div className="login-footer">VJTI Integrated Committee Management</div>
      </div>
    </div>
  );
}
