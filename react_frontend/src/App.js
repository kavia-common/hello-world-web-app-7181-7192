import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import "./App.css";
import {
  AssessmentsPage,
  HomePage,
  LearningPathsPage,
  RmgTrackerPage,
  SkillFactoriesPage,
} from "./pages";

// PUBLIC_INTERFACE
function App() {
  /** Root application component that renders the navbar and page routes. */
  return (
    <div className="App">
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/rmg-tracker" element={<RmgTrackerPage />} />
        <Route path="/skill-factories" element={<SkillFactoriesPage />} />
        <Route path="/learning-paths" element={<LearningPathsPage />} />
        <Route path="/assessments" element={<AssessmentsPage />} />

        {/* Friendly fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
