import React from "react";
import { Link, NavLink } from "react-router-dom";

/**
 * Site-wide navigation bar.
 * - Semantic <nav>
 * - Mobile-friendly with a simple collapsible menu
 * - Uses NavLink for active state
 */

// PUBLIC_INTERFACE
export default function Navbar() {
  /** Top navigation bar with links to primary sections of the portal. */
  const [isOpen, setIsOpen] = React.useState(false);

  // Close menu on route change (NavLink click) for better mobile UX.
  const handleNavigate = () => setIsOpen(false);

  return (
    <header className="TopBar">
      <div className="TopBar-inner">
        <Link className="TopBar-brand" to="/" aria-label="Digi Portal home" onClick={handleNavigate}>
          <span className="TopBar-brandMark" aria-hidden="true">
            DP
          </span>
          <span className="TopBar-brandText">Digi Portal</span>
        </Link>

        <button
          type="button"
          className="TopBar-toggle"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-controls="primary-navigation"
          aria-expanded={isOpen ? "true" : "false"}
          onClick={() => setIsOpen((v) => !v)}
        >
          <span className="TopBar-toggleIcon" aria-hidden="true">
            {isOpen ? "✕" : "☰"}
          </span>
        </button>

        <nav className="TopBar-nav" aria-label="Primary" data-open={isOpen ? "true" : "false"}>
          <ul id="primary-navigation" className="TopBar-list">
            <li>
              <NavLink
                to="/get-started"
                className={({ isActive }) =>
                  `TopBar-link${isActive ? " TopBar-linkActive" : ""}`
                }
                onClick={handleNavigate}
              >
                Get Started
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/rmg-tracker"
                className={({ isActive }) =>
                  `TopBar-link${isActive ? " TopBar-linkActive" : ""}`
                }
                onClick={handleNavigate}
              >
                RMG Tracker
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/skill-factories"
                className={({ isActive }) =>
                  `TopBar-link${isActive ? " TopBar-linkActive" : ""}`
                }
                onClick={handleNavigate}
              >
                Skill Factories
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/learning-paths"
                className={({ isActive }) =>
                  `TopBar-link${isActive ? " TopBar-linkActive" : ""}`
                }
                onClick={handleNavigate}
              >
                Learning Paths
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/assessments"
                className={({ isActive }) =>
                  `TopBar-link${isActive ? " TopBar-linkActive" : ""}`
                }
                onClick={handleNavigate}
              >
                Assessments
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
