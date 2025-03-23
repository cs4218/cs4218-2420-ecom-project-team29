import React from "react";
import { render, fireEvent, waitFor, screen, act } from "@testing-library/react";
import axios from "axios";
import { BrowserRouter, MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import CreateProduct from "../CreateProduct";
import UpdateProduct from "../UpdateProduct";
import { AuthProvider } from "../../../context/auth";
import { CartProvider } from "../../../context/cart";
import { SearchProvider } from "../../../context/search";
import userEvent from "@testing-library/user-event";
import { useParams } from "react-router-dom";

jest.spyOn(toast, "success");
jest.spyOn(toast, "error");

jest.mock("antd", () => {
    const antd = jest.requireActual("antd");
    const SelectMock = ({ children, "data-testid": testId, onChange, placeholder }) => (
        <select
            data-testid={testId}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
        >
            {children}
        </select>
    );

    SelectMock.Option = ({ children, value }) => (
        <option value={value}>{children}</option>
    );

    return {
        ...antd,
        Select: SelectMock,
    };
});

window.matchMedia = window.matchMedia || function () {
    return {
        matches: false,
        addListener: function () { },
        removeListener: function () { }
    };
};

const mockAuth = { user: { name: "admin", email: "admin@test.sg" }, token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2N2RmYTc1YWE4ODU0ZDgzYTIzMWEyODYiLCJpYXQiOjE3NDI3MTUyMTR9.cSfnzdY6mkc2oacp440caYoyyG7-7oqPaQQUX79u5mU" };
localStorage.setItem("auth", JSON.stringify(mockAuth));


describe("Create and Update Product", () => {

    const user = userEvent.setup();

    beforeEach(() => {
        jest.clearAllMocks();
        axios.defaults.baseURL = "http://localhost:6060";
        axios.defaults.timeout = 5000;
    });

    it('Render all categories and form fields', async () => {

        await act(async () => {
            render(
                <AuthProvider>
                    <CartProvider>
                        <SearchProvider>
                            <BrowserRouter>
                                <CreateProduct />
                            </BrowserRouter>
                        </SearchProvider>
                    </CartProvider>
                </AuthProvider>
            );
        });

        await waitFor(() => {
            expect(screen.getByPlaceholderText("Select a category")).toBeInTheDocument();
            expect(screen.getByTestId("upload-photo-input")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("Write a name")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("Write a description")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("Write a price")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("Write a quantity")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("Select shipping")).toBeInTheDocument();
            expect(screen.getByTestId("create-product-btn")).toBeInTheDocument();
        });
    });

    it("Create a product successfully", async () => {

        await act(async () => {
            render(
                <AuthProvider>
                    <CartProvider>
                        <SearchProvider>
                            <BrowserRouter>
                                <CreateProduct />
                            </BrowserRouter>
                        </SearchProvider>
                    </CartProvider>
                </AuthProvider>
            );
        });


        await waitFor(() => {
            expect(screen.getByTestId('category-select')).toBeInTheDocument();
            expect(screen.getByRole('option', { name: 'Book' })).toBeInTheDocument();
            expect(screen.getByRole('option', { name: 'Yes' })).toBeInTheDocument();
            expect(screen.getByTestId("upload-photo-input")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("Write a name")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("Write a description")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("Write a price")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("Write a quantity")).toBeInTheDocument();
            expect(screen.getByTestId('shipping-select')).toBeInTheDocument();
            expect(screen.getByTestId("create-product-btn")).toBeInTheDocument();
        });

        await user.selectOptions(screen.getByTestId("category-select"), "Book");
        await user.selectOptions(screen.getByTestId("shipping-select"), "Yes");
        fireEvent.change(screen.getByPlaceholderText("Write a name"), { target: { value: "integration_test_product" }, });
        fireEvent.change(screen.getByPlaceholderText("Write a description"), { target: { value: "This is a integration_test_product" }, });
        fireEvent.change(screen.getByPlaceholderText("Write a price"), { target: { value: "100" }, });
        fireEvent.change(screen.getByPlaceholderText("Write a quantity"), { target: { value: "10" }, });
        fireEvent.click(screen.getByTestId("create-product-btn"));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Product created successfully");
        });
    });

    it("Update product successfully", async () => {

        await act(async () => {
            render(
                <AuthProvider>
                    <CartProvider>
                        <SearchProvider>
                            <MemoryRouter
                                initialEntries={["/admin/product/update/integration_test_product"]}
                            >
                                <Routes>
                                    <Route
                                        path="/admin/product/update/:slug"
                                        element={<UpdateProduct />}
                                    />
                                    <Route path="/dashboard/admin/products" element={<div>Products</div>} />
                                </Routes>
                            </MemoryRouter>
                        </SearchProvider>
                    </CartProvider>
                </AuthProvider>
            );
        });

        await waitFor(() => {
            expect(screen.getByPlaceholderText("Write a description")).toBeInTheDocument();
            expect(screen.getByText("This is a integration_test_product")).toBeInTheDocument();

        });

        fireEvent.change(screen.getByPlaceholderText("Write a description"), { target: { value: "edited description" }, });
        fireEvent.click(screen.getByTestId("update-product-btn"));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Product updated successfully");
        });
    });

    it("Delete product successfully", async () => {

        await act(async () => {
            render(
                <AuthProvider>
                    <CartProvider>
                        <SearchProvider>
                            <MemoryRouter
                                initialEntries={["/admin/product/update/integration_test_product"]}
                            >
                                <Routes>
                                    <Route
                                        path="/admin/product/update/:slug"
                                        element={<UpdateProduct />}
                                    />
                                    <Route path="/dashboard/admin/products" element={<div>Products</div>} />
                                </Routes>
                            </MemoryRouter>
                        </SearchProvider>
                    </CartProvider>
                </AuthProvider>
            );
        });

        await waitFor(() => {
            expect(screen.getByPlaceholderText("Write a description")).toBeInTheDocument();
            expect(screen.getByText("edited description")).toBeInTheDocument();
            expect(screen.getByTestId("delete-product-btn")).toBeInTheDocument();
        });

        window.prompt = jest.fn(() => 'yes')
        fireEvent.click(screen.getByTestId("delete-product-btn"));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Product deleted successfully");
        });
    });




});