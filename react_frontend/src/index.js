import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import PrimeReact from "primereact/api";

// PrimeReact global styles (theme + base + icons)
// Note: order matters: theme -> base -> icons
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import "./index.css";
import App from "./App";

// PrimeReact configuration:
// - ripple is a tasteful interaction hint and aligns with the playful theme.
// - inputStyle outlined works well with our glassy cards and crisp borders.
PrimeReact.ripple = true;
PrimeReact.inputStyle = "outlined";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
