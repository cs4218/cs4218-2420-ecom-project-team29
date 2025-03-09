import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import Footer from "./Footer";

describe("Footer Component", () => {
  it("should display Footer component correctly", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/All Rights Reserved © TestingComp/i)
    ).toBeInTheDocument();
  });

  it("should have About link", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    expect(screen.getByText("About")).toHaveAttribute("href", "/about");
  });

  it("should have Contact link", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    expect(screen.getByText("Contact")).toHaveAttribute("href", "/contact");
  });

  it("should have Privacy Policy Link", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    expect(screen.getByText("Privacy Policy")).toHaveAttribute("href", "/policy");
  });
});
