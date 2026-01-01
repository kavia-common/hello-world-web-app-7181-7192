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
      if (
        filters.currentStatus &&
        normalizeText(r.currentStatus) !== filters.currentStatus
      ) {
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
  }, [searchText, filters.employeeType, filters.currentStatus, filters.location, filters.grade, pageSize]);

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
                Showing <strong>{totalRows === 0 ? 0 : start + 1}</strong>–
                <strong>{Math.min(end, totalRows)}</strong> of{" "}
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
              <div
                id="rmg-column-panel"
                className="RmgColumnPanel"
                role="region"
                aria-label="Column visibility"
              >
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
                    <th
                      key={c.id}
                      scope="col"
                      style={c.id === "allocationPct" ? { textAlign: "right" } : undefined}
                    >
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
                        <td
                          key={`${r.empId}-${c.id}`}
                          style={c.id === "allocationPct" ? { textAlign: "right" } : undefined}
                        >
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

function formatIsoDateTimeOrDash(value) {
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

// PUBLIC_INTERFACE
export function SkillFactoriesPage() {
  /** Skill Factories page that fetches (mocked) data and renders a table with loading and error states. */
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const controller = new AbortController();

    try {
      const response = await fetchSkillFactoriesMock({ signal: controller.signal });

      if (
        !response ||
        response.status !== "success" ||
        !Array.isArray(response.data)
      ) {
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
    <main className="App-main" aria-label="Skill Factories page">
      <section className="HelloCard HelloCard--wide" aria-label="Skill Factories content">
        <p className="HelloEyebrow">Digi Portal</p>
        <h1 className="HelloTitle">Skill Factories</h1>
        <p className="HelloSubtitle">
          Skill Factory overview fetched from an API (mocked response for now).
        </p>

        <div className="RmgToolbar" aria-label="Skill Factories actions">
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
                  <th scope="col">Skill Factory ID</th>
                  <th scope="col">Skill Factory Name</th>
                  <th scope="col">Mentors</th>
                  <th scope="col">Employees</th>
                  <th scope="col">Created At</th>
                  <th scope="col">Updated At</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="RmgEmptyCell">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  rows.map((sf) => (
                    <tr key={sf.skillFactoryId}>
                      <td>
                        <span className="RmgMono">{sf.skillFactoryId}</span>
                      </td>
                      <td>{sf.skillFactoryName || "—"}</td>
                      <td>
                        {Array.isArray(sf.mentors) && sf.mentors.length > 0 ? (
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
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {Array.isArray(sf.employees) && sf.employees.length > 0 ? (
                          <div className="RmgChips" aria-label={`${sf.skillFactoryName} employees`}>
                            {sf.employees.map((e) => (
                              <span
                                key={e.id}
                                className="RmgChip"
                                title={`${e.email} • Initial ${formatRatingOrDash(
                                  e.initialRating
                                )} • Current ${formatRatingOrDash(e.currentRating)} • ${
                                  e.isInPool ? "In pool" : "Not in pool"
                                }`}
                              >
                                <span className="RmgMono" style={{ marginRight: 8 }}>
                                  {e.id}
                                </span>
                                {e.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <span className="RmgMono">{formatIsoDateTimeOrDash(sf.createdAt)}</span>
                      </td>
                      <td>
                        <span className="RmgMono">{formatIsoDateTimeOrDash(sf.updatedAt)}</span>
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
