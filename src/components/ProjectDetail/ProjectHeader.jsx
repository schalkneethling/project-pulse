import { IconBack, IconEdit } from "../icons";

export function ProjectHeader({
  project,
  editing,
  tempValue,
  returnLabel,
  onBack,
  onTempChange,
  onStartEdit,
  onCommit,
  onKeyDown,
  inputRef,
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
        aria-label={`Back to ${returnLabel}`}
      >
        <IconBack />
      </button>
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={tempValue}
            onChange={(e) => onTempChange(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={onCommit}
            aria-label="Project name"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1 text-xl font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <button
            type="button"
            onClick={onStartEdit}
            className="text-left group flex items-center gap-2"
          >
            <h2 className="text-xl font-semibold text-slate-200 truncate">
              {project.name || "Untitled Project"}
            </h2>
            <span className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-slate-500 transition-opacity">
              <IconEdit size={14} />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
