import { useState, useEffect, useRef, useReducer } from "react";
import { RETURN_VIEW_LABELS } from "../../lib/constants";
import { TodoForm } from "../TodoForm";
import { TodoCard } from "../TodoCard";
import { TodoEditModal } from "../TodoEditModal";
import { NetlifyModal } from "../NetlifyModal";
import { GitHubModal } from "../GitHubModal";
import { ProjectHeader } from "./ProjectHeader";
import { ProjectMeta } from "./ProjectMeta";
import { DeployCard } from "./DeployCard";
import { GitHubCard } from "./GitHubCard";
import { TasksSection } from "./TasksSection";
import { DangerZone } from "./DangerZone";

const detailInitial = {
  editingField: null,
  tempValue: "",
  newTask: "",
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
    case "SET_NEW_TASK":
      return { ...state, newTask: action.value };
    case "CLEAR_NEW_TASK":
      return { ...state, newTask: "" };
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
  projects,
  actions,
  todos,
  onCreateTodo,
  onUpdateTodo,
  onDeleteTodo,
  onBack,
  returnView,
  hasNetlifyToken,
  hasGithubToken,
  onOpenSettings,
  onSyncResult,
}) {
  const [d, dispatch] = useReducer(detailReducer, detailInitial);
  const [editingTodo, setEditingTodo] = useState(null);
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

  const handleAddTask = () => {
    if (!d.newTask.trim()) return;
    actions.addTask(project.id, d.newTask.trim());
    dispatch({ type: "CLEAR_NEW_TASK" });
  };

  const handleSyncNetlify = async () => {
    dispatch({ type: "SET_SYNCING", key: "syncingNetlify", value: true });
    const result = await actions.syncNetlifyDeploys();
    dispatch({ type: "SET_SYNCING", key: "syncingNetlify", value: false });
    onSyncResult?.(result, "Netlify");
  };

  const handleSyncGithub = async () => {
    dispatch({ type: "SET_SYNCING", key: "syncingGithub", value: true });
    const result = await actions.syncGithubActivity();
    dispatch({ type: "SET_SYNCING", key: "syncingGithub", value: false });
    onSyncResult?.(result, "GitHub");
  };

  const groups = {
    in_progress: project.tasks.filter((t) => t.status === "in_progress"),
    todo: project.tasks.filter((t) => t.status === "todo"),
    blocked: project.tasks.filter((t) => t.status === "blocked"),
    done: project.tasks.filter((t) => t.status === "done"),
  };
  const gc = {
    in_progress: "border-blue-900/30",
    todo: "border-slate-700/50",
    blocked: "border-red-900/30",
    done: "border-slate-700/30",
  };

  const returnLabel = RETURN_VIEW_LABELS[returnView] || "overview";

  return (
    <div className="space-y-6">
      <ProjectHeader
        project={project}
        editing={d.editingField === "name"}
        tempValue={d.tempValue}
        returnLabel={returnLabel}
        onBack={onBack}
        onTempChange={(v) => dispatch({ type: "SET_TEMP", value: v })}
        onStartEdit={() => startEdit("name", project.name)}
        onCommit={() => commitEdit("name")}
        onKeyDown={(e) => onKey(e, "name")}
        inputRef={ref}
      />

      <ProjectMeta
        project={project}
        editingField={d.editingField}
        tempValue={d.tempValue}
        onStatusChange={(status) => actions.updateProject(project.id, { status })}
        onTempChange={(v) => dispatch({ type: "SET_TEMP", value: v })}
        onStartEdit={startEdit}
        onCommit={commitEdit}
        onKeyDown={onKey}
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

      <TasksSection
        project={project}
        groups={groups}
        groupBorders={gc}
        newTask={d.newTask}
        onNewTaskChange={(v) => dispatch({ type: "SET_NEW_TASK", value: v })}
        onAddTask={handleAddTask}
        onUpdateTask={(taskId, updates) => actions.updateTask(project.id, taskId, updates)}
        onDeleteTask={(taskId) => actions.deleteTask(project.id, taskId)}
      />

      <section>
        <h3 className="text-lg font-semibold text-slate-200 mb-1">Follow-ups</h3>
        <p className="text-xs text-slate-500 mb-4">
          Quick captures linked to this project — shown on the global Follow-ups board
        </p>
        <TodoForm
          onCreate={onCreateTodo}
          projects={projects}
          defaultProjectId={project.id}
          compact
        />
        {todos?.length > 0 ? (
          <div className="space-y-3 mt-4">
            {todos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onUpdate={onUpdateTodo}
                onDelete={onDeleteTodo}
                onEdit={setEditingTodo}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4 mt-2">
            No follow-ups linked yet — add one above
          </p>
        )}
      </section>

      {editingTodo && (
        <TodoEditModal
          todo={editingTodo}
          projects={projects}
          onSave={async (updates) => {
            await onUpdateTodo(editingTodo.id, updates);
            setEditingTodo(null);
          }}
          onClose={() => setEditingTodo(null)}
        />
      )}

      <DangerZone
        projectName={project.name}
        confirming={d.showDelete}
        onConfirm={() => {
          actions.deleteProject(project.id);
          onBack();
        }}
        onShow={() => dispatch({ type: "SET_SHOW", key: "showDelete", value: true })}
        onCancel={() => dispatch({ type: "SET_SHOW", key: "showDelete", value: false })}
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
