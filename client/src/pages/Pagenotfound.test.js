import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter } from "react-router-dom";
import PageNotFound from "./Pagenotfound";

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [[], jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "", results: [] }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));


describe("Page Not Found", () => {
  it("should render correctly", () => {
    render(
      <MemoryRouter>
        <PageNotFound />
      </MemoryRouter>
    );

    expect(screen.getByText("Go Back")).toHaveAttribute("href", "/");

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Oops ! Page Not Found")).toBeInTheDocument();
  });
});
