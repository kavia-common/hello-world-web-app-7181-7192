import React from "react";
import { Link } from "react-router-dom";

/**
 * Simple pages used by the app router.
 * Kept lightweight and styled via existing App.css utility-ish classes.
 */

// PUBLIC_INTERFACE
export function HomePage() {
  /** Home page that preserves the existing centered hero content. */
  return (
    <main className="App-main" aria-label="Welcome page">
      <section className="HelloCard" aria-label="Welcome hero">
        <h1 className="HelloTitle">Welcome to Digi Portal</h1>
        <p className="HelloSubtitle">Build, assess, and grow your digital skills.</p>

        <div style={{ marginTop: 20 }}>
          <a className="HelloCTA" href="/" aria-label="Get started">
            Get Started
          </a>
        </div>
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

// PUBLIC_INTERFACE
export function RmgTrackerPage() {
  /** RMG Tracker page that fetches (mocked) data and renders a table with loading and error states. */
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

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
                  <th scope="col">Emp ID</th>
                  <th scope="col">Name</th>
                  <th scope="col">Role</th>
                  <th scope="col">Project</th>
                  <th scope="col" style={{ textAlign: "right" }}>
                    Allocation %
                  </th>
                  <th scope="col">Status</th>
                  <th scope="col">Manager</th>
                  <th scope="col">Location</th>
                  <th scope="col">Start</th>
                  <th scope="col">End</th>
                  <th scope="col">Skills</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="RmgEmptyCell">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.empId}>
                      <td className="RmgMono">{r.empId}</td>
                      <td>{r.name}</td>
                      <td>{r.role}</td>
                      <td>{r.project}</td>
                      <td style={{ textAlign: "right" }}>{r.allocationPct}</td>
                      <td>
                        <span className={`RmgPill RmgPill--${String(r.status).toLowerCase()}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>{r.manager}</td>
                      <td>{r.location}</td>
                      <td className="RmgMono">{formatDateOrDash(r.startDate)}</td>
                      <td className="RmgMono">{formatDateOrDash(r.endDate)}</td>
                      <td>
                        {Array.isArray(r.skills) ? (
                          <div className="RmgChips" aria-label={`${r.name} skills`}>
                            {r.skills.map((s) => (
                              <span key={`${r.empId}-${s}`} className="RmgChip">
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
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

// PUBLIC_INTERFACE
export function SkillFactoriesPage() {
  /** Placeholder page for Skill Factories route. */
  return (
    <PlaceholderPage
      title="Skill Factories"
      description="Explore curated skill-building programs here. (Placeholder)"
    />
  );
}

// PUBLIC_INTERFACE
export function LearningPathsPage() {
  /** Placeholder page for Learning Paths route. */
  return (
    <PlaceholderPage
      title="Learning Paths"
      description="Follow structured learning paths here. (Placeholder)"
    />
  );
}

// PUBLIC_INTERFACE
export function AssessmentsPage() {
  /** Placeholder page for Assessments route. */
  return (
    <PlaceholderPage
      title="Assessments"
      description="Take assessments and measure growth here. (Placeholder)"
    />
  );
}
