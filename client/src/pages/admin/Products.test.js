import React from "react";
import "@testing-library/jest-dom/extend-expect";
import { render, waitFor } from '@testing-library/react';
import { useAuth } from '../../context/auth';
import Products from "./Products";
import axios from "axios";
import { toast } from "react-hot-toast";
import { MemoryRouter, Routes, Route } from 'react-router-dom';


jest.mock('axios');
jest.mock('react-hot-toast');

// mock the console.log
console.log = jest.fn();

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../../components/AdminMenu', () => () => <div>Admin Panel</div>);
jest.mock('../../components/Layout', () => ({ children }) => <div>{children}</div>);

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

describe('AdminDashboard', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue([{ token: "sampletoken" }, jest.fn()]); // Mock useAuth hook
    });

    it("renders header and menu only when no products", async () => {
        axios.get.mockResolvedValueOnce({ data: { products: [] } });

        const { getByText } = render(
            <MemoryRouter initialEntries={['/products']}>
                <Routes>
                    <Route path="/products" element={<Products />} />
                </Routes>
            </MemoryRouter>
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
            <MemoryRouter initialEntries={['/products']}>
                <Routes>
                    <Route path="/products" element={<Products />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
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
            <MemoryRouter initialEntries={['/products']}>
                <Routes>
                    <Route path="/products" element={<Products />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
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

        const { getByText } = render(<Products />);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(getByText('All Products List')).toBeInTheDocument();
            expect(toast.error).toHaveBeenCalledWith('Something Went Wrong');
        });
    });

    it('no api call when not admin', () => {
        useAuth.mockReturnValueOnce([null, jest.fn()]);
        axios.get.mockResolvedValueOnce({ data: [] });

        const { getByText } = render(<Products />);

        expect(getByText('Admin Panel')).toBeInTheDocument();
        expect(axios.get).not.toHaveBeenCalled();
    });
});