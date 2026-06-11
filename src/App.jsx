import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./hooks/useAuth";
import { useProjects } from "./hooks/useProjects";
import { useSettings } from "./hooks/useSettings";
import { useTodos } from "./hooks/useTodos";
import { useRealtimeSync } from "./hooks/useRealtimeSync";
import { readViewFromUrl, writeViewToUrl } from "./lib/routing";
import { LoginScreen } from "./components/LoginScreen";
import { TodoForm, TodoBoard } from "./components/Todos";
import { Toast } from "./components/Toast";
import { Overview } from "./components/Overview";
import { ProjectList } from "./components/ProjectList";
import { ProjectDetail } from "./components/ProjectDetail/ProjectDetail";
import { SettingsModal } from "./components/SettingsModal";
import { IconPlus, IconSettings, IconLogout } from "./components/icons";

export default function App() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const {
    projects,
    loading: projLoading,
    createProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    saveNetlifySite,
    removeNetlifySite,
    saveGithubRepo,
    removeGithubRepo,
    syncNetlifyDeploys,
    syncGithubActivity,
    refetch,
  } = useProjects(user?.id);
  const { hasNetlifyToken, hasGithubToken, saveTokens } = useSettings(user?.id);
  const { todos, loading: todosLoading, createTodo, updateTodo, deleteTodo } = useTodos(user?.id);

  const initialUrl = readViewFromUrl();
  const [view, setViewState] = useState(initialUrl.view);
  const [showSettings, setShowSettings] = useState(false);
  const [pulseToast, setPulseToast] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState(null);

  const selectedIdRef = useRef(initialUrl.projectId);
  const returnViewRef = useRef("overview");

  const setView = useCallback((nextView, projectId = null) => {
    setViewState(nextView);
    if (projectId !== null) {
      selectedIdRef.current = projectId;
    }
    writeViewToUrl(nextView, nextView === "detail" ? selectedIdRef.current : null);
  }, []);

  const handleRealtimeChange = useCallback(() => setPulseToast(true), []);

  useRealtimeSync(user?.id, handleRealtimeChange);

  useEffect(() => {
    const onPopState = () => {
      const { view: urlView, projectId } = readViewFromUrl();
      setViewState(urlView);
      if (projectId) {
        selectedIdRef.current = projectId;
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const select = (id) => {
    returnViewRef.current = view;
    selectedIdRef.current = id;
    setView("detail", id);
  };

  const selected = projects.find((p) => p.id === selectedIdRef.current);

  const handleNew = async () => {
    const p = await createProject();
    if (p) {
      returnViewRef.current = view;
      selectedIdRef.current = p.id;
      setView("detail", p.id);
    }
  };

  const handleBack = () => {
    const target = returnViewRef.current || "overview";
    setView(target);
  };

  const handleSyncResult = (result, provider) => {
    if (result?.error) {
      setFeedbackToast(`${provider} sync failed: ${result.error}`);
    } else {
      setFeedbackToast(`${provider} synced successfully`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginScreen
        onSignIn={signInWithGoogle}
        loading={authLoading}
        mode={import.meta.env.VITE_PULSE_MODE ?? "single"}
      />
    );
  }

  if (projLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading projects…</div>
      </div>
    );
  }

  const actions = {
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    saveNetlifySite,
    removeNetlifySite,
    saveGithubRepo,
    removeGithubRepo,
    syncNetlifyDeploys,
    syncGithubActivity,
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {view !== "detail" && (
          <div className="flex items-center justify-between mb-6">
            <nav className="flex items-center gap-1 flex-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700/50">
              {[
                ["overview", "Overview"],
                ["projects", `Projects (${projects.length})`],
                ["todos", "Follow-ups"],
              ].map(([v, label]) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setView(v)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    view === v ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={handleNew}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-1.5"
                aria-label="Add new project"
              >
                <IconPlus size={16} />
                <span className="hidden sm:inline">New</span>
              </button>
            </nav>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="ml-3 p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              aria-label="Settings"
              title="Settings"
            >
              <IconSettings size={18} />
            </button>
            <button
              type="button"
              onClick={signOut}
              className="ml-1 p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <IconLogout size={18} />
            </button>
          </div>
        )}

        {view === "overview" && (
          <div className="max-w-5xl mx-auto">
            <Overview
              projects={projects}
              todos={todos}
              onSelect={select}
              onSelectFollowUp={() => setView("todos")}
              onNewProject={handleNew}
              hasNetlifyToken={hasNetlifyToken}
              hasGithubToken={hasGithubToken}
              onOpenSettings={() => setShowSettings(true)}
            />
          </div>
        )}

        {view === "projects" && (
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-semibold text-slate-100 mb-4">All Projects</h1>
            <ProjectList projects={projects} onSelect={select} />
            {projects.length === 0 && (
              <div className="text-center py-16">
                <p className="text-slate-500">No projects yet</p>
                <button
                  type="button"
                  onClick={handleNew}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  Add your first project
                </button>
              </div>
            )}
          </div>
        )}

        {view === "todos" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-100">Follow-ups</h1>
              <p className="text-sm text-slate-500 mt-1">Quick captures across projects</p>
            </div>
            {todosLoading ? (
              <div className="animate-pulse text-slate-400 py-12 text-center">Loading follow-ups…</div>
            ) : (
              <>
                <TodoForm onCreate={createTodo} projects={projects} />
                <TodoBoard
                  todos={todos}
                  onUpdate={updateTodo}
                  onDelete={deleteTodo}
                  projects={projects}
                />
              </>
            )}
          </div>
        )}

        {view === "detail" && selected && (
          <div className="max-w-4xl mx-auto">
            <ProjectDetail
              project={selected}
              projects={projects}
              actions={actions}
              todos={todos.filter((todo) => todo.projectId === selected.id)}
              onCreateTodo={createTodo}
              onUpdateTodo={updateTodo}
              onDeleteTodo={deleteTodo}
              onBack={handleBack}
              returnView={returnViewRef.current}
              hasNetlifyToken={hasNetlifyToken}
              hasGithubToken={hasGithubToken}
              onOpenSettings={() => setShowSettings(true)}
              onSyncResult={handleSyncResult}
            />
          </div>
        )}
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          saveTokens={saveTokens}
          hasNetlifyToken={hasNetlifyToken}
          hasGithubToken={hasGithubToken}
        />
      )}

      {pulseToast && (
        <Toast
          message="New pulse update received."
          actionLabel="Refresh data"
          onAction={() => refetch()}
          onDismiss={() => setPulseToast(false)}
        />
      )}

      {feedbackToast && (
        <Toast message={feedbackToast} onDismiss={() => setFeedbackToast(null)} />
      )}
    </div>
  );
}
