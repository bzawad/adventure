import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import App from "./App.jsx";

test("renders dungeon generator by default", () => {
  render(<App />);
  expect(screen.getByText(/Dungeon Generator/i)).toBeInTheDocument();
  expect(screen.getByText(/Cavern Generator/i)).toBeInTheDocument();
  expect(screen.getByText(/Dungeon Map Generator/i)).toBeInTheDocument();
});
