import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders Digi Portal welcome title and subtitle", () => {
  render(<App />);

  expect(
    screen.getByRole("heading", { name: /welcome to digi portal/i })
  ).toBeInTheDocument();

  expect(
    screen.getByText("Build, assess, and grow your digital skills.")
  ).toBeInTheDocument();
});
