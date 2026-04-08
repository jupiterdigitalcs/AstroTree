export function DialogBackdrop({ children, onClose }) {
  return (
    <div className="save-dialog-backdrop" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
