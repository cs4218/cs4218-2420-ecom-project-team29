import React from "react";
import { render, screen, act, fireEvent, waitFor  } from "@testing-library/react";
import { testApi, apiConfig } from './testConfig';
import { AuthProvider } from "../../context/auth";
import { SearchProvider } from "../../context/search";
import { CartProvider } from "../../context/cart";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import '@testing-library/jest-dom';
import HomePage from "../../pages/HomePage";
import ProductDetails from "../../pages/ProductDetails";
import Contact from "../../pages/Contact";
import Search from "../../pages/Search";
import Policy from "../../pages/Policy";
import { describe } from "node:test";
import { expect } from "@playwright/test";

const renderHomePage = async () => {
    await act(async () => {
        render(
            <AuthProvider>
                <SearchProvider>
                    <CartProvider>
                        <MemoryRouter initialEntries={['/']}>
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route 
                                    path="/product/:slug" 
                                    element={<ProductDetails />} 
                                />
                                <Route path="/contact" element={<Contact />} />
                                <Route path="/search" element={<Search />} />
                                <Route path="/policy" element={<Policy />} />
                            </Routes>
                        </MemoryRouter>
                    </CartProvider>
                </SearchProvider>
            </AuthProvider>
        );
    });
}
describe("Search", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        axios.defaults.baseURL = apiConfig.baseURL;
        axios.defaults.timeout = apiConfig.timeout;
    });
    beforeAll(async () => {
        try {
            // console.log('Testing connection to:', axios.defaults.baseURL + '/api/v1/category/get-category');
            
            const response = await testApi.get('/api/v1/category/get-category');
            // console.log('API Response:', {
            //     status: response?.status,
            //     data: response?.data
            // });
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
    
    it("should navigate to product details page after click the More Details Button", async () => {
        await renderHomePage();
        await waitFor(() => {
            // Wait for products to load
            const productHeading = screen.getByText('All Products');
            expect(productHeading).toBeInTheDocument();
            const initialProduct = screen.getByText(/MacBook/i);
            expect(initialProduct).toBeInTheDocument();
        }, { timeout: axios.defaults.timeout });
        const searchButton = await screen.findByRole('button', { name: 'Search' });
        const searchInput = await screen.findByPlaceholderText(/search/i);
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'macbook' } });
            fireEvent.click(searchButton);
        });
        const searchResultNumber = await screen.findByText(/Found 1/i);
        expect(searchResultNumber).toBeInTheDocument();
        const detailsButtons = await screen.findByRole('button', { 
            name: /more details/i
        });
    
        await act(async () => {
            fireEvent.click(detailsButtons);
        });         
        
        const productDetailsPage = await screen.findByTestId('product-details-page');
        expect(productDetailsPage).toBeInTheDocument();
       
        const productDetails = await screen.findByText(/13-inch MacBook Air -/i);
        expect(productDetails).toBeInTheDocument();
    }, 15000);
    
});