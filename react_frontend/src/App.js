import React from "react";
import "./App.css";

// PUBLIC_INTERFACE
function App() {
  /** Root application component that renders the centered welcome hero. */
  return (
    <div className="App">
      <main className="App-main" aria-label="Welcome page">
        <section className="HelloCard" aria-label="Welcome hero">
          <p className="HelloEyebrow">Ocean Professional</p>
          <h1 className="HelloTitle">Welcome to Digi Portal</h1>
          <p className="HelloSubtitle">
            Your central place to explore tools, updates, and next steps—built with a
            playful, polished ocean-inspired theme.
          </p>

          <div style={{ marginTop: 20 }}>
            <a className="HelloCTA" href="/" aria-label="Get started">
              Get Started
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
