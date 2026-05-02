import { useState } from "react";

export function LoginScreen({ onSignIn, loading, mode = "single" }) {
  const isSingleUser = mode === "single";
  const [showSignIn, setShowSignIn] = useState(!isSingleUser);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-100">Project Pulse</h1>
          <p className="mt-2 text-slate-400">Track your side projects, see what needs you.</p>
        </div>

        {showSignIn ? (
          <>
            <button
              onClick={onSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {loading ? "Signing in…" : "Sign in with Google"}
            </button>

            <p className="text-xs text-slate-600">
              Your data is private — only you can see your projects.
            </p>
          </>
        ) : (
          <>
            <p className="text-slate-400">
              This is a personal Project Pulse instance. Want your own?{" "}
              <a
                href="https://github.com/schalkneethling/project-pulse"
                className="text-slate-300 underline underline-offset-2 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Fork it on GitHub
              </a>
            </p>
            <button
              onClick={() => setShowSignIn(true)}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Sign in as owner
            </button>
          </>
        )}
      </div>
    </div>
  );
}
