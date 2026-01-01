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
    /**
     * react-chatbotify (v2.x) expects `options` to be an array of strings (or `{items: string[]}`).
     * Passing objects (e.g., `{label, value}`) causes React to try to render the object as a child,
     * which crashes the app with:
     *   "Objects are not valid as a React child (found: object with keys {label, value})"
     *
     * To keep a "pretty label" and a "value", we use labels as the visible options and map labels
     * to destinations/commands.
     */
    const OPTION_TO_DESTINATION = {
      "RMG Tracker": "/rmg-tracker",
      "Skill Factories": "/skill-factories",
      "Learning Paths": "/learning-paths",
      Assessments: "/assessments",

      Help: "help",
      "What’s here?": "overview",
      "Go to RMG": "/rmg-tracker",

      "Show shortcuts": "help",
      "Go Home": "/",
    };

    function resolveDestinationFromUserInput(userInput) {
      const raw = String(userInput || "").trim();
      if (!raw) return "";

      // If user typed a route directly, allow it.
      if (raw.startsWith("/")) return raw;

      // If they clicked a quick option (label), map it.
      return OPTION_TO_DESTINATION[raw] || "";
    }

    // Small helper: answer with a message + "quick link" buttons.
    const helpStep = {
      message:
        "I can help you jump to key sections, or answer basic questions about what’s on each page. Where do you want to go?",
      options: ["RMG Tracker", "Skill Factories", "Learning Paths", "Assessments"],
      // When an option is picked, we navigate and send a confirmation.
      callback: ({ userInput }) => {
        const dest = resolveDestinationFromUserInput(userInput);
        if (dest.startsWith("/")) navigate(dest);
      },
      path: ({ userInput }) => {
        const dest = resolveDestinationFromUserInput(userInput);
        // If they typed a command (help/overview), route accordingly.
        if (dest === "help") return "help";
        if (dest === "overview") return "overview";
        if (dest.startsWith("/")) return "navigate";
        return "help";
      },
    };

    /**
     * react-chatbotify supports a "flow" object where each key is a step and
     * each step can define:
     * - message: bot message
     * - options: quick reply buttons (strings)
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
        options: ["Help", "What’s here?", "Go to RMG"],
        path: ({ userInput }) => {
          const dest = resolveDestinationFromUserInput(userInput);
          if (dest === "help") return "help";
          if (dest === "overview") return "overview";
          if (dest.startsWith("/")) return "navigate";
          return "help";
        },
      },

      overview: {
        message:
          "Digi Portal has: RMG Tracker (resource status), Skill Factories (mentorship hubs), Learning Paths (journeys), and Assessments (measure growth). Want a shortcut?",
        options: ["Show shortcuts", "Go Home"],
        path: ({ userInput }) => {
          const dest = resolveDestinationFromUserInput(userInput);
          if (dest.startsWith("/")) return "navigate";
          return "help";
        },
      },

      help: helpStep,

      navigate: {
        message: "Got it—taking you there!",
        callback: ({ userInput }) => {
          const dest = resolveDestinationFromUserInput(userInput);
          if (dest.startsWith("/")) navigate(dest);
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
