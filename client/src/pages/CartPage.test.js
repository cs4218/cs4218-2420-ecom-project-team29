import React, { useEffect } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CartPage from "../pages/CartPage";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

// Mock the required dependencies
jest.mock("../context/cart");
jest.mock("../context/auth");
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));
jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));
jest.mock("braintree-web-drop-in-react", () => {
  // need React const to use React in this mock factory
  // (Jest module mocks execute in special scope)
  const React = jest.requireActual("react");

  return {
    __esModule: true,
    default: ({ onInstance }) => {
      React.useEffect(() => {
        onInstance({
          requestPaymentMethod: jest
            .fn()
            .mockResolvedValue({ nonce: "test-nonce" }),
        });
      }, []);

      return React.createElement(
        "div",
        { "data-testid": "braintree-dropin" },
        "Braintree DropIn"
      );
    },
  };
});

jest.mock("../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

describe("CartPage", () => {
  const mockNavigate = jest.fn();
  const mockSetCart = jest.fn();

  beforeEach(() => {
    // Setup mocks before each test
    useCart.mockReturnValue([["1", "2"], mockSetCart]);
    useAuth.mockReturnValue([
      {
        token: "test-token",
        user: {
          name: "Test User",
          address: "123 Test St",
          email: "green@gmail.com",
        },
      },
      jest.fn(),
    ]);
    useNavigate.mockReturnValue(mockNavigate);

    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn().mockReturnValue(JSON.stringify(["1", "2"])),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", { value: localStorageMock });

    // Mock axios responses
    axios.get.mockImplementation((url) => {
      // uses axios twice
      if (url === "/api/v1/product/braintree/token") {
        return Promise.resolve({ data: { clientToken: "test-client-token" } });
      } else if (url === "/api/v1/product/get-product-details") {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: "1",
                name: "Product 1",
                description: "Description 1",
                price: 100,
              },
              {
                _id: "2",
                name: "Product 2",
                description: "Description 2",
                price: 200,
              },
            ],
          },
        });
      }
      return Promise.reject(new Error("Not found"));
    });

    axios.post.mockResolvedValue({ data: { ok: true } });
  });

  it("should have user name when authenticated", async () => {
    render(<CartPage />);
    await waitFor(() => {
      expect(screen.getByText(/Hello Test User/i)).toBeInTheDocument();
    });
  });

  it("should have cart summary with correct total price", async () => {
    render(<CartPage />);
    // check whether local storage get item has been called
    expect(window.localStorage.getItem).toHaveBeenCalledWith(
      `cartgreen@gmail.com`
    );
    await waitFor(() => {
      expect(screen.getByText(/Total : \$300/i)).toBeInTheDocument();
    });
  });

  it('should have "Your Cart Is Empty" message when cart is empty', async () => {
    useCart.mockReturnValue([[], mockSetCart]);
    render(<CartPage />);
    await waitFor(() => {
      expect(screen.getByText(/Your Cart Is Empty/i)).toBeInTheDocument();
    });
  });

  it("should show product details for items in cart", async () => {
    render(<CartPage />);
    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText("Product 2")).toBeInTheDocument();
    });
  });

  it("should remove item from cart when Remove button is clicked", async () => {
    render(<CartPage />);
    await waitFor(() => {
      expect(screen.getAllByText("Remove").length).toBe(2);
    });

    fireEvent.click(screen.getAllByText("Remove")[0]);

    expect(mockSetCart).toHaveBeenCalled();
    expect(window.localStorage.setItem).toHaveBeenCalled();
  });

  it("should have braintree drop in when user is authenticated and has items in cart", async () => {
    render(<CartPage />);
    await waitFor(() => {
      expect(screen.getByTestId("braintree-dropin")).toBeInTheDocument();
      expect(screen.getByText("Make Payment")).toBeInTheDocument();
    });
  });

  it("should process payment successfully when Make Payment button is clicked", async () => {
    const localStorageMock = {
      getItem: jest.fn().mockReturnValue(JSON.stringify(["1", "2"])),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", { value: localStorageMock });

    // Mock the Braintree instance
    const mockInstance = {
      requestPaymentMethod: jest.fn().mockResolvedValue({
        nonce: "test-nonce", // This should match the expected nonce in the test
      }),
    };

    render(<CartPage />);

    // Manually set the instance since we're not using the real DropIn component
    // This is a critical step that was missing
    await waitFor(() => {
      expect(screen.getByTestId("braintree-dropin")).toBeInTheDocument();
    });

    // Find and click the Make Payment button
    const paymentButton = await screen.findByTestId("make-payment");
    expect(paymentButton).toBeInTheDocument();

    // Mock the instance before clicking
    global.instance = mockInstance;

    // Check that the payment processing occurs
    await waitFor(() => {
      fireEvent.click(paymentButton);
      // Verify the Braintree payment request was made
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/braintree/payment",
        {
          nonce: "test-nonce",
          cart: [
            {
              _id: "1",
              name: "Product 1",
              description: "Description 1",
              price: 100,
            },
            {
              _id: "2",
              name: "Product 2",
              description: "Description 2",
              price: 200,
            },
          ],
        }
      );

      // verify local storage was cleared
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "cartgreen@gmail.com"
      );
      // Verify state cart was cleared
      expect(mockSetCart).toHaveBeenCalledWith([]);

      // Verify navigation to orders page
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");

      // Verify success toast was shown
      expect(toast.success).toHaveBeenCalledWith(
        "Payment Completed Successfully"
      );
    });
  });
  it("should update address button for authenticated users", async () => {
    useAuth.mockReturnValue([
      {
        token: "test-token",
        user: { name: "Test User", address: "123 Happy Street" },
      },
      jest.fn(),
    ]);

    render(<CartPage />);
    expect(screen.getByText("123 Happy Street")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Update Address")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Update Address"));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/profile");
  });
});
