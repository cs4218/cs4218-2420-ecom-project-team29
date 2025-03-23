import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
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
jest.mock('../../components/Header', () => () => <div>Header</div>);

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
      createdAt: "2023-01-15T10:00:00Z",
      payment: { success: true },
      products: [
        {
          _id: "Product1",
          name: "Test Product Name",
          description: "Exactly thirty characters long",
          price: 100,
        },
      ],
    },
    {
      _id: "Order2",
      status: "Processing",
      buyer: { name: "Green" },
      createdAt: "2023-01-15T11:40:00Z",
      payment: { success: false },
      products: [
        {
          _id: "Product2",
          name: "Test Product Name 2",
          description:
            "Testing Product Description 2",
          price: 200.11,
        },
      ],
    },
  ];

  const mockOrdersMoreThanOneProduct = [
    {
      _id: "Order1",
      status: "Not Processed",
      buyer: { name: "Green" },
      createdAt: "2023-01-13T11:40:00Z",
      payment: { success: true },
      products: [
        {
          _id: "Product1",
          name: "First Product",
          description: "1st descr",
          price: 100,
        },
        {
          _id: "Product2",
          name: "Second Product",
          description: "This is the description of the second product",
          price: 200.2,
        },
      ],
    },
  ];

  beforeEach(() => {
    const { useAuth } = require("../../context/auth");
    useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);

    // Axios mock
    axios.get.mockResolvedValue({ data: mockOrders });

    jest.useFakeTimers();
    jest.setSystemTime(new Date("2023-01-15T12:00:00Z"));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should display headers correctly", async () => {
    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText("All Orders")).toBeInTheDocument();
    });
  });

  it("should fetch and display orders data correctly for 1 order, multiple products in an order and having product description of both <30 and >30 char", async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrdersMoreThanOneProduct });
    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
      expect(screen.getByText("Not Processed")).toBeInTheDocument(); // Check Status
      expect(screen.getByText("Green")).toBeInTheDocument(); // Buyer name
      expect(screen.getByText("Success")).toBeInTheDocument(); // Payment status
      expect(screen.getByText("First Product")).toBeInTheDocument(); // 1st Product name
      expect(screen.getByText(/Price: 100\.00/)).toBeInTheDocument(); // 1st Product price
      expect(screen.getByText("1st descr")).toBeInTheDocument(); // 1st Product description
      expect(screen.getByText("Second Product")).toBeInTheDocument(); // 2nd Product name
      expect(screen.getByText(/Price: 200\.20/)).toBeInTheDocument(); // 2nd Product price
      //screen.debug();
      expect(
        screen.getByText("This is the description of the second product")
      ).toBeInTheDocument();
      expect(screen.getByText("2 days ago")).toBeInTheDocument(); // Order date
    });
  });

  it("should fetch and display all data correctly for more than 1 order", async () => {
    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
      expect(screen.getAllByText("Not Processed").length).toBe(1); // Check Status
      expect(screen.getAllByText("Processing").length).toBe(1);
      expect(screen.getAllByText("Green").length).toBe(2); // Buyer name

      // Payment Status
      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(screen.getByText("Failed")).toBeInTheDocument(); // Payment status

      // Date details
      expect(screen.getByText("20 minutes ago")).toBeInTheDocument(); // Order date
      expect(screen.getByText("2 hours ago")).toBeInTheDocument(); // Order date

      // Check product details
      expect(screen.getByText("Test Product Name")).toBeInTheDocument(); // Product name
      expect(screen.getByText(/Price: 100\.00/)).toBeInTheDocument(); // Product price
      expect(
        screen.getByText("Exactly thirty characters long")
      ).toBeInTheDocument(); // Product description
      expect(screen.getByText("Test Product Name 2")).toBeInTheDocument(); // 2nd Product name
      expect(screen.getByText(/Price: 200\.11/)).toBeInTheDocument(); // 2nd Product price
      expect(
        screen.getByText("Testing Product Description 2")
      ).toBeInTheDocument(); // 2nd Product description
    });
  });

  it("should have failed payment status when no payment in order", async () => {
    const mockOrdersNoPayment = [
      {
        _id: "Order1",
        status: "Not Processed",
        buyer: { name: "Green" },
        createdAt: new Date().toISOString(),
        products: [
          {
            _id: "Product1",
            name: "Test Product Name",
            description: "Testing Product Description",
            price: 100,
          },
        ],
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockOrdersNoPayment });
    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );

    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");

    await waitFor(() => {
      expect(screen.getByText("Not Processed")).toBeInTheDocument(); // Check Status
      expect(screen.getByText("Green")).toBeInTheDocument(); // Buyer name
      expect(screen.getByText("Failed")).toBeInTheDocument(); // Payment status
      expect(screen.getByText("Test Product Name")).toBeInTheDocument(); // Product name
      expect(screen.getByText(/Price: 100\.00/)).toBeInTheDocument(); // Product price
      expect(
        screen.getByText("Testing Product Description")
      ).toBeInTheDocument(); // Product description
    });
  });

  it("should handle no orders", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );

    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");

    await waitFor(() => {
      expect(screen.getByText("All Orders")).toBeInTheDocument();
      expect(screen.getByText("No Orders Yet.")).toBeInTheDocument();
    });
  });

  it("should console.log when there is an API error", async () => {
    // Mock console.log to check for error logging
    const logSpy = jest.spyOn(console, "log");

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
