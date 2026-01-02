import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Dropdown } from "primereact/dropdown";
import PrimeDataTableCard from "./components/PrimeDataTableCard";

/**
 * Simple pages used by the app router.
 * Kept lightweight and styled via existing App.css utility-ish classes.
 */

/**
 * Mocked response used for the Home dashboard metrics.
 * Replace this with a real fetch() call when backend is ready.
 */
const DUMMY_HOME_METRICS_RESPONSE = {
  status: "success",
  data: {
    learningPaths: { total: 12, active: 8 },
    skillFactories: { total: 4, mentors: 18 },
    employees: { total: 245, inPool: 37 },
    assessments: { total: 28, pending: 6 },
  },
};

/**
 * Mocked response used for the "Learning Path metrics" section on Home.
 * Note: The prompt includes `count: 2` even though `data` has 1 row; we display count if present.
 */
const DUMMY_HOME_LEARNING_PATH_METRICS_RESPONSE = {
  status: "success",
  data: [
    {
      learningPathName: "Cloud Fundamentals",
      enrolled: 100,
      completed: 40,
      inProgress: 50,
      completionRate: 0.4,
    },
  ],
  count: 2,
};

/**
 * Mocked response used for the "Skill Factory metrics" section on Home.
 * Payload provided by the prompt.
 */
const DUMMY_HOME_SKILL_FACTORY_METRICS_RESPONSE = {
  status: "success",
  data: [
    {
      skillFactoryId: "SF-PLATFORM-001",
      skillFactoryName: "Platform Engineering",
      mentorCount: 2,
      employeeCount: 4,
      inPoolCount: 2,
      notInPoolCount: 2,
    },
  ],
  count: 1,
};

async function delay(ms, { signal } = {}) {
  await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timeoutId);
          reject(new DOMException("Request aborted", "AbortError"));
        },
        { once: true }
      );
    }
  });
}

/**
 * Simulates an API call with loading/error states.
 * This is where a real request will live later:
 *   fetch(`${process.env.REACT_APP_API_BASE}/home/metrics`, ...)
 */
async function fetchHomeMetricsMock({ signal } = {}) {
  await delay(650, { signal });

  const shouldFail = false;
  if (shouldFail) throw new Error("Failed to load dashboard metrics. Please try again.");

  return DUMMY_HOME_METRICS_RESPONSE;
}

/**
 * Simulates an API call for Learning Path metrics with loading/error states.
 */
async function fetchHomeLearningPathMetricsMock({ signal } = {}) {
  await delay(720, { signal });

  const shouldFail = false;
  if (shouldFail) throw new Error("Failed to load Learning Path metrics. Please try again.");

  return DUMMY_HOME_LEARNING_PATH_METRICS_RESPONSE;
}

/**
 * Simulates an API call for Skill Factory metrics with loading/error states.
 */
async function fetchHomeSkillFactoryMetricsMock({ signal } = {}) {
  await delay(760, { signal });

  const shouldFail = false;
  if (shouldFail) throw new Error("Failed to load Skill Factory metrics. Please try again.");

  return DUMMY_HOME_SKILL_FACTORY_METRICS_RESPONSE;
}

function safeNumber(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function metricLabelOrDash(value) {
  const num = safeNumber(value);
  return num === null ? "—" : String(num);
}

function getMetricCardA11yText({ title, mainValue, mainLabel, secondary }) {
  const parts = [title];
  if (mainLabel) parts.push(`${mainLabel} ${mainValue}`);
  if (secondary) parts.push(`${secondary.label} ${secondary.value}`);
  return parts.join(". ");
}

function buildLearningPathsQuery({ q, status }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  const qs = params.toString();
  return qs ? `/learning-paths?${qs}` : "/learning-paths";
}

function safeNumberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function aggregateHomeLearningPathMetrics(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  return safeRows.reduce(
    (acc, r) => {
      acc.enrolled += safeNumberOrZero(r?.enrolled);
      acc.completed += safeNumberOrZero(r?.completed);
      acc.inProgress += safeNumberOrZero(r?.inProgress);
      return acc;
    },
    { enrolled: 0, completed: 0, inProgress: 0 }
  );
}

/**
 * Skill Factories URL query parameters:
 * - q: global search term
 * - mentorPool: "in" | "not-in"
 * - employeePool: "in" | "not-in"
 */
function buildSkillFactoriesQuery({ q, mentorPool, employeePool } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (mentorPool) params.set("mentorPool", mentorPool);
  if (employeePool) params.set("employeePool", employeePool);
  const qs = params.toString();
  return qs ? `/skill-factories?${qs}` : "/skill-factories";
}

function parseSkillFactoriesQuery(locationSearch) {
  const params = new URLSearchParams(locationSearch || "");
  const q = (params.get("q") || "").trim();
  const mentorPool = (params.get("mentorPool") || "").trim();
  const employeePool = (params.get("employeePool") || "").trim();
  return { q, mentorPool, employeePool };
}

function normalizePoolParam(value) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "in" || v === "in-pool" || v === "in_pool") return "in";
  if (v === "not-in" || v === "notin" || v === "not_in" || v === "out") return "not-in";
  return "";
}

function poolParamToLabel(param) {
  if (param === "in") return "In pool";
  if (param === "not-in") return "Not in pool";
  return "";
}

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(" ");
  return String(value);
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b)));
}

function formatIsoDateTimeOrDash(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().replace(".000Z", "Z");
}

// PUBLIC_INTERFACE
export function HomePage() {
  /** Home page that renders a dashboard-style overview using mocked API metrics. */

  const [metrics, setMetrics] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  // Learning Path metrics section state
  const [lpMetricsRows, setLpMetricsRows] = React.useState([]);
  const [lpMetricsCount, setLpMetricsCount] = React.useState(null);
  const [lpMetricsLoading, setLpMetricsLoading] = React.useState(true);
  const [lpMetricsError, setLpMetricsError] = React.useState("");

  // Skill Factory metrics section state
  const [sfMetricsRows, setSfMetricsRows] = React.useState([]);
  const [sfMetricsCount, setSfMetricsCount] = React.useState(null);
  const [sfMetricsLoading, setSfMetricsLoading] = React.useState(true);
  const [sfMetricsError, setSfMetricsError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const controller = new AbortController();

    try {
      const response = await fetchHomeMetricsMock({ signal: controller.signal });

      if (!response || response.status !== "success" || !response.data) {
        throw new Error("Unexpected API response format.");
      }

      setMetrics(response.data);
    } catch (err) {
      if (err?.name !== "AbortError") {
        setErrorMessage(err?.message || "Something went wrong while loading data.");
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, []);

  const loadLearningPathMetrics = React.useCallback(async () => {
    setLpMetricsLoading(true);
    setLpMetricsError("");

    const controller = new AbortController();

    try {
      const response = await fetchHomeLearningPathMetricsMock({ signal: controller.signal });

      if (!response || response.status !== "success" || !Array.isArray(response.data)) {
        throw new Error("Unexpected API response format.");
      }

      setLpMetricsRows(response.data);
      setLpMetricsCount(typeof response.count === "number" && Number.isFinite(response.count) ? response.count : null);
    } catch (err) {
      if (err?.name !== "AbortError") {
        setLpMetricsError(err?.message || "Something went wrong while loading data.");
      }
    } finally {
      setLpMetricsLoading(false);
    }

    return () => controller.abort();
  }, []);

  const loadSkillFactoryMetrics = React.useCallback(async () => {
    setSfMetricsLoading(true);
    setSfMetricsError("");

    const controller = new AbortController();

    try {
      const response = await fetchHomeSkillFactoryMetricsMock({ signal: controller.signal });

      if (!response || response.status !== "success" || !Array.isArray(response.data)) {
        throw new Error("Unexpected API response format.");
      }

      setSfMetricsRows(response.data);
      setSfMetricsCount(typeof response.count === "number" && Number.isFinite(response.count) ? response.count : null);
    } catch (err) {
      if (err?.name !== "AbortError") {
        setSfMetricsError(err?.message || "Something went wrong while loading data.");
      }
    } finally {
      setSfMetricsLoading(false);
    }

    return () => controller.abort();
  }, []);

  React.useEffect(() => {
    let cleanupDashboard = null;
    let cleanupLp = null;
    let cleanupSf = null;

    (async () => {
      cleanupDashboard = await load();
      cleanupLp = await loadLearningPathMetrics();
      cleanupSf = await loadSkillFactoryMetrics();
    })();

    return () => {
      if (typeof cleanupDashboard === "function") cleanupDashboard();
      if (typeof cleanupLp === "function") cleanupLp();
      if (typeof cleanupSf === "function") cleanupSf();
    };
  }, [load, loadLearningPathMetrics, loadSkillFactoryMetrics]);

  const cards = React.useMemo(() => {
    const lp = metrics?.learningPaths || {};
    const sf = metrics?.skillFactories || {};
    const emp = metrics?.employees || {};
    const asmt = metrics?.assessments || {};

    return [
      {
        key: "learningPaths",
        title: "Learning Paths",
        eyebrow: "Structured journeys",
        main: { value: metricLabelOrDash(lp.total), label: "Total" },
        secondary: { value: metricLabelOrDash(lp.active), label: "Active" },
        href: "/learning-paths",
      },
      {
        key: "skillFactories",
        title: "Skill Factories",
        eyebrow: "Mentorship hubs",
        main: { value: metricLabelOrDash(sf.total), label: "Total" },
        secondary: { value: metricLabelOrDash(sf.mentors), label: "Mentors" },
        href: "/skill-factories",
      },
      {
        key: "employees",
        title: "Employees",
        eyebrow: "Talent base",
        main: { value: metricLabelOrDash(emp.total), label: "Total" },
        secondary: { value: metricLabelOrDash(emp.inPool), label: "In pool" },
        href: "/rmg-tracker",
      },
      {
        key: "assessments",
        title: "Assessments",
        eyebrow: "Measure growth",
        main: { value: metricLabelOrDash(asmt.total), label: "Total" },
        secondary: { value: metricLabelOrDash(asmt.pending), label: "Pending" },
        href: "/assessments",
      },
    ];
  }, [metrics]);

  return (
    <main className="App-main" aria-label="Welcome page">
      <section className="HelloCard HelloCard--wide" aria-label="Home dashboard">
        <p className="HelloEyebrow">Digi Portal</p>
        <h1 className="HelloTitle">Welcome to Digi Portal</h1>
        <p className="HelloSubtitle">Build, assess, and grow your digital skills.</p>

        <div className="RmgToolbar" aria-label="Dashboard actions">
          <button type="button" className="RmgButton" onClick={load} disabled={loading} aria-disabled={loading ? "true" : "false"}>
            {loading ? "Loading…" : "Refresh"}
          </button>

          <Link className="RmgLink" to="/learning-paths">
            Explore Learning Paths
          </Link>
        </div>

        {loading && (
          <div className="RmgState" role="status" aria-live="polite">
            <div className="RmgSpinner" aria-hidden="true" />
            <span>Fetching dashboard metrics…</span>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="RmgError" role="alert">
            <div className="RmgErrorTitle">Couldn’t load metrics</div>
            <div className="RmgErrorMessage">{errorMessage}</div>
            <button type="button" className="RmgButton RmgButton--danger" onClick={load}>
              Try again
            </button>
          </div>
        )}

        {!loading && !errorMessage && (
          <div className="HomeDashboard" role="region" aria-label="Key metrics">
            {cards.map((c) => (
              <Link
                key={c.key}
                className="MetricCard"
                to={c.href}
                aria-label={getMetricCardA11yText({
                  title: c.title,
                  mainValue: c.main.value,
                  mainLabel: c.main.label,
                  secondary: { value: c.secondary.value, label: c.secondary.label },
                })}
              >
                <div className="MetricCard-top">
                  <div className="MetricCard-eyebrow">{c.eyebrow}</div>
                  <div className="MetricCard-title">{c.title}</div>
                </div>

                <div className="MetricCard-body">
                  <div className="MetricCard-valueRow">
                    <div className="MetricCard-value">{c.main.value}</div>
                    <div className="MetricCard-label">{c.main.label}</div>
                  </div>

                  <div className="MetricCard-subRow">
                    <span className="MetricCard-subLabel">{c.secondary.label}</span>
                    <span className="MetricCard-subValue">{c.secondary.value}</span>
                  </div>
                </div>

                <div className="MetricCard-footer">View details →</div>
              </Link>
            ))}
          </div>
        )}

        {/* Skill Factory metrics */}
        <section className="HomeSection" aria-label="Skill Factory metrics">
          <div className="HomeSectionHeader">
            <div>
              <h2 className="HomeSectionTitle">Skill Factory metrics</h2>
              <p className="HomeSectionSubtitle">Pool distribution snapshot (mocked API response).</p>
            </div>

            <div className="RmgToolbar" aria-label="Skill Factory metrics actions" style={{ marginTop: 0 }}>
              <button
                type="button"
                className="RmgButton"
                onClick={loadSkillFactoryMetrics}
                disabled={sfMetricsLoading}
                aria-disabled={sfMetricsLoading ? "true" : "false"}
              >
                {sfMetricsLoading ? "Loading…" : "Refresh"}
              </button>

              <span className="HomeMiniPill" aria-label="Skill Factory metrics count">
                Count: <span className="RmgMono">{sfMetricsCount === null ? "—" : sfMetricsCount}</span>
              </span>
            </div>
          </div>

          {sfMetricsLoading && (
            <div className="RmgState" role="status" aria-live="polite">
              <div className="RmgSpinner" aria-hidden="true" />
              <span>Fetching Skill Factory metrics…</span>
            </div>
          )}

          {!sfMetricsLoading && sfMetricsError && (
            <div className="RmgError" role="alert">
              <div className="RmgErrorTitle">Couldn’t load Skill Factory metrics</div>
              <div className="RmgErrorMessage">{sfMetricsError}</div>
              <button type="button" className="RmgButton RmgButton--danger" onClick={loadSkillFactoryMetrics}>
                Try again
              </button>
            </div>
          )}

          {!sfMetricsLoading && !sfMetricsError && (
            <div className="SfMetricsGrid" role="region" aria-label="Skill Factory metric cards">
              {sfMetricsRows.length === 0 ? (
                <div className="RmgState" role="status" aria-live="polite">
                  <span>No Skill Factory metrics available.</span>
                </div>
              ) : (
                sfMetricsRows.map((sf) => {
                  const title = sf.skillFactoryName || sf.skillFactoryId || "Skill Factory";
                  const subtitle = sf.skillFactoryId ? `ID: ${sf.skillFactoryId}` : "";

                  const metricCards = [
                    { key: "mentorCount", label: "Mentor Count", value: metricLabelOrDash(sf.mentorCount) },
                    { key: "employeeCount", label: "Employee Count", value: metricLabelOrDash(sf.employeeCount) },
                    { key: "inPoolCount", label: "In Pool", value: metricLabelOrDash(sf.inPoolCount) },
                    { key: "notInPoolCount", label: "Not In Pool", value: metricLabelOrDash(sf.notInPoolCount) },
                  ];

                  return (
                    <article key={sf.skillFactoryId || sf.skillFactoryName} className="SfMetricsCard" aria-label={`${title} metrics`}>
                      <header className="SfMetricsCardHeader">
                        <div className="SfMetricsCardTitleRow">
                          <h3 className="SfMetricsCardTitle">{title}</h3>
                          {subtitle && <span className="SfMetricsCardMeta RmgMono">{subtitle}</span>}
                        </div>
                      </header>

                      <div className="SfMetricsCardGrid" role="list" aria-label={`${title} metric list`}>
                        {metricCards.map((m) => {
                          const baseQ = sf.skillFactoryName || "";
                          const to =
                            m.key === "inPoolCount"
                              ? buildSkillFactoriesQuery({ q: baseQ, employeePool: "in" })
                              : m.key === "notInPoolCount"
                                ? buildSkillFactoriesQuery({ q: baseQ, employeePool: "not-in" })
                                : buildSkillFactoriesQuery({ q: baseQ });

                          const titleHint =
                            m.key === "inPoolCount"
                              ? "Open Skill Factories filtered to employees in pool"
                              : m.key === "notInPoolCount"
                                ? "Open Skill Factories filtered to employees not in pool"
                                : "Open Skill Factories filtered by this Skill Factory";

                          return (
                            <Link
                              key={m.key}
                              className="SfMetricMiniCard"
                              role="listitem"
                              to={to}
                              aria-label={`${m.label} ${m.value}. ${titleHint}.`}
                              title={titleHint}
                              style={{ textDecoration: "none", color: "inherit" }}
                            >
                              <div className="SfMetricMiniValue RmgMono">{m.value}</div>
                              <div className="SfMetricMiniLabel">{m.label}</div>
                            </Link>
                          );
                        })}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}
        </section>

        {/* Learning Path metrics */}
        <section className="HomeSection" aria-label="Learning Path metrics">
          <div className="HomeSectionHeader">
            <div>
              <h2 className="HomeSectionTitle">Learning Path metrics</h2>
              <p className="HomeSectionSubtitle">Enrollment and progress snapshot (mocked API response).</p>
            </div>

            <div className="RmgToolbar" aria-label="Learning Path metrics actions" style={{ marginTop: 0 }}>
              <button
                type="button"
                className="RmgButton"
                onClick={loadLearningPathMetrics}
                disabled={lpMetricsLoading}
                aria-disabled={lpMetricsLoading ? "true" : "false"}
              >
                {lpMetricsLoading ? "Loading…" : "Refresh"}
              </button>

              <span className="HomeMiniPill" aria-label="Learning path metrics count">
                Count: <span className="RmgMono">{lpMetricsCount === null ? "—" : lpMetricsCount}</span>
              </span>
            </div>
          </div>

          {lpMetricsLoading && (
            <div className="RmgState" role="status" aria-live="polite">
              <div className="RmgSpinner" aria-hidden="true" />
              <span>Fetching Learning Path metrics…</span>
            </div>
          )}

          {!lpMetricsLoading && lpMetricsError && (
            <div className="RmgError" role="alert">
              <div className="RmgErrorTitle">Couldn’t load Learning Path metrics</div>
              <div className="RmgErrorMessage">{lpMetricsError}</div>
              <button type="button" className="RmgButton RmgButton--danger" onClick={loadLearningPathMetrics}>
                Try again
              </button>
            </div>
          )}

          {!lpMetricsLoading && !lpMetricsError && (
            <div className="HomeLpMetricCardsWrap" role="region" aria-label="Learning Path metric cards">
              {lpMetricsRows.length === 0 ? (
                <div className="RmgState" role="status" aria-live="polite">
                  <span>No Learning Path metrics available.</span>
                </div>
              ) : (
                (() => {
                  const agg = aggregateHomeLearningPathMetrics(lpMetricsRows);
                  const completionRate = agg.enrolled > 0 ? agg.completed / agg.enrolled : null;

                  const cards2 = [
                    {
                      key: "enrolled",
                      title: "Enrolled",
                      value: String(agg.enrolled),
                      subtitle: "All enrollments",
                      to: buildLearningPathsQuery({}),
                      hint: "Open Learning Paths (no status filter)",
                    },
                    {
                      key: "completed",
                      title: "Completed",
                      value: String(agg.completed),
                      subtitle: "Paths with completions",
                      to: buildLearningPathsQuery({ status: "completed" }),
                      hint: "Open Learning Paths filtered to Completed",
                    },
                    {
                      key: "inProgress",
                      title: "In Progress",
                      value: String(agg.inProgress),
                      subtitle: "Paths with learners in progress",
                      to: buildLearningPathsQuery({ status: "inProgress" }),
                      hint: "Open Learning Paths filtered to In Progress",
                    },
                    {
                      key: "completionRate",
                      title: "Completion Rate",
                      value: completionRate === null ? "—" : `${(completionRate * 100).toFixed(0)}%`,
                      subtitle: "Completed / Enrolled",
                      to: buildLearningPathsQuery({}),
                      hint: "Open Learning Paths (no status filter)",
                    },
                  ];

                  return (
                    <div className="HomeLpMetricCardsGrid" role="list" aria-label="Learning Path metric cards">
                      {cards2.map((c) => (
                        <Link
                          key={c.key}
                          className="HomeLpMetricCard"
                          role="listitem"
                          to={c.to}
                          aria-label={`${c.title} ${c.value}. ${c.subtitle}. ${c.hint}.`}
                          title={c.hint}
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <div className="HomeLpMetricCardTop">
                            <div className="HomeLpMetricCardTitle">{c.title}</div>
                            <div className="HomeLpMetricCardValue RmgMono">{c.value}</div>
                          </div>
                          <div className="HomeLpMetricCardSub">{c.subtitle}</div>
                          <div className="HomeLpMetricCardCta">View Learning Paths →</div>
                        </Link>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

/**
 * ---------------------------------------------------------------------------
 * RMG Tracker
 * ---------------------------------------------------------------------------
 */

const DUMMY_RMG_RESPONSE = {
  status: "success",
  data: [
    {
      empId: "E10234",
      name: "Aarav Mehta",
      role: "Frontend Engineer",
      project: "Digi Portal",
      allocationPct: 100,
      status: "Billable",
      startDate: "2025-01-10",
      endDate: null,
      location: "Bengaluru",
      manager: "Priya Sharma",
      skills: ["React", "TypeScript", "CSS"],
      employeeType: "FTE",
      grade: "G6",
      currentStatus: "Active",
    },
    {
      empId: "E11876",
      name: "Diya Iyer",
      role: "Backend Engineer",
      project: "Skill Factory",
      allocationPct: 60,
      status: "Partial",
      startDate: "2024-11-01",
      endDate: null,
      location: "Pune",
      manager: "Rahul Verma",
      skills: ["Node.js", "PostgreSQL", "APIs"],
      employeeType: "Contractor",
      grade: "G5",
      currentStatus: "Active",
    },
    {
      empId: "E10991",
      name: "Kabir Singh",
      role: "QA Engineer",
      project: "Learning Paths",
      allocationPct: 0,
      status: "Bench",
      startDate: "2024-12-15",
      endDate: null,
      location: "Remote",
      manager: "Neha Kapoor",
      skills: ["Automation", "Playwright", "Jest"],
      employeeType: "FTE",
      grade: "G4",
      currentStatus: "Bench",
    },
  ],
};

async function fetchRmgTrackerDataMock({ signal } = {}) {
  await delay(650, { signal });
  const shouldFail = false;
  if (shouldFail) throw new Error("Failed to load RMG Tracker data. Please try again.");
  return DUMMY_RMG_RESPONSE;
}

function formatDateOrDash(value) {
  if (!value) return "—";
  return value;
}

// PUBLIC_INTERFACE
export function RmgTrackerPage() {
  /** RMG Tracker page that fetches (mocked) data and renders a PrimeReact table while preserving existing UX features. */
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  // Page-level dropdown filters (kept as in old UX)
  const [filters, setFilters] = React.useState({
    employeeType: "",
    currentStatus: "",
    location: "",
    grade: "",
  });

  const ALL_COLUMNS = React.useMemo(
    () => [
      { id: "empId", label: "Emp ID", sortType: "text", filterType: "text" },
      { id: "name", label: "Name", sortType: "text", filterType: "text" },
      { id: "role", label: "Role", sortType: "text", filterType: "select" },
      { id: "project", label: "Project", sortType: "text", filterType: "select" },
      { id: "allocationPct", label: "Allocation %", sortType: "number", filterType: "numberRange" },
      { id: "status", label: "Status", sortType: "text", filterType: "select" },
      { id: "currentStatus", label: "Current Status", sortType: "text", filterType: "select" },
      { id: "employeeType", label: "Employee Type", sortType: "text", filterType: "select" },
      { id: "grade", label: "Grade", sortType: "text", filterType: "select" },
      { id: "manager", label: "Manager", sortType: "text", filterType: "select" },
      { id: "location", label: "Location", sortType: "text", filterType: "select" },
      { id: "startDate", label: "Start", sortType: "date", filterType: "dateRange" },
      { id: "endDate", label: "End", sortType: "date", filterType: "dateRange" },
      { id: "skills", label: "Skills", sortType: "text", filterType: "multiselect", filterAccessor: (r) => r?.skills || [] },
    ],
    []
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const controller = new AbortController();

    try {
      const response = await fetchRmgTrackerDataMock({ signal: controller.signal });

      if (!response || response.status !== "success" || !Array.isArray(response.data)) {
        throw new Error("Unexpected API response format.");
      }

      setRows(response.data);
    } catch (err) {
      if (err?.name !== "AbortError") {
        setErrorMessage(err?.message || "Something went wrong while loading data.");
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, []);

  React.useEffect(() => {
    let cleanup = null;
    (async () => {
      cleanup = await load();
    })();

    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [load]);

  const filterOptions = React.useMemo(() => {
    const employeeType = uniqueSorted(rows.map((r) => r.employeeType));
    const currentStatus = uniqueSorted(rows.map((r) => r.currentStatus));
    const location = uniqueSorted(rows.map((r) => r.location));
    const grade = uniqueSorted(rows.map((r) => r.grade));
    return { employeeType, currentStatus, location, grade };
  }, [rows]);

  // Apply page-level filters before passing into table
  const prefilteredRows = React.useMemo(() => {
    return (Array.isArray(rows) ? rows : []).filter((r) => {
      if (filters.employeeType && normalizeText(r.employeeType) !== filters.employeeType) return false;
      if (filters.currentStatus && normalizeText(r.currentStatus) !== filters.currentStatus) return false;
      if (filters.location && normalizeText(r.location) !== filters.location) return false;
      if (filters.grade && normalizeText(r.grade) !== filters.grade) return false;
      return true;
    });
  }, [rows, filters]);

  function renderCell(r, colId) {
    switch (colId) {
      case "empId":
        return <span className="RmgMono">{r.empId}</span>;
      case "allocationPct":
        return <span className="RmgMono">{r.allocationPct}</span>;
      case "status":
        return <span className={`RmgPill RmgPill--${String(r.status).toLowerCase()}`}>{r.status}</span>;
      case "startDate":
        return <span className="RmgMono">{formatDateOrDash(r.startDate)}</span>;
      case "endDate":
        return <span className="RmgMono">{formatDateOrDash(r.endDate)}</span>;
      case "skills":
        return Array.isArray(r.skills) ? (
          <div className="RmgChips" aria-label={`${r.name} skills`}>
            {r.skills.map((s) => (
              <span key={`${r.empId}-${s}`} className="RmgChip">
                {s}
              </span>
            ))}
          </div>
        ) : (
          "—"
        );
      default:
        return normalizeText(r[colId]) || "—";
    }
  }

  return (
    <main className="App-main" aria-label="RMG Tracker page">
      <section className="HelloCard HelloCard--wide" aria-label="RMG Tracker content">
        <p className="HelloEyebrow">Digi Portal</p>
        <h1 className="HelloTitle">RMG Tracker</h1>
        <p className="HelloSubtitle">Resource overview fetched from an API (mocked response for now).</p>

        <div className="RmgToolbar" aria-label="RMG actions">
          <button type="button" className="RmgButton" onClick={load} disabled={loading} aria-disabled={loading ? "true" : "false"}>
            {loading ? "Loading…" : "Refresh"}
          </button>

          <Link className="RmgLink" to="/">
            Back to Home
          </Link>
        </div>

        {!loading && !errorMessage && (
          <div className="RmgOptions" aria-label="RMG table filters">
            <div className="RmgOptionsRow">
              <label className="RmgField">
                <span className="RmgFieldLabel">Employee Type</span>
                <Dropdown
                  value={filters.employeeType}
                  options={[{ label: "All", value: "" }, ...filterOptions.employeeType.map((v) => ({ label: v, value: v }))]}
                  onChange={(e) => setFilters((f) => ({ ...f, employeeType: e.value }))}
                  placeholder="All"
                  aria-label="Filter by employee type"
                  style={{ width: "100%" }}
                />
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Current Status</span>
                <Dropdown
                  value={filters.currentStatus}
                  options={[{ label: "All", value: "" }, ...filterOptions.currentStatus.map((v) => ({ label: v, value: v }))]}
                  onChange={(e) => setFilters((f) => ({ ...f, currentStatus: e.value }))}
                  placeholder="All"
                  aria-label="Filter by current status"
                  style={{ width: "100%" }}
                />
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Location</span>
                <Dropdown
                  value={filters.location}
                  options={[{ label: "All", value: "" }, ...filterOptions.location.map((v) => ({ label: v, value: v }))]}
                  onChange={(e) => setFilters((f) => ({ ...f, location: e.value }))}
                  placeholder="All"
                  aria-label="Filter by location"
                  style={{ width: "100%" }}
                />
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Grade</span>
                <Dropdown
                  value={filters.grade}
                  options={[{ label: "All", value: "" }, ...filterOptions.grade.map((v) => ({ label: v, value: v }))]}
                  onChange={(e) => setFilters((f) => ({ ...f, grade: e.value }))}
                  placeholder="All"
                  aria-label="Filter by grade"
                  style={{ width: "100%" }}
                />
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Quick reset</span>
                <button type="button" className="RmgButton" onClick={() => setFilters({ employeeType: "", currentStatus: "", location: "", grade: "" })} disabled={loading}>
                  Reset filters
                </button>
              </label>
            </div>
          </div>
        )}

        {loading && (
          <div className="RmgState" role="status" aria-live="polite">
            <div className="RmgSpinner" aria-hidden="true" />
            <span>Fetching RMG data…</span>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="RmgError" role="alert">
            <div className="RmgErrorTitle">Couldn’t load data</div>
            <div className="RmgErrorMessage">{errorMessage}</div>
            <button type="button" className="RmgButton RmgButton--danger" onClick={load}>
              Try again
            </button>
          </div>
        )}

        {!loading && !errorMessage && (
          <PrimeDataTableCard
            title="RMG Table"
            subtitle="PrimeReact DataTable with preserved filters/sort/pagination UX."
            columns={ALL_COLUMNS}
            rows={prefilteredRows}
            loading={loading}
            errorMessage={errorMessage}
            alwaysInlineColumnIds={["empId", "name"]}
            rowKey={(r) => r.empId}
            renderCell={renderCell}
          />
        )}
      </section>
    </main>
  );
}

/**
 * ---------------------------------------------------------------------------
 * Skill Factories
 * ---------------------------------------------------------------------------
 */

const DUMMY_SKILL_FACTORIES_RESPONSE = {
  status: "success",
  data: [
    {
      skillFactoryId: "SF-PLATFORM-001",
      skillFactoryName: "Platform Engineering",
      mentors: [
        { mentorId: "M-001", mentorName: "Mentor A", mentorEmail: "mentor.a@example.com", isInPool: true },
        { mentorId: "M-002", mentorName: "Mentor B", mentorEmail: "mentor.b@example.com", isInPool: false },
      ],
      employees: [
        {
          id: "E12345",
          name: "Jane Doe",
          email: "jane.doe@example.com",
          initialRating: 3.5,
          currentRating: 4.2,
          startDate: "2026-01-01",
          endDate: "2026-06-30",
          isInPool: true,
        },
      ],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  count: 1,
};

async function fetchSkillFactoriesMock({ signal } = {}) {
  await delay(650, { signal });
  const shouldFail = false;
  if (shouldFail) throw new Error("Failed to load Skill Factories. Please try again.");
  return DUMMY_SKILL_FACTORIES_RESPONSE;
}

function formatRatingOrDash(value) {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return num.toFixed(1);
}

function yesNo(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "—";
}

function flattenPoolFlags(sf) {
  const flags = [];
  if (Array.isArray(sf.mentors)) flags.push(...sf.mentors.map((m) => m?.isInPool));
  if (Array.isArray(sf.employees)) flags.push(...sf.employees.map((e) => e?.isInPool));
  return flags.some(Boolean);
}

function getMentorPoolStatus(sf) {
  if (!Array.isArray(sf.mentors) || sf.mentors.length === 0) return "—";
  return sf.mentors.some((m) => m?.isInPool) ? "In pool" : "Not in pool";
}

function getEmployeePoolStatus(sf) {
  if (!Array.isArray(sf.employees) || sf.employees.length === 0) return "—";
  return sf.employees.some((e) => e?.isInPool) ? "In pool" : "Not in pool";
}

function safeArrayCount(value) {
  if (!Array.isArray(value)) return 0;
  return value.length;
}

// PUBLIC_INTERFACE
export function SkillFactoriesPage() {
  /** Skill Factories page that fetches (mocked) data and renders a PrimeReact table with preserved filtering UX. */
  const location = useLocation();

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  const [filters, setFilters] = React.useState({
    skillFactoryName: "",
    mentorPoolStatus: "",
    employeePoolStatus: "",
  });

  React.useEffect(() => {
    const { mentorPool, employeePool } = parseSkillFactoriesQuery(location.search);
    const nextMentorLabel = poolParamToLabel(normalizePoolParam(mentorPool));
    const nextEmployeeLabel = poolParamToLabel(normalizePoolParam(employeePool));

    setFilters((f) => ({
      ...f,
      mentorPoolStatus: nextMentorLabel || "",
      employeePoolStatus: nextEmployeeLabel || "",
    }));
  }, [location.search]);

  const ALL_COLUMNS = React.useMemo(
    () => [
      { id: "skillFactoryId", label: "Skill Factory ID", sortType: "text", filterType: "text" },
      { id: "skillFactoryName", label: "Skill Factory Name", sortType: "text", filterType: "select" },
      {
        id: "mentorCount",
        label: "Mentors (#)",
        sortType: "number",
        filterType: "numberRange",
        accessor: (sf) => safeArrayCount(sf.mentors),
        filterAccessor: (sf) => safeArrayCount(sf.mentors),
      },
      {
        id: "employeeCount",
        label: "Employees (#)",
        sortType: "number",
        filterType: "numberRange",
        accessor: (sf) => safeArrayCount(sf.employees),
        filterAccessor: (sf) => safeArrayCount(sf.employees),
      },
      {
        id: "mentorPoolStatus",
        label: "Mentors Pool",
        sortType: "text",
        filterType: "select",
        accessor: (sf) => getMentorPoolStatus(sf),
        filterAccessor: (sf) => getMentorPoolStatus(sf),
      },
      {
        id: "employeePoolStatus",
        label: "Employees Pool",
        sortType: "text",
        filterType: "select",
        accessor: (sf) => getEmployeePoolStatus(sf),
        filterAccessor: (sf) => getEmployeePoolStatus(sf),
      },
      {
        id: "hasAnyPoolMembers",
        label: "Any In Pool",
        sortType: "text",
        filterType: "select",
        accessor: (sf) => yesNo(flattenPoolFlags(sf)),
        filterAccessor: (sf) => yesNo(flattenPoolFlags(sf)),
      },
      {
        id: "mentors",
        label: "Mentors",
        sortType: "text",
        filterType: "text",
        accessor: (sf) => (Array.isArray(sf.mentors) ? sf.mentors.map((m) => m?.mentorName).join(" ") : ""),
        filterAccessor: (sf) =>
          Array.isArray(sf.mentors)
            ? sf.mentors.map((m) => `${m?.mentorName || ""} ${m?.mentorEmail || ""} ${m?.isInPool ? "in" : "not-in"}`).join(" ")
            : "",
      },
      {
        id: "employees",
        label: "Employees",
        sortType: "text",
        filterType: "text",
        accessor: (sf) => (Array.isArray(sf.employees) ? sf.employees.map((e) => e?.name).join(" ") : ""),
        filterAccessor: (sf) =>
          Array.isArray(sf.employees)
            ? sf.employees
                .map(
                  (e) =>
                    `${e?.id || ""} ${e?.name || ""} ${e?.email || ""} ${formatRatingOrDash(e?.initialRating)} ${formatRatingOrDash(e?.currentRating)} ${e?.isInPool ? "in" : "not-in"}`
                )
                .join(" ")
            : "",
      },
      { id: "createdAt", label: "Created At", sortType: "date", filterType: "dateRange" },
      { id: "updatedAt", label: "Updated At", sortType: "date", filterType: "dateRange" },
    ],
    []
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const controller = new AbortController();

    try {
      const response = await fetchSkillFactoriesMock({ signal: controller.signal });

      if (!response || response.status !== "success" || !Array.isArray(response.data)) {
        throw new Error("Unexpected API response format.");
      }

      setRows(response.data);
    } catch (err) {
      if (err?.name !== "AbortError") {
        setErrorMessage(err?.message || "Something went wrong while loading data.");
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, []);

  React.useEffect(() => {
    let cleanup = null;
    (async () => {
      cleanup = await load();
    })();

    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [load]);

  const filterOptions = React.useMemo(() => {
    const skillFactoryName = uniqueSorted(rows.map((r) => r.skillFactoryName));
    return {
      skillFactoryName,
      mentorPoolStatus: ["In pool", "Not in pool"],
      employeePoolStatus: ["In pool", "Not in pool"],
    };
  }, [rows]);

  const prefilteredRows = React.useMemo(() => {
    return (Array.isArray(rows) ? rows : []).filter((sf) => {
      const sfName = normalizeText(sf.skillFactoryName);

      if (filters.skillFactoryName && sfName !== filters.skillFactoryName) return false;

      const mentorsPool = getMentorPoolStatus(sf);
      if (filters.mentorPoolStatus && mentorsPool !== filters.mentorPoolStatus) return false;

      const employeesPool = getEmployeePoolStatus(sf);
      if (filters.employeePoolStatus && employeesPool !== filters.employeePoolStatus) return false;

      return true;
    });
  }, [rows, filters]);

  function renderMentorChips(sf) {
    if (!Array.isArray(sf.mentors) || sf.mentors.length === 0) return "—";
    return (
      <div className="RmgChips" aria-label={`${sf.skillFactoryName} mentors`}>
        {sf.mentors.map((m) => (
          <span key={m.mentorId} className="RmgChip" title={`${m.mentorEmail} • ${m.isInPool ? "In pool" : "Not in pool"}`}>
            {m.mentorName}
          </span>
        ))}
      </div>
    );
  }

  function renderEmployeeChips(sf) {
    if (!Array.isArray(sf.employees) || sf.employees.length === 0) return "—";
    return (
      <div className="RmgChips" aria-label={`${sf.skillFactoryName} employees`}>
        {sf.employees.map((e) => (
          <span
            key={e.id}
            className="RmgChip"
            title={`${e.email} • Initial ${formatRatingOrDash(e.initialRating)} • Current ${formatRatingOrDash(e.currentRating)} • ${e.isInPool ? "In pool" : "Not in pool"}`}
          >
            <span className="RmgMono" style={{ marginRight: 8 }}>
              {e.id}
            </span>
            {e.name}
          </span>
        ))}
      </div>
    );
  }

  function renderCell(sf, colId) {
    switch (colId) {
      case "skillFactoryId":
        return <span className="RmgMono">{sf.skillFactoryId}</span>;
      case "mentorCount":
        return <span className="RmgMono">{safeArrayCount(sf.mentors)}</span>;
      case "employeeCount":
        return <span className="RmgMono">{safeArrayCount(sf.employees)}</span>;
      case "hasAnyPoolMembers":
        return <span className={`RmgPill ${flattenPoolFlags(sf) ? "RmgPill--billable" : "RmgPill--bench"}`}>{yesNo(flattenPoolFlags(sf))}</span>;
      case "mentors":
        return renderMentorChips(sf);
      case "employees":
        return renderEmployeeChips(sf);
      case "createdAt":
      case "updatedAt":
        return <span className="RmgMono">{formatIsoDateTimeOrDash(sf[colId])}</span>;
      default:
        return normalizeText(sf[colId]) || "—";
    }
  }

  return (
    <main className="App-main" aria-label="Skill Factories page">
      <section className="HelloCard HelloCard--wide" aria-label="Skill Factories content">
        <p className="HelloEyebrow">Digi Portal</p>
        <h1 className="HelloTitle">Skill Factories</h1>
        <p className="HelloSubtitle">Skill Factory overview fetched from an API (mocked response for now).</p>

        <div className="RmgToolbar" aria-label="Skill Factories actions">
          <button type="button" className="RmgButton" onClick={load} disabled={loading} aria-disabled={loading ? "true" : "false"}>
            {loading ? "Loading…" : "Refresh"}
          </button>

          <Link className="RmgLink" to="/">
            Back to Home
          </Link>
        </div>

        {!loading && !errorMessage && (
          <div className="RmgOptions" aria-label="Skill Factories filters">
            <div className="RmgOptionsRow">
              <label className="RmgField">
                <span className="RmgFieldLabel">Skill Factory</span>
                <Dropdown
                  value={filters.skillFactoryName}
                  options={[{ label: "All", value: "" }, ...filterOptions.skillFactoryName.map((v) => ({ label: v, value: v }))]}
                  onChange={(e) => setFilters((f) => ({ ...f, skillFactoryName: e.value }))}
                  placeholder="All"
                  aria-label="Filter by skill factory name"
                  style={{ width: "100%" }}
                />
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Mentors Pool</span>
                <Dropdown
                  value={filters.mentorPoolStatus}
                  options={[{ label: "All", value: "" }, ...filterOptions.mentorPoolStatus.map((v) => ({ label: v, value: v }))]}
                  onChange={(e) => setFilters((f) => ({ ...f, mentorPoolStatus: e.value }))}
                  placeholder="All"
                  aria-label="Filter by mentors pool status"
                  style={{ width: "100%" }}
                />
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Employees Pool</span>
                <Dropdown
                  value={filters.employeePoolStatus}
                  options={[{ label: "All", value: "" }, ...filterOptions.employeePoolStatus.map((v) => ({ label: v, value: v }))]}
                  onChange={(e) => setFilters((f) => ({ ...f, employeePoolStatus: e.value }))}
                  placeholder="All"
                  aria-label="Filter by employees pool status"
                  style={{ width: "100%" }}
                />
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Quick reset</span>
                <button type="button" className="RmgButton" onClick={() => setFilters({ skillFactoryName: "", mentorPoolStatus: "", employeePoolStatus: "" })} disabled={loading}>
                  Reset filters
                </button>
              </label>
            </div>
          </div>
        )}

        {loading && (
          <div className="RmgState" role="status" aria-live="polite">
            <div className="RmgSpinner" aria-hidden="true" />
            <span>Fetching Skill Factories…</span>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="RmgError" role="alert">
            <div className="RmgErrorTitle">Couldn’t load data</div>
            <div className="RmgErrorMessage">{errorMessage}</div>
            <button type="button" className="RmgButton RmgButton--danger" onClick={load}>
              Try again
            </button>
          </div>
        )}

        {!loading && !errorMessage && (
          <PrimeDataTableCard
            title="Skill Factories Table"
            subtitle="PrimeReact DataTable with preserved filters/sort/pagination UX."
            columns={ALL_COLUMNS}
            rows={prefilteredRows}
            loading={loading}
            errorMessage={errorMessage}
            alwaysInlineColumnIds={["skillFactoryId", "skillFactoryName"]}
            rowKey={(sf) => sf.skillFactoryId}
            renderCell={renderCell}
          />
        )}
      </section>
    </main>
  );
}

/**
 * ---------------------------------------------------------------------------
 * Learning Paths
 * ---------------------------------------------------------------------------
 */

const DUMMY_LEARNING_PATHS_RESPONSE = {
  status: "success",
  data: [
    {
      learningPathName: "Cloud Fundamentals",
      description: "Start-to-finish introduction to cloud concepts.",
      tags: ["cloud", "foundations"],
      courseLinks: ["https://example.com/course-1", "https://example.com/course-2"],
      duration: "6h",
      enrolledCount: 100,
      completedCount: 40,
      inProgressCount: 50,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  count: 1,
};

async function fetchLearningPathsMock({ signal } = {}) {
  await delay(650, { signal });
  const shouldFail = false;
  if (shouldFail) throw new Error("Failed to load Learning Paths. Please try again.");
  return DUMMY_LEARNING_PATHS_RESPONSE;
}

function parseLearningPathsQuery(locationSearch) {
  const params = new URLSearchParams(locationSearch || "");
  const q = (params.get("q") || "").trim();
  const status = (params.get("status") || "").trim();
  return { q, status };
}

function normalizeLpStatusFilter(value) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "completed") return "completed";
  if (v === "inprogress" || v === "in_progress" || v === "in-progress") return "inProgress";
  if (v === "inprogresscount") return "inProgress";
  return "";
}

function safeNumberOrDash(value) {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  return Number.isFinite(num) ? String(num) : "—";
}

function formatLearningPathsIsoDateTimeOrDash(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().replace(".000Z", "Z");
}

// PUBLIC_INTERFACE
export function LearningPathsPage() {
  /** Learning Paths page that fetches (mocked) data and renders a PrimeReact table preserving existing controls. */
  const location = useLocation();

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  const [filters, setFilters] = React.useState({
    duration: "",
    tag: "",
    status: "",
  });

  const ALL_COLUMNS = React.useMemo(
    () => [
      { id: "learningPathName", label: "Learning Path Name", sortType: "text", filterType: "text" },
      { id: "description", label: "Description", sortType: "text", filterType: "text" },
      { id: "tags", label: "Tags", sortType: "text", filterType: "multiselect", filterAccessor: (lp) => lp?.tags || [] },
      {
        id: "courseLinks",
        label: "Course Links",
        sortType: "text",
        filterType: "text",
        filterAccessor: (lp) => (Array.isArray(lp.courseLinks) ? lp.courseLinks.join(" ") : ""),
      },
      { id: "duration", label: "Duration", sortType: "text", filterType: "select" },
      { id: "enrolledCount", label: "Enrolled", sortType: "number", filterType: "numberRange" },
      { id: "completedCount", label: "Completed", sortType: "number", filterType: "numberRange" },
      { id: "inProgressCount", label: "In Progress", sortType: "number", filterType: "numberRange" },
      { id: "createdAt", label: "Created At", sortType: "date", filterType: "dateRange" },
      { id: "updatedAt", label: "Updated At", sortType: "date", filterType: "dateRange" },
    ],
    []
  );

  React.useEffect(() => {
    const { status } = parseLearningPathsQuery(location.search);
    const normalized = normalizeLpStatusFilter(status);
    setFilters((f) => ({ ...f, status: normalized || "" }));
  }, [location.search]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const controller = new AbortController();

    try {
      const response = await fetchLearningPathsMock({ signal: controller.signal });

      if (!response || response.status !== "success" || !Array.isArray(response.data)) {
        throw new Error("Unexpected API response format.");
      }

      setRows(response.data);
    } catch (err) {
      if (err?.name !== "AbortError") {
        setErrorMessage(err?.message || "Something went wrong while loading data.");
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, []);

  React.useEffect(() => {
    let cleanup = null;
    (async () => {
      cleanup = await load();
    })();

    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [load]);

  const filterOptions = React.useMemo(() => {
    const duration = uniqueSorted(rows.map((r) => r.duration));

    const allTags = [];
    for (const r of rows) {
      if (Array.isArray(r?.tags)) allTags.push(...r.tags);
    }
    const tag = uniqueSorted(allTags);

    return {
      duration,
      tag,
      status: [
        { value: "", label: "All" },
        { value: "completed", label: "Completed" },
        { value: "inProgress", label: "In Progress" },
      ],
    };
  }, [rows]);

  const prefilteredRows = React.useMemo(() => {
    return (Array.isArray(rows) ? rows : []).filter((lp) => {
      if (filters.duration && normalizeText(lp.duration) !== filters.duration) return false;

      if (filters.tag) {
        const tags = Array.isArray(lp.tags) ? lp.tags : [];
        if (!tags.includes(filters.tag)) return false;
      }

      if (filters.status === "completed") {
        const n = Number(lp?.completedCount);
        if (!(Number.isFinite(n) && n > 0)) return false;
      }
      if (filters.status === "inProgress") {
        const n = Number(lp?.inProgressCount);
        if (!(Number.isFinite(n) && n > 0)) return false;
      }

      return true;
    });
  }, [rows, filters]);

  function renderCell(lp, colId) {
    switch (colId) {
      case "learningPathName":
        return <span style={{ fontWeight: 900 }}>{normalizeText(lp.learningPathName) || "—"}</span>;
      case "description":
        return normalizeText(lp.description) || "—";
      case "tags":
        return Array.isArray(lp.tags) && lp.tags.length ? (
          <div className="RmgChips" aria-label={`${lp.learningPathName} tags`}>
            {lp.tags.map((t) => (
              <span key={`${lp.learningPathName}-${t}`} className="RmgChip">
                {t}
              </span>
            ))}
          </div>
        ) : (
          "—"
        );
      case "courseLinks":
        return Array.isArray(lp.courseLinks) && lp.courseLinks.length ? (
          <div className="RmgChips" aria-label={`${lp.learningPathName} course links`}>
            {lp.courseLinks.map((href, idx) => (
              <a key={`${lp.learningPathName}-course-${idx}`} className="RmgLink" href={href} target="_blank" rel="noreferrer">
                Course {idx + 1}
              </a>
            ))}
          </div>
        ) : (
          "—"
        );
      case "duration":
        return <span className="RmgMono">{normalizeText(lp.duration) || "—"}</span>;
      case "enrolledCount":
      case "completedCount":
      case "inProgressCount":
        return <span className="RmgMono">{safeNumberOrDash(lp[colId])}</span>;
      case "createdAt":
      case "updatedAt":
        return <span className="RmgMono">{formatLearningPathsIsoDateTimeOrDash(lp[colId])}</span>;
      default:
        return normalizeText(lp[colId]) || "—";
    }
  }

  return (
    <main className="App-main" aria-label="Learning Paths page">
      <section className="HelloCard HelloCard--wide" aria-label="Learning Paths content">
        <p className="HelloEyebrow">Digi Portal</p>
        <h1 className="HelloTitle">Learning Paths</h1>
        <p className="HelloSubtitle">Explore structured learning plans. Data is currently loaded from a mocked API response.</p>

        <div className="RmgToolbar" aria-label="Learning Paths actions">
          <button type="button" className="RmgButton" onClick={load} disabled={loading} aria-disabled={loading ? "true" : "false"}>
            {loading ? "Loading…" : "Refresh"}
          </button>

          <Link className="RmgLink" to="/">
            Back to Home
          </Link>
        </div>

        {!loading && !errorMessage && (
          <div className="RmgOptions" aria-label="Learning Paths filters">
            <div className="RmgOptionsRow">
              <label className="RmgField">
                <span className="RmgFieldLabel">Duration</span>
                <Dropdown
                  value={filters.duration}
                  options={[{ label: "All", value: "" }, ...filterOptions.duration.map((v) => ({ label: v, value: v }))]}
                  onChange={(e) => setFilters((f) => ({ ...f, duration: e.value }))}
                  placeholder="All"
                  aria-label="Filter by duration"
                  style={{ width: "100%" }}
                />
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Tag</span>
                <Dropdown
                  value={filters.tag}
                  options={[{ label: "All", value: "" }, ...filterOptions.tag.map((v) => ({ label: v, value: v }))]}
                  onChange={(e) => setFilters((f) => ({ ...f, tag: e.value }))}
                  placeholder="All"
                  aria-label="Filter by tag"
                  style={{ width: "100%" }}
                />
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Status</span>
                <Dropdown
                  value={filters.status}
                  options={filterOptions.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.value }))}
                  placeholder="All"
                  aria-label="Filter by status"
                  style={{ width: "100%" }}
                />
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Quick reset</span>
                <button type="button" className="RmgButton" onClick={() => setFilters({ duration: "", tag: "", status: "" })} disabled={loading}>
                  Reset filters
                </button>
              </label>
            </div>
          </div>
        )}

        {loading && (
          <div className="RmgState" role="status" aria-live="polite">
            <div className="RmgSpinner" aria-hidden="true" />
            <span>Fetching Learning Paths…</span>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="RmgError" role="alert">
            <div className="RmgErrorTitle">Couldn’t load data</div>
            <div className="RmgErrorMessage">{errorMessage}</div>
            <button type="button" className="RmgButton RmgButton--danger" onClick={load}>
              Try again
            </button>
          </div>
        )}

        {!loading && !errorMessage && (
          <PrimeDataTableCard
            title="Learning Paths Table"
            subtitle="PrimeReact DataTable with preserved filters/sort/pagination UX."
            columns={ALL_COLUMNS}
            rows={prefilteredRows}
            loading={loading}
            errorMessage={errorMessage}
            alwaysInlineColumnIds={["learningPathName"]}
            rowKey={(lp) => lp.learningPathName}
            renderCell={renderCell}
          />
        )}
      </section>
    </main>
  );
}

/**
 * ---------------------------------------------------------------------------
 * Assessments
 * ---------------------------------------------------------------------------
 */

const DUMMY_ASSESSMENTS_RESPONSE = {
  status: "success",
  data: [
    {
      assessmentId: "A-001",
      title: "Quarterly Technical Assessment",
      description: "Assessment for backend engineering fundamentals.",
      assignedTo: [
        {
          employeeId: "E12345",
          employeeName: "Jane Doe",
          email: "jane.doe@example.com",
        },
      ],
      dueDate: "2026-02-01T00:00:00.000Z",
      status: "Assigned",
      marks: 85,
      basisOfScoring: "Rubric-based scoring across 5 competencies.",
      strength: "Strong system design and API clarity.",
      areasOfImprovement: "Increase unit test coverage and edge-case handling.",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  count: 1,
};

async function fetchAssessmentsMock({ signal } = {}) {
  await delay(650, { signal });
  const shouldFail = false;
  if (shouldFail) throw new Error("Failed to load Assessments. Please try again.");
  return DUMMY_ASSESSMENTS_RESPONSE;
}

function formatAssessmentsIsoDateTimeOrDash(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().replace(".000Z", "Z");
}

function formatMarkOrDash(value) {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  return Number.isFinite(num) ? String(num) : "—";
}

function firstAssigneeOrDash(assignedTo) {
  if (!Array.isArray(assignedTo) || assignedTo.length === 0) return "—";
  const a = assignedTo[0];
  return `${a?.employeeName || "—"} (${a?.employeeId || "—"})`;
}

function assigneeContactOrDash(assignedTo) {
  if (!Array.isArray(assignedTo) || assignedTo.length === 0) return "—";
  const a = assignedTo[0];
  const parts = [a?.email, a?.employeeId].filter(Boolean);
  return parts.length ? parts.join(" • ") : "—";
}

function normalizeAssessmentStatus(value) {
  if (!value) return "";
  return String(value).trim().toLowerCase().replace(/\s+/g, "-");
}

// PUBLIC_INTERFACE
export function AssessmentsPage() {
  /** Assessments page that fetches (mocked) data and renders a PrimeReact table preserving existing controls. */
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  const [filters, setFilters] = React.useState({
    status: "",
    dueMonth: "",
  });

  const ALL_COLUMNS = React.useMemo(
    () => [
      { id: "assessmentId", label: "Assessment ID", sortType: "text", filterType: "text" },
      { id: "title", label: "Title", sortType: "text", filterType: "text" },
      { id: "description", label: "Description", sortType: "text", filterType: "text" },
      {
        id: "assignedTo",
        label: "Assigned To",
        sortType: "text",
        filterType: "text",
        accessor: (a) => firstAssigneeOrDash(a.assignedTo),
        filterAccessor: (a) => firstAssigneeOrDash(a.assignedTo),
      },
      {
        id: "assigneeContact",
        label: "Contact",
        sortType: "text",
        filterType: "text",
        accessor: (a) => assigneeContactOrDash(a.assignedTo),
        filterAccessor: (a) => assigneeContactOrDash(a.assignedTo),
      },
      { id: "dueDate", label: "Due Date", sortType: "date", filterType: "dateRange" },
      { id: "status", label: "Status", sortType: "text", filterType: "select" },
      { id: "marks", label: "Marks", sortType: "number", filterType: "numberRange" },
      { id: "basisOfScoring", label: "Basis of Scoring", sortType: "text", filterType: "text" },
      { id: "strength", label: "Strength", sortType: "text", filterType: "text" },
      { id: "areasOfImprovement", label: "Areas of Improvement", sortType: "text", filterType: "text" },
      { id: "createdAt", label: "Created At", sortType: "date", filterType: "dateRange" },
      { id: "updatedAt", label: "Updated At", sortType: "date", filterType: "dateRange" },
    ],
    []
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const controller = new AbortController();

    try {
      const response = await fetchAssessmentsMock({ signal: controller.signal });

      if (!response || response.status !== "success" || !Array.isArray(response.data)) {
        throw new Error("Unexpected API response format.");
      }

      setRows(response.data);
    } catch (err) {
      if (err?.name !== "AbortError") {
        setErrorMessage(err?.message || "Something went wrong while loading data.");
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, []);

  React.useEffect(() => {
    let cleanup = null;
    (async () => {
      cleanup = await load();
    })();

    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [load]);

  const filterOptions = React.useMemo(() => {
    const status = uniqueSorted(rows.map((r) => r?.status));

    const months = [];
    for (const r of rows) {
      const value = r?.dueDate;
      const d = value ? new Date(value) : null;
      if (!d || Number.isNaN(d.getTime())) continue;
      const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      months.push(month);
    }

    return { status, dueMonth: uniqueSorted(months) };
  }, [rows]);

  const prefilteredRows = React.useMemo(() => {
    return (Array.isArray(rows) ? rows : []).filter((a) => {
      if (filters.status && normalizeText(a.status) !== filters.status) return false;

      if (filters.dueMonth) {
        const d = a?.dueDate ? new Date(a.dueDate) : null;
        const month =
          d && !Number.isNaN(d.getTime())
            ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
            : "";
        if (month !== filters.dueMonth) return false;
      }

      return true;
    });
  }, [rows, filters]);

  function renderCell(a, colId) {
    switch (colId) {
      case "assessmentId":
        return <span className="RmgMono">{normalizeText(a.assessmentId) || "—"}</span>;
      case "title":
        return <span style={{ fontWeight: 900 }}>{normalizeText(a.title) || "—"}</span>;
      case "assignedTo":
        return <span title={assigneeContactOrDash(a.assignedTo)}>{firstAssigneeOrDash(a.assignedTo)}</span>;
      case "assigneeContact":
        return <span className="RmgMono">{assigneeContactOrDash(a.assignedTo)}</span>;
      case "dueDate":
        return <span className="RmgMono">{formatAssessmentsIsoDateTimeOrDash(a.dueDate)}</span>;
      case "createdAt":
      case "updatedAt":
        return <span className="RmgMono">{formatAssessmentsIsoDateTimeOrDash(a[colId])}</span>;
      case "marks":
        return <span className="RmgMono">{formatMarkOrDash(a.marks)}</span>;
      case "status":
        return <span className={`RmgPill RmgPill--${normalizeAssessmentStatus(a.status)}`}>{normalizeText(a.status) || "—"}</span>;
      default:
        return normalizeText(a[colId]) || "—";
    }
  }

  return (
    <main className="App-main" aria-label="Assessments page">
      <section className="HelloCard HelloCard--wide" aria-label="Assessments content">
        <p className="HelloEyebrow">Digi Portal</p>
        <h1 className="HelloTitle">Assessments</h1>
        <p className="HelloSubtitle">Assessments loaded from a mocked API response (for now).</p>

        <div className="RmgToolbar" aria-label="Assessments actions">
          <button type="button" className="RmgButton" onClick={load} disabled={loading} aria-disabled={loading ? "true" : "false"}>
            {loading ? "Loading…" : "Refresh"}
          </button>

          <Link className="RmgLink" to="/">
            Back to Home
          </Link>
        </div>

        {!loading && !errorMessage && (
          <div className="RmgOptions" aria-label="Assessments filters">
            <div className="RmgOptionsRow">
              <label className="RmgField">
                <span className="RmgFieldLabel">Status</span>
                <Dropdown
                  value={filters.status}
                  options={[{ label: "All", value: "" }, ...filterOptions.status.map((v) => ({ label: v, value: v }))]}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.value }))}
                  placeholder="All"
                  aria-label="Filter by status"
                  style={{ width: "100%" }}
                />
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Due month</span>
                <Dropdown
                  value={filters.dueMonth}
                  options={[{ label: "All", value: "" }, ...filterOptions.dueMonth.map((v) => ({ label: v, value: v }))]}
                  onChange={(e) => setFilters((f) => ({ ...f, dueMonth: e.value }))}
                  placeholder="All"
                  aria-label="Filter by due month"
                  style={{ width: "100%" }}
                />
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Quick reset</span>
                <button type="button" className="RmgButton" onClick={() => setFilters({ status: "", dueMonth: "" })} disabled={loading}>
                  Reset filters
                </button>
              </label>
            </div>
          </div>
        )}

        {loading && (
          <div className="RmgState" role="status" aria-live="polite">
            <div className="RmgSpinner" aria-hidden="true" />
            <span>Fetching Assessments…</span>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="RmgError" role="alert">
            <div className="RmgErrorTitle">Couldn’t load data</div>
            <div className="RmgErrorMessage">{errorMessage}</div>
            <button type="button" className="RmgButton RmgButton--danger" onClick={load}>
              Try again
            </button>
          </div>
        )}

        {!loading && !errorMessage && (
          <PrimeDataTableCard
            title="Assessments Table"
            subtitle="PrimeReact DataTable with preserved filters/sort/pagination UX."
            columns={ALL_COLUMNS}
            rows={prefilteredRows}
            loading={loading}
            errorMessage={errorMessage}
            alwaysInlineColumnIds={["assessmentId", "title"]}
            rowKey={(a) => a.assessmentId}
            renderCell={renderCell}
          />
        )}
      </section>
    </main>
  );
}

// PUBLIC_INTERFACE
export function GetStartedPage() {
  /** Get Started page that provides a friendly, guided entry into the main portal sections. */
  return (
    <main className="App-main" aria-label="Get Started page">
      <section className="HelloCard HelloCard--wide" aria-label="Get Started content">
        <p className="HelloEyebrow">Digi Portal</p>
        <h1 className="HelloTitle">Get Started</h1>
        <p className="HelloSubtitle">
          Pick a section to explore—or open the chatbot and type “Learning Paths”, “RMG”, or “Assessments”.
        </p>

        <div className="HomeDashboard" role="region" aria-label="Get Started shortcuts">
          <Link className="MetricCard" to="/learning-paths" aria-label="Open Learning Paths">
            <div className="MetricCard-top">
              <div className="MetricCard-eyebrow">Structured journeys</div>
              <div className="MetricCard-title">Learning Paths</div>
            </div>
            <div className="MetricCard-footer">View →</div>
          </Link>

          <Link className="MetricCard" to="/skill-factories" aria-label="Open Skill Factories">
            <div className="MetricCard-top">
              <div className="MetricCard-eyebrow">Mentorship hubs</div>
              <div className="MetricCard-title">Skill Factories</div>
            </div>
            <div className="MetricCard-footer">View →</div>
          </Link>

          <Link className="MetricCard" to="/rmg-tracker" aria-label="Open RMG Tracker">
            <div className="MetricCard-top">
              <div className="MetricCard-eyebrow">Resource status</div>
              <div className="MetricCard-title">RMG Tracker</div>
            </div>
            <div className="MetricCard-footer">View →</div>
          </Link>

          <Link className="MetricCard" to="/assessments" aria-label="Open Assessments">
            <div className="MetricCard-top">
              <div className="MetricCard-eyebrow">Measure growth</div>
              <div className="MetricCard-title">Assessments</div>
            </div>
            <div className="MetricCard-footer">View →</div>
          </Link>
        </div>

        <div className="RmgToolbar" aria-label="Get Started actions">
          <Link className="RmgLink" to="/">
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
