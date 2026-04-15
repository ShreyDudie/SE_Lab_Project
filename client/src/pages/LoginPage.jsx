import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../components/FlashMessage';

const DEPARTMENTS = ['IT', 'CS', 'Mech', 'Prod', 'Text', 'EXTC', 'Tronics', 'Trical', 'Civil', 'Diploma'];

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', password: '', role: 'student', department: 'IT', committee_id: '' });
  const [committees, setCommittees] = useState([]);
  const [loadedComms, setLoadedComms] = useState(false);
  const { login, signup } = useAuth();
  const flash = useFlash();
  const navigate = useNavigate();

  const loadCommittees = async () => {
    if (loadedComms) return;
    try {
      const res = await fetch('/api/committees', { credentials: 'include' });
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

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login(form.username, form.password);
    if (result.ok) {
      flash(result.message, 'success');
      navigate('/dashboard');
    } else {
      flash(result.error, 'error');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const result = await signup(form);
    if (result.ok) {
      flash(result.message, 'success');
      navigate('/dashboard');
    } else {
      flash(result.error, 'error');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="navbar-crest" style={{ width: 48, height: 48, fontSize: '1.1rem', margin: '0 auto 0.75rem', borderRadius: 'var(--radius)' }}>
            <i className="fas fa-university"></i>
          </div>
        </div>

        <div className="tab-bar">
          <button className={isLogin ? 'active' : ''} onClick={() => setIsLogin(true)}>Sign In</button>
          <button className={!isLogin ? 'active' : ''} onClick={() => { setIsLogin(false); loadCommittees(); }}>Register</button>
        </div>

        {isLogin ? (
          <>
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-sub">Access your VJTI portal</p>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-input" type="text" name="username" value={form.username} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" name="password" value={form.password} onChange={handleChange} required />
              </div>
              <button className="btn btn-primary btn-block mt-1" type="submit">Sign In</button>
            </form>
          </>
        ) : (
          <>
            <h2 className="login-title">Create Account</h2>
            <p className="login-sub">Join the VJTI community</p>
            <form onSubmit={handleSignup}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-input" type="text" name="username" value={form.username} onChange={handleChange} required placeholder="e.g. shreyas_vjti" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" name="role" value={form.role} onChange={handleChange}>
                    <option value="student">Student</option>
                    <option value="head">Committee Head</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" name="department" value={form.department} onChange={handleChange}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {form.role === 'head' && (
                <div className="form-group" style={{ background: 'var(--warning-bg)', padding: '0.85rem', borderRadius: 'var(--radius)', border: '1px solid #e6d9a8' }}>
                  <div className="gap-row mb-1">
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)', display: 'inline-block' }}></span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--warning)' }}>Admin Verification Required</span>
                  </div>
                  <label className="form-label">Select Committee</label>
                  <select className="form-select" name="committee_id" value={form.committee_id} onChange={handleChange}>
                    <option value="">Choose...</option>
                    {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" name="password" value={form.password} onChange={handleChange} required />
              </div>
              <button className="btn btn-burgundy btn-block mt-1" type="submit">Create Account</button>
            </form>
          </>
        )}

        <div className="login-footer">VJTI Integrated Committee Management</div>
      </div>
    </div>
  );
}
