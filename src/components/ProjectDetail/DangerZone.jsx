export function DangerZone({ projectName, confirming, onConfirm, onShow, onCancel }) {
  return (
    <div className="border-t border-slate-800 pt-6">
      {confirming ? (
        <div className="flex items-center gap-3 bg-red-950/30 border border-red-900/40 rounded-lg p-4">
          <p className="text-sm text-red-300 flex-1">
            Permanently delete "{projectName || "this project"}"?
          </p>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium text-white transition-colors"
          >
            Delete project
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onShow}
          className="text-sm text-slate-500 hover:text-red-400 transition-colors"
        >
          Delete project
        </button>
      )}
    </div>
  );
}
