import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Orders from "../../pages/user/Orders";
import axios from "axios";

// Mock the required modules
jest.mock("axios");
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));
jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));
jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

describe("Orders Component", () => {
  const mockOrders = [
    {
      _id: "Order1",
      status: "Not Processed",
      buyer: { name: "Green" },
      createdAt: new Date().toISOString(),
      payment: { success: true },
      products: [
        {
          _id: "Product1",
          name: "Test Product Name",
          description: "Testing Product Description",
          price: 100,
        },
      ],
    },
    {
      _id: "Order2",
      status: "Not Processed",
      buyer: { name: "Green" },
      createdAt: new Date().toISOString(),
      payment: { success: false },
      products: [
        {
          _id: "Product2",
          name: "Test Product Name 2",
          description: "Testing Product Description 2",
          price: 200,
        },
      ],
    },
  ];

  beforeEach(() => {
    const { useAuth } = require("../../context/auth");
    useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);

    // Axios mock
    axios.get.mockResolvedValue({ data: mockOrders });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and display data correctly", async () => {
    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );

    // Test that axios call to backend has been made
    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");

    // Check if order data is displayed
    await waitFor(() => {
      expect(screen.getAllByText("Not Processed").length).toBe(2); // Check Status
      expect(screen.getAllByText("Green").length).toBe(2); // Buyer name
      expect(screen.getByText("Success")).toBeInTheDocument(); // Payment status
      expect(screen.getByText("Test Product Name")).toBeInTheDocument(); // Product name
      expect(screen.getByText("Failed")).toBeInTheDocument(); // Payment status
      expect(screen.getByText("Test Product Name 2")).toBeInTheDocument(); // 2nd Product name
    });
  });

  it("should have no table when no orders but user is authenticated", async () => {
    // Override the axios mock for this test
    axios.get.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );

    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");

    await waitFor(() => {
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
  });

  it("should console.log when there is an API error", async () => {
    // Mock console.log to check for error logging
    const logSpy = jest.spyOn(console, 'log');

    // Override the axios mock to throw an error
    const error = new Error("API Error");
    axios.get.mockRejectedValueOnce(error);

    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );

    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    await waitFor(() => expect(console.log).toHaveBeenCalledWith(error));


    expect(logSpy).toBeCalledWith(error);
    logSpy.mockRestore();
  });

  it("should not fetch orders when user is not authenticated", async () => {
    // Override auth mock to return no token
    const { useAuth } = require("../../context/auth");
    useAuth.mockReturnValueOnce([{}, jest.fn()]);

    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );
    expect(axios.get).not.toHaveBeenCalled();
  });
});
