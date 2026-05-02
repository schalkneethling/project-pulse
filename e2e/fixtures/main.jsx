import { useState } from "react";
import { createRoot } from "react-dom/client";
import { NetlifyModal } from "../../src/components/NetlifyModal";
import { SettingsModal } from "../../src/components/SettingsModal";
import { GitHubModal } from "../../src/components/GitHubModal";
import "../../src/index.css";

function Harness() {
  const [showNetlify, setShowNetlify] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGithub, setShowGithub] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8">
      <h1 className="text-2xl font-bold mb-6">Modal A11y Test Harness</h1>
      <div className="flex gap-3">
        <button
          onClick={() => setShowNetlify(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white"
        >
          Open Netlify Modal
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white"
        >
          Open Settings Modal
        </button>
        <button
          onClick={() => setShowGithub(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white"
        >
          Open GitHub Modal
        </button>
      </div>

      {showNetlify && (
        <NetlifyModal
          netlify={null}
          onSave={(data) => {
            // eslint-disable-next-line no-console
            console.log("Netlify saved:", data);
            setShowNetlify(false);
          }}
          onClose={() => setShowNetlify(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          saveTokens={async (updates) => {
            // eslint-disable-next-line no-console
            console.log("Tokens saved:", updates);
          }}
        />
      )}

      {showGithub && (
        <GitHubModal
          github={null}
          onSave={(data) => {
            // eslint-disable-next-line no-console
            console.log("GitHub saved:", data);
            setShowGithub(false);
          }}
          onClose={() => setShowGithub(false)}
        />
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Harness />);
