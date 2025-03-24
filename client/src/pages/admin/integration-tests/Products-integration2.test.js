import React from "react";
import "@testing-library/jest-dom/extend-expect";
import { render, waitFor, act, screen } from '@testing-library/react';
import Products from "..//Products";
import axios from "axios";
import { toast } from "react-hot-toast";
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from "../../../context/auth";
import { CartProvider } from "../../../context/cart";
import { SearchProvider } from "../../../context/search";


jest.spyOn(toast, "success");
jest.spyOn(toast, "error");

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

const mockAuth = { user: { name: "admin", email: "admin@test.sg" }, token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2N2RmYTc1YWE4ODU0ZDgzYTIzMWEyODYiLCJpYXQiOjE3NDI3MTUyMTR9.cSfnzdY6mkc2oacp440caYoyyG7-7oqPaQQUX79u5mU" };
localStorage.setItem("auth", JSON.stringify(mockAuth));

describe('Products', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        axios.defaults.baseURL = "http://localhost:6060";
        axios.defaults.timeout = 5000;
    });

    it('renders products', async () => {

        await act(async () => {
            render(
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
        });

        await waitFor(() => {
            expect(screen.getByText("All Products List")).toBeInTheDocument();
            expect(screen.getByText("13-inch MacBook Air - Sky Blue")).toBeInTheDocument();
            expect(screen.getByText("Wisepad 3 Reader")).toBeInTheDocument();
            expect(screen.getByText("Truffle Yakiniku Donburi")).toBeInTheDocument();
        });
    });


});