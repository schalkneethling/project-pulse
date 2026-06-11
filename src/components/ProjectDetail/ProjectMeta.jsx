import { fmtDate } from "../../lib/helpers";
import { STATUS } from "../../lib/constants";
import { Editable } from "./Editable";

export function ProjectMeta({
  project,
  editingField,
  tempValue,
  onStatusChange,
  onTempChange,
  onStartEdit,
  onCommit,
  onKeyDown,
  inputRef,
}) {
  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-5 space-y-4">
      <div>
        <span className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Status</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Project status">
          {Object.entries(STATUS).map(([k, v]) => (
            <button
              type="button"
              key={k}
              onClick={() => onStatusChange(k)}
              role="radio"
              aria-checked={project.status === k}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${project.status === k ? `${v.color} text-white` : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <Editable
        field="description"
        label="Description"
        value={project.description}
        multi
        editing={editingField === "description"}
        tempValue={tempValue}
        onTempChange={onTempChange}
        onStartEdit={onStartEdit}
        onCommit={onCommit}
        onKeyDown={onKeyDown}
        inputRef={inputRef}
      />
      <div className="rounded-lg bg-slate-900/50 border border-blue-900/30 p-4">
        <Editable
          field="nextStep"
          label="⚡ Next Step"
          value={project.nextStep}
          editing={editingField === "nextStep"}
          tempValue={tempValue}
          onTempChange={onTempChange}
          onStartEdit={onStartEdit}
          onCommit={onCommit}
          onKeyDown={onKeyDown}
          inputRef={inputRef}
        />
        <p className="text-xs text-slate-500 mt-1 px-3">
          What should you do when you next sit down with this project?
        </p>
      </div>
      <div className="flex gap-4 text-xs text-slate-500 px-3">
        <span>Created {fmtDate(project.createdAt)}</span>
        <span>Updated {fmtDate(project.updatedAt)}</span>
      </div>
    </div>
  );
}
