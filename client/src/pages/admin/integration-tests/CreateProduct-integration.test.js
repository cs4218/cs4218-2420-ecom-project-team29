import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import CreateProduct from "../CreateProduct";
import { AuthProvider } from "../../../context/auth";
import { CartProvider } from "../../../context/cart";
import { SearchProvider } from "../../../context/search";

jest.mock("axios");
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

const mockCategories = [{ _id: "1", name: "Cars" }, { _id: "2", name: "Books" }];
const mockAuth = { user: { name: "admin", email: "admin@email.com" }, token: "sometoken" };
localStorage.setItem("auth", JSON.stringify(mockAuth));

console.log = jest.fn();

describe("CreateProduct Component", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("Render error if cant get categories", async () => {
        axios.get.mockRejectedValueOnce(new Error("Internal Server Error"));

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

        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting category")
        );
    });

    it('Render all categories and form fields', async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, category: mockCategories } });

        const { getByPlaceholderText, getByTestId, getByText } = render(
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

        await waitFor(() => {
            expect(getByPlaceholderText("Select a category")).toBeInTheDocument();
            expect(getByTestId("upload-photo-input")).toBeInTheDocument();
            expect(getByPlaceholderText("Write a name")).toBeInTheDocument();
            expect(getByPlaceholderText("Write a description")).toBeInTheDocument();
            expect(getByPlaceholderText("Write a price")).toBeInTheDocument();
            expect(getByPlaceholderText("Write a quantity")).toBeInTheDocument();
            expect(getByPlaceholderText("Select shipping")).toBeInTheDocument();
            expect(getByTestId("create-product-btn")).toBeInTheDocument();
            expect(getByText("Cars")).toBeInTheDocument();
            expect(getByText("Books")).toBeInTheDocument();
        });
    });

    it("Create a product successfully", async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, category: mockCategories } });
        axios.post.mockResolvedValueOnce({ data: { success: true, message: "Product created successfully" } });
        URL.createObjectURL = jest.fn().mockReturnValue("test-url");
        const { getByPlaceholderText, getByTestId } = render(
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

        fireEvent.change(getByTestId('category-select'), { target: { value: 'Cars' } });
        fireEvent.change(getByTestId('shipping-select'), { target: { value: 'Yes' } });
        fireEvent.change(getByPlaceholderText("Write a name"), { target: { value: "Test Product" }, });
        fireEvent.change(getByPlaceholderText("Write a description"), { target: { value: "This is a test product" }, });
        fireEvent.change(getByPlaceholderText("Write a price"), { target: { value: "100" }, });
        fireEvent.change(getByPlaceholderText("Write a quantity"), { target: { value: "10" }, });
        fireEvent.click(getByTestId("create-product-btn"));
        const file = new File(["photo"], "photo.png", { type: "image/png" });
        fireEvent.change(getByTestId("upload-photo-input"), { target: { files: [file] } });

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/create-product", expect.any(FormData));
            expect(axios.post).toHaveBeenCalledTimes(1);
            expect(toast.success).toHaveBeenCalledWith("Product created successfully");
        });
    });

    it('Render error toast if api not successful', async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, category: mockCategories } });
        axios.post.mockResolvedValueOnce({ data: { success: false, message: "Error message" } });

        const { getByTestId } = render(
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

        fireEvent.click(getByTestId("create-product-btn"));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/create-product", expect.any(FormData));
            expect(axios.post).toHaveBeenCalledTimes(1);
            expect(toast.error).toHaveBeenCalledWith("Error message");
        });
    });

    it('Render error toast if api error', async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, category: mockCategories } });
        axios.post.mockRejectedValueOnce(new Error('Internal Server Error'));

        const { getByTestId } = render(
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

        fireEvent.click(getByTestId("create-product-btn"));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/create-product", expect.any(FormData));
            expect(axios.post).toHaveBeenCalledTimes(1);
            expect(toast.error).toHaveBeenCalledWith("Something went wrong");
        });
    });


});