import { useState, useEffect, useRef, useReducer } from "react";
import { RETURN_VIEW_LABELS } from "../../lib/constants";
import { NetlifyModal } from "../NetlifyModal";
import { GitHubModal } from "../GitHubModal";
import { ProjectOverview } from "./ProjectOverview";
import { DeployCard } from "./DeployCard";
import { GitHubCard } from "./GitHubCard";
import { WorkSection } from "./WorkSection";
import { WorkItemEditModal } from "./WorkItemEditModal";
import { ProjectActions } from "./ProjectActions";

const detailInitial = {
  editingField: null,
  tempValue: "",
  showDelete: false,
  showNetlify: false,
  showGithub: false,
  syncingNetlify: false,
  syncingGithub: false,
};

function detailReducer(state, action) {
  switch (action.type) {
    case "START_EDIT":
      return { ...state, editingField: action.field, tempValue: action.value };
    case "SET_TEMP":
      return { ...state, tempValue: action.value };
    case "STOP_EDIT":
      return { ...state, editingField: null };
    case "SET_SHOW":
      return { ...state, [action.key]: action.value };
    case "SET_SYNCING":
      return { ...state, [action.key]: action.value };
    default:
      return state;
  }
}

export function ProjectDetail({
  project,
  actions,
  onBack,
  returnView,
  hasNetlifyToken,
  hasGithubToken,
  onOpenSettings,
  onSyncResult,
}) {
  const [d, dispatch] = useReducer(detailReducer, detailInitial);
  const [editingItem, setEditingItem] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (d.editingField && ref.current) ref.current.focus();
  }, [d.editingField]);

  const startEdit = (f, v) => {
    dispatch({ type: "START_EDIT", field: f, value: v || "" });
  };
  const commitEdit = (f) => {
    actions.updateProject(project.id, { [f]: d.tempValue });
    dispatch({ type: "STOP_EDIT" });
  };
  const onKey = (e, f) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commitEdit(f);
    }
    if (e.key === "Escape") dispatch({ type: "STOP_EDIT" });
  };

  const handleSyncNetlify = async () => {
    dispatch({ type: "SET_SYNCING", key: "syncingNetlify", value: true });
    try {
      const result = await actions.syncNetlifyDeploys();
      onSyncResult?.(result, "Netlify");
    } finally {
      dispatch({ type: "SET_SYNCING", key: "syncingNetlify", value: false });
    }
  };

  const handleSyncGithub = async () => {
    dispatch({ type: "SET_SYNCING", key: "syncingGithub", value: true });
    try {
      const result = await actions.syncGithubActivity();
      onSyncResult?.(result, "GitHub");
    } finally {
      dispatch({ type: "SET_SYNCING", key: "syncingGithub", value: false });
    }
  };

  const returnLabel = RETURN_VIEW_LABELS[returnView] || "overview";
  const isArchived = !!project.archivedAt;

  return (
    <div className="space-y-6">
      {isArchived && (
        <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-400">This project is archived</p>
          <button
            type="button"
            onClick={() => actions.unarchiveProject(project.id)}
            className="text-sm px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
          >
            Unarchive
          </button>
        </div>
      )}

      <ProjectOverview
        project={project}
        editingField={d.editingField}
        tempValue={d.tempValue}
        returnLabel={returnLabel}
        onBack={onBack}
        onTempChange={(v) => dispatch({ type: "SET_TEMP", value: v })}
        onStartEdit={startEdit}
        onCommit={commitEdit}
        onKeyDown={onKey}
        onStatusChange={(status) => actions.updateProject(project.id, { status })}
        inputRef={ref}
      />

      <DeployCard
        netlify={project.netlify}
        onEdit={() => dispatch({ type: "SET_SHOW", key: "showNetlify", value: true })}
        onRemove={() => actions.removeNetlifySite(project.id)}
        onSync={handleSyncNetlify}
        syncing={d.syncingNetlify}
        hasNetlifyToken={hasNetlifyToken}
        onOpenSettings={onOpenSettings}
      />

      <GitHubCard
        github={project.github}
        onEdit={() => dispatch({ type: "SET_SHOW", key: "showGithub", value: true })}
        onRemove={() => actions.removeGithubRepo(project.id)}
        onSync={handleSyncGithub}
        syncing={d.syncingGithub}
        hasGithubToken={hasGithubToken}
        onOpenSettings={onOpenSettings}
      />

      <WorkSection
        project={project}
        onAdd={(fields) => actions.addTask(project.id, fields)}
        onUpdate={(taskId, updates) => actions.updateTask(project.id, taskId, updates)}
        onArchive={(taskId) => actions.archiveTask(project.id, taskId)}
        onUnarchive={(taskId) => actions.unarchiveTask(project.id, taskId)}
        onDelete={(taskId) => actions.deleteTask(project.id, taskId)}
        onEdit={setEditingItem}
      />

      {editingItem && (
        <WorkItemEditModal
          item={editingItem}
          onSave={async (updates) => {
            const ok = await actions.updateTask(project.id, editingItem.id, updates);
            if (ok) setEditingItem(null);
          }}
          onClose={() => setEditingItem(null)}
        />
      )}

      <ProjectActions
        projectName={project.name}
        isArchived={isArchived}
        onArchive={() => actions.archiveProject(project.id)}
        onUnarchive={() => actions.unarchiveProject(project.id)}
        onDelete={() => {
          actions.deleteProject(project.id);
          onBack();
        }}
      />

      {d.showNetlify && (
        <NetlifyModal
          netlify={project.netlify}
          onSave={(data) => {
            actions.saveNetlifySite(project.id, data);
            dispatch({ type: "SET_SHOW", key: "showNetlify", value: false });
          }}
          onClose={() => dispatch({ type: "SET_SHOW", key: "showNetlify", value: false })}
        />
      )}
      {d.showGithub && (
        <GitHubModal
          github={project.github}
          onSave={(data) => {
            actions.saveGithubRepo(project.id, data);
            dispatch({ type: "SET_SHOW", key: "showGithub", value: false });
          }}
          onClose={() => dispatch({ type: "SET_SHOW", key: "showGithub", value: false })}
        />
      )}
    </div>
  );
}
