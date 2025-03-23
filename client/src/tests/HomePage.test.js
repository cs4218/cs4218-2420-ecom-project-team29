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
import exp from "constants";

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

        await waitFor(() => {
            // Wait for products to load
            const productHeading = screen.getByText('All Products');
            expect(productHeading).toBeInTheDocument();
            const initialProduct = screen.getByText(/MacBook/i);
            expect(initialProduct).toBeInTheDocument();
        }, { timeout: axios.defaults.timeout });

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

        const radioButton = await screen.findByRole('radio', { name: '$0 to 19.99' });

        // initial state
        expect(radioButton).not.toBeChecked();

        await act(async () => {
            fireEvent.click(radioButton);
        });

        
        await waitFor(() => {
            expect(radioButton).toBeChecked();
            expect(screen.queryByText(/Macbook/i)).not.toBeInTheDocument();

           
            const expectedItems = [
                /Save me an orange/i,
                /Yellow Bird Drink/i,
                /Shirley Temple Drink/i,
                /Delightful Nyonya Treats/i,
                /Garlic Butter Chicken/i,
                /Superstar Roll/i,

            ];

            expectedItems.forEach(product => {
                expect(screen.getAllByText(product)).not.toHaveLength(0);
            });
            
        }, { timeout: 15000 });

    }, 15000);

    it("should filter products by category", async () => {
        await renderHomePage();

        const checkbox = await screen.findByRole('checkbox', { name: 'Book' });
        // Initial state
        expect(checkbox).not.toBeChecked();
        await act(async () => {
            fireEvent.click(checkbox);
        });

        await waitFor(() => {
            expect(checkbox).toBeChecked();
            expect(screen.queryByText(/Macbook/i)).not.toBeInTheDocument();

            const expectedItems = [
                /Save me an orange/i,
                /You become what you think/i,
                /The journey to the west/i,
                /Delightful nyonya Treats/i,
            ];
        
            expectedItems.forEach(product => {
                expect(screen.getAllByText(product)).not.toHaveLength(0);
            });    
        }, { timeout: 15000 });

    }, 15000);

    it("should filter products by categories", async () => {
        await renderHomePage(); 
    
        const bookCheckbox = await screen.findByRole('checkbox', { name: 'Book' });
        const drinkCheckbox = await screen.findByRole('checkbox', { name: 'Drink' });

        // Initial state
        expect(bookCheckbox).not.toBeChecked();
        expect(drinkCheckbox).not.toBeChecked();

        await act(async () => {
            fireEvent.click(bookCheckbox);
            fireEvent.click(drinkCheckbox);
        });

        await waitFor(() => {
            expect(bookCheckbox).toBeChecked();
            expect(drinkCheckbox).toBeChecked();
            expect(screen.queryByText(/Macbook/i)).not.toBeInTheDocument();

            const expectedItems = [
                /Save me an orange/i,
                /You become what you think/i,
                /The journey to the west/i,
                /Yellow Bird Drink/i,
                /Shirley Temple Drink/i,
                /Pahit Pink Gin/i,
                /Kubota Senjyu Ginjyo/i,
                /Jack Daniels/i,
                /Sapporo/i,
                /Delightful nyonya Treats/i,
            ];
        
            expectedItems.forEach(product => {
                expect(screen.getAllByText(product)).not.toHaveLength(0);
            });  
        }, { timeout: 15000 });
    }, 15000);

    it("should filter products by both category and price range", async () => {
        await renderHomePage(); 
    
        const radioButton = await screen.findByRole('radio', { name: '$20 to 39.99' });
        const bookCheckbox = await screen.findByRole('checkbox', { name: 'Book' });
        const drinkCheckbox = await screen.findByRole('checkbox', { name: 'Drink' });

        // initial state
        expect(radioButton).not.toBeChecked();
        expect(bookCheckbox).not.toBeChecked();
        expect(drinkCheckbox).not.toBeChecked();

        await act(async () => {
            fireEvent.click(bookCheckbox);
            fireEvent.click(drinkCheckbox);
            fireEvent.click(radioButton);
        });

        await waitFor(() => {
            expect(radioButton).toBeChecked();
            expect(bookCheckbox).toBeChecked();
            expect(drinkCheckbox).toBeChecked();
            expect(screen.queryByText(/Macbook/i)).not.toBeInTheDocument();

            const expectedItems = [
                /You become what you think/i,
                /Sapporo/i,
            ];
        
            expectedItems.forEach(product => {
                expect(screen.getAllByText(product)).not.toHaveLength(0);
            });  
        }, { timeout: 15000 });
    }, 15000);
    
    it("should reset filters", async () => {
        await renderHomePage();

        const originalWindow = window.location;
        delete window.location;
        window.location = {
            ...originalWindow,
            reload: jest.fn()
        };

        const checkbox = await screen.findByRole('checkbox', { name: 'Book' });
        const radioButton = await screen.findByRole('radio', { name: '$0 to 19.99' });

        // Initial state
        expect(radioButton).not.toBeChecked();
        expect(checkbox).not.toBeChecked();


        await act(async () => {
            fireEvent.click(checkbox);
            fireEvent.click(radioButton);
        });

        await waitFor(() => {
            expect(checkbox).toBeChecked();
            expect(radioButton).toBeChecked();
            expect(screen.queryByText(/Macbook/i)).not.toBeInTheDocument();
        }, { timeout: 15000 });

        const resetButton = await screen.findByRole('button', { name: 'RESET FILTERS' });

        await act(async () => {
            fireEvent.click(resetButton);
        });

        await waitFor(() => {
            expect(screen.getByText(/Macbook/i)).toBeInTheDocument();
        }, { timeout: 15000 });
        window.location = originalWindow;
    }, 15000);
       
});