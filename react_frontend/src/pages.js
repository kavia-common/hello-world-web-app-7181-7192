import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

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

/**
 * Simulates an API call with loading/error states.
 * This is where a real request will live later:
 *   fetch(`${process.env.REACT_APP_API_BASE}/home/metrics`, ...)
 */
async function fetchHomeMetricsMock({ signal } = {}) {
  // Simulate network latency
  await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, 650);
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

  // Toggle to validate error UI if needed.
  const shouldFail = false;
  if (shouldFail) {
    throw new Error("Failed to load dashboard metrics. Please try again.");
  }

  return DUMMY_HOME_METRICS_RESPONSE;
}

/**
 * Simulates an API call for Learning Path metrics with loading/error states.
 * This is where a real request will live later:
 *   fetch(`${process.env.REACT_APP_API_BASE}/home/learning-path-metrics`, ...)
 */
async function fetchHomeLearningPathMetricsMock({ signal } = {}) {
  // Simulate network latency (slightly staggered from the dashboard call)
  await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, 720);
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

  // Toggle to validate error UI if needed.
  const shouldFail = false;
  if (shouldFail) {
    throw new Error("Failed to load Learning Path metrics. Please try again.");
  }

  return DUMMY_HOME_LEARNING_PATH_METRICS_RESPONSE;
}

/**
 * Simulates an API call for Skill Factory metrics with loading/error states.
 * This is where a real request will live later:
 *   fetch(`${process.env.REACT_APP_API_BASE}/home/skill-factory-metrics`, ...)
 */
async function fetchHomeSkillFactoryMetricsMock({ signal } = {}) {
  // Simulate network latency (slightly staggered from other Home calls)
  await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, 760);
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

  // Toggle to validate error UI if needed.
  const shouldFail = false;
  if (shouldFail) {
    throw new Error("Failed to load Skill Factory metrics. Please try again.");
  }

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

function formatPercentOrDash(value, { digits = 0 } = {}) {
  const num = safeNumber(value);
  if (num === null) return "—";
  return `${(num * 100).toFixed(digits)}%`;
}

function rateToneClass(rate) {
  const num = safeNumber(rate);
  if (num === null) return "";
  // Very simple tone threshold for the pill.
  return num >= 0.5 ? "HomeLpRatePill--good" : "HomeLpRatePill--low";
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

/**
 * Skill Factories URL query parameters:
 * - q: global search term (we'll use this for skillFactoryName searches, but it searches across all columns)
 * - mentorPool: "in" | "not-in" (maps to Mentors Pool dropdown)
 * - employeePool: "in" | "not-in" (maps to Employees Pool dropdown)
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

function isInteractiveElement(target) {
  if (!target) return false;
  const el = target;
  const tag = String(el.tagName || "").toLowerCase();
  return tag === "a" || tag === "button" || tag === "input" || tag === "select" || tag === "textarea";
}

// PUBLIC_INTERFACE
export function HomePage() {
  /** Home page that renders a dashboard-style overview using mocked API metrics. */
  const navigate = useNavigate();

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
            className="RmgButton"
            onClick={load}
            disabled={loading}
            aria-disabled={loading ? "true" : "false"}
          >
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

        {/* New section: Skill Factory metrics (below existing dashboard) */}
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
                    <article
                      key={sf.skillFactoryId || sf.skillFactoryName}
                      className="SfMetricsCard"
                      aria-label={`${title} metrics`}
                    >
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
                                : m.key === "mentorCount"
                                  ? buildSkillFactoriesQuery({ q: baseQ })
                                  : m.key === "employeeCount"
                                    ? buildSkillFactoriesQuery({ q: baseQ })
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

        {/* Existing section: Learning Path metrics (keep intact) */}
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
            <div className="HomeLpTableWrap" role="region" aria-label="Learning Path metrics table">
              <table className="HomeLpTable">
                <thead>
                  <tr>
                    <th scope="col">Learning Path</th>
                    <th scope="col" style={{ textAlign: "right" }}>
                      Enrolled
                    </th>
                    <th scope="col" style={{ textAlign: "right" }}>
                      Completed
                    </th>
                    <th scope="col" style={{ textAlign: "right" }}>
                      In Progress
                    </th>
                    <th scope="col">Completion rate</th>
                  </tr>
                </thead>
                <tbody>
                  {lpMetricsRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="RmgEmptyCell">
                        No learning path metrics available.
                      </td>
                    </tr>
                  ) : (
                    lpMetricsRows.map((row) => {
                      const lpName = row.learningPathName || "";
                      const baseTo = buildLearningPathsQuery({ q: lpName });

                      return (
                        <tr
                          key={row.learningPathName}
                          role="button"
                          tabIndex={0}
                          aria-label={`View learning path: ${lpName || "Unknown"}`}
                          onClick={(e) => {
                            // If user clicks a nested interactive element (like the pills), let it handle navigation.
                            if (isInteractiveElement(e.target)) return;
                            navigate(baseTo);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              navigate(baseTo);
                            }
                          }}
                          style={{ cursor: "pointer" }}
                          title="Open Learning Paths with this Learning Path name pre-filtered"
                        >
                          <td>
                            <span className="HomeLpName">{row.learningPathName || "—"}</span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <span className="RmgMono">{metricLabelOrDash(row.enrolled)}</span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {/* Clickable: filter by q + status=completed */}
                            <Link
                              className="RmgMono"
                              to={buildLearningPathsQuery({ q: lpName, status: "completed" })}
                              aria-label={`Filter Learning Paths by ${lpName} and status completed`}
                              title="Open Learning Paths filtered to completed"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              {metricLabelOrDash(row.completed)}
                            </Link>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {/* Clickable: filter by q + status=inProgress */}
                            <Link
                              className="RmgMono"
                              to={buildLearningPathsQuery({ q: lpName, status: "inProgress" })}
                              aria-label={`Filter Learning Paths by ${lpName} and status in progress`}
                              title="Open Learning Paths filtered to in progress"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              {metricLabelOrDash(row.inProgress)}
                            </Link>
                          </td>
                          <td>
                            {/* Clickable pill: filter by q only */}
                            <Link
                              to={baseTo}
                              className={`HomeLpRatePill ${rateToneClass(row.completionRate)}`}
                              aria-label={`Filter Learning Paths by ${lpName} (completion rate ${formatPercentOrDash(row.completionRate, { digits: 0 })})`}
                              title={`Completion rate: ${formatPercentOrDash(row.completionRate, { digits: 0 })}. Click to filter by learning path name.`}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                              style={{ textDecoration: "none", color: "inherit" }}
                            >
                              {formatPercentOrDash(row.completionRate, { digits: 0 })}
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function PlaceholderPage({ title, description }) {
  return (
    <main className="App-main" aria-label={`${title} page`}>
      <section className="HelloCard" aria-label={`${title} content`}>
        <p className="HelloEyebrow">Digi Portal</p>
        <h1 className="HelloTitle">{title}</h1>
        <p className="HelloSubtitle">{description}</p>

        <div style={{ marginTop: 20 }}>
          <Link className="HelloCTA" to="/" aria-label="Back to home">
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}

/**
 * Mocked/dummy response used for the RMG Tracker table.
 * This intentionally mimics a typical API payload shape.
 * Replace this with a real fetch() call when backend is ready.
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

/**
 * Simulates an API call with loading/error states.
 * This is where a real request will live later:
 *   fetch(`${process.env.REACT_APP_API_BASE}/rmg`, ...)
 */
async function fetchRmgTrackerDataMock({ signal } = {}) {
  // Simulate network latency
  await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, 650);
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

  // Simulate a rare failure to ensure error UI works.
  // (Deterministic enough for users; tests do not depend on it.)
  const shouldFail = false;

  if (shouldFail) {
    throw new Error("Failed to load RMG Tracker data. Please try again.");
  }

  return DUMMY_RMG_RESPONSE;
}

function formatDateOrDash(value) {
  if (!value) return "—";
  // Keep it simple: display YYYY-MM-DD if already in ISO-like format.
  return value;
}

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(" ");
  return String(value);
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    String(a).localeCompare(String(b))
  );
}

// PUBLIC_INTERFACE
export function RmgTrackerPage() {
  /** RMG Tracker page that fetches (mocked) data and renders a table with loading and error states. */
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  // Table options
  const [searchText, setSearchText] = React.useState("");
  const [filters, setFilters] = React.useState({
    employeeType: "",
    currentStatus: "",
    location: "",
    grade: "",
  });

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

  const DEFAULT_VISIBLE_COLUMN_IDS = React.useMemo(
    () => ALL_COLUMNS.map((c) => c.id),
    [ALL_COLUMNS]
  );

  const [visibleColumnIds, setVisibleColumnIds] = React.useState(
    DEFAULT_VISIBLE_COLUMN_IDS
  );

  const [columnPanelOpen, setColumnPanelOpen] = React.useState(false);

  // Pagination
  const PAGE_SIZES = React.useMemo(() => [3, 5, 10, 20], []);
  const [pageSize, setPageSize] = React.useState(5);
  const [pageIndex, setPageIndex] = React.useState(0);

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

    // Avoid making useEffect callback async directly.
    (async () => {
      cleanup = await load();
    })();

    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [load]);

  // Build filter options from available values in the dataset (current rows)
  const filterOptions = React.useMemo(() => {
    const employeeType = uniqueSorted(rows.map((r) => r.employeeType));
    const currentStatus = uniqueSorted(rows.map((r) => r.currentStatus));
    const location = uniqueSorted(rows.map((r) => r.location));
    const grade = uniqueSorted(rows.map((r) => r.grade));

    return { employeeType, currentStatus, location, grade };
  }, [rows]);

  // Apply filters + global search
  const filteredRows = React.useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return rows.filter((r) => {
      // Basic dropdown filters (exact match)
      if (filters.employeeType && normalizeText(r.employeeType) !== filters.employeeType) {
        return false;
      }
      if (filters.currentStatus && normalizeText(r.currentStatus) !== filters.currentStatus) {
        return false;
      }
      if (filters.location && normalizeText(r.location) !== filters.location) {
        return false;
      }
      if (filters.grade && normalizeText(r.grade) !== filters.grade) {
        return false;
      }

      // Global search: match any cell (across ALL columns, not only visible ones).
      if (!query) return true;

      const anyMatch = ALL_COLUMNS.some((c) => {
        const value = r[c.id];
        return normalizeText(value).toLowerCase().includes(query);
      });

      return anyMatch;
    });
  }, [rows, filters, searchText, ALL_COLUMNS]);

  // Reset pagination when the dataset changes (search/filters/pageSize)
  React.useEffect(() => {
    setPageIndex(0);
  }, [
    searchText,
    filters.employeeType,
    filters.currentStatus,
    filters.location,
    filters.grade,
    pageSize,
  ]);

  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const start = safePageIndex * pageSize;
  const end = start + pageSize;
  const pagedRows = filteredRows.slice(start, end);

  const visibleColumns = React.useMemo(() => {
    const set = new Set(visibleColumnIds);
    return ALL_COLUMNS.filter((c) => set.has(c.id));
  }, [ALL_COLUMNS, visibleColumnIds]);

  function toggleColumn(colId) {
    setVisibleColumnIds((prev) => {
      const set = new Set(prev);
      if (set.has(colId)) set.delete(colId);
      else set.add(colId);

      // Ensure at least 1 column is always visible for usability.
      if (set.size === 0) return prev;
      return Array.from(set);
    });
  }

  function clearFilters() {
    setFilters({ employeeType: "", currentStatus: "", location: "", grade: "" });
    setSearchText("");
  }

  function renderCell(r, colId) {
    switch (colId) {
      case "empId":
        return <span className="RmgMono">{r.empId}</span>;
      case "allocationPct":
        return <span style={{ display: "inline-block", minWidth: 30 }}>{r.allocationPct}</span>;
      case "status":
        return (
          <span className={`RmgPill RmgPill--${String(r.status).toLowerCase()}`}>
            {r.status}
          </span>
        );
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
        <p className="HelloSubtitle">
          Resource overview fetched from an API (mocked response for now).
        </p>

        <div className="RmgToolbar" aria-label="RMG actions">
          <button
            type="button"
            className="RmgButton"
            onClick={load}
            disabled={loading}
            aria-disabled={loading ? "true" : "false"}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>

          <button
            type="button"
            className="RmgButton"
            onClick={() => setColumnPanelOpen((v) => !v)}
            aria-expanded={columnPanelOpen ? "true" : "false"}
            aria-controls="rmg-column-panel"
            disabled={loading}
          >
            Columns
          </button>

          <button
            type="button"
            className="RmgButton"
            onClick={clearFilters}
            disabled={loading}
          >
            Reset
          </button>

          <Link className="RmgLink" to="/">
            Back to Home
          </Link>
        </div>

        {/* Controls */}
        {!loading && !errorMessage && (
          <div className="RmgOptions" aria-label="RMG table options">
            <div className="RmgOptionsRow">
              <label className="RmgField">
                <span className="RmgFieldLabel">Search</span>
                <input
                  className="RmgInput"
                  type="search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search any field…"
                  aria-label="Global search"
                />
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Employee Type</span>
                <select
                  className="RmgSelect"
                  value={filters.employeeType}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, employeeType: e.target.value }))
                  }
                  aria-label="Filter by employee type"
                >
                  <option value="">All</option>
                  {filterOptions.employeeType.map((v) => (
                    <option key={`employeeType-${v}`} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Current Status</span>
                <select
                  className="RmgSelect"
                  value={filters.currentStatus}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, currentStatus: e.target.value }))
                  }
                  aria-label="Filter by current status"
                >
                  <option value="">All</option>
                  {filterOptions.currentStatus.map((v) => (
                    <option key={`currentStatus-${v}`} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Location</span>
                <select
                  className="RmgSelect"
                  value={filters.location}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, location: e.target.value }))
                  }
                  aria-label="Filter by location"
                >
                  <option value="">All</option>
                  {filterOptions.location.map((v) => (
                    <option key={`location-${v}`} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Grade</span>
                <select
                  className="RmgSelect"
                  value={filters.grade}
                  onChange={(e) => setFilters((f) => ({ ...f, grade: e.target.value }))}
                  aria-label="Filter by grade"
                >
                  <option value="">All</option>
                  {filterOptions.grade.map((v) => (
                    <option key={`grade-${v}`} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="RmgOptionsRow RmgOptionsRow--meta" aria-label="RMG table meta">
              <div className="RmgMetaText" aria-live="polite">
                Showing <strong>{totalRows === 0 ? 0 : start + 1}</strong>–<strong>{Math.min(end, totalRows)}</strong> of{" "}
                <strong>{totalRows}</strong>
              </div>

              <label className="RmgField RmgField--inline">
                <span className="RmgFieldLabel">Page size</span>
                <select
                  className="RmgSelect"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  aria-label="Select page size"
                >
                  {PAGE_SIZES.map((s) => (
                    <option key={`pageSize-${s}`} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <div className="RmgPager" aria-label="Pagination controls">
                <button
                  type="button"
                  className="RmgButton RmgButton--small"
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  disabled={safePageIndex <= 0}
                >
                  Prev
                </button>
                <span className="RmgPagerText" aria-label="Current page">
                  Page <strong>{safePageIndex + 1}</strong> of <strong>{totalPages}</strong>
                </span>
                <button
                  type="button"
                  className="RmgButton RmgButton--small"
                  onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safePageIndex >= totalPages - 1}
                >
                  Next
                </button>
              </div>
            </div>

            {columnPanelOpen && (
              <div id="rmg-column-panel" className="RmgColumnPanel" role="region" aria-label="Column visibility">
                <div className="RmgColumnPanelHeader">
                  <div className="RmgColumnPanelTitle">Visible columns</div>
                  <button
                    type="button"
                    className="RmgButton RmgButton--small"
                    onClick={() => setColumnPanelOpen(false)}
                    aria-label="Close column visibility panel"
                  >
                    Close
                  </button>
                </div>

                <div className="RmgColumnGrid">
                  {ALL_COLUMNS.map((c) => {
                    const checked = visibleColumnIds.includes(c.id);
                    const isLastVisible = checked && visibleColumnIds.length === 1;

                    return (
                      <label key={c.id} className="RmgCheckbox">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleColumn(c.id)}
                          disabled={isLastVisible}
                          aria-label={`Toggle column ${c.label}`}
                        />
                        <span>{c.label}</span>
                      </label>
                    );
                  })}
                </div>

                {visibleColumnIds.length === 1 && (
                  <div className="RmgHint" role="note">
                    At least one column must remain visible.
                  </div>
                )}
              </div>
            )}
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
          <div className="RmgTableWrap" role="region" aria-label="RMG table">
            <table className="RmgTable">
              <thead>
                <tr>
                  {visibleColumns.map((c) => (
                    <th key={c.id} scope="col" style={c.id === "allocationPct" ? { textAlign: "right" } : undefined}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={Math.max(1, visibleColumns.length)} className="RmgEmptyCell">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((r) => (
                    <tr key={r.empId}>
                      {visibleColumns.map((c) => (
                        <td key={`${r.empId}-${c.id}`} style={c.id === "allocationPct" ? { textAlign: "right" } : undefined}>
                          {renderCell(r, c.id)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

/**
 * Mocked response used for the Skill Factories table.
 * Replace this with a real fetch() call when backend is ready.
 */
const DUMMY_SKILL_FACTORIES_RESPONSE = {
  status: "success",
  data: [
    {
      skillFactoryId: "SF-PLATFORM-001",
      skillFactoryName: "Platform Engineering",
      mentors: [
        {
          mentorId: "M-001",
          mentorName: "Mentor A",
          mentorEmail: "mentor.a@example.com",
          isInPool: true,
        },
        {
          mentorId: "M-002",
          mentorName: "Mentor B",
          mentorEmail: "mentor.b@example.com",
          isInPool: false,
        },
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

/**
 * Simulates an API call with loading/error states.
 * This is where a real request will live later:
 *   fetch(`${process.env.REACT_APP_API_BASE}/skill-factories`, ...)
 */
async function fetchSkillFactoriesMock({ signal } = {}) {
  // Simulate network latency
  await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, 650);
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

  // Toggle to validate error UI if needed.
  const shouldFail = false;
  if (shouldFail) {
    throw new Error("Failed to load Skill Factories. Please try again.");
  }

  return DUMMY_SKILL_FACTORIES_RESPONSE;
}

function formatLearningPathsIsoDateTimeOrDash(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().replace(".000Z", "Z");
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
  if (Array.isArray(sf.mentors)) {
    flags.push(...sf.mentors.map((m) => m?.isInPool));
  }
  if (Array.isArray(sf.employees)) {
    flags.push(...sf.employees.map((e) => e?.isInPool));
  }
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
  /** Skill Factories page that fetches (mocked) data and renders a table with loading and error states + client-side table UX. */
  const location = useLocation();

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  // Table options (match RMG Tracker UX)
  const [searchText, setSearchText] = React.useState("");
  const [filters, setFilters] = React.useState({
    skillFactoryName: "",
    mentorPoolStatus: "",
    employeePoolStatus: "",
  });

  // Apply URL query parameters to pre-populate controls (mirrors LearningPathsPage approach).
  const hasAppliedQueryRef = React.useRef(false);
  React.useEffect(() => {
    const { q, mentorPool, employeePool } = parseSkillFactoriesQuery(location.search);

    // Keep the search input in sync with URL (supports manual edits and navigation changes).
    setSearchText(q);

    const normalizedMentorPool = normalizePoolParam(mentorPool);
    const normalizedEmployeePool = normalizePoolParam(employeePool);

    const nextMentorLabel = poolParamToLabel(normalizedMentorPool);
    const nextEmployeeLabel = poolParamToLabel(normalizedEmployeePool);

    if (!hasAppliedQueryRef.current) {
      // Apply once on first mount.
      setFilters((f) => ({
        ...f,
        mentorPoolStatus: nextMentorLabel || "",
        employeePoolStatus: nextEmployeeLabel || "",
      }));
      hasAppliedQueryRef.current = true;
      return;
    }

    // If URL changes while on the page, update accordingly.
    setFilters((f) => ({
      ...f,
      mentorPoolStatus: nextMentorLabel || "",
      employeePoolStatus: nextEmployeeLabel || "",
    }));
  }, [location.search]);

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

  const DEFAULT_VISIBLE_COLUMN_IDS = React.useMemo(
    () => ALL_COLUMNS.map((c) => c.id),
    [ALL_COLUMNS]
  );

  const [visibleColumnIds, setVisibleColumnIds] = React.useState(DEFAULT_VISIBLE_COLUMN_IDS);
  const [columnPanelOpen, setColumnPanelOpen] = React.useState(false);

  // Pagination
  const PAGE_SIZES = React.useMemo(() => [3, 5, 10, 20], []);
  const [pageSize, setPageSize] = React.useState(5);
  const [pageIndex, setPageIndex] = React.useState(0);

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

    // Avoid making useEffect callback async directly.
    (async () => {
      cleanup = await load();
    })();

    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [load]);

  const filterOptions = React.useMemo(() => {
    const skillFactoryName = uniqueSorted(rows.map((r) => r.skillFactoryName));

    // Keep the dropdowns very clear (and consistent with RMG Tracker “All” UX)
    const mentorPoolStatus = ["In pool", "Not in pool"];
    const employeePoolStatus = ["In pool", "Not in pool"];

    return { skillFactoryName, mentorPoolStatus, employeePoolStatus };
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return rows.filter((sf) => {
      const sfName = normalizeText(sf.skillFactoryName);

      if (filters.skillFactoryName && sfName !== filters.skillFactoryName) {
        return false;
      }

      const mentorsPool = getMentorPoolStatus(sf);
      if (filters.mentorPoolStatus && mentorsPool !== filters.mentorPoolStatus) {
        return false;
      }

      const employeesPool = getEmployeePoolStatus(sf);
      if (filters.employeePoolStatus && employeesPool !== filters.employeePoolStatus) {
        return false;
      }

      // Global search across all columns (not only visible ones)
      if (!query) return true;

      const anyMatch = ALL_COLUMNS.some((c) => {
        switch (c.id) {
          case "mentorCount":
            return String(safeArrayCount(sf.mentors)).toLowerCase().includes(query);
          case "employeeCount":
            return String(safeArrayCount(sf.employees)).toLowerCase().includes(query);
          case "mentorPoolStatus":
            return getMentorPoolStatus(sf).toLowerCase().includes(query);
          case "employeePoolStatus":
            return getEmployeePoolStatus(sf).toLowerCase().includes(query);
          case "hasAnyPoolMembers":
            return yesNo(flattenPoolFlags(sf)).toLowerCase().includes(query);
          case "mentors":
            return Array.isArray(sf.mentors)
              ? sf.mentors
                  .map((m) => `${m?.mentorName || ""} ${m?.mentorEmail || ""} ${yesNo(m?.isInPool)}`)
                  .join(" ")
                  .toLowerCase()
                  .includes(query)
              : false;
          case "employees":
            return Array.isArray(sf.employees)
              ? sf.employees
                  .map(
                    (e) =>
                      `${e?.id || ""} ${e?.name || ""} ${e?.email || ""} ${formatRatingOrDash(
                        e?.initialRating
                      )} ${formatRatingOrDash(e?.currentRating)} ${yesNo(e?.isInPool)}`
                  )
                  .join(" ")
                  .toLowerCase()
                  .includes(query)
              : false;
          case "createdAt":
          case "updatedAt":
            return normalizeText(formatIsoDateTimeOrDash(sf[c.id])).toLowerCase().includes(query);
          default:
            return normalizeText(sf[c.id]).toLowerCase().includes(query);
        }
      });

      return anyMatch;
    });
  }, [rows, filters, searchText, ALL_COLUMNS]);

  // Reset pagination when data set changes (search/filters/pageSize), matching RMG Tracker behavior
  React.useEffect(() => {
    setPageIndex(0);
  }, [searchText, filters.skillFactoryName, filters.mentorPoolStatus, filters.employeePoolStatus, pageSize]);

  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const start = safePageIndex * pageSize;
  const end = start + pageSize;
  const pagedRows = filteredRows.slice(start, end);

  const visibleColumns = React.useMemo(() => {
    const set = new Set(visibleColumnIds);
    return ALL_COLUMNS.filter((c) => set.has(c.id));
  }, [ALL_COLUMNS, visibleColumnIds]);

  function toggleColumn(colId) {
    setVisibleColumnIds((prev) => {
      const set = new Set(prev);
      if (set.has(colId)) set.delete(colId);
      else set.add(colId);

      // Ensure at least 1 column is always visible for usability.
      if (set.size === 0) return prev;
      return Array.from(set);
    });
  }

  function clearFilters() {
    setFilters({ skillFactoryName: "", mentorPoolStatus: "", employeePoolStatus: "" });
    setSearchText("");
  }

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
            title={`${e.email} • Initial ${formatRatingOrDash(e.initialRating)} • Current ${formatRatingOrDash(
              e.currentRating
            )} • ${e.isInPool ? "In pool" : "Not in pool"}`}
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
      case "skillFactoryName":
        return normalizeText(sf.skillFactoryName) || "—";
      case "mentorCount":
        return <span className="RmgMono">{safeArrayCount(sf.mentors)}</span>;
      case "employeeCount":
        return <span className="RmgMono">{safeArrayCount(sf.employees)}</span>;
      case "mentorPoolStatus":
        return getMentorPoolStatus(sf);
      case "employeePoolStatus":
        return getEmployeePoolStatus(sf);
      case "hasAnyPoolMembers":
        return (
          <span className={`RmgPill ${flattenPoolFlags(sf) ? "RmgPill--billable" : "RmgPill--bench"}`}>
            {yesNo(flattenPoolFlags(sf))}
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
          <button type="button" className="RmgButton" onClick={load} disabled={loading} aria-disabled={loading ? "true" : "false"}>
            {loading ? "Loading…" : "Refresh"}
          </button>

          <button
            type="button"
            className="RmgButton"
            onClick={() => setColumnPanelOpen((v) => !v)}
            aria-expanded={columnPanelOpen ? "true" : "false"}
            aria-controls="skillfactories-column-panel"
            disabled={loading}
          >
            Columns
          </button>

          <button type="button" className="RmgButton" onClick={clearFilters} disabled={loading}>
            Reset
          </button>

          <Link className="RmgLink" to="/">
            Back to Home
          </Link>
        </div>

        {/* Controls */}
        {!loading && !errorMessage && (
          <div className="RmgOptions" aria-label="Skill Factories table options">
            <div className="RmgOptionsRow">
              <label className="RmgField">
                <span className="RmgFieldLabel">Search</span>
                <input
                  className="RmgInput"
                  type="search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search any field…"
                  aria-label="Global search"
                />
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Skill Factory</span>
                <select
                  className="RmgSelect"
                  value={filters.skillFactoryName}
                  onChange={(e) => setFilters((f) => ({ ...f, skillFactoryName: e.target.value }))}
                  aria-label="Filter by skill factory name"
                >
                  <option value="">All</option>
                  {filterOptions.skillFactoryName.map((v) => (
                    <option key={`skillFactoryName-${v}`} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Mentors Pool</span>
                <select
                  className="RmgSelect"
                  value={filters.mentorPoolStatus}
                  onChange={(e) => setFilters((f) => ({ ...f, mentorPoolStatus: e.target.value }))}
                  aria-label="Filter by mentors pool status"
                >
                  <option value="">All</option>
                  {filterOptions.mentorPoolStatus.map((v) => (
                    <option key={`mentorPool-${v}`} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Employees Pool</span>
                <select
                  className="RmgSelect"
                  value={filters.employeePoolStatus}
                  onChange={(e) => setFilters((f) => ({ ...f, employeePoolStatus: e.target.value }))}
                  aria-label="Filter by employees pool status"
                >
                  <option value="">All</option>
                  {filterOptions.employeePoolStatus.map((v) => (
                    <option key={`employeePool-${v}`} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="RmgOptionsRow RmgOptionsRow--meta" aria-label="Skill Factories table meta">
              <div className="RmgMetaText" aria-live="polite">
                Showing <strong>{totalRows === 0 ? 0 : start + 1}</strong>–<strong>{Math.min(end, totalRows)}</strong> of{" "}
                <strong>{totalRows}</strong>
              </div>

              <label className="RmgField RmgField--inline">
                <span className="RmgFieldLabel">Page size</span>
                <select className="RmgSelect" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} aria-label="Select page size">
                  {PAGE_SIZES.map((s) => (
                    <option key={`pageSize-sf-${s}`} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <div className="RmgPager" aria-label="Pagination controls">
                <button type="button" className="RmgButton RmgButton--small" onClick={() => setPageIndex((p) => Math.max(0, p - 1))} disabled={safePageIndex <= 0}>
                  Prev
                </button>
                <span className="RmgPagerText" aria-label="Current page">
                  Page <strong>{safePageIndex + 1}</strong> of <strong>{totalPages}</strong>
                </span>
                <button
                  type="button"
                  className="RmgButton RmgButton--small"
                  onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safePageIndex >= totalPages - 1}
                >
                  Next
                </button>
              </div>
            </div>

            {columnPanelOpen && (
              <div id="skillfactories-column-panel" className="RmgColumnPanel" role="region" aria-label="Column visibility">
                <div className="RmgColumnPanelHeader">
                  <div className="RmgColumnPanelTitle">Visible columns</div>
                  <button type="button" className="RmgButton RmgButton--small" onClick={() => setColumnPanelOpen(false)} aria-label="Close column visibility panel">
                    Close
                  </button>
                </div>

                <div className="RmgColumnGrid">
                  {ALL_COLUMNS.map((c) => {
                    const checked = visibleColumnIds.includes(c.id);
                    const isLastVisible = checked && visibleColumnIds.length === 1;

                    return (
                      <label key={c.id} className="RmgCheckbox">
                        <input type="checkbox" checked={checked} onChange={() => toggleColumn(c.id)} disabled={isLastVisible} aria-label={`Toggle column ${c.label}`} />
                        <span>{c.label}</span>
                      </label>
                    );
                  })}
                </div>

                {visibleColumnIds.length === 1 && (
                  <div className="RmgHint" role="note">
                    At least one column must remain visible.
                  </div>
                )}
              </div>
            )}
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
          <div className="RmgTableWrap" role="region" aria-label="Skill Factories table">
            <table className="RmgTable">
              <thead>
                <tr>
                  {visibleColumns.map((c) => (
                    <th key={c.id} scope="col">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={Math.max(1, visibleColumns.length)} className="RmgEmptyCell">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((sf) => (
                    <tr key={sf.skillFactoryId}>
                      {visibleColumns.map((c) => (
                        <td key={`${sf.skillFactoryId}-${c.id}`}>{renderCell(sf, c.id)}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

/**
 * Mocked response used for the Learning Paths table.
 * Replace this with a real fetch() call when backend is ready.
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

/**
 * Simulates an API call with loading/error states.
 * This is where a real request will live later:
 *   fetch(`${process.env.REACT_APP_API_BASE}/learning-paths`, ...)
 */
async function fetchLearningPathsMock({ signal } = {}) {
  // Simulate network latency
  await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, 650);
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

  // Toggle to validate error UI if needed.
  const shouldFail = false;
  if (shouldFail) {
    throw new Error("Failed to load Learning Paths. Please try again.");
  }

  return DUMMY_LEARNING_PATHS_RESPONSE;
}

function formatAssessmentsIsoDateTimeOrDash(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().replace(".000Z", "Z");
}

function safeNumberOrDash(value) {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  return Number.isFinite(num) ? String(num) : "—";
}

function parseLearningPathsQuery(locationSearch) {
  const params = new URLSearchParams(locationSearch || "");
  const q = (params.get("q") || "").trim();
  const status = (params.get("status") || "").trim();
  return { q, status };
}

function normalizeLpStatusFilter(value) {
  // Accept a couple spellings, keep it simple.
  const v = String(value || "").trim().toLowerCase();
  if (v === "completed") return "completed";
  if (v === "inprogress" || v === "in_progress" || v === "in-progress") return "inProgress";
  if (v === "inprogresscount") return "inProgress";
  return "";
}

// PUBLIC_INTERFACE
export function LearningPathsPage() {
  /** Learning Paths page that fetches (mocked) data and renders a table with loading and error states + client-side table UX. */
  const location = useLocation();

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  // Table options (match RMG Tracker / Skill Factories UX)
  const [searchText, setSearchText] = React.useState("");
  const [filters, setFilters] = React.useState({
    duration: "",
    tag: "",
    // New: filter results by status derived from counts (completed / inProgress)
    status: "",
  });

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

  const DEFAULT_VISIBLE_COLUMN_IDS = React.useMemo(() => ALL_COLUMNS.map((c) => c.id), [ALL_COLUMNS]);

  const [visibleColumnIds, setVisibleColumnIds] = React.useState(DEFAULT_VISIBLE_COLUMN_IDS);
  const [columnPanelOpen, setColumnPanelOpen] = React.useState(false);

  // Pagination
  const PAGE_SIZES = React.useMemo(() => [3, 5, 10, 20], []);
  const [pageSize, setPageSize] = React.useState(5);
  const [pageIndex, setPageIndex] = React.useState(0);

  // Apply URL query parameters to pre-populate controls.
  // We only set duration/tag/status if they're valid once options exist (post-load), but q can be set immediately.
  const hasAppliedQueryRef = React.useRef(false);
  React.useEffect(() => {
    const { q, status } = parseLearningPathsQuery(location.search);

    // Always set q to keep input in sync with URL (also supports manual edits of the URL).
    setSearchText(q);

    // Only apply status once (avoid stomping user changes on subsequent rerenders),
    // but still respond if URL changes while on the page (new navigation).
    const normalized = normalizeLpStatusFilter(status);
    if (!hasAppliedQueryRef.current) {
      if (normalized) {
        setFilters((f) => ({ ...f, status: normalized }));
      }
      hasAppliedQueryRef.current = true;
      return;
    }

    // If the URL changes and differs from current, update accordingly.
    if (normalized) {
      setFilters((f) => ({ ...f, status: normalized }));
    } else if (status === "") {
      // Clear status if URL explicitly removed it.
      setFilters((f) => ({ ...f, status: "" }));
    }
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

    // Flatten tags into a single filter dropdown.
    const allTags = [];
    for (const r of rows) {
      if (Array.isArray(r?.tags)) allTags.push(...r.tags);
    }
    const tag = uniqueSorted(allTags);

    // New: status options correspond to Home metrics deep-links
    const status = [
      { value: "", label: "All" },
      { value: "completed", label: "Completed" },
      { value: "inProgress", label: "In Progress" },
    ];

    return { duration, tag, status };
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return rows.filter((lp) => {
      // Dropdown filters (exact match)
      if (filters.duration && normalizeText(lp.duration) !== filters.duration) {
        return false;
      }
      if (filters.tag) {
        const tags = Array.isArray(lp.tags) ? lp.tags : [];
        if (!tags.includes(filters.tag)) return false;
      }

      // New: status filter derived from counts.
      if (filters.status === "completed") {
        const n = Number(lp?.completedCount);
        if (!(Number.isFinite(n) && n > 0)) return false;
      }
      if (filters.status === "inProgress") {
        const n = Number(lp?.inProgressCount);
        if (!(Number.isFinite(n) && n > 0)) return false;
      }

      // Global search across all columns (not only visible ones)
      if (!query) return true;

      const anyMatch = ALL_COLUMNS.some((c) => {
        switch (c.id) {
          case "tags":
            return Array.isArray(lp.tags) ? lp.tags.join(" ").toLowerCase().includes(query) : false;
          case "courseLinks":
            return Array.isArray(lp.courseLinks) ? lp.courseLinks.join(" ").toLowerCase().includes(query) : false;
          case "createdAt":
          case "updatedAt":
            return normalizeText(formatLearningPathsIsoDateTimeOrDash(lp[c.id])).toLowerCase().includes(query);
          default:
            return normalizeText(lp[c.id]).toLowerCase().includes(query);
        }
      });

      return anyMatch;
    });
  }, [rows, filters, searchText, ALL_COLUMNS]);

  // Reset pagination when data set changes (search/filters/pageSize), matching existing pages
  React.useEffect(() => {
    setPageIndex(0);
  }, [searchText, filters.duration, filters.tag, filters.status, pageSize]);

  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const start = safePageIndex * pageSize;
  const end = start + pageSize;
  const pagedRows = filteredRows.slice(start, end);

  const visibleColumns = React.useMemo(() => {
    const set = new Set(visibleColumnIds);
    return ALL_COLUMNS.filter((c) => set.has(c.id));
  }, [ALL_COLUMNS, visibleColumnIds]);

  function toggleColumn(colId) {
    setVisibleColumnIds((prev) => {
      const set = new Set(prev);
      if (set.has(colId)) set.delete(colId);
      else set.add(colId);

      // Ensure at least 1 column is always visible for usability.
      if (set.size === 0) return prev;
      return Array.from(set);
    });
  }

  function clearFilters() {
    setFilters({ duration: "", tag: "", status: "" });
    setSearchText("");
  }

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

          <button
            type="button"
            className="RmgButton"
            onClick={() => setColumnPanelOpen((v) => !v)}
            aria-expanded={columnPanelOpen ? "true" : "false"}
            aria-controls="learningpaths-column-panel"
            disabled={loading}
          >
            Columns
          </button>

          <button type="button" className="RmgButton" onClick={clearFilters} disabled={loading}>
            Reset
          </button>

          <Link className="RmgLink" to="/">
            Back to Home
          </Link>
        </div>

        {/* Controls */}
        {!loading && !errorMessage && (
          <div className="RmgOptions" aria-label="Learning Paths table options">
            <div className="RmgOptionsRow">
              <label className="RmgField">
                <span className="RmgFieldLabel">Search</span>
                <input
                  className="RmgInput"
                  type="search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search any field…"
                  aria-label="Global search"
                />
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Duration</span>
                <select
                  className="RmgSelect"
                  value={filters.duration}
                  onChange={(e) => setFilters((f) => ({ ...f, duration: e.target.value }))}
                  aria-label="Filter by duration"
                >
                  <option value="">All</option>
                  {filterOptions.duration.map((v) => (
                    <option key={`lp-duration-${v}`} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Tag</span>
                <select
                  className="RmgSelect"
                  value={filters.tag}
                  onChange={(e) => setFilters((f) => ({ ...f, tag: e.target.value }))}
                  aria-label="Filter by tag"
                >
                  <option value="">All</option>
                  {filterOptions.tag.map((v) => (
                    <option key={`lp-tag-${v}`} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Status</span>
                <select
                  className="RmgSelect"
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                  aria-label="Filter by status"
                >
                  {filterOptions.status.map((opt) => (
                    <option key={`lp-status-${opt.value || "all"}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="RmgOptionsRow RmgOptionsRow--meta" aria-label="Learning Paths table meta">
              <div className="RmgMetaText" aria-live="polite">
                Showing <strong>{totalRows === 0 ? 0 : start + 1}</strong>–<strong>{Math.min(end, totalRows)}</strong> of{" "}
                <strong>{totalRows}</strong>
              </div>

              <label className="RmgField RmgField--inline">
                <span className="RmgFieldLabel">Page size</span>
                <select className="RmgSelect" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} aria-label="Select page size">
                  {PAGE_SIZES.map((s) => (
                    <option key={`pageSize-lp-${s}`} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <div className="RmgPager" aria-label="Pagination controls">
                <button type="button" className="RmgButton RmgButton--small" onClick={() => setPageIndex((p) => Math.max(0, p - 1))} disabled={safePageIndex <= 0}>
                  Prev
                </button>
                <span className="RmgPagerText" aria-label="Current page">
                  Page <strong>{safePageIndex + 1}</strong> of <strong>{totalPages}</strong>
                </span>
                <button type="button" className="RmgButton RmgButton--small" onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))} disabled={safePageIndex >= totalPages - 1}>
                  Next
                </button>
              </div>
            </div>

            {columnPanelOpen && (
              <div id="learningpaths-column-panel" className="RmgColumnPanel" role="region" aria-label="Column visibility">
                <div className="RmgColumnPanelHeader">
                  <div className="RmgColumnPanelTitle">Visible columns</div>
                  <button type="button" className="RmgButton RmgButton--small" onClick={() => setColumnPanelOpen(false)} aria-label="Close column visibility panel">
                    Close
                  </button>
                </div>

                <div className="RmgColumnGrid">
                  {ALL_COLUMNS.map((c) => {
                    const checked = visibleColumnIds.includes(c.id);
                    const isLastVisible = checked && visibleColumnIds.length === 1;

                    return (
                      <label key={c.id} className="RmgCheckbox">
                        <input type="checkbox" checked={checked} onChange={() => toggleColumn(c.id)} disabled={isLastVisible} aria-label={`Toggle column ${c.label}`} />
                        <span>{c.label}</span>
                      </label>
                    );
                  })}
                </div>

                {visibleColumnIds.length === 1 && (
                  <div className="RmgHint" role="note">
                    At least one column must remain visible.
                  </div>
                )}
              </div>
            )}
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
          <div className="RmgTableWrap" role="region" aria-label="Learning Paths table">
            <table className="RmgTable">
              <thead>
                <tr>
                  {visibleColumns.map((c) => (
                    <th key={c.id} scope="col">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={Math.max(1, visibleColumns.length)} className="RmgEmptyCell">
                      No learning paths found.
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((lp) => (
                    <tr key={lp.learningPathName}>
                      {visibleColumns.map((c) => (
                        <td key={`${lp.learningPathName}-${c.id}`}>{renderCell(lp, c.id)}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

/**
 * Mocked response used for the Assessments table.
 * Replace this with a real fetch() call when backend is ready.
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

/**
 * Simulates an API call with loading/error states.
 * This is where a real request will live later:
 *   fetch(`${process.env.REACT_APP_API_BASE}/assessments`, ...)
 */
async function fetchAssessmentsMock({ signal } = {}) {
  // Simulate network latency
  await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, 650);
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

  // Toggle to validate error UI if needed.
  const shouldFail = false;
  if (shouldFail) {
    throw new Error("Failed to load Assessments. Please try again.");
  }

  return DUMMY_ASSESSMENTS_RESPONSE;
}

function formatIsoDateTimeOrDash(value) {
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
  const label = `${a?.employeeName || "—"} (${a?.employeeId || "—"})`;
  return label;
}

function assigneeContactOrDash(assignedTo) {
  if (!Array.isArray(assignedTo) || assignedTo.length === 0) return "—";
  const a = assignedTo[0];
  const parts = [a?.email, a?.employeeId].filter(Boolean);
  return parts.length ? parts.join(" • ") : "—";
}

function normalizeAssessmentStatus(value) {
  // Used only for pill styling classes.
  // Converts e.g. "In Review" -> "in-review"
  if (!value) return "";
  return String(value).trim().toLowerCase().replace(/\s+/g, "-");
}

// PUBLIC_INTERFACE
export function AssessmentsPage() {
  /** Assessments page that fetches (mocked) data and renders a table with loading and error states + client-side table UX. */
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  // Table options (match RMG Tracker / Skill Factories / Learning Paths UX)
  const [searchText, setSearchText] = React.useState("");
  const [filters, setFilters] = React.useState({
    status: "",
    dueMonth: "",
  });

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

  const DEFAULT_VISIBLE_COLUMN_IDS = React.useMemo(() => ALL_COLUMNS.map((c) => c.id), [ALL_COLUMNS]);

  const [visibleColumnIds, setVisibleColumnIds] = React.useState(DEFAULT_VISIBLE_COLUMN_IDS);
  const [columnPanelOpen, setColumnPanelOpen] = React.useState(false);

  // Pagination
  const PAGE_SIZES = React.useMemo(() => [3, 5, 10, 20], []);
  const [pageSize, setPageSize] = React.useState(5);
  const [pageIndex, setPageIndex] = React.useState(0);

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
    // Status options derived from data (and sorted)
    const status = uniqueSorted(rows.map((r) => r?.status));

    // Due Month: derived from dueDate
    const months = [];
    for (const r of rows) {
      const value = r?.dueDate;
      const d = value ? new Date(value) : null;
      if (!d || Number.isNaN(d.getTime())) continue;

      // YYYY-MM (safe, stable, sortable)
      const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      months.push(month);
    }
    const dueMonth = uniqueSorted(months);

    return { status, dueMonth };
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return rows.filter((a) => {
      // Dropdown filters
      if (filters.status && normalizeText(a.status) !== filters.status) {
        return false;
      }
      if (filters.dueMonth) {
        const d = a?.dueDate ? new Date(a.dueDate) : null;
        const month =
          d && !Number.isNaN(d.getTime())
            ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
            : "";
        if (month !== filters.dueMonth) return false;
      }

      // Global search across all columns (not only visible ones)
      if (!query) return true;

      const anyMatch = ALL_COLUMNS.some((c) => {
        switch (c.id) {
          case "assignedTo":
            return normalizeText(firstAssigneeOrDash(a.assignedTo)).toLowerCase().includes(query);
          case "assigneeContact":
            return normalizeText(assigneeContactOrDash(a.assignedTo)).toLowerCase().includes(query);
          case "dueDate":
          case "createdAt":
          case "updatedAt":
            return normalizeText(formatAssessmentsIsoDateTimeOrDash(a[c.id])).toLowerCase().includes(query);
          case "marks":
            return String(formatMarkOrDash(a.marks)).toLowerCase().includes(query);
          default:
            return normalizeText(a[c.id]).toLowerCase().includes(query);
        }
      });

      return anyMatch;
    });
  }, [rows, filters, searchText, ALL_COLUMNS]);

  // Reset pagination when the dataset changes (search/filters/pageSize)
  React.useEffect(() => {
    setPageIndex(0);
  }, [searchText, filters.status, filters.dueMonth, pageSize]);

  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const start = safePageIndex * pageSize;
  const end = start + pageSize;
  const pagedRows = filteredRows.slice(start, end);

  const visibleColumns = React.useMemo(() => {
    const set = new Set(visibleColumnIds);
    return ALL_COLUMNS.filter((c) => set.has(c.id));
  }, [ALL_COLUMNS, visibleColumnIds]);

  function toggleColumn(colId) {
    setVisibleColumnIds((prev) => {
      const set = new Set(prev);
      if (set.has(colId)) set.delete(colId);
      else set.add(colId);

      // Ensure at least 1 column is always visible for usability.
      if (set.size === 0) return prev;
      return Array.from(set);
    });
  }

  function clearFilters() {
    setFilters({ status: "", dueMonth: "" });
    setSearchText("");
  }

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

          <button
            type="button"
            className="RmgButton"
            onClick={() => setColumnPanelOpen((v) => !v)}
            aria-expanded={columnPanelOpen ? "true" : "false"}
            aria-controls="assessments-column-panel"
            disabled={loading}
          >
            Columns
          </button>

          <button type="button" className="RmgButton" onClick={clearFilters} disabled={loading}>
            Reset
          </button>

          <Link className="RmgLink" to="/">
            Back to Home
          </Link>
        </div>

        {/* Controls */}
        {!loading && !errorMessage && (
          <div className="RmgOptions" aria-label="Assessments table options">
            <div className="RmgOptionsRow">
              <label className="RmgField">
                <span className="RmgFieldLabel">Search</span>
                <input
                  className="RmgInput"
                  type="search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search any field…"
                  aria-label="Global search"
                />
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Status</span>
                <select
                  className="RmgSelect"
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                  aria-label="Filter by status"
                >
                  <option value="">All</option>
                  {filterOptions.status.map((v) => (
                    <option key={`assessment-status-${v}`} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>

              <label className="RmgField">
                <span className="RmgFieldLabel">Due month</span>
                <select
                  className="RmgSelect"
                  value={filters.dueMonth}
                  onChange={(e) => setFilters((f) => ({ ...f, dueMonth: e.target.value }))}
                  aria-label="Filter by due month"
                >
                  <option value="">All</option>
                  {filterOptions.dueMonth.map((v) => (
                    <option key={`assessment-duemonth-${v}`} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="RmgOptionsRow RmgOptionsRow--meta" aria-label="Assessments table meta">
              <div className="RmgMetaText" aria-live="polite">
                Showing <strong>{totalRows === 0 ? 0 : start + 1}</strong>–<strong>{Math.min(end, totalRows)}</strong> of{" "}
                <strong>{totalRows}</strong>
              </div>

              <label className="RmgField RmgField--inline">
                <span className="RmgFieldLabel">Page size</span>
                <select className="RmgSelect" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} aria-label="Select page size">
                  {PAGE_SIZES.map((s) => (
                    <option key={`pageSize-assessments-${s}`} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <div className="RmgPager" aria-label="Pagination controls">
                <button type="button" className="RmgButton RmgButton--small" onClick={() => setPageIndex((p) => Math.max(0, p - 1))} disabled={safePageIndex <= 0}>
                  Prev
                </button>
                <span className="RmgPagerText" aria-label="Current page">
                  Page <strong>{safePageIndex + 1}</strong> of <strong>{totalPages}</strong>
                </span>
                <button type="button" className="RmgButton RmgButton--small" onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))} disabled={safePageIndex >= totalPages - 1}>
                  Next
                </button>
              </div>
            </div>

            {columnPanelOpen && (
              <div id="assessments-column-panel" className="RmgColumnPanel" role="region" aria-label="Column visibility">
                <div className="RmgColumnPanelHeader">
                  <div className="RmgColumnPanelTitle">Visible columns</div>
                  <button type="button" className="RmgButton RmgButton--small" onClick={() => setColumnPanelOpen(false)} aria-label="Close column visibility panel">
                    Close
                  </button>
                </div>

                <div className="RmgColumnGrid">
                  {ALL_COLUMNS.map((c) => {
                    const checked = visibleColumnIds.includes(c.id);
                    const isLastVisible = checked && visibleColumnIds.length === 1;

                    return (
                      <label key={c.id} className="RmgCheckbox">
                        <input type="checkbox" checked={checked} onChange={() => toggleColumn(c.id)} disabled={isLastVisible} aria-label={`Toggle column ${c.label}`} />
                        <span>{c.label}</span>
                      </label>
                    );
                  })}
                </div>

                {visibleColumnIds.length === 1 && (
                  <div className="RmgHint" role="note">
                    At least one column must remain visible.
                  </div>
                )}
              </div>
            )}
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
          <div className="RmgTableWrap" role="region" aria-label="Assessments table">
            <table className="RmgTable">
              <thead>
                <tr>
                  {visibleColumns.map((c) => (
                    <th key={c.id} scope="col">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={Math.max(1, visibleColumns.length)} className="RmgEmptyCell">
                      No assessments found.
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((a) => (
                    <tr key={a.assessmentId}>
                      {visibleColumns.map((c) => (
                        <td key={`${a.assessmentId}-${c.id}`}>{renderCell(a, c.id)}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
