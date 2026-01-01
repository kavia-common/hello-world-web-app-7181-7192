import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

test("renders navbar with required links", () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>
  );

  // Navbar links
  expect(screen.getByRole("link", { name: /rmg tracker/i })).toHaveAttribute(
    "href",
    "/rmg-tracker"
  );
  expect(screen.getByRole("link", { name: /skill factories/i })).toHaveAttribute(
    "href",
    "/skill-factories"
  );
  expect(screen.getByRole("link", { name: /learning paths/i })).toHaveAttribute(
    "href",
    "/learning-paths"
  );
  expect(screen.getByRole("link", { name: /assessments/i })).toHaveAttribute(
    "href",
    "/assessments"
  );
});

test("renders Digi Portal welcome title and subtitle on home route", () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>
  );

  expect(
    screen.getByRole("heading", { name: /welcome to digi portal/i })
  ).toBeInTheDocument();

  expect(
    screen.getByText("Build, assess, and grow your digital skills.")
  ).toBeInTheDocument();
});

test("renders RMG Tracker page and shows loading then table", async () => {
  render(
    <MemoryRouter initialEntries={["/rmg-tracker"]}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: /rmg tracker/i })).toBeInTheDocument();

  // Loading state should appear immediately
  expect(screen.getByText(/fetching rmg data/i)).toBeInTheDocument();

  // Table should render after mock fetch resolves
  expect(await screen.findByRole("table")).toBeInTheDocument();

  // Verify at least one key field from the dummy dataset shows up
  expect(await screen.findByText("E10234")).toBeInTheDocument();
});
