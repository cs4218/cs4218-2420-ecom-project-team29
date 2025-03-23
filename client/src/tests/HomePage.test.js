import { TextEncoder, TextDecoder } from 'text-encoding';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import React, { useEffect } from "react";
import { render, screen, act, fireEvent, waitFor  } from "@testing-library/react";
import { testApi, apiConfig } from './testConfig';
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import '@testing-library/jest-dom';
import HomePage from "../pages/HomePage";
import Layout from "../components/Layout";
import { Prices } from "../components/Prices";
// Mock useCart hook to return null state and a mock function
jest.mock("../context/cart", () => ({
    useCart: jest.fn(() => [null, jest.fn()]),
}));

// Mock useAuth hook to return null state and a mock function for setAuth
jest.mock("../context/auth", () => ({
    useAuth: jest.fn(() => [null, jest.fn()]), 
}));
// Mock useSearch hook to return null state and a mock function
jest.mock("../context/search", () => ({
    useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]), 
}));

jest.mock("../hooks/useCategory", () => jest.fn(() => []));

// Mock the Layout component
jest.mock("../components/Layout", () => {
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


const renderHomePage = async () => {
    await act(async () => {
        render(<HomePage />);
    });
}

let server;

beforeAll(async () => {
    try {
      // Set NODE_ENV to test to prevent auto-starting the server
      process.env.DEV_ENV = 'integration-test';
      
      // Use dynamic import to load the server and startServer function
      const serverModule = await import("../../../server.js");
      const app = serverModule.default;
      const { startServer } = serverModule;
      
      // Start the server on our test port
      server = app.listen(6061);
      
      // Configure axios to use the test port
      axios.defaults.baseURL = `http://localhost:6061`;
      
      console.log(`Test server started on port 6061`);
    } catch (error) {
      console.error("Failed to start test server:", error);
      throw error;
    }
  });
  
  // Single afterAll callback to clean up
  afterAll((done) => {
    if (server) {
      console.log("Closing test server");
      server.close(done);
    } else {
      done();
    }
  });

describe("HomePage", () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        axios.defaults.baseURL = apiConfig.baseURL;
        axios.defaults.timeout = apiConfig.timeout;
    });

    it("should connect to backend API", async () => {
        try {
            console.log('Testing connection to:', axios.defaults.baseURL + '/api/v1/category/get-category');
            
            const response = await testApi.get('/api/v1/category/get-category');

            console.log('API Response:', {
                status: response?.status,
                data: response?.data
            });

            expect(response).toBeDefined();
            expect(response.status).toBeDefined();

        } catch (err) {
            console.log('Detailed error:', {
                name: err.name,
                message: err.message,
                stack: err.stack,
                axiosError: err.isAxiosError,
                response: err.response,
                request: err.request
            });
            throw err;
        }
    });

    it("loads products from real API", async () => {
        await renderHomePage();
       
        await waitFor(() => {
            expect(screen.getByText(/Sky Blue/i)).toBeInTheDocument();
            expect(screen.getByText("Filter By Category")).toBeInTheDocument();
            expect(screen.getByText(/Wisepad 3 reader/i)).toBeInTheDocument();
        }, { timeout: axios.defaults.timeout });

    });

});