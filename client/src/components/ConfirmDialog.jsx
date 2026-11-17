import { useEffect, useRef } from 'react';

/**
 * Modern replacement for window.confirm(): accessible, keyboard friendly
 * (Esc cancels, focus lands on the safe "Cancel" action).
 */
export default function ConfirmDialog({
  show,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!show) return undefined;
    cancelRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, onCancel]);

  if (!show) return null;

  return (
    <div className="modal-backdrop confirm-backdrop" onClick={onCancel} style={{ zIndex: 1100 }}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={e => e.stopPropagation()}
      >
        <div className={`confirm-icon ${danger ? 'danger' : ''}`}>
          <i className={`fas ${danger ? 'fa-trash-alt' : 'fa-question'}`}></i>
        </div>
        <h3 id="confirm-title" className="confirm-title">{title}</h3>
        {message && <p className="confirm-message">{message}</p>}
        <div className="confirm-actions">
          <button type="button" ref={cancelRef} className="btn btn-outline" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
