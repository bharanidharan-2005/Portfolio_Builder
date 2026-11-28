import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  CreditCard,
  Database,
  Download,
  Eye,
  FileText,
  Layers,
  LogOut,
  Moon,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { API } from "../../api";
import { useAppContext } from "../../context/AppContext";
import { notify } from "../../toast";
import { Badge, Button, Card, ConfirmDialog, EmptyState, Modal } from "../ui";

const RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "all", label: "All Time" },
];

const ADMIN_TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "analytics", label: "Features & Engagement", icon: Activity },
  { id: "ai", label: "AI Usage & Cost", icon: Sparkles },
  { id: "revenue", label: "Plans & Revenue", icon: CreditCard },
  { id: "health", label: "Health & Audit Logs", icon: Server },
];

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function formatDuration(totalSeconds) {
  const sec = Math.max(0, Math.round(Number(totalSeconds) || 0));
  if (sec === 0) return "0m";
  if (sec < 60) return `${sec}s`;
  const mins = Math.floor(sec / 60);
  const remSec = sec % 60;
  if (mins < 60) return remSec > 0 ? `${mins}m ${remSec}s` : `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { userData, themeMode, toggleTheme, logout } = useAppContext();

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const requested = new URLSearchParams(window.location.search).get("tab");
      return ADMIN_TABS.some((t) => t.id === requested) ? requested : "overview";
    } catch {
      return "overview";
    }
  });
  const [dateRange, setDateRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tab datasets (real API responses only)
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [aiUsage, setAiUsage] = useState(null);
  const [health, setHealth] = useState(null);
  const [auditLogs, setAuditLogs] = useState({ results: [], count: 0, page: 1, total_pages: 1 });

  // Users directory state
  const [usersData, setUsersData] = useState({ results: [], count: 0, page: 1, total_pages: 1 });
  const [userSearch, setUserSearch] = useState("");
  const [userPlan, setUserPlan] = useState("all");
  const [userStatus, setUserStatus] = useState("all");
  const [userSort, setUserSort] = useState("recent_active");
  const [userDateFrom, setUserDateFrom] = useState("");
  const [userDateTo, setUserDateTo] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [exportingCsv, setExportingCsv] = useState(false);

  // User detail drawer/modal
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingUserAction, setSavingUserAction] = useState(false);
  const [confirmSuspendUser, setConfirmSuspendUser] = useState(null);

  const loadUsers = useCallback(async (pageOverride = null) => {
    const params = {
      search: userSearch.trim() || undefined,
      plan: userPlan,
      status: userStatus,
      sort: userSort,
      date_from: userDateFrom || undefined,
      date_to: userDateTo || undefined,
      page: pageOverride || userPage,
      page_size: 15,
    };
    const res = await API.get("admin/users/", { params });
    setUsersData(res.data);
  }, [userSearch, userPlan, userStatus, userSort, userDateFrom, userDateTo, userPage]);

  const loadAllAdminData = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const [ovRes, anRes, aiRes, hRes, audRes, usrRes] = await Promise.all([
        API.get("admin/overview/", { params: { range: dateRange } }),
        API.get("admin/analytics/", { params: { range: dateRange } }),
        API.get("admin/ai-usage/", { params: { range: dateRange } }),
        API.get("admin/system-health/"),
        API.get("admin/audit-logs/", { params: { page: 1 } }),
        API.get("admin/users/", { params: { page: 1, page_size: 15, sort: "recent_active" } }),
      ]);
      setOverview(ovRes.data);
      setAnalytics(anRes.data);
      setAiUsage(aiRes.data);
      setHealth(hRes.data);
      setAuditLogs(audRes.data);
      setUsersData(usrRes.data);
      setUserPage(1);
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        setError("Administrator privileges (is_staff) are required to view this console.");
      } else {
        setError(err.response?.data?.error || "Failed to load admin analytics from backend.");
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      API.get("admin/overview/", { params: { range: dateRange } }),
      API.get("admin/analytics/", { params: { range: dateRange } }),
      API.get("admin/ai-usage/", { params: { range: dateRange } }),
      API.get("admin/system-health/"),
      API.get("admin/audit-logs/", { params: { page: 1 } }),
      API.get("admin/users/", { params: { page: 1, page_size: 15, sort: "recent_active" } }),
    ])
      .then(([ovRes, anRes, aiRes, hRes, audRes, usrRes]) => {
        if (cancelled) return;
        setError("");
        setOverview(ovRes.data);
        setAnalytics(anRes.data);
        setAiUsage(aiRes.data);
        setHealth(hRes.data);
        setAuditLogs(audRes.data);
        setUsersData(usrRes.data);
        setUserPage(1);
      })
      .catch((err) => {
        if (cancelled) return;
        const status = err.response?.status;
        if (status === 403) {
          setError("Administrator privileges (is_staff) are required to view this console.");
        } else {
          setError(err.response?.data?.error || "Failed to load admin analytics from backend.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange]);

  const handleOpenUserDetail = async (userId) => {
    setSelectedUserId(userId);
    setUserDetail(null);
    setLoadingDetail(true);
    try {
      const res = await API.get(`admin/users/${userId}/`);
      setUserDetail(res.data);
    } catch (err) {
      notify(err.response?.data?.error || "Could not load user details.", "error");
      setSelectedUserId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdateUser = async (targetId, payload) => {
    setSavingUserAction(true);
    try {
      const res = await API.patch(`admin/users/${targetId}/`, payload);
      notify("User account updated.", "success");
      await Promise.all([
        loadUsers(userPage),
        API.get("admin/audit-logs/", { params: { page: 1 } }).then((r) => setAuditLogs(r.data)),
      ]);
      if (selectedUserId === targetId && res.data?.user) {
        setUserDetail((prev) =>
          prev
            ? {
                ...prev,
                user: { ...prev.user, ...res.data.user },
              }
            : prev
        );
      }
    } catch (err) {
      notify(err.response?.data?.error || "Action rejected by server.", "error");
    } finally {
      setSavingUserAction(false);
      setConfirmSuspendUser(null);
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      const res = await API.get("admin/users/export/", {
        params: {
          search: userSearch.trim() || undefined,
          plan: userPlan,
          status: userStatus,
          date_from: userDateFrom || undefined,
          date_to: userDateTo || undefined,
        },
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "aurabuild-users.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify("Exported users CSV.", "success");
      const audRes = await API.get("admin/audit-logs/", { params: { page: 1 } });
      setAuditLogs(audRes.data);
    } catch (err) {
      notify(err.response?.data?.error || "Failed to export CSV.", "error");
    } finally {
      setExportingCsv(false);
    }
  };

  const dailyTrends = overview?.daily_trends || [];
  const maxTrendValue = Math.max(
    1,
    ...dailyTrends.map((d) =>
      Math.max(
        d.registrations || 0,
        d.active_users || 0,
        d.ai_requests || 0,
        d.portfolios_created || 0,
        d.duration_minutes || 0
      )
    )
  );

  return (
    <div className="min-h-screen bg-[var(--color-canvas-bg)] text-[var(--text-primary)]">
      {/* Top Admin Navigation */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--surface-panel)]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img src="/logo.png" alt="AuraBuild Logo" className="w-8 h-8 object-contain shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-sm sm:text-base tracking-tight truncate">AuraBuild</span>
                <Badge tone="accent">Admin Console</Badge>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] truncate hidden sm:block">
                {userData?.email || "Staff Administrator"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              aria-label="Analytics date range"
              className="h-8 px-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-xs font-medium focus:outline-none focus:border-indigo-500"
            >
              {RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              onClick={loadAllAdminData}
              aria-label="Refresh analytics"
              icon={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
            />

            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              icon={themeMode === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            />

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/dashboard")}
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              <span className="hidden sm:inline">Workspace</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              onClick={logout}
              aria-label="Log out"
              icon={<LogOut className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Sub-nav Tabs */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 border-t border-[var(--border-subtle)] flex items-center gap-1 overflow-x-auto custom-scrollbar py-1.5">
          {ADMIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {error ? (
          <EmptyState
            icon={<ShieldAlert className="w-6 h-6 text-rose-400" />}
            title="Admin Access Error"
            description={error}
            action={
              <Button variant="primary" size="sm" onClick={() => navigate("/dashboard")}>
                Return to Dashboard
              </Button>
            }
          />
        ) : (
          <>
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && overview && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <p className="text-xs text-[var(--text-muted)]">Registered Users</p>
                    <p className="text-2xl font-bold mt-1">{overview.users.total}</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      +{overview.users.new_today} today · +{overview.users.new_this_week} 7d · +{overview.users.new_this_month} 30d
                    </p>
                  </Card>

                  <Card>
                    <p className="text-xs text-[var(--text-muted)]">Active Users (DAU / WAU / MAU)</p>
                    <p className="text-2xl font-bold mt-1">
                      {overview.users.dau} / {overview.users.wau} / {overview.users.mau}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      Unique users with qualifying workspace events
                    </p>
                  </Card>

                  <Card>
                    <p className="text-xs text-[var(--text-muted)]">Platform Usage (AI / Portfolios)</p>
                    <p className="text-2xl font-bold mt-1">
                      {overview.portfolios.total} <span className="text-sm font-medium text-[var(--text-muted)]">sites</span> · {overview.ai.total_requests} <span className="text-sm font-medium text-[var(--text-muted)]">AI</span>
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      {overview.portfolios.published} published · {overview.ai.successful_requests} AI ok · {overview.resume_uploads} resumes
                    </p>
                  </Card>

                  <Card>
                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Duration of Use
                    </p>
                    <p className="text-2xl font-bold mt-1">
                      {formatDuration(overview.usage_duration?.total_seconds)}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      Avg {formatDuration(overview.usage_duration?.avg_session_seconds)} / session · {overview.usage_duration?.total_sessions || 0} sessions
                    </p>
                  </Card>
                </div>

                {/* Daily Activity Bar Chart */}
                <Card className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-bold">Usage &amp; Activity Timeline (Last {dailyTrends.length} Days)</h2>
                      <p className="text-xs text-[var(--text-muted)]">
                        {overview.definitions?.active_user}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] text-[var(--text-muted)]">
                      <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> Active Users</span>
                      <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" /> AI Requests</span>
                      <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Registrations</span>
                      <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Duration (min)</span>
                    </div>
                  </div>

                  {dailyTrends.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)]">No activity recorded in this window yet.</p>
                  ) : (
                    <div className="w-full overflow-x-auto custom-scrollbar pb-2">
                      <div className="flex items-end gap-1.5 h-44 min-w-[540px] pt-4">
                        {dailyTrends.map((row) => (
                          <div
                            key={row.date}
                            className="flex-1 flex flex-col items-center gap-1 group"
                            title={`${row.date}: ${row.active_users} active, ${row.ai_requests} AI, ${row.registrations} signups, ${row.duration_minutes || 0}m usage`}
                          >
                            <div className="w-full h-32 flex items-end justify-center gap-0.5">
                              <div
                                className="w-1/4 bg-indigo-500/85 rounded-t"
                                style={{ height: `${Math.max(4, Math.round(((row.active_users || 0) / maxTrendValue) * 100))}%` }}
                              />
                              <div
                                className="w-1/4 bg-cyan-500/85 rounded-t"
                                style={{ height: `${Math.max(4, Math.round(((row.ai_requests || 0) / maxTrendValue) * 100))}%` }}
                              />
                              <div
                                className="w-1/4 bg-emerald-500/85 rounded-t"
                                style={{ height: `${Math.max(4, Math.round(((row.registrations || 0) / maxTrendValue) * 100))}%` }}
                              />
                              <div
                                className="w-1/4 bg-amber-500/85 rounded-t"
                                style={{ height: `${Math.max(4, Math.round(((row.duration_minutes || 0) / maxTrendValue) * 100))}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-mono text-[var(--text-muted)]">{row.date.slice(5)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Live Platform Timeline & Recent Usage Sessions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-sm font-bold flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-400" />
                        User Activity Timeline
                      </h2>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        Latest {overview.recent_timeline?.length || 0} events
                      </span>
                    </div>
                    {(overview.recent_timeline || []).length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] py-4">No platform activity recorded in this window yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1 text-xs">
                        {overview.recent_timeline.map((ev) => (
                          <div key={ev.id} className="flex items-start justify-between gap-3 p-2.5 rounded-xl border border-[var(--border-subtle)]">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono font-semibold">{ev.event_name}</span>
                                <Badge tone={ev.status === "failed" ? "danger" : "neutral"}>{ev.feature_name}</Badge>
                              </div>
                              <div className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
                                {ev.user_id ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenUserDetail(ev.user_id)}
                                    className="text-indigo-400 hover:underline cursor-pointer"
                                  >
                                    {ev.user_email || ev.user_name}
                                  </button>
                                ) : (
                                  <span>{ev.user_name || "Anonymous"}</span>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap shrink-0">
                              {formatDateTime(ev.timestamp)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  <Card className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-sm font-bold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        Recent Usage Sessions &amp; Duration
                      </h2>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        Active visible time
                      </span>
                    </div>
                    {(overview.recent_sessions || []).length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] py-4">
                        No tracked sessions yet. Duration starts recording automatically when users sign in.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1 text-xs">
                        {overview.recent_sessions.map((sess) => (
                          <div key={sess.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-[var(--border-subtle)]">
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => sess.user_id && handleOpenUserDetail(sess.user_id)}
                                className="font-semibold text-indigo-400 hover:underline truncate block cursor-pointer"
                              >
                                {sess.user_email || sess.user_name}
                              </button>
                              <p className="text-[11px] text-[var(--text-muted)] truncate">
                                Route: <span className="font-mono">{sess.last_path || "/"}</span> · Last seen {formatDateTime(sess.last_seen_at)}
                              </p>
                            </div>
                            <Badge tone="accent">{formatDuration(sess.duration_seconds)}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>

                {/* Plan Distribution Summary */}
                <Card className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Free Users</p>
                    <p className="text-xl font-bold mt-1">{overview.monetization.free_users}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Pro Plan</p>
                    <p className="text-xl font-bold mt-1">{overview.monetization.pro_users}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Premium Plan</p>
                    <p className="text-xl font-bold mt-1">{overview.monetization.premium_users}</p>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB 2: USER MANAGEMENT */}
            {activeTab === "users" && (
              <div className="space-y-4">
                <Card className="space-y-3">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setUserPage(1);
                      loadUsers(1);
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5"
                  >
                    <div className="relative lg:col-span-2">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full h-9 pl-8 pr-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <select
                      value={userPlan}
                      onChange={(e) => setUserPlan(e.target.value)}
                      className="h-9 px-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-xs"
                    >
                      <option value="all">All Plans</option>
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="premium">Premium</option>
                    </select>
                    <select
                      value={userStatus}
                      onChange={(e) => setUserStatus(e.target.value)}
                      className="h-9 px-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-xs"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                    <select
                      value={userSort}
                      onChange={(e) => setUserSort(e.target.value)}
                      className="h-9 px-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-xs"
                    >
                      <option value="recent_active">Sort: Recent Active</option>
                      <option value="usage_duration">Sort: Longest Usage</option>
                      <option value="newest">Sort: Newest Joined</option>
                      <option value="portfolios">Sort: Most Portfolios</option>
                      <option value="ai_usage">Sort: Most AI Calls</option>
                    </select>
                    <Button type="submit" variant="primary" size="sm">
                      Apply Filters
                    </Button>
                  </form>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[var(--text-muted)]">Joined:</span>
                      <input
                        type="date"
                        value={userDateFrom}
                        onChange={(e) => setUserDateFrom(e.target.value)}
                        aria-label="Joined from date"
                        className="h-8 px-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-xs"
                      />
                      <span className="text-[var(--text-muted)]">to</span>
                      <input
                        type="date"
                        value={userDateTo}
                        onChange={(e) => setUserDateTo(e.target.value)}
                        aria-label="Joined to date"
                        className="h-8 px-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-xs"
                      />
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={exportingCsv}
                      onClick={handleExportCsv}
                      icon={<Download className="w-3.5 h-3.5" />}
                    >
                      Export CSV ({usersData.count})
                    </Button>
                  </div>
                </Card>

                <Card padding="p-0" className="overflow-hidden">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-panel)] text-[var(--text-muted)]">
                          <th className="py-3 px-4 font-semibold">ID</th>
                          <th className="py-3 px-4 font-semibold">User</th>
                          <th className="py-3 px-4 font-semibold">Registered</th>
                          <th className="py-3 px-4 font-semibold">Last Active</th>
                          <th className="py-3 px-4 font-semibold">Duration</th>
                          <th className="py-3 px-4 font-semibold">Plan</th>
                          <th className="py-3 px-4 font-semibold">Portfolios</th>
                          <th className="py-3 px-4 font-semibold">AI Calls</th>
                          <th className="py-3 px-4 font-semibold">Status</th>
                          <th className="py-3 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {(usersData.results || []).length === 0 ? (
                          <tr>
                            <td colSpan="10" className="py-8 text-center text-[var(--text-muted)]">
                              No users match your current filter criteria.
                            </td>
                          </tr>
                        ) : (
                          usersData.results.map((u) => (
                            <tr key={u.id} className="hover:bg-[var(--surface-hover)]/50 transition-colors">
                              <td className="py-3 px-4 font-mono text-[var(--text-muted)]">#{u.id}</td>
                              <td className="py-3 px-4">
                                <div className="font-semibold flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {u.is_staff && <Badge tone="accent">Staff</Badge>}
                                </div>
                                <div className="text-[11px] text-[var(--text-muted)]">{u.email}</div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">{formatDate(u.date_joined)}</td>
                              <td className="py-3 px-4 whitespace-nowrap">{formatDate(u.last_active_at)}</td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="font-semibold">{formatDuration(u.total_duration_seconds)}</span>{" "}
                                <span className="text-[var(--text-muted)]">({u.sessions_count || 0})</span>
                              </td>
                              <td className="py-3 px-4 uppercase font-semibold">{u.plan}</td>
                              <td className="py-3 px-4">
                                {u.portfolios_count} <span className="text-[var(--text-muted)]">({u.published_count} live)</span>
                              </td>
                              <td className="py-3 px-4">{u.ai_requests_count}</td>
                              <td className="py-3 px-4">
                                <Badge tone={u.is_active ? "success" : "danger"} dot>
                                  {u.is_active ? "Active" : "Suspended"}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => handleOpenUserDetail(u.id)}
                                  icon={<Eye className="w-3.5 h-3.5" />}
                                >
                                  Details
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  disabled={savingUserAction}
                                  className={u.is_active ? "text-rose-400" : "text-emerald-400"}
                                  onClick={() => setConfirmSuspendUser(u)}
                                  icon={u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                >
                                  {u.is_active ? "Suspend" : "Activate"}
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>Showing {usersData.results?.length || 0} of {usersData.count} users</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="xs"
                        disabled={usersData.page <= 1}
                        onClick={() => {
                          const next = Math.max(1, usersData.page - 1);
                          setUserPage(next);
                          loadUsers(next);
                        }}
                      >
                        Prev
                      </Button>
                      <span>Page {usersData.page} / {usersData.total_pages}</span>
                      <Button
                        variant="secondary"
                        size="xs"
                        disabled={usersData.page >= usersData.total_pages}
                        onClick={() => {
                          const next = Math.min(usersData.total_pages, usersData.page + 1);
                          setUserPage(next);
                          loadUsers(next);
                        }}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB 3: FEATURE & ENGAGEMENT ANALYTICS */}
            {activeTab === "analytics" && analytics && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <p className="text-xs text-[var(--text-muted)]">Registration → Portfolio</p>
                    <p className="text-2xl font-bold mt-1">{analytics.engagement.registration_to_portfolio_pct}%</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      {analytics.engagement.users_with_portfolio} created · {analytics.engagement.onboarding_incomplete_users} incomplete
                    </p>
                  </Card>
                  <Card>
                    <p className="text-xs text-[var(--text-muted)]">Active vs Inactive ({analytics.range})</p>
                    <p className="text-2xl font-bold mt-1">
                      {analytics.engagement.active_users} / {analytics.engagement.inactive_users}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      Active users in window vs inactive accounts
                    </p>
                  </Card>
                  <Card>
                    <p className="text-xs text-[var(--text-muted)]">New vs Returning Active</p>
                    <p className="text-2xl font-bold mt-1">
                      {analytics.engagement.new_active_users} / {analytics.engagement.returning_active_users}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      Joined during window vs returning
                    </p>
                  </Card>
                  <Card>
                    <p className="text-xs text-[var(--text-muted)]">Avg Login Sessions / Active User</p>
                    <p className="text-2xl font-bold mt-1">{analytics.engagement.avg_sessions_per_active_user}</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      Based on recorded authentication events
                    </p>
                  </Card>
                </div>

                <Card className="space-y-4">
                  <h2 className="text-sm font-bold">Feature Adoption &amp; Reliability Breakdown</h2>
                  <div className="space-y-3">
                    {(analytics.features || []).map((f) => (
                      <div key={f.feature_key} className="space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-semibold">{f.label}</span>
                          <span className="text-[var(--text-muted)]">
                            {f.total_events} events · {f.unique_users} users ({f.adoption_pct}% adoption) ·{" "}
                            <span className={f.failed_events > 0 ? "text-rose-400 font-semibold" : ""}>
                              {f.failed_events} failed
                            </span>
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-[var(--surface-hover)] overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${Math.min(100, f.adoption_pct || 0)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="space-y-3">
                    <h3 className="text-sm font-bold">Most Popular Frontpage Templates</h3>
                    {(analytics.template_popularity || []).length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)]">No portfolios recorded yet.</p>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {analytics.template_popularity.map((t) => (
                          <div key={t.frontpage_template} className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)] last:border-0">
                            <span className="font-mono">{t.frontpage_template || "template1"}</span>
                            <Badge tone="neutral">{t.count} portfolios</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  <Card className="space-y-3">
                    <h3 className="text-sm font-bold">Career Track Adoption</h3>
                    {(analytics.career_tracks || []).length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)]">No portfolios recorded yet.</p>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {analytics.career_tracks.map((t) => (
                          <div key={t.career_track} className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)] last:border-0">
                            <span>{t.career_track || "software_developer"}</span>
                            <Badge tone="accent">{t.count}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            )}

            {/* TAB 4: AI USAGE & COST ANALYTICS */}
            {activeTab === "ai" && aiUsage && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <p className="text-xs text-[var(--text-muted)]">Total AI Requests</p>
                    <p className="text-2xl font-bold mt-1">{aiUsage.summary.total_requests}</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      {aiUsage.summary.successful_requests} ok · {aiUsage.summary.failed_requests} failed
                    </p>
                  </Card>
                  <Card>
                    <p className="text-xs text-[var(--text-muted)]">AI Credits Consumed</p>
                    <p className="text-2xl font-bold mt-1">{aiUsage.summary.credits_consumed}</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">1 credit per successful generation</p>
                  </Card>
                  <Card>
                    <p className="text-xs text-[var(--text-muted)]">Reported Provider Tokens</p>
                    <p className="text-2xl font-bold mt-1">
                      {aiUsage.summary.total_tokens !== null ? aiUsage.summary.total_tokens.toLocaleString() : "N/A"}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      Only summed when provider supplies usage metadata
                    </p>
                  </Card>
                  <Card>
                    <p className="text-xs text-[var(--text-muted)]">Avg Provider Latency</p>
                    <p className="text-2xl font-bold mt-1">
                      {aiUsage.summary.avg_latency_ms !== null ? `${aiUsage.summary.avg_latency_ms} ms` : "—"}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">Measured server-side</p>
                  </Card>
                </div>

                <Card className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-bold">Requests by Provider &amp; Model</h2>
                    <span className="text-[11px] text-[var(--text-muted)]">{aiUsage.cost_note}</span>
                  </div>
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                          <th className="py-2.5 px-3">Provider</th>
                          <th className="py-2.5 px-3">Model</th>
                          <th className="py-2.5 px-3">Requests</th>
                          <th className="py-2.5 px-3">Success / Fail</th>
                          <th className="py-2.5 px-3">Tokens</th>
                          <th className="py-2.5 px-3">Avg Latency</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {(aiUsage.by_provider || []).length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-6 text-center text-[var(--text-muted)]">
                              No AI calls recorded in this window.
                            </td>
                          </tr>
                        ) : (
                          aiUsage.by_provider.map((row, idx) => (
                            <tr key={idx}>
                              <td className="py-2.5 px-3 font-semibold uppercase">{row.provider}</td>
                              <td className="py-2.5 px-3 font-mono">{row.model_name || "—"}</td>
                              <td className="py-2.5 px-3">{row.requests}</td>
                              <td className="py-2.5 px-3">
                                {row.success} / <span className={row.failed > 0 ? "text-rose-400" : ""}>{row.failed}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                {row.total_tokens !== null ? row.total_tokens.toLocaleString() : "Not reported"}
                              </td>
                              <td className="py-2.5 px-3">
                                {row.avg_latency_ms !== null ? `${Math.round(row.avg_latency_ms)} ms` : "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>

                <Card className="space-y-3">
                  <h3 className="text-sm font-bold">Top Users by AI Consumption</h3>
                  {(aiUsage.top_users || []).length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)]">No user AI activity in this period.</p>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {aiUsage.top_users.map((u) => (
                        <div key={u.user_id} className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)] last:border-0">
                          <div>
                            <span className="font-semibold">{u.user__first_name || u.user__email}</span>{" "}
                            <span className="text-[var(--text-muted)]">({u.user__email})</span>
                          </div>
                          <span>
                            {u.requests} reqs · {u.credits || 0} credits
                            {u.tokens !== null ? ` · ${u.tokens.toLocaleString()} tokens` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* TAB 5: REVENUE & SUBSCRIPTION READINESS */}
            {activeTab === "revenue" && overview && (
              <div className="space-y-4">
                <Card className="border-indigo-500/30 bg-indigo-500/5 space-y-2">
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-400" />
                    Monetization Readiness (Billing Gateway Not Connected)
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Subscription tier entitlements (`free`, `pro`, `premium`) and per-request AI credit accounting are stored in PostgreSQL and enforced server-side. MRR, renewals, cancellations, and refunds will populate automatically once a live billing provider (Stripe / Razorpay webhooks) is integrated in Phase 2 — no placeholder revenue figures are shown.
                  </p>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Card>
                    <p className="text-xs text-[var(--text-muted)]">Free Tier Users</p>
                    <p className="text-2xl font-bold mt-1">{overview.monetization.free_users}</p>
                  </Card>
                  <Card>
                    <p className="text-xs text-[var(--text-muted)]">Pro Tier Users</p>
                    <p className="text-2xl font-bold mt-1">{overview.monetization.pro_users}</p>
                  </Card>
                  <Card>
                    <p className="text-xs text-[var(--text-muted)]">Premium Tier Users</p>
                    <p className="text-2xl font-bold mt-1">{overview.monetization.premium_users}</p>
                  </Card>
                  <Card>
                    <p className="text-xs text-[var(--text-muted)]">MRR (Live Billing)</p>
                    <p className="text-2xl font-bold mt-1 text-[var(--text-muted)]">Not connected</p>
                  </Card>
                </div>
              </div>
            )}

            {/* TAB 6: SYSTEM HEALTH & ADMIN AUDIT LOGS */}
            {activeTab === "health" && (
              <div className="space-y-6">
                {health && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5" /> Database Connectivity
                      </p>
                      <p className="text-lg font-bold mt-1 flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 ${health.database.status === "healthy" ? "text-emerald-400" : "text-rose-400"}`} />
                        {health.database.status}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">
                        Query latency: {health.database.latency_ms ?? "—"} ms
                      </p>
                    </Card>

                    <Card>
                      <p className="text-xs text-[var(--text-muted)]">Cache &amp; Queue</p>
                      <p className="text-lg font-bold mt-1">{health.cache.status}</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">
                        Background tasks: {health.background_queue.mode}
                      </p>
                    </Card>

                    <Card>
                      <p className="text-xs text-[var(--text-muted)]">AI &amp; Email Providers</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge tone={health.providers.gemini_configured ? "success" : "neutral"}>
                          Gemini {health.providers.gemini_configured ? "Ready" : "Unset"}
                        </Badge>
                        <Badge tone={health.providers.groq_configured ? "success" : "neutral"}>
                          Groq {health.providers.groq_configured ? "Ready" : "Unset"}
                        </Badge>
                        <Badge tone={health.providers.email_configured ? "success" : "neutral"}>
                          Email {health.providers.email_configured ? "Ready" : "Unset"}
                        </Badge>
                      </div>
                    </Card>

                    <Card>
                      <p className="text-xs text-[var(--text-muted)]">Failed Events (Last 24h)</p>
                      <p className="text-2xl font-bold mt-1">{health.failed_events_24h}</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">
                        Recorded across server-side endpoints
                      </p>
                    </Card>
                  </div>
                )}

                {health?.recent_ai_failures?.length > 0 && (
                  <Card className="space-y-3">
                    <h3 className="text-sm font-bold">Recent Failed AI Operations (24h)</h3>
                    <div className="space-y-2 text-xs">
                      {health.recent_ai_failures.map((f) => (
                        <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-[var(--border-subtle)] last:border-0">
                          <div>
                            <span className="font-semibold">{f.action_name}</span> ({f.provider})
                            <p className="text-[11px] text-rose-400">{f.error_message}</p>
                          </div>
                          <span className="text-[11px] text-[var(--text-muted)]">{formatDateTime(f.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <Card className="space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Admin Audit Log
                  </h3>
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                          <th className="py-2.5 px-3">Timestamp</th>
                          <th className="py-2.5 px-3">Admin</th>
                          <th className="py-2.5 px-3">Action</th>
                          <th className="py-2.5 px-3">Target User</th>
                          <th className="py-2.5 px-3">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {(auditLogs.results || []).length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-6 text-center text-[var(--text-muted)]">
                              No administrative actions recorded yet.
                            </td>
                          </tr>
                        ) : (
                          auditLogs.results.map((log) => (
                            <tr key={log.id}>
                              <td className="py-2.5 px-3 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                              <td className="py-2.5 px-3">{log.admin_email}</td>
                              <td className="py-2.5 px-3 font-mono">{log.action_type}</td>
                              <td className="py-2.5 px-3">{log.target_email || "—"}</td>
                              <td className="py-2.5 px-3 text-[var(--text-muted)]">{JSON.stringify(log.details || {})}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </main>

      {/* Individual User Detail Modal */}
      <Modal
        isOpen={Boolean(selectedUserId)}
        onClose={() => setSelectedUserId(null)}
        title={userDetail?.user?.name ? `User Profile · ${userDetail.user.name}` : "User Account Details"}
        subtitle={userDetail?.user?.email || ""}
        size="lg"
      >
        {loadingDetail ? (
          <p className="text-xs text-[var(--text-muted)] py-6 text-center">Loading user profile and timeline...</p>
        ) : userDetail ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <Card padding="p-3">
                <p className="text-[var(--text-muted)]">Login Sessions</p>
                <p className="text-lg font-bold mt-0.5">{userDetail.metrics.total_sessions}</p>
              </Card>
              <Card padding="p-3">
                <p className="text-[var(--text-muted)]">Duration of Use</p>
                <p className="text-lg font-bold mt-0.5">{formatDuration(userDetail.metrics.total_duration_seconds)}</p>
                <p className="text-[10px] text-[var(--text-muted)]">Avg {formatDuration(userDetail.metrics.avg_session_seconds)}</p>
              </Card>
              <Card padding="p-3">
                <p className="text-[var(--text-muted)]">Portfolios (Live)</p>
                <p className="text-lg font-bold mt-0.5">
                  {userDetail.metrics.portfolios_count} ({userDetail.metrics.published_portfolios_count})
                </p>
              </Card>
              <Card padding="p-3">
                <p className="text-[var(--text-muted)]">Resumes (Up/Exp)</p>
                <p className="text-lg font-bold mt-0.5">
                  {userDetail.metrics.resume_uploads_count} / {userDetail.metrics.resume_exports_count}
                </p>
              </Card>
              <Card padding="p-3">
                <p className="text-[var(--text-muted)]">AI Reqs / Credits</p>
                <p className="text-lg font-bold mt-0.5">
                  {userDetail.metrics.ai_requests_total} / {userDetail.metrics.ai_credits_used}
                </p>
              </Card>
            </div>

            {/* Admin Account Controls */}
            <Card className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Account Governance
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="flex items-center gap-2">
                  <span>Plan:</span>
                  <select
                    value={userDetail.user.plan}
                    disabled={savingUserAction}
                    onChange={(e) => handleUpdateUser(userDetail.user.id, { plan: e.target.value })}
                    className="h-8 px-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-panel)]"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                  </select>
                </label>

                <Button
                  variant={userDetail.user.is_active ? "secondary" : "primary"}
                  size="xs"
                  disabled={savingUserAction}
                  onClick={() => handleUpdateUser(userDetail.user.id, { is_active: !userDetail.user.is_active })}
                >
                  {userDetail.user.is_active ? "Suspend Account" : "Reactivate Account"}
                </Button>

                <Button
                  variant="ghost"
                  size="xs"
                  disabled={savingUserAction}
                  onClick={() => handleUpdateUser(userDetail.user.id, { is_staff: !userDetail.user.is_staff })}
                  icon={<ShieldCheck className="w-3.5 h-3.5" />}
                >
                  {userDetail.user.is_staff ? "Revoke Staff Role" : "Grant Staff Role"}
                </Button>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Registered: {formatDateTime(userDetail.user.date_joined)} · Last Active: {formatDateTime(userDetail.user.last_active_at)}
              </p>
            </Card>

            {/* User Portfolios */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Portfolios ({userDetail.portfolios.length})
              </h4>
              {userDetail.portfolios.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">No portfolios created yet.</p>
              ) : (
                <div className="space-y-1.5 text-xs">
                  {userDetail.portfolios.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--border-subtle)]">
                      <div>
                        <span className="font-semibold">{p.title}</span>{" "}
                        <span className="text-[var(--text-muted)]">({p.career_track} · {p.frontpage_template})</span>
                      </div>
                      <Badge tone={p.is_published ? "success" : "neutral"}>
                        {p.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Sessions Duration */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Usage Sessions ({userDetail.recent_sessions?.length || 0})
              </h4>
              {(userDetail.recent_sessions || []).length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">No duration-tracked sessions recorded yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1 text-xs">
                  {userDetail.recent_sessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-[var(--border-subtle)]">
                      <div className="min-w-0">
                        <span className="font-mono font-semibold">{s.last_path || "/"}</span>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Started {formatDateTime(s.started_at)} · Last active {formatDateTime(s.last_seen_at)}
                        </p>
                      </div>
                      <Badge tone="accent">{formatDuration(s.duration_seconds)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Real Activity Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Recorded Activity Timeline
              </h4>
              {(userDetail.timeline || []).length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">No recorded activity events yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-1 text-xs">
                  {userDetail.timeline.map((ev) => (
                    <div key={ev.id} className="flex items-start justify-between gap-3 p-2.5 rounded-xl border border-[var(--border-subtle)]">
                      <div>
                        <span className="font-mono font-semibold">{ev.event_name}</span>{" "}
                        <Badge tone={ev.status === "failed" ? "danger" : "neutral"}>{ev.feature_name}</Badge>
                        {Object.keys(ev.metadata || {}).length > 0 && (
                          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{JSON.stringify(ev.metadata)}</p>
                        )}
                      </div>
                      <span className="text-[11px] text-[var(--text-muted)] shrink-0">{formatDateTime(ev.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Suspend / Activate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmSuspendUser)}
        onClose={() => !savingUserAction && setConfirmSuspendUser(null)}
        onConfirm={() =>
          confirmSuspendUser &&
          handleUpdateUser(confirmSuspendUser.id, { is_active: !confirmSuspendUser.is_active })
        }
        title={confirmSuspendUser?.is_active ? "Suspend User Account" : "Reactivate User Account"}
        message={
          confirmSuspendUser?.is_active
            ? `Suspend ${confirmSuspendUser.email}? They will no longer be able to log in until reactivated.`
            : `Reactivate ${confirmSuspendUser?.email || ""}?`
        }
        confirmLabel={confirmSuspendUser?.is_active ? "Suspend Account" : "Activate Account"}
        loading={savingUserAction}
      />
    </div>
  );
}
