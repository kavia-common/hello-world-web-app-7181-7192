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

// PUBLIC_INTERFACE
export function RmgTrackerPage() {
  /** Placeholder page for RMG Tracker route. */
  return (
    <PlaceholderPage
      title="RMG Tracker"
      description="Track resource management and progress here. (Placeholder)"
    />
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
