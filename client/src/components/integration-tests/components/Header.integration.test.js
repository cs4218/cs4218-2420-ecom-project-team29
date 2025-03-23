import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";
import { AuthProvider } from "../../../context/auth";
import { SearchProvider } from "../../../context/search";
import { CartProvider } from "../../../context/cart";
import Header from "../../Header";
import { mock } from "node:test";

jest.mock("axios");

const renderComponent = () => {
  render(
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <Router>
            <Header reload_categories={false} />
          </Router>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );
};

describe("Header Integration Component", () => {
  const mockAuthData = {
    user: { name: "Green", email: "green@bluemail.com", phone: "1234567890" },
    token: "mock-token",
  };

  const categories = [
    { _id: 1, name: "Rainbow", slug: "rainbow" },
    { _id: 2, name: "Sea", slug: "sea" },
  ];

  const mockAxiosGet = axios.get({
    data: { category: categories },
  });

  beforeEach(() => {
    jest.clearAllMocks();

    localStorage.clear();
  });

  it("should show Register and Login when the user is not authenticated", () => {
    renderComponent();

    expect(screen.getByText(/Register/i)).toBeInTheDocument();
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
  });

  it("should show Dashboard and Logout when the user is authenticated", async () => {
    // set localStorage
    localStorage.setItem("auth", JSON.stringify(mockAuthData));
    renderComponent();

    // click on user's name
    fireEvent.click(screen.getByText(mockAuthData.user.name));

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Logout")).toBeInTheDocument();
    });
  });

  it("should render the correct cart count when no items in cart and no authenticated user", () => {
    renderComponent();
    const badgeCount = screen.getByTitle("0");
    expect(badgeCount).toBeInTheDocument();
    expect(badgeCount.textContent).toBe("0");
  });

  it("should render the correct cart count of authenticated user when there are multiple stored carts in local storage", () => {
    // add to local storage
    localStorage.setItem("auth", JSON.stringify(mockAuthData));

    localStorage.setItem(
      `cart${mockAuthData.user.email}`,
      JSON.stringify(["1"])
    );
    localStorage.setItem(`cartblue@email.com`, JSON.stringify(["1", "2"]));

    renderComponent();

    const badgeCount = screen.getByTitle("1");
    expect(badgeCount).toBeInTheDocument();
    expect(badgeCount.textContent).toBe("1");
  });

  it("should render the correct cart count when there are items in cart for authenticated user", () => {
    // add to local storage

    localStorage.setItem("auth", JSON.stringify(mockAuthData));

    localStorage.setItem(
      `cart${mockAuthData.user.email}`,
      JSON.stringify(["1", "2"])
    );

    renderComponent();

    const badgeCount = screen.getByTitle("2");
    expect(badgeCount).toBeInTheDocument();
    expect(badgeCount.textContent).toBe("2");
  });

  it("should handle logout", async () => {
    localStorage.setItem("auth", JSON.stringify(mockAuthData));

    renderComponent();
    fireEvent.click(screen.getByText(mockAuthData.user.name));

    fireEvent.click(screen.getByText("Logout"));

    await waitFor(() => {
      expect(screen.getByText(/Register/i)).toBeInTheDocument();
      expect(screen.getByText(/Login/i)).toBeInTheDocument();
    });

    expect(localStorage.getItem("auth")).toBeNull();
  });
});
