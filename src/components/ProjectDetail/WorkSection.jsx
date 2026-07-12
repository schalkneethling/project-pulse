import { useState } from "react";
import { WORK_STATUS, WORK_STATUS_ORDER } from "../../lib/constants";
import { groupWorkItems } from "../../lib/workItems";
import { WorkItemForm } from "./WorkItemForm";
import { WorkItemRow } from "./WorkItemRow";

export function WorkSection({
  project,
  onAdd,
  onUpdate,
  onComplete,
  onFocus,
  onArchive,
  onUnarchive,
  onDelete,
  onEdit,
}) {
  const [showDone, setShowDone] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [mutationError, setMutationError] = useState(null);

  const groups = groupWorkItems(project.tasks);
  const visibleStatuses = WORK_STATUS_ORDER.filter((s) => s !== "done");

  async function runMutation(fn) {
    setMutationError(null);
    try {
      await fn();
    } catch (err) {
      console.error(err);
      setMutationError(err?.message || "Could not update work item.");
    }
  }

  const handleAdvance = (taskId, nextStatus) => {
    void runMutation(() =>
      nextStatus === "done" ? onComplete(taskId) : onUpdate(taskId, { status: nextStatus }),
    );
  };

  const handleBlock = (taskId) => {
    void runMutation(() => onUpdate(taskId, { status: "blocked" }));
  };

  const handleArchive = (taskId) => {
    void runMutation(() => onArchive(taskId));
  };

  const handleUnarchive = (taskId) => {
    void runMutation(() => onUnarchive(taskId));
  };

  const handleDelete = (taskId) => {
    void runMutation(() => onDelete(taskId));
  };

  return (
    <section>
      <h3 className="text-lg font-semibold text-slate-200 mb-1">Work</h3>
      <p className="text-xs text-slate-500 mb-4">What moves this project forward</p>

      <WorkItemForm onCreate={onAdd} compact />

      {mutationError && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {mutationError}
        </p>
      )}

      <div className="mt-4 space-y-4">
        {visibleStatuses.map((status) => {
          const items = groups[status];
          if (!items.length) return null;
          return (
            <div key={status}>
              <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                {WORK_STATUS[status].label}
                <span className="text-slate-500">({items.length})</span>
              </h4>
              <div className="space-y-2">
                {items.map((item) => (
                  <WorkItemRow
                    key={item.id}
                    item={item}
                    onAdvance={handleAdvance}
                    onBlock={handleBlock}
                    onEdit={onEdit}
                    onFocus={onFocus}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {groups.done.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowDone((v) => !v)}
              className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
              {showDone ? "Hide" : "Show"} completed ({groups.done.length})
            </button>
            {showDone && (
              <div className="mt-2 space-y-2">
                {groups.done.map((item) => (
                  <WorkItemRow
                    key={item.id}
                    item={item}
                    onEdit={onEdit}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {groups.archived.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
              {showArchived ? "Hide" : "Show"} archived ({groups.archived.length})
            </button>
            {showArchived && (
              <div className="mt-2 space-y-2">
                {groups.archived.map((item) => (
                  <WorkItemRow
                    key={item.id}
                    item={item}
                    archived
                    onUnarchive={handleUnarchive}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {project.tasks.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-6">No work yet — add something above.</p>
        )}
      </div>
    </section>
  );
}
