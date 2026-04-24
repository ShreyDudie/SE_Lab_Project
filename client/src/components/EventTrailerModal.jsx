import { useState } from 'react';

export default function EventTrailerModal({ show, onClose, eventTitle }) {
  if (!show) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', background: '#000', padding: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10px', right: '15px', zIndex: 10 }}>
          <button className="btn btn-sm btn-danger" onClick={onClose} style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {/* Mock Video Player */}
        <div style={{ position: 'relative', paddingTop: '56.25%', background: '#111' }}>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', 
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7))',
            color: '#fff'
          }}>
            <div className="pulse-glow" style={{
              width: '64px', height: '64px', background: 'var(--primary)', 
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1rem', cursor: 'pointer'
            }}>
              <i className="fas fa-play" style={{ fontSize: '1.5rem', marginLeft: '4px' }}></i>
            </div>
            <h3 style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{eventTitle || 'Event'} Official Trailer</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Mock Video Source</p>
          </div>
        </div>
      </div>
    </div>
  );
}
