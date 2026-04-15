export default function Modal({ show, onClose, title, children }) {
  if (!show) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
