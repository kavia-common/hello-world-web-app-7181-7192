import React from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Chatbot from "react-chatbotify";
import Navbar from "./components/Navbar";
import "./App.css";
import {
  AssessmentsPage,
  GetStartedPage,
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
     * Passing objects (e.g., `{label, value}`) causes React to try to render the object as a child.
     *
     * Important: In react-chatbotify v2.x, the Block API uses `function` (not `callback`)
     * to run side-effects when a user submits text or clicks an option. If `callback` is used,
     * it will be ignored, which is why navigation didn't happen.
     */
    const OPTION_TO_DESTINATION = {
      // Primary destinations (quick replies)
      "RMG Tracker": "/rmg-tracker",
      "Skill Factories": "/skill-factories",
      "Learning Paths": "/learning-paths",
      Assessments: "/assessments",
      "Get Started": "/get-started",

      // Helpful commands (chat-only)
      Help: "help",
      "Show shortcuts": "help",
      "What’s here?": "overview",
      Overview: "overview",

      // Common phrases
      "Go to RMG": "/rmg-tracker",
      "Go Home": "/",
    };

    const ROUTES = new Set([
      "/",
      "/get-started",
      "/rmg-tracker",
      "/skill-factories",
      "/learning-paths",
      "/assessments",
    ]);

    function normalizeText(v) {
      return String(v || "")
        .trim()
        .toLowerCase()
        .replace(/[’']/g, "'")
        .replace(/\s+/g, " ");
    }

    function resolveDestinationFromUserInput(userInput) {
      const raw = String(userInput || "").trim();
      if (!raw) return "";

      // If user typed a route directly, allow it (but only routes we support).
      if (raw.startsWith("/")) {
        // Strip origin if someone pasted a full URL.
        try {
          const maybeUrl = new URL(raw, window.location.origin);
          const path = maybeUrl.pathname + (maybeUrl.search || "");
          const pathnameOnly = maybeUrl.pathname;
          return ROUTES.has(pathnameOnly) ? path : "";
        } catch {
          // raw is already a path-like string
          const [pathnameOnly] = raw.split("?");
          return ROUTES.has(pathnameOnly) ? raw : "";
        }
      }

      // If they clicked a quick option (label), map it.
      if (OPTION_TO_DESTINATION[raw]) return OPTION_TO_DESTINATION[raw];

      // If they typed a common prompt, interpret it.
      const n = normalizeText(raw);

      // Commands
      if (n === "help" || n === "shortcuts" || n === "show shortcuts")
        return "help";
      if (n === "overview" || n === "what's here" || n === "whats here")
        return "overview";

      // Destinations (typed)
      if (n.includes("learning path")) return "/learning-paths";
      if (n.includes("skill factor")) return "/skill-factories";
      if (n.includes("rmg")) return "/rmg-tracker";
      if (n.includes("assessment")) return "/assessments";
      if (n === "get started" || n.includes("get started") || n.includes("start"))
        return "/get-started";
      if (n === "home" || n.includes("go home")) return "/";

      return "";
    }

    async function navigateIfRoute(params) {
      const dest = resolveDestinationFromUserInput(params?.userInput);

      if (dest && dest.startsWith("/")) {
        // SPA navigation (no full page reload)
        navigate(dest);
        // Optional UX: close the chat window after navigation
        // (this is safe even if the component ignores it)
        await params?.toggleChatWindow?.(false);
      }
    }

    const helpStep = {
      message: "I can help you jump to key sections. Where do you want to go?",
      options: [
        "Get Started",
        "Learning Paths",
        "Skill Factories",
        "RMG Tracker",
        "Assessments",
      ],
      function: async (params) => {
        // If user clicked an option in THIS step, navigate immediately.
        await navigateIfRoute(params);
      },
      path: ({ userInput }) => {
        const dest = resolveDestinationFromUserInput(userInput);

        if (dest === "help") return "help";
        if (dest === "overview") return "overview";
        if (dest && dest.startsWith("/")) return "navigate";

        // Stay on help if input isn't understood.
        return "help";
      },
    };

    const flow = {
      start: {
        message: "Hi! I’m Digi Bot. Want help finding something?",
        options: ["Get Started", "Help", "What’s here?"],
        path: ({ userInput }) => {
          const dest = resolveDestinationFromUserInput(userInput);

          if (dest === "help") return "help";
          if (dest === "overview") return "overview";
          if (dest && dest.startsWith("/")) return "navigate";

          return "help";
        },
      },

      overview: {
        message:
          "Digi Portal has: RMG Tracker (resource status), Skill Factories (mentorship hubs), Learning Paths (journeys), and Assessments (measure growth). Want a shortcut?",
        options: ["Show shortcuts", "Go Home", "Get Started"],
        path: ({ userInput }) => {
          const dest = resolveDestinationFromUserInput(userInput);

          if (dest && dest.startsWith("/")) return "navigate";
          return "help";
        },
      },

      help: helpStep,

      navigate: {
        message: "Got it—taking you there!",
        function: async (params) => {
          // When we arrive in this step, navigate based on the most recent user input.
          await navigateIfRoute(params);
        },
        path: "help",
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

            /**
             * Branding / labels (react-chatbotify v2.5):
             * - Tooltip text shows near the launcher button.
             * - Header title shows at the top of the chat window.
             * - Footer text replaces the default "Powered By react-chatbotify".
             *
             * We only update visible labels/branding as requested; behavior/flow/styles remain unchanged.
             */
            settings: {
              tooltip: { text: "Digi Bot" },

              /**
               * Force the header title across react-chatbotify versions.
               * Some releases read `settings.header.title`, others may fall back
               * to legacy top-level `headerTitle`. Setting both prevents any
               * default/previous title (e.g., "Tan Jin") from appearing.
               */
              header: { title: "Digi Bot" },

              footer: { text: "made with <3 from Digital Competency" },
            },

            // Keep it lightweight and non-intrusive by default.
            botBubbleColor: "#EC4899",
            userBubbleColor: "#8B5CF6",

            // Backwards-compatible fields used by some versions; safe to pass even if ignored.
            tooltipText: "Digi Bot",
            headerTitle: "Digi Bot",
          }}
        />
      </div>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/get-started" element={<GetStartedPage />} />
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
