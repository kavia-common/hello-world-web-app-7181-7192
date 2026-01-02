import React from "react";
import { Link, useLocation } from "react-router-dom";
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
          <button
            type="button"
            className="RmgButton RmgIconOnlyButton"
            onClick={load}
            disabled={loading}
            aria-disabled={loading ? "true" : "false"}
            aria-label="Refresh dashboard"
            title="Refresh"
          >
            <span className="pi pi-refresh" aria-hidden="true" />
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
            <button
              type="button"
              className="RmgButton RmgButton--danger RmgIconOnlyButton"
              onClick={load}
              aria-label="Retry loading dashboard metrics"
              title="Try again"
            >
              <span className="pi pi-refresh" aria-hidden="true" />
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
                className="RmgButton RmgIconOnlyButton"
                onClick={loadSkillFactoryMetrics}
                disabled={sfMetricsLoading}
                aria-disabled={sfMetricsLoading ? "true" : "false"}
                aria-label="Refresh Skill Factory metrics"
                title="Refresh"
              >
                <span className="pi pi-refresh" aria-hidden="true" />
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
              <button
                type="button"
                className="RmgButton RmgButton--danger RmgIconOnlyButton"
                onClick={loadSkillFactoryMetrics}
                aria-label="Retry loading Skill Factory metrics"
                title="Try again"
              >
                <span className="pi pi-refresh" aria-hidden="true" />
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
                className="RmgButton RmgIconOnlyButton"
                onClick={loadLearningPathMetrics}
                disabled={lpMetricsLoading}
                aria-disabled={lpMetricsLoading ? "true" : "false"}
                aria-label="Refresh Learning Path metrics"
                title="Refresh"
              >
                <span className="pi pi-refresh" aria-hidden="true" />
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
              <button
                type="button"
                className="RmgButton RmgButton--danger RmgIconOnlyButton"
                onClick={loadLearningPathMetrics}
                aria-label="Retry loading Learning Path metrics"
                title="Try again"
              >
                <span className="pi pi-refresh" aria-hidden="true" />
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
  /** RMG Tracker page that fetches (mocked) data and renders a PrimeReact table with built-in per-column filters. */
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  const ALL_COLUMNS = React.useMemo(
    () => [
      { id: "empId", label: "Emp ID" },
      { id: "name", label: "Name" },
      { id: "role", label: "Role" },
      { id: "project", label: "Project" },
      { id: "allocationPct", label: "Allocation %" },
      { id: "status", label: "Status" },
      { id: "currentStatus", label: "Current Status" },
      { id: "employeeType", label: "Employee Type" },
      { id: "grade", label: "Grade" },
      { id: "manager", label: "Manager" },
      { id: "location", label: "Location" },
      { id: "startDate", label: "Start" },
      { id: "endDate", label: "End" },
      { id: "skills", label: "Skills" },
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
          <button
            type="button"
            className="RmgButton RmgIconOnlyButton"
            onClick={load}
            disabled={loading}
            aria-disabled={loading ? "true" : "false"}
            aria-label="Refresh RMG Tracker"
            title="Refresh"
          >
            <span className="pi pi-refresh" aria-hidden="true" />
          </button>

          <Link className="RmgLink" to="/">
            Back to Home
          </Link>
        </div>

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
            <button
              type="button"
              className="RmgButton RmgButton--danger RmgIconOnlyButton"
              onClick={load}
              aria-label="Retry loading RMG Tracker data"
              title="Try again"
            >
              <span className="pi pi-refresh" aria-hidden="true" />
            </button>
          </div>
        )}

        {!loading && !errorMessage && (
          <PrimeDataTableCard
            title="RMG Tracker"
            subtitle="Use per-column filters in the header row, or global search above the table."
            columns={ALL_COLUMNS}
            rows={rows}
            loading={loading}
            errorMessage={errorMessage}
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
  /** Skill Factories page that fetches (mocked) data and renders a PrimeReact table with built-in per-column filters. */
  useLocation(); // kept to avoid changing router usage patterns; top filter panel is removed

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  const ALL_COLUMNS = React.useMemo(
    () => [
      { id: "skillFactoryId", label: "Skill Factory ID" },
      { id: "skillFactoryName", label: "Skill Factory Name" },
      { id: "mentorCount", label: "Mentors (#)" },
      { id: "employeeCount", label: "Employees (#)" },
      { id: "mentorPoolStatus", label: "Mentors Pool" },
      { id: "employeePoolStatus", label: "Employees Pool" },
      { id: "hasAnyPoolMembers", label: "Any In Pool" },
      { id: "mentors", label: "Mentors" },
      { id: "employees", label: "Employees" },
      { id: "createdAt", label: "Created At" },
      { id: "updatedAt", label: "Updated At" },
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

      // Add derived fields used by the table columns so per-column filters work naturally.
      const enriched = response.data.map((sf) => ({
        ...sf,
        mentorCount: safeArrayCount(sf.mentors),
        employeeCount: safeArrayCount(sf.employees),
        mentorPoolStatus: getMentorPoolStatus(sf),
        employeePoolStatus: getEmployeePoolStatus(sf),
        hasAnyPoolMembers: yesNo(flattenPoolFlags(sf)),
      }));

      setRows(enriched);
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

  function renderMentorChips(sf) {
    if (!Array.isArray(sf.mentors) || sf.mentors.length === 0) return "—";
    return (
      <div className="RmgChips" aria-label={`${sf.skillFactoryName} mentors`}>
        {sf.mentors.map((m) => (
          <span
            key={m.mentorId}
            className="RmgChip"
            title={`${m.mentorEmail} • ${m.isInPool ? "In pool" : "Not in pool"}`}
          >
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
      case "employeeCount":
        return <span className="RmgMono">{sf[colId]}</span>;
      case "hasAnyPoolMembers":
        return (
          <span className={`RmgPill ${flattenPoolFlags(sf) ? "RmgPill--billable" : "RmgPill--bench"}`}>
            {sf.hasAnyPoolMembers}
          </span>
        );
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
          <button
            type="button"
            className="RmgButton RmgIconOnlyButton"
            onClick={load}
            disabled={loading}
            aria-disabled={loading ? "true" : "false"}
            aria-label="Refresh Skill Factories"
            title="Refresh"
          >
            <span className="pi pi-refresh" aria-hidden="true" />
          </button>

          <Link className="RmgLink" to="/">
            Back to Home
          </Link>
        </div>

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
            <button
              type="button"
              className="RmgButton RmgButton--danger RmgIconOnlyButton"
              onClick={load}
              aria-label="Retry loading Skill Factories data"
              title="Try again"
            >
              <span className="pi pi-refresh" aria-hidden="true" />
            </button>
          </div>
        )}

        {!loading && !errorMessage && (
          <PrimeDataTableCard
            title="Skill Factories"
            subtitle="Use per-column filters in the header row, or global search above the table."
            columns={ALL_COLUMNS}
            rows={rows}
            loading={loading}
            errorMessage={errorMessage}
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
  /** Learning Paths page that fetches (mocked) data and renders a PrimeReact table with built-in per-column filters. */
  useLocation(); // kept to avoid changing router usage patterns; top filter panel is removed

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  const ALL_COLUMNS = React.useMemo(
    () => [
      { id: "learningPathName", label: "Learning Path Name" },
      { id: "description", label: "Description" },
      { id: "tags", label: "Tags" },
      { id: "courseLinks", label: "Course Links" },
      { id: "duration", label: "Duration" },
      { id: "enrolledCount", label: "Enrolled" },
      { id: "completedCount", label: "Completed" },
      { id: "inProgressCount", label: "In Progress" },
      { id: "createdAt", label: "Created At" },
      { id: "updatedAt", label: "Updated At" },
    ],
    []
  );

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
          <button
            type="button"
            className="RmgButton RmgIconOnlyButton"
            onClick={load}
            disabled={loading}
            aria-disabled={loading ? "true" : "false"}
            aria-label="Refresh Learning Paths"
            title="Refresh"
          >
            <span className="pi pi-refresh" aria-hidden="true" />
          </button>

          <Link className="RmgLink" to="/">
            Back to Home
          </Link>
        </div>

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
            <button
              type="button"
              className="RmgButton RmgButton--danger RmgIconOnlyButton"
              onClick={load}
              aria-label="Retry loading Learning Paths data"
              title="Try again"
            >
              <span className="pi pi-refresh" aria-hidden="true" />
            </button>
          </div>
        )}

        {!loading && !errorMessage && (
          <PrimeDataTableCard
            title="Learning Paths"
            subtitle="Use per-column filters in the header row, or global search above the table."
            columns={ALL_COLUMNS}
            rows={rows}
            loading={loading}
            errorMessage={errorMessage}
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
  /** Assessments page that fetches (mocked) data and renders a PrimeReact table with built-in per-column filters. */
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  const ALL_COLUMNS = React.useMemo(
    () => [
      { id: "assessmentId", label: "Assessment ID" },
      { id: "title", label: "Title" },
      { id: "description", label: "Description" },
      { id: "assignedTo", label: "Assigned To" },
      { id: "assigneeContact", label: "Contact" },
      { id: "dueDate", label: "Due Date" },
      { id: "status", label: "Status" },
      { id: "marks", label: "Marks" },
      { id: "basisOfScoring", label: "Basis of Scoring" },
      { id: "strength", label: "Strength" },
      { id: "areasOfImprovement", label: "Areas of Improvement" },
      { id: "createdAt", label: "Created At" },
      { id: "updatedAt", label: "Updated At" },
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

      // Add derived fields used by the table columns so per-column filters work naturally.
      const enriched = response.data.map((a) => ({
        ...a,
        assignedTo: firstAssigneeOrDash(a.assignedTo),
        assigneeContact: assigneeContactOrDash(a.assignedTo),
      }));

      setRows(enriched);
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

  function renderCell(a, colId) {
    switch (colId) {
      case "assessmentId":
        return <span className="RmgMono">{normalizeText(a.assessmentId) || "—"}</span>;
      case "title":
        return <span style={{ fontWeight: 900 }}>{normalizeText(a.title) || "—"}</span>;
      case "assignedTo":
        return <span title={a.assigneeContact}>{a.assignedTo}</span>;
      case "assigneeContact":
        return <span className="RmgMono">{a.assigneeContact}</span>;
      case "dueDate":
        return <span className="RmgMono">{formatAssessmentsIsoDateTimeOrDash(a.dueDate)}</span>;
      case "createdAt":
      case "updatedAt":
        return <span className="RmgMono">{formatAssessmentsIsoDateTimeOrDash(a[colId])}</span>;
      case "marks":
        return <span className="RmgMono">{formatMarkOrDash(a.marks)}</span>;
      case "status":
        return (
          <span className={`RmgPill RmgPill--${normalizeAssessmentStatus(a.status)}`}>
            {normalizeText(a.status) || "—"}
          </span>
        );
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
          <button
            type="button"
            className="RmgButton RmgIconOnlyButton"
            onClick={load}
            disabled={loading}
            aria-disabled={loading ? "true" : "false"}
            aria-label="Refresh Assessments"
            title="Refresh"
          >
            <span className="pi pi-refresh" aria-hidden="true" />
          </button>

          <Link className="RmgLink" to="/">
            Back to Home
          </Link>
        </div>

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
            <button
              type="button"
              className="RmgButton RmgButton--danger RmgIconOnlyButton"
              onClick={load}
              aria-label="Retry loading Assessments data"
              title="Try again"
            >
              <span className="pi pi-refresh" aria-hidden="true" />
            </button>
          </div>
        )}

        {!loading && !errorMessage && (
          <PrimeDataTableCard
            title="Assessments"
            subtitle="Use per-column filters in the header row, or global search above the table."
            columns={ALL_COLUMNS}
            rows={rows}
            loading={loading}
            errorMessage={errorMessage}
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
