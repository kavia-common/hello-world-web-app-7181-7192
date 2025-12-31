import React from "react";
import "./App.css";

// PUBLIC_INTERFACE
function App() {
  /** Root application component that renders the centered Hello World message. */
  return (
    <div className="App">
      <main className="App-main" aria-label="Hello World page">
        <section className="HelloCard" aria-label="Greeting">
          <p className="HelloEyebrow">Ocean Professional</p>
          <h1 className="HelloTitle">Hello World</h1>
          <p className="HelloSubtitle">
            A playful, polished starter—ready to build on.
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;
