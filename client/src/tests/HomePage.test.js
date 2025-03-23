import React, { useEffect } from "react";
import { render, screen, act, fireEvent, waitFor  } from "@testing-library/react";
import { testApi, apiConfig } from './testConfig';
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import { useNavigate, BrowserRouter, MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import '@testing-library/jest-dom';
import HomePage from "../pages/HomePage";
import ProductDetails from "../pages/ProductDetails";
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

// Mock toast
jest.mock("react-hot-toast", () => ({
    success: jest.fn(),
    error: jest.fn(),
}));

// Mock the Layout component
jest.mock("../components/Layout", () => {
    return ({ children }) => <div>{children}</div>;
});
    

// const mockNavigate = jest.fn();
// jest.mock('react-router-dom', () => ({
//     ...jest.requireActual('react-router-dom'),
//     useNavigate: () => mockNavigate,
// }));




const renderHomePage = async () => {
    await act(async () => {
        render(
            
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route 
                        path="/product/:slug" 
                        element={<ProductDetails />} 
                    />
                </Routes>
            </MemoryRouter>
        
        );
    });
}

  
describe("HomePage Integration Tests", () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        axios.defaults.baseURL = apiConfig.baseURL;
        axios.defaults.timeout = apiConfig.timeout;
    });

    beforeAll(async () => {
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

    it("loads products from real backend API", async () => {
        await renderHomePage();
    
        await waitFor(() => {
            expect(screen.getByText(/All Products/i)).toBeInTheDocument();
            expect(screen.getByText("Filter By Category")).toBeInTheDocument();
            expect(screen.getByText(/MacBook/i)).toBeInTheDocument();
            //expect(screen.getByText(/Wisepad 3 reader/i)).toBeInTheDocument();
        }, { timeout: axios.defaults.timeout });
    });

    it("should navigate to product details page after click the More Details Button", async () => {
        await renderHomePage();

        // Wait for products to load
        const productHeading = await screen.findByText('All Products');
        expect(productHeading).toBeInTheDocument();
        const product = await screen.findByText(/Macbook/i);
        expect(product).toBeInTheDocument();

        const detailsButtons = await screen.findAllByRole('button', {
            name: /more details/i
        });
    
        await act(async () => {
            fireEvent.click(detailsButtons[0]);
        });         
        
        const productDetailsPage = await screen.findByTestId('product-details-page');
        expect(productDetailsPage).toBeInTheDocument();
    }, 15000);
    
    it("should filter products by price range", async () => {
        await renderHomePage();

        await waitFor(() => {
            // Wait for products to load
            const productHeading = screen.getByText('All Products');
            expect(productHeading).toBeInTheDocument();
            const priceFilterHeading = screen.getByText('Filter By Price');
            expect(priceFilterHeading).toBeInTheDocument();
            const initialProduct = screen.getByText(/MacBook/i);
            expect(initialProduct).toBeInTheDocument();
        }, { timeout: axios.defaults.timeout });

        const radioButton = await screen.findByRole('radio', { name: '$0 to 19' });
        fireEvent.click(radioButton);
      

        await waitFor(() => {
            expect(radioButton).toBeChecked();
            screen.debug();
            expect(screen.queryByText(/Macbook/i)).toBeNull();
            expect(screen.queryByText(/Wisepad 3 reader/i)).not.toBeInTheDocument();
            expect(screen.getByText(/Save me an orange/i)).toBeInTheDocument();
        }, { timeout: 15000 });

    }, 15000);

 
       
});