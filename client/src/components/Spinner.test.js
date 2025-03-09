import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter } from "react-router-dom";
import Spinner from "./Spinner";

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [[], jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "", results: [] }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: jest.fn(),
    useLocation: jest.fn(),
  }));

describe("Spinner Component", () => {
  it("should display Spinner components correctly", () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require("react-router-dom"), "useNavigate").mockReturnValue(mockNavigate);
    jest.spyOn(require("react-router-dom"), "useLocation").mockReturnValue({ pathname: "/" }); 

    render(
      <MemoryRouter>
        <Spinner />
      </MemoryRouter>
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(
      screen.getByText("redirecting to you in 3 second")
    ).toBeInTheDocument();
  });

  it("should redirect to login page after 3 seconds", async () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require("react-router-dom"), "useNavigate").mockReturnValue(mockNavigate);
    jest.spyOn(require("react-router-dom"), "useLocation").mockReturnValue({ pathname: "/" });

    jest.useFakeTimers();
    render(
      <MemoryRouter>
        <Spinner />
      </MemoryRouter>
    );
    jest.advanceTimersByTime(3000);
    
    await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login", { state: "/" });
      }, { timeout: 4000 });
    ;
  });

  it("should redirect to about page after 3 seconds", async () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require("react-router-dom"), "useNavigate").mockReturnValue(mockNavigate);
    jest.spyOn(require("react-router-dom"), "useLocation").mockReturnValue({ pathname: "/" });

    jest.useFakeTimers();
    render(
      <MemoryRouter>
        <Spinner path="about" />
      </MemoryRouter>
    );
    jest.advanceTimersByTime(3000);
    
    await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/about", { state: "/" });
      }, { timeout: 4000 });
    ;
  });
});
