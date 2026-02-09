import { useEffect, useMemo, useState } from "react";

const THEMES = [
  "light","dark","cupcake","bumblebee","emerald","corporate","synthwave","retro",
  "cyberpunk","valentine","halloween","garden","forest","aqua","lofi","pastel",
  "fantasy","wireframe","black","luxury","dracula","cmyk","autumn","business",
  "acid","lemonade","night","coffee","winter",
];

function Settings() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme"));
  const [search, setSearch] = useState("");

  // Apply globally
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const filteredThemes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return THEMES;
    return THEMES.filter((t) => t.toLowerCase().includes(q));
  }, [search]);

  const resetTheme = () => setTheme("light");

  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl md:text-3xl font-bold">⚙️ Settings</h2>
              <div className="badge badge-outline">Current: {theme}</div>
            </div>

            {/* Preview strip */}
            <div className="mt-4 rounded-2xl border border-base-300 bg-base-200 p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <button className="btn btn-primary">Primary</button>
                <button className="btn">Default</button>
                <button className="btn btn-outline">Outline</button>
                <span className="badge badge-success">Badge</span>
                <span className="badge badge-warning">Warning</span>
                <span className="badge badge-error">Error</span>
              </div>
              <p className="mt-3 text-sm opacity-80">
                Tap a theme below to apply it instantly.
              </p>
            </div>

            {/* Search + actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <label className="input input-bordered flex items-center gap-2 w-full sm:max-w-sm">
                <input
                  type="text"
                  className="grow"
                  placeholder="Search themes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <span className="opacity-60 text-sm">{filteredThemes.length}</span>
              </label>

              <button className="btn btn-ghost" onClick={resetTheme}>
                Reset to light
              </button>
            </div>

            {/* Theme grid */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredThemes.map((t) => {
                const active = t === theme;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`btn justify-start ${
                      active ? "btn-primary" : "btn-outline"
                    }`}
                    title={`Apply ${t}`}
                  >
                    <span className="truncate">{t}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
