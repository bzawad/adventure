import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import App from "./App.jsx";

test("renders hello message", () => {
  render(<App />);
  expect(
    screen.getByText(/Hello, Vite \+ React is working!/i),
  ).toBeInTheDocument();
});
