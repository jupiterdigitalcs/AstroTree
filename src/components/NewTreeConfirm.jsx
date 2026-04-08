import { DialogBackdrop } from './DialogBackdrop.jsx'

export function NewTreeConfirm({ onClose, onConfirm }) {
  return (
    <DialogBackdrop onClose={onClose}>
      <div className="save-dialog">
        <p className="save-dialog-title">Start a new chart?</p>
        <p className="save-dialog-sub">Your current chart is saved and can be reloaded from Saved Charts.</p>
        <div className="save-dialog-btns">
          <button type="button" className="save-dialog-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="save-dialog-save" onClick={onConfirm}>Start New</button>
        </div>
      </div>
    </DialogBackdrop>
  )
}
