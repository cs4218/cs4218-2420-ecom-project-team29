import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import Header from "./Header";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import toast from "react-hot-toast";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";

jest.mock("../context/auth");

jest.mock("../context/cart");

jest.mock("react-hot-toast");

jest.mock("./Form/SearchInput", () => () => (
  <div data-testid="mock-search">Mock Search</div>
));
jest.mock("axios");

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

describe("Header component", () => {
  const setAuthMock = jest.fn();
  const mockCategories = [];
  const mockCart = [];

  beforeEach(() => {
    jest.clearAllMocks();

    useAuth.mockReturnValue([{ user: null, token: "" }, setAuthMock]);
    useCart.mockReturnValue(mockCart);
  });

  it("should render Header with items in cart", () => {
    const categories = [];
    axios.get.mockResolvedValue({ data: { category: categories } });

    render(
      <Router>
        <Header />
      </Router>
    );

    expect(screen.getByText("🛒 Virtual Vault")).toHaveAttribute("href", "/");
    expect(screen.getByTestId("mock-search")).toBeInTheDocument();

    expect(screen.getByText("Home")).toHaveAttribute("href", "/");
    expect(screen.getByText("Categories")).toBeInTheDocument();
    expect(screen.getByText("Cart")).toHaveAttribute("href", "/cart");
  });

  it("should render Header with main components", async () => {
    const categories = [
      {
        _id: "mock-category-id",
        name: "mock category",
        slug: "mock-category-slug",
      },
      {
        _id: "mock-category-2-id",
        name: "mock category-2",
        slug: "mock-category-2-slug",
      },
    ];

    axios.get.mockResolvedValue({ data: { category: categories } });

    const cart = [
      {
        id: 1,
        name: "product-food",
        price: 100,
        quantity: 2,
      },
      {
        id: 2,
        name: "product-drinks",
        price: 200,
        quantity: 1,
      },
    ];
    useCart.mockReturnValue([cart]);

    render(
      <Router>
        <Header />
      </Router>
    );

    expect(screen.getByText("🛒 Virtual Vault")).toHaveAttribute("href", "/");
    expect(screen.getByTestId("mock-search")).toBeInTheDocument();

    expect(screen.getByText("Home")).toHaveAttribute("href", "/");
    expect(screen.getByText("Categories")).toBeInTheDocument();
    expect(screen.getByText("All Categories")).toHaveAttribute(
      "href",
      "/categories"
    );

    // click on all categories
    await waitFor(() => {
      expect(screen.getByText("Categories")).toBeInTheDocument();
    });

    // Click on categories
    fireEvent.click(screen.getByText("Categories"));

    // Wait for the specific category to appear
    await waitFor(() => {
      expect(screen.getByText("mock category")).toHaveAttribute(
        "href",
        "/category/mock-category-slug"
      );
    });

    const badgeCount = screen.getByTitle("2");
    expect(badgeCount).toBeInTheDocument();
    expect(badgeCount.textContent).toBe("2");
  });

  // test when there are no items in cart
  it("should render Header with empty cart", () => {
    const categories = [
      {
        _id: "mock-category-id",
        name: "mock-category",
        slug: "mock-category-slug",
      },
    ];
    axios.get.mockResolvedValue({ data: { category: categories } });

    const cart = [];
    useCart.mockReturnValue([cart]);

    render(
      <Router>
        <Header />
      </Router>
    );

    const badgeCount = screen.getByTitle("0");
    expect(badgeCount).toBeInTheDocument();
    expect(badgeCount.textContent).toBe("0");
  });

  it("should log out user that has been authenticated", () => {
    const setAuthMock = jest.fn();

    // Mock useAuth to return the user and the setAuth function
    useAuth.mockReturnValue([
      { user: { name: "green", role: 0 }, token: "mock-token" },
      setAuthMock,
    ]);
    render(
      <Router>
        <Header />
      </Router>
    );

    expect(screen.getByText("green")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Logout"));

    expect(setAuthMock).toHaveBeenCalledWith({ user: null, token: "" });
    expect(window.localStorage.removeItem).toHaveBeenCalledWith("auth");
    expect(toast.success).toHaveBeenCalledWith("Logout Successfully");
  });

  it("should not display user name if user is not authenticated", () => {
    useAuth.mockReturnValue([{ user: null, token: "" }, setAuthMock]);

    render(
      <Router>
        <Header />
      </Router>
    );

    expect(screen.queryByText("green")).not.toBeInTheDocument();
  });

  it("should show register and login if user is not authenticated", () => {
    useAuth.mockReturnValue([{ user: null, token: "" }, setAuthMock]);

    render(
      <Router>
        <Header />
      </Router>
    );

    expect(screen.getByText("Register")).toBeInTheDocument();
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("should not show register and login if user is authenticated", () => {
    useAuth.mockReturnValue([
      { user: { name: "green", role: 0 }, token: "mock-token" },
      setAuthMock,
    ]);
    render(
      <Router>
        <Header />
      </Router>
    );
    expect(screen.queryByText("Register")).not.toBeInTheDocument();
    expect(screen.queryByText("Login")).not.toBeInTheDocument();
  });

  it("should have no list of categories if there are no categories", () => {
    axios.get.mockResolvedValue({ data: { category: [] } });

    render(
      <Router>
        <Header />
      </Router>
    );

    // Get all the <li> elements (list items) in the document
    const dropdownItems = screen.getAllByRole("listitem");

    const dropdownNavItems = dropdownItems.filter(
      (item) =>
        item.classList.contains("nav-item") &&
        item.classList.contains("dropdown")
    );
    expect(dropdownNavItems).toHaveLength(1);
    const allCategoriesLink = screen.getByText("All Categories");
    expect(allCategoriesLink).toBeInTheDocument();
    const categoriesLink = screen.getByText("Categories");
    expect(categoriesLink).toBeInTheDocument();
  });
  it("should render correct dashboard link for admin user", () => {
    useAuth.mockReturnValue([
      { user: { name: "green", role: 1 }, token: "mock-token" },
      setAuthMock,
    ]);

    render(
      <Router>
        <Header />
      </Router>
    );

    const dashboardLink = screen.getByText("Dashboard");
    expect(dashboardLink).toHaveAttribute("href", "/dashboard/admin");
  });

  it("should render correct dashboard link for non-admin user", () => {
    useAuth.mockReturnValue([
      { user: { name: "green", role: 0 }, token: "mock-token" },
      setAuthMock,
    ]);

    render(
      <Router>
        <Header />
      </Router>
    );

    const dashboardLink = screen.getByText("Dashboard");
    expect(dashboardLink).toHaveAttribute("href", "/dashboard/user");
  });
});
