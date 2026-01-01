import { fireEvent, render, screen, within } from "@testing-library/react";
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

test("column visibility toggling affects rendered table headers", async () => {
  render(
    <MemoryRouter initialEntries={["/rmg-tracker"]}>
      <App />
    </MemoryRouter>
  );

  const table = await screen.findByRole("table");

  // Role column should be visible by default
  expect(within(table).getByRole("columnheader", { name: /role/i })).toBeInTheDocument();

  // Open columns panel and hide Role
  fireEvent.click(screen.getByRole("button", { name: /columns/i }));
  const roleToggle = screen.getByRole("checkbox", { name: /toggle column role/i });
  fireEvent.click(roleToggle);

  // Header should be gone
  expect(
    within(table).queryByRole("columnheader", { name: /role/i })
  ).not.toBeInTheDocument();

  // Re-enable Role
  fireEvent.click(screen.getByRole("checkbox", { name: /toggle column role/i }));
  expect(within(table).getByRole("columnheader", { name: /role/i })).toBeInTheDocument();
});

test("global search narrows results", async () => {
  render(
    <MemoryRouter initialEntries={["/rmg-tracker"]}>
      <App />
    </MemoryRouter>
  );

  await screen.findByRole("table");

  // Search for a specific employee id; should leave only that row visible.
  fireEvent.change(screen.getByRole("searchbox", { name: /global search/i }), {
    target: { value: "E11876" },
  });

  expect(screen.getByText("E11876")).toBeInTheDocument();
  expect(screen.queryByText("E10234")).not.toBeInTheDocument();
  expect(screen.queryByText("E10991")).not.toBeInTheDocument();
});

test("selecting a filter reduces rows as expected", async () => {
  render(
    <MemoryRouter initialEntries={["/rmg-tracker"]}>
      <App />
    </MemoryRouter>
  );

  await screen.findByRole("table");

  // Location "Remote" exists for exactly one record
  fireEvent.change(screen.getByRole("combobox", { name: /filter by location/i }), {
    target: { value: "Remote" },
  });

  expect(screen.getByText("Remote")).toBeInTheDocument();
  expect(screen.queryByText("Bengaluru")).not.toBeInTheDocument();
  expect(screen.queryByText("Pune")).not.toBeInTheDocument();

  // And the matching employee remains
  expect(screen.getByText("E10991")).toBeInTheDocument();
});

test("pagination changes which rows are visible", async () => {
  render(
    <MemoryRouter initialEntries={["/rmg-tracker"]}>
      <App />
    </MemoryRouter>
  );

  await screen.findByRole("table");

  // Set page size to 2 -> should show first two employees initially
  fireEvent.change(screen.getByRole("combobox", { name: /select page size/i }), {
    target: { value: "2" },
  });

  expect(screen.getByText("E10234")).toBeInTheDocument();
  expect(screen.getByText("E11876")).toBeInTheDocument();
  expect(screen.queryByText("E10991")).not.toBeInTheDocument();

  // Next page should show the last employee
  fireEvent.click(screen.getByRole("button", { name: /next/i }));
  expect(screen.getByText("E10991")).toBeInTheDocument();
  expect(screen.queryByText("E10234")).not.toBeInTheDocument();
  expect(screen.queryByText("E11876")).not.toBeInTheDocument();

  // Prev page returns to first two
  fireEvent.click(screen.getByRole("button", { name: /prev/i }));
  expect(screen.getByText("E10234")).toBeInTheDocument();
  expect(screen.getByText("E11876")).toBeInTheDocument();
});
