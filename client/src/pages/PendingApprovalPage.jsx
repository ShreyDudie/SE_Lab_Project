import { Link } from 'react-router-dom';

export default function PendingApprovalPage() {
  return (
    <div className="main-content">
      <div className="pending-wrapper">
        <div className="pending-icon">
          <i className="fas fa-clock"></i>
        </div>
        <h1>Account Pending Approval</h1>
        <p className="mt-1" style={{ color: 'var(--text-light)', maxWidth: 480, margin: '0.5rem auto 0' }}>
          Your request to join as a Committee Head has been submitted to the VJTI Administration. 
          You will gain full access once they verify your credentials.
        </p>
        <Link to="/login" className="btn btn-outline mt-3">Sign Out For Now</Link>
      </div>
    </div>
  );
}
