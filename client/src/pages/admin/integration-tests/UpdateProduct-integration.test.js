import React from "react";
import { getByTestId, render, screen, waitFor, fireEvent } from "@testing-library/react";
import UpdateProduct from "../UpdateProduct";
import axios from "axios";
import { useParams, useNavigate, BrowserRouter, Route, Routes, MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import useCategory from "../../../hooks/useCategory";
import { toast } from "react-hot-toast";
import { AuthProvider } from "../../../context/auth";
import { CartProvider } from "../../../context/cart";
import { SearchProvider } from "../../../context/search";

jest.mock("axios");
jest.spyOn(toast, "success");
jest.spyOn(toast, "error");
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: jest.fn(),
}));


window.matchMedia = window.matchMedia || function () {
    return {
        matches: false,
        addListener: function () { },
        removeListener: function () { }
    };
};

console.log = jest.fn();

const mockCategories = [{ _id: "1", name: "Cars" }, { _id: "2", name: "Books" }];
const mockAuth = { user: { name: "admin", email: "admin@email.com" }, token: "sometoken" };
localStorage.setItem("auth", JSON.stringify(mockAuth));

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

const mockProduct = {
    _id: "1",
    name: "Product 1",
    description: "Product 1 description",
    price: 100,
    quantity: 10,
    shipping: true,
    category: { _id: "2", name: "Books" },
};



describe("UpdateProduct Component", () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("Render correct product details", async () => {

        axios.get.mockResolvedValue({ data: { success: true, product: mockProduct } });

        const { getByPlaceholderText } = render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <MemoryRouter
                            initialEntries={["/admin/product/update/product-1"]}
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

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product/product-1");
            expect(getByPlaceholderText("Write a name")).toHaveValue("Product 1");
            expect(getByPlaceholderText("Write a description")).toHaveValue("Product 1 description");
            expect(getByPlaceholderText("Write a price")).toHaveValue(100);
            expect(getByPlaceholderText("Write a quantity")).toHaveValue(10);
        });

    });

    it("Error if get api not successful", async () => {
        axios.get.mockResolvedValue({ data: { success: false, message: "Error message" } });

        render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <MemoryRouter
                            initialEntries={["/admin/product/update/product-1"]}
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

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error message")
        });
    })

    it("Update product successfully", async () => {
        axios.get.mockResolvedValue({ data: { success: true, product: mockProduct } });
        axios.put.mockResolvedValue({ data: { success: true } });

        const { getByTestId, getByPlaceholderText } = render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <MemoryRouter
                            initialEntries={["/admin/product/update/product-1"]}
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

        fireEvent.change(getByPlaceholderText("Write a price"), { target: { value: 123 } });
        fireEvent.click(getByTestId("update-product-btn"));

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalled()
            expect(toast.success).toHaveBeenCalledWith("Product updated successfully");
        });
    });

    it("Error if update api not successful", async () => {
        axios.get.mockResolvedValue({ data: { success: true, product: mockProduct } });
        axios.put.mockResolvedValue({ data: { success: false, message: "Error message" } });

        const { getByTestId, getByPlaceholderText } = render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <MemoryRouter
                            initialEntries={["/admin/product/update/product-1"]}
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

        fireEvent.change(getByPlaceholderText("Write a price"), { target: { value: 123 } });
        fireEvent.click(getByTestId("update-product-btn"));

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalled()
            expect(toast.error).toHaveBeenCalledWith("Error message");
        });
    });

    it("Should not delete product when cancel", async () => {
        axios.get.mockResolvedValue({ data: { success: true, product: mockProduct } });
        axios.delete.mockResolvedValue({ data: { success: true } });

        const { getByTestId } = render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <MemoryRouter
                            initialEntries={["/admin/product/update/product-1"]}
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

        await waitFor(() => {
            window.prompt = jest.fn()
            fireEvent.click(getByTestId("delete-product-btn"));
            expect(axios.delete).not.toHaveBeenCalled()
        });
    });

    it("Should delete product when yes", async () => {
        axios.get.mockResolvedValue({ data: { success: true, product: mockProduct } });
        axios.delete.mockResolvedValue({ data: { success: true } });

        const { getByTestId } = render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <MemoryRouter
                            initialEntries={["/admin/product/update/product-1"]}
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

        await waitFor(() => {
            window.prompt = jest.fn(() => 'yes')
            fireEvent.click(getByTestId("delete-product-btn"));
            expect(axios.delete).toHaveBeenCalled()
            expect(toast.success).toHaveBeenCalledWith("Product deleted successfully");
        });
    });

    it("Error if api is unsuccessful", async () => {
        axios.get.mockResolvedValue({ data: { success: true, product: mockProduct } });
        axios.delete.mockResolvedValue({ data: { success: false, message: "Error message" } });

        const { getByTestId } = render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <MemoryRouter
                            initialEntries={["/admin/product/update/product-1"]}
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

        await waitFor(() => {
            window.prompt = jest.fn(() => 'yes')
            fireEvent.click(getByTestId("delete-product-btn"));
            expect(axios.delete).toHaveBeenCalled()
            expect(toast.error).toHaveBeenCalledWith("Error message");
        });
    });


});
