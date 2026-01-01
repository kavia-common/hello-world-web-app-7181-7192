import React from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Chatbot from "react-chatbotify";
import Navbar from "./components/Navbar";
import "./App.css";
import {
  AssessmentsPage,
  HomePage,
  LearningPathsPage,
  RmgTrackerPage,
  SkillFactoriesPage,
} from "./pages";

/**
 * Creates a small, friendly starter flow for the Digi Portal chatbot.
 * We keep it intentionally simple and mocked (no backend calls) so it can be extended later.
 */
function useDigiPortalChatFlow() {
  const navigate = useNavigate();

  return React.useMemo(() => {
    // Small helper: answer with a message + "quick link" buttons.
    const helpStep = {
      message:
        "I can help you jump to key sections, or answer basic questions about what’s on each page. Where do you want to go?",
      options: [
        { label: "RMG Tracker", value: "/rmg-tracker" },
        { label: "Skill Factories", value: "/skill-factories" },
        { label: "Learning Paths", value: "/learning-paths" },
        { label: "Assessments", value: "/assessments" },
      ],
      // When an option is picked, we navigate and send a confirmation.
      callback: ({ userInput }) => {
        const to = String(userInput || "").trim();
        if (!to.startsWith("/")) return;
        navigate(to);
      },
    };

    /**
     * react-chatbotify supports a "flow" object where each key is a step and
     * each step can define:
     * - message: bot message
     * - options: quick reply buttons
     * - path: next step (string or function)
     * - callback: invoked when user responds / selects an option
     *
     * This minimal flow:
     * 1) Greets
     * 2) Offers Help / "What can you do?"
     * 3) Provides navigation shortcuts
     */
    const flow = {
      start: {
        message:
          "Hi! I’m the Digi Portal assistant. Want help finding something?",
        options: [
          { label: "Help", value: "help" },
          { label: "What’s here?", value: "overview" },
          { label: "Go to RMG", value: "/rmg-tracker" },
        ],
        path: ({ userInput }) => {
          const input = String(userInput || "").trim().toLowerCase();
          if (input === "help") return "help";
          if (input === "overview") return "overview";
          if (input.startsWith("/")) return "navigate";
          return "help";
        },
      },

      overview: {
        message:
          "Digi Portal has: RMG Tracker (resource status), Skill Factories (mentorship hubs), Learning Paths (journeys), and Assessments (measure growth). Want a shortcut?",
        options: [
          { label: "Show shortcuts", value: "help" },
          { label: "Go Home", value: "/" },
        ],
        path: ({ userInput }) => {
          const input = String(userInput || "").trim();
          if (input === "/") return "navigate";
          return "help";
        },
      },

      help: helpStep,

      navigate: {
        message: "Got it—taking you there!",
        callback: ({ userInput }) => {
          const to = String(userInput || "").trim();
          if (to.startsWith("/")) navigate(to);
        },
        path: "help", // return to shortcuts after navigation
      },
    };

    return flow;
  }, [navigate]);
}

// PUBLIC_INTERFACE
function App() {
  /** Root application component that renders the navbar, global chatbot, and page routes. */
  const flow = useDigiPortalChatFlow();

  return (
    <div className="App">
      <Navbar />

      {/* Global chatbot (appears across all pages) */}
      <div className="GlobalChatbot" aria-label="Digi Portal chatbot">
        <Chatbot
          flow={flow}
          options={{
            theme: {
              // Ocean Professional / Playful vibe to match existing UI
              primaryColor: "#EC4899",
              secondaryColor: "#8B5CF6",
              fontFamily:
                'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif',
            },
            // Keep it lightweight and non-intrusive by default.
            botBubbleColor: "#EC4899",
            userBubbleColor: "#8B5CF6",
            // Some versions use these optional fields; safe to pass even if ignored.
            tooltipText: "Need help?",
          }}
        />
      </div>

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
