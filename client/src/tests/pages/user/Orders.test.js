import React, { useEffect } from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom";
import { AuthProvider } from "../../../context/auth";
import Orders from "../../../pages/user/Orders";
import { apiConfig, testApi } from "../../testConfig";

// Mock the Layout component
jest.mock("../../../components/Layout", () => {
  return ({ children }) => <div>{children}</div>;
});

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));
// Mock toast
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../../../components/UserMenu", () => {
  return () => <div>User Menu</div>;
});

const renderOrdersPage = async () => {
  await act(async () => {
    render(
      <AuthProvider value={[{}, jest.fn()]}>
        <Orders />
      </AuthProvider>
    );
  });
};

describe("Orders Page Integration Tests", () => {
  let authToken = null;

  beforeEach(() => {
    jest.clearAllMocks();
    axios.defaults.baseURL = apiConfig.baseURL;
    axios.defaults.timeout = apiConfig.timeout;
  });

  beforeAll(async () => {
    try {
      console.log("Testing connection to:", axios.defaults.baseURL);

      const loginResponse = await testApi.post("/api/v1/auth/login", {
        email: "green@gmail.com",
        password: "123456",
      });
      console.log("API Response:", {
        status: loginResponse?.status,
        data: loginResponse?.data,
      });
      authToken = loginResponse?.data?.token;

      expect(loginResponse).toBeDefined();
      expect(loginResponse.status).toBeDefined();
    } catch (err) {
      console.log("Detailed error:", {
        name: err.name,
        message: err.message,
        stack: err.stack,
        axiosError: err.isAxiosError,
        response: err.response,
        request: err.request,
      });
      throw err;
    }
    console.log(authToken);
  });

  it("should fetch the orders successfully for test account (green@gmail.com)", async () => {
    axios.defaults.headers.common["Authorization"] = authToken;
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: {
          name: "green",
          email: "green@gmail.com",
          address: "123 Green St",
        },
        token: authToken,
      })
    );
    await renderOrdersPage();
    // add a delay to allow the orders to load

    await waitFor(
      () => {
        expect(screen.getAllByText("green").length).toBe(2);

        expect(screen.getAllByText("Not Processed").length).toBe(2);
        expect(screen.getAllByText("Success").length).toBe(2);
        expect(screen.getAllByText("Superstar Roll (8 pcs)").length).toBe(2);
        expect(screen.getAllByText("Price : 19.99").length).toBe(2);
        expect(screen.getByText("Pahit Pink Gin")).toBeInTheDocument();
        expect(
          screen.getByText(
            "The Pink Gin was first popularised by the British Royal Navy as a remedy for sea sickness in colonial Malaya. A mix of Gin and Bitters, it soon became known in the region as Gin Pahit – Pahit translates to “bitter” in Malay."
          )
        ).toBeInTheDocument();
        expect(screen.getByText("Price : 108.00")).toBeInTheDocument();
      },
      { timeout: 20000 }
    );
  });
});
