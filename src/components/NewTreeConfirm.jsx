export function NewTreeConfirm({ onClose, onConfirm }) {
  return (
    <div className="save-dialog-backdrop" onClick={onClose}>
      <div className="save-dialog" onClick={e => e.stopPropagation()}>
        <p className="save-dialog-title">Start a new chart?</p>
        <p className="save-dialog-sub">Your current chart is saved and can be reloaded from Saved Charts.</p>
        <div className="save-dialog-btns">
          <button type="button" className="save-dialog-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="save-dialog-save" onClick={onConfirm}>Start New</button>
        </div>
      </div>
    </div>
  )
}
