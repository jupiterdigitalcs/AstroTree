export function SaveDialog({
  saveTitle, setSaveTitle,
  pendingNewTree,
  onClose,
  onDiscard,
  onSubmit,
}) {
  return (
    <div className="save-dialog-backdrop" onClick={onClose}>
      <form
        className={`save-dialog${pendingNewTree ? ' save-dialog--warning' : ''}`}
        onSubmit={onSubmit}
        onClick={e => e.stopPropagation()}
      >
        <p className="save-dialog-title">
          {pendingNewTree ? '⚠ Save before starting a new chart?' : '💾 Name this chart'}
        </p>
        {!pendingNewTree && (
          <p className="save-dialog-sub">Saved charts appear in the Saved tab and sync to your devices.</p>
        )}
        <input
          type="text"
          className="save-dialog-input"
          placeholder="e.g. Mom's side, 2025…"
          value={saveTitle}
          onChange={e => setSaveTitle(e.target.value)}
          autoFocus
        />
        <div className="save-dialog-btns">
          <button type="button" className="save-dialog-cancel" onClick={onClose}>
            Cancel
          </button>
          {pendingNewTree && (
            <button
              type="button"
              className="save-dialog-discard save-dialog-discard--prominent"
              onClick={onDiscard}
            >
              Discard & Start New
            </button>
          )}
          <button type="submit" className="save-dialog-save" disabled={!saveTitle.trim()}>
            Save
          </button>
        </div>
      </form>
    </div>
  )
}
