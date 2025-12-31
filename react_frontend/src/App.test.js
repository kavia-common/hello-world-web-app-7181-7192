import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders Hello World message", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /hello world/i })).toBeInTheDocument();
});
