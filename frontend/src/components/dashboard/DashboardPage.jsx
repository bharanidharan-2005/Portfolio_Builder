import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Sparkles,
  ExternalLink,
  Trash2,
  FolderOpen,
  Globe,
  Lock,
  Layers,
  Activity,
  Sun,
  Moon,
  LogOut,
  FileUp,
  User,
  Check,
  Copy,
  RefreshCw,
} from "lucide-react";
import { API } from "../../api";
import { useAppContext } from "../../context/AppContext";
import { CAREER_TRACKS, FRONTPAGE_LAYOUTS } from "../../utils/templatesCatalog";
import { notify } from "../../toast";
import {
  Button,
  Badge,
  Card,
  Modal,
  ConfirmDialog,
  EmptyState,
  CardSkeleton,
} from "../ui";

const AVATAR_CHOICES = ["👨‍💻", "👩‍💻", "🚀", "🎨", "🧠", "⚡", "🎓", "🔬"];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { userData, setUserData, themeMode, toggleTheme, logout } = useAppContext();

  const [portfolios, setPortfolios] = useState([]);
  const [usage, setUsage] = useState({
    total_portfolios: 0,
    published_portfolios: 0,
    total_ai_actions: 0,
    recent_ai_logs: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Create form
  const [newTitle, setNewTitle] = useState("");
  const [selectedTrack, setSelectedTrack] = useState(CAREER_TRACKS[0].id);
  const [selectedLayout, setSelectedLayout] = useState(CAREER_TRACKS[0].frontpageTemplate);
  const [creating, setCreating] = useState(false);
  const [openResumeAfterCreate, setOpenResumeAfterCreate] = useState(false);

  // Account settings form
  const [profileName, setProfileName] = useState(userData?.name || "");
  const [profileAvatar, setProfileAvatar] = useState(userData?.avatar || "👨‍💻");
  const [savingProfile, setSavingProfile] = useState(false);

  const loadDashboard = useCallback(async () => {
    setError("");
    try {
      const res = await API.get("portfolios/");
      setPortfolios(res.data?.portfolios || []);
      if (res.data?.usage) {
        setUsage(res.data.usage);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not load your portfolios. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    API.get("portfolios/")
      .then((res) => {
        if (cancelled) return;
        setPortfolios(res.data?.portfolios || []);
        if (res.data?.usage) {
          setUsage(res.data.usage);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err.response?.data?.error ||
            "Could not load your portfolios. Please check your connection and try again."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleTrackSelect = (trackId) => {
    setSelectedTrack(trackId);
    const track = CAREER_TRACKS.find((t) => t.id === trackId);
    if (track) {
      setSelectedLayout(track.frontpageTemplate);
    }
  };

  const handleCreatePortfolio = async (e) => {
    e.preventDefault();
    setCreating(true);
    const track = CAREER_TRACKS.find((t) => t.id === selectedTrack) || CAREER_TRACKS[0];
    try {
      const res = await API.post("portfolios/", {
        title: newTitle.trim() || `${track.label} Portfolio`,
        career_track: selectedTrack,
        frontpage_template: selectedLayout,
        owner_name: userData?.name || "Developer",
      });
      const created = res.data;
      notify("Portfolio workspace created.", "success");
      setCreateOpen(false);
      setNewTitle("");
      const suffix = openResumeAfterCreate ? "?importResume=1" : "";
      navigate(`/workspace/${created.id}${suffix}`);
    } catch (err) {
      notify(err.response?.data?.error || "Failed to create portfolio.", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenWorkspace = async (portfolio) => {
    try {
      if (!portfolio.is_active) {
        await API.patch(`portfolios/${portfolio.id}/`, { is_active: true });
      }
    } catch {
      // Fallback safely; WorkspaceProvider also accepts portfolioId
    }
    navigate(`/workspace/${portfolio.id}`);
  };

  const handleTogglePublish = async (portfolio) => {
    const nextState = !portfolio.is_published;
    try {
      const res = await API.patch(`portfolios/${portfolio.id}/`, {
        is_published: nextState,
      });
      setPortfolios((prev) =>
        prev.map((item) => (item.id === portfolio.id ? res.data : item))
      );
      setUsage((prev) => ({
        ...prev,
        published_portfolios: Math.max(
          0,
          (prev.published_portfolios || 0) + (nextState ? 1 : -1)
        ),
      }));
      notify(
        nextState
          ? "Portfolio is now published and publicly viewable."
          : "Portfolio reverted to private draft.",
        "success"
      );
    } catch (err) {
      notify(err.response?.data?.error || "Failed to update visibility.", "error");
    }
  };

  const handleDeletePortfolio = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await API.delete(`portfolios/${deleteTarget.id}/`);
      notify(`Deleted "${deleteTarget.title}".`, "success");
      setDeleteTarget(null);
      await loadDashboard();
    } catch (err) {
      notify(err.response?.data?.error || "Failed to delete portfolio.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await API.patch("user/profile/", {
        name: profileName.trim(),
        avatar: profileAvatar,
      });
      setUserData((prev) => ({
        ...prev,
        name: res.data?.name || profileName.trim(),
        avatar: res.data?.avatar || profileAvatar,
      }));
      notify("Account settings saved.", "success");
      setAccountOpen(false);
    } catch (err) {
      notify(err.response?.data?.error || "Failed to save profile.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const copyWorkspaceKey = async () => {
    if (!userData?.code) return;
    try {
      await navigator.clipboard.writeText(userData.code);
      notify("Workspace code copied to clipboard.", "success");
    } catch {
      notify("Could not copy automatically.", "error");
    }
  };

  const getPublicUrl = (portfolio) => {
    const ownerUsername = userData?.email?.split("@")?.[0] || "me";
    if (portfolio.published_url) return portfolio.published_url;
    return `${window.location.origin}/preview/${encodeURIComponent(
      ownerUsername
    )}?portfolio=${encodeURIComponent(portfolio.slug || portfolio.id)}`;
  };

  return (
    <div className="min-h-screen bg-[var(--color-canvas-bg)] text-[var(--text-primary)]">
      {/* Top Workspace Bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--surface-panel)]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img
              src="/logo.png"
              alt="AuraBuild Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-sm sm:text-base tracking-tight truncate">
                  AuraBuild
                </span>
                <Badge tone="accent" className="hidden sm:inline-flex">Dashboard</Badge>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] truncate hidden sm:block">
                {userData?.email || "Authenticated Workspace"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="px-2 sm:px-3"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              icon={
                themeMode === "light" ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )
              }
            >
              <span className="hidden md:inline">
                {themeMode === "light" ? "Dark" : "Light"}
              </span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="px-2 sm:px-3"
              onClick={() => {
                setProfileName(userData?.name || "");
                setProfileAvatar(userData?.avatar || "👨‍💻");
                setAccountOpen(true);
              }}
              aria-label="Account Settings"
              icon={<User className="w-3.5 h-3.5" />}
            >
              <span className="hidden sm:inline">Account</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              className="px-2.5 sm:px-3"
              onClick={() => {
                setOpenResumeAfterCreate(false);
                setCreateOpen(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              <span className="sm:hidden">New</span>
              <span className="hidden sm:inline">New Portfolio</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="px-2 sm:px-3"
              onClick={logout}
              aria-label="Log out"
              icon={<LogOut className="w-4 h-4" />}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Welcome & Quick Actions */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Workspace Overview
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 break-words">
              Welcome back, {userData?.name || "Developer"}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Manage your portfolios, switch career templates, import resumes, and control public publishing.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 w-full md:w-auto">
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:w-auto px-3 sm:px-4 text-xs sm:text-sm"
              onClick={() => {
                setOpenResumeAfterCreate(true);
                setCreateOpen(true);
              }}
              icon={<FileUp className="w-4 h-4" />}
            >
              Import Resume
            </Button>
            {portfolios[0] && (
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto px-3 sm:px-4 text-xs sm:text-sm"
                onClick={() => handleOpenWorkspace(portfolios[0])}
                icon={<FolderOpen className="w-4 h-4" />}
              >
                Continue Editing
              </Button>
            )}
          </div>
        </section>

        {/* Real Usage Stats (100% backed by /api/portfolios/) */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Total Portfolios
              </p>
              <p className="text-2xl font-bold mt-1">
                {usage.total_portfolios ?? portfolios.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/12 text-indigo-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </Card>

          <Card className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Live Published Sites
              </p>
              <p className="text-2xl font-bold mt-1">
                {usage.published_portfolios ??
                  portfolios.filter((p) => p.is_published).length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/12 text-emerald-400 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
          </Card>

          <Card className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">
                AI Operations Logged
              </p>
              <p className="text-2xl font-bold mt-1">
                {usage.total_ai_actions ?? 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/12 text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </Card>
        </section>

        {/* Recent Portfolios Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Your Portfolios</h2>
            <Button
              variant="ghost"
              size="xs"
              onClick={loadDashboard}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : error ? (
            <EmptyState
              title="Unable to load portfolios"
              description={error}
              action={
                <Button variant="primary" size="sm" onClick={loadDashboard}>
                  Retry
                </Button>
              }
            />
          ) : portfolios.length === 0 ? (
            <EmptyState
              icon={<Layers className="w-6 h-6" />}
              title="Create your first portfolio"
              description="Start from a tailored career-path template or import a PDF/DOCX resume to populate sections automatically."
              action={
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setCreateOpen(true)}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Create Portfolio
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolios.map((p) => {
                const trackMeta =
                  CAREER_TRACKS.find((t) => t.id === p.career_track) ||
                  CAREER_TRACKS[0];
                const layoutMeta =
                  FRONTPAGE_LAYOUTS.find((l) => l.id === p.frontpage_template) ||
                  FRONTPAGE_LAYOUTS[0];
                const updatedLabel = p.updated_at
                  ? new Date(p.updated_at).toLocaleDateString()
                  : "Recently";

                return (
                  <Card key={p.id} className="flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-base truncate">
                            {p.title || "Untitled Portfolio"}
                          </h3>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            {trackMeta.label} · {layoutMeta.name}
                          </p>
                        </div>
                        <Badge
                          tone={p.is_published ? "success" : "neutral"}
                          dot={true}
                        >
                          {p.is_published ? "Published" : "Draft"}
                        </Badge>
                      </div>

                      {/* Completion progress */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-1">
                          <span>Profile Completeness</span>
                          <span className="font-semibold text-[var(--text-primary)]">
                            {p.completeness ?? 0}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[var(--surface-hover)] overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, p.completeness ?? 0)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1">
                        <span>
                          {p.pages_count || 1} page{(p.pages_count || 1) === 1 ? "" : "s"} ·{" "}
                          {p.sections_count || 0} sections
                        </span>
                        <span>Updated {updatedLabel}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--border-subtle)]">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenWorkspace(p)}
                        icon={<FolderOpen className="w-3.5 h-3.5" />}
                      >
                        Open Editor
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleTogglePublish(p)}
                        title={
                          p.is_published
                            ? "Set back to private draft"
                            : "Publish portfolio URL"
                        }
                        icon={
                          p.is_published ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Globe className="w-3.5 h-3.5" />
                          )
                        }
                      >
                        {p.is_published ? "Unpublish" : "Publish"}
                      </Button>

                      {p.is_published && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getPublicUrl(p), "_blank", "noopener,noreferrer")}
                          aria-label="Open published URL"
                          icon={<ExternalLink className="w-3.5 h-3.5" />}
                        />
                      )}

                      {portfolios.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(p)}
                          aria-label={`Delete ${p.title}`}
                          className="text-rose-400 hover:text-rose-300"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                        />
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Career Track Template Starter Strip */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              Start From a Career Template
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Every template shares the same structured data model so you can switch themes or layouts without losing content.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CAREER_TRACKS.map((track) => (
              <Card
                key={track.id}
                interactive
                padding="p-4"
                onClick={() => {
                  handleTrackSelect(track.id);
                  setNewTitle(`${track.label} Portfolio`);
                  setOpenResumeAfterCreate(false);
                  setCreateOpen(true);
                }}
                className="flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-indigo-400">
                      {track.category}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: track.palette.primary }}
                    />
                  </div>
                  <h3 className="font-bold text-sm mt-1">{track.label}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                    {track.summary}
                  </p>
                </div>
                <span className="text-xs font-semibold text-indigo-400 pt-1">
                  Use template →
                </span>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent AI Activity Log (only if non-empty, real DB logs) */}
        {usage.recent_ai_logs?.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Recent AI Activity
            </h2>
            <Card padding="p-0" className="divide-y divide-[var(--border-subtle)] overflow-hidden">
              {usage.recent_ai_logs.slice(0, 5).map((log, idx) => (
                <div
                  key={log.id || idx}
                  className="px-4 py-3 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {log.prompt || "AI refinement action"}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {log.action_type} · {log.section_title || "Workspace"}
                    </p>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)] shrink-0">
                    {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : ""}
                  </span>
                </div>
              ))}
            </Card>
          </section>
        )}
      </main>

      {/* Create Portfolio Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => !creating && setCreateOpen(false)}
        title="Create New Portfolio"
        subtitle="Choose a career track and layout structure to initialize your workspace."
        size="lg"
      >
        <form onSubmit={handleCreatePortfolio} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold mb-1.5">
              Portfolio Name
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Full-Stack Engineering 2026"
              className="w-full h-10 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2">
              Career Path Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {CAREER_TRACKS.map((track) => {
                const active = selectedTrack === track.id;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => handleTrackSelect(track.id)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      active
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-[var(--border-subtle)] hover:border-indigo-500/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs">{track.label}</span>
                      {active && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2">
                      {track.summary}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2">
              Frontpage Layout ({FRONTPAGE_LAYOUTS.length} layouts)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
              {FRONTPAGE_LAYOUTS.map((layout) => {
                const active = selectedLayout === layout.id;
                return (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => setSelectedLayout(layout.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-[var(--border-subtle)] hover:border-indigo-500/40"
                    }`}
                  >
                    <p className="text-xs font-semibold truncate">{layout.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {layout.tag}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={openResumeAfterCreate}
              onChange={(e) => setOpenResumeAfterCreate(e.target.checked)}
              className="rounded border-[var(--border-subtle)]"
            />
            Launch AI Resume Parser right after opening workspace
          </label>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={creating}>
              Create & Open Editor
            </Button>
          </div>
        </form>
      </Modal>

      {/* Account Settings Modal */}
      <Modal
        isOpen={accountOpen}
        onClose={() => !savingProfile && setAccountOpen(false)}
        title="Account Settings"
        subtitle="Manage your creator profile and workspace access code."
        size="md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Avatar</label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_CHOICES.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setProfileAvatar(emoji)}
                  className={`w-10 h-10 rounded-xl border text-lg flex items-center justify-center cursor-pointer transition-all ${
                    profileAvatar === emoji
                      ? "border-indigo-500 bg-indigo-500/15 scale-105"
                      : "border-[var(--border-subtle)] hover:border-indigo-500/40"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">Email</label>
            <input
              type="email"
              value={userData?.email || ""}
              readOnly
              className="w-full h-10 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-hover)] text-sm text-[var(--text-muted)]"
            />
          </div>

          {userData?.code && (
            <div>
              <label className="block text-xs font-semibold mb-1.5">
                Workspace Access Code
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 h-10 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-xs font-mono flex items-center select-all">
                  {userData.code}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={copyWorkspaceKey}
                  icon={<Copy className="w-3.5 h-3.5" />}
                >
                  Copy
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAccountOpen(false)}
              disabled={savingProfile}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={savingProfile}>
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDeletePortfolio}
        title="Delete Portfolio"
        message={`Permanently delete "${deleteTarget?.title || ""}" and all of its pages and sections? This cannot be undone.`}
        confirmLabel="Delete Portfolio"
        loading={deleting}
      />
    </div>
  );
}
