import React from "react";
import "@testing-library/jest-dom/extend-expect";
import { render, waitFor } from '@testing-library/react';
// import { useAuth } from '../../context/auth';
import Products from "..//Products";
import axios from "axios";
import { toast } from "react-hot-toast";
import { MemoryRouter, Routes, Route, BrowserRouter } from 'react-router-dom';
import { AuthProvider } from "../../../context/auth";
import { CartProvider } from "../../../context/cart";
import { SearchProvider } from "../../../context/search";
import { before } from "node:test";


jest.mock('axios');
jest.spyOn(toast, "success");
jest.spyOn(toast, "error");
console.log = jest.fn();

const mockAuth = { user: { name: "admin", email: "admin@email.com" }, token: "sometoken" };
localStorage.setItem("auth", JSON.stringify(mockAuth));
jest.mock('../../../components/Header', () => () => <div>Header</div>);


const product1 = {
    _id: 1,
    createdAt: Date.now(),
    description: "hot drink",
    name: "hot choco",
    price: 4.8,
    quantity: 1,
    slug: "hot-choco",
    updatedAt: Date.now()
}

const product2 = {
    _id: 2,
    createdAt: Date.now(),
    description: "dog description",
    name: "dog",
    price: 123,
    quantity: 1,
    slug: "dog",
    updatedAt: Date.now()
}

window.matchMedia = window.matchMedia || function () {
    return {
        matches: false,
        addListener: function () { },
        removeListener: function () { }
    };
};

describe('AdminDashboard', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders header and menu only when no products", async () => {
        axios.get.mockResolvedValueOnce({ data: { products: [] } });

        const { getByText } = render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <BrowserRouter>
                            <Products />
                        </BrowserRouter>
                    </SearchProvider>
                </CartProvider>
            </AuthProvider>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(document.querySelectorAll('.product-link').length).toBe(0);
            expect(getByText('All Products List')).toBeInTheDocument();
        });
    });

    it('renders 1 product', async () => {
        axios.get.mockResolvedValueOnce({ data: { products: [product1] } });

        const { getByText, getByTestId } = render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <BrowserRouter>
                            <Products />
                        </BrowserRouter>
                    </SearchProvider>
                </CartProvider>
            </AuthProvider>
        );

        await waitFor(() => {
            expect(document.querySelectorAll('.product-link').length).toBe(1);
            expect(getByText('All Products List')).toBeInTheDocument();
            expect(getByText('hot choco')).toBeInTheDocument();
            expect(getByText('hot drink')).toBeInTheDocument();
            expect(getByTestId('product-1').closest('a')).toHaveAttribute('href', '/dashboard/admin/product/hot-choco');
        });
    });


    it('renders multiple products', async () => {
        axios.get.mockResolvedValueOnce({ data: { products: [product1, product2] } });

        const { getByText, getByTestId } = render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <BrowserRouter>
                            <Products />
                        </BrowserRouter>
                    </SearchProvider>
                </CartProvider>
            </AuthProvider>
        );

        await waitFor(() => {
            expect(document.querySelectorAll('.product-link').length).toBe(2);
            expect(getByText('All Products List')).toBeInTheDocument();
            expect(getByText('hot choco')).toBeInTheDocument();
            expect(getByText('hot drink')).toBeInTheDocument();
            expect(getByTestId('product-1').closest('a')).toHaveAttribute('href', '/dashboard/admin/product/hot-choco');
            expect(getByText('dog')).toBeInTheDocument();
            expect(getByText('dog description')).toBeInTheDocument();
            expect(getByTestId('product-2').closest('a')).toHaveAttribute('href', '/dashboard/admin/product/dog');

        });
    });

    it('renders error message on failure', async () => {
        axios.get.mockRejectedValueOnce(new Error('Internal Server Error'));

        const { getByText } = render(<AuthProvider>
            <CartProvider>
                <SearchProvider>
                    <BrowserRouter>
                        <Products />
                    </BrowserRouter>
                </SearchProvider>
            </CartProvider>
        </AuthProvider>);

        await waitFor(() => {
            expect(getByText('All Products List')).toBeInTheDocument();
            expect(toast.error).toHaveBeenCalledWith('Something Went Wrong');
        });
    });

});