import { useState } from "react";
import { linkify, safeHttpUrl } from "../../lib/linkify";
import { getDueState, formatDateKey } from "../../lib/dueDate";
import { WORK_STATUS } from "../../lib/constants";
import { IconCheck, IconTrash } from "../icons";

const DUE_STYLES = {
  today: "bg-yellow-950/30 border-yellow-600/50",
  late: "bg-red-950/30 border-red-600/50",
};

const LINK_CLASS =
  "inline-block max-w-[min(100%,72ch)] truncate align-bottom text-sky-400 hover:text-sky-300 underline underline-offset-2";

export function WorkItemRow({
  item,
  onAdvance,
  onBlock,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
  archived = false,
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { id, title, who, source, sourceUrl, status, dueDate } = item;
  const dueState = getDueState(dueDate, status);
  const segments = linkify(title);
  const safeSourceUrl = safeHttpUrl(sourceUrl);
  const meta = WORK_STATUS[status] || WORK_STATUS.todo;
  const borderClass = archived
    ? "border-slate-700/30 opacity-70"
    : DUE_STYLES[dueState] || meta.border;

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg bg-slate-800/40 border ${borderClass} p-3 group`}
    >
      <div className="flex items-start gap-3">
        {status === "done" && !archived ? (
          <span className="text-emerald-500 shrink-0 mt-0.5">
            <IconCheck />
          </span>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm ${status === "done" && !archived ? "text-slate-500 line-through" : "text-slate-200"}`}
          >
            {segments.map((seg) =>
              seg.type === "link" ? (
                <a
                  key={`link:${seg.start}:${seg.value}`}
                  href={seg.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={seg.value}
                  className={LINK_CLASS}
                >
                  {seg.value}
                </a>
              ) : (
                <span key={`text:${seg.start}:${seg.value}`}>{seg.value}</span>
              ),
            )}
          </p>
          {(who || source || dueDate) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
              {who && <span>Who: {who}</span>}
              {source && (
                <span>
                  {safeSourceUrl ? (
                    <a
                      href={safeSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={LINK_CLASS}
                    >
                      {source}
                    </a>
                  ) : (
                    source
                  )}
                </span>
              )}
              {dueDate && (
                <span
                  className={
                    dueState === "late" ? "text-red-300" : dueState === "today" ? "text-yellow-300" : ""
                  }
                >
                  Due {formatDateKey(dueDate)}
                </span>
              )}
            </div>
          )}
        </div>
        {archived && (
          <span className="shrink-0 text-xs text-slate-500">{meta.label}</span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap pl-7">
        {!archived && meta.advance && onAdvance && (
          <button
            type="button"
            onClick={() => onAdvance(id, meta.advance)}
            className="text-xs px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded-md font-medium text-white transition-colors"
          >
            {meta.advanceLabel}
          </button>
        )}
        {!archived && status !== "blocked" && onBlock && (
          <button
            type="button"
            onClick={() => onBlock(id)}
            className="text-xs px-2 py-1 rounded border border-slate-600 text-slate-400 hover:border-amber-600 hover:text-amber-300 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
          >
            Block
          </button>
        )}
        {!archived && onEdit && (
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="text-xs px-2 py-1 rounded border border-slate-600 text-slate-400 hover:border-blue-500 hover:text-blue-300 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
          >
            Edit
          </button>
        )}
        {!archived && onArchive && (
          <button
            type="button"
            onClick={() => onArchive(id)}
            className="text-xs px-2 py-1 rounded border border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
          >
            Archive
          </button>
        )}
        {archived && onUnarchive && (
          <button
            type="button"
            onClick={() => onUnarchive(id)}
            className="text-xs px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-slate-200 transition-colors"
          >
            Unarchive
          </button>
        )}
        {onDelete && (
          confirmingDelete ? (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-slate-400">Delete?</span>
              <button
                type="button"
                onClick={() => {
                  onDelete(id);
                  setConfirmingDelete(false);
                }}
                className="text-xs px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-white"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              aria-label={`Delete ${title}`}
              className="text-slate-600 hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all ml-auto shrink-0"
            >
              <IconTrash size={14} />
            </button>
          )
        )}
      </div>
    </div>
  );
}
