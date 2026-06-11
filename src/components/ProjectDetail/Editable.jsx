import { IconEdit } from "../icons";

export function Editable({
  field,
  label,
  value,
  multi,
  editing,
  tempValue,
  onTempChange,
  onStartEdit,
  onCommit,
  onKeyDown,
  inputRef,
}) {
  const Tag = multi ? "textarea" : "input";
  return (
    <div className="group">
      <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</label>
      {editing ? (
        <Tag
          ref={inputRef}
          type="text"
          value={tempValue}
          onChange={(e) => onTempChange(e.target.value)}
          onKeyDown={(e) => onKeyDown(e, field)}
          onBlur={() => onCommit(field)}
          rows={multi ? 3 : undefined}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => onStartEdit(field, value)}
          className="w-full text-left px-3 py-2 rounded-lg border border-transparent hover:border-slate-600 hover:bg-slate-800/50 transition-colors min-h-[2.5rem] flex items-start"
        >
          <span className={`text-sm ${value ? "text-slate-200" : "text-slate-500 italic"}`}>
            {value || `Set ${label.toLowerCase()}…`}
          </span>
          <span className="ml-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-slate-500 transition-opacity shrink-0 mt-0.5">
            <IconEdit size={14} />
          </span>
        </button>
      )}
    </div>
  );
}
