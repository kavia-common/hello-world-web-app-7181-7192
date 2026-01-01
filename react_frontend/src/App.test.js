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

test("renders placeholder page content for an app route", () => {
  render(
    <MemoryRouter initialEntries={["/rmg-tracker"]}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: /rmg tracker/i })).toBeInTheDocument();
  expect(screen.getByText(/placeholder/i)).toBeInTheDocument();
});
