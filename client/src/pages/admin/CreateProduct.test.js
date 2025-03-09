import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import CreateProduct from "./CreateProduct";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock("../../context/cart", () => ({
    useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

// mock the useSearch hook
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));


jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => jest.fn(),
}));

// mock antd Select component
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

const mockCategories = [{ _id: "1", name: "Cars" }, { _id: "2", name: "Books" }];

//mock console.log
console.log = jest.fn();

describe("CreateProduct Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });


    it("render toast.error if cant get categories", async () => {
        axios.get.mockRejectedValueOnce(new Error("Internal Server Error"));

        render(
            <MemoryRouter>
                <CreateProduct />
            </MemoryRouter>
        );

        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting category")
        );
    });

    it('should render all categories and form fields', async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, category: mockCategories } });

        const { getByPlaceholderText, getByTestId, getByText } = render(
            <MemoryRouter>
                <CreateProduct />
            </MemoryRouter>
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

    it("should create a product successfully", async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, category: mockCategories } });
        axios.post.mockResolvedValueOnce({ data: { success: true, message: "Product Created Successfully" } });
        URL.createObjectURL = jest.fn().mockReturnValue("test-url");
        const { getByPlaceholderText, getByTestId } = render(
            <MemoryRouter>
                <CreateProduct />
            </MemoryRouter>
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
            expect(toast.success).toHaveBeenCalledWith("Product Created Successfully");
        });
    });

    it('should render error toast if api not successful', async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, category: mockCategories } });
        axios.post.mockResolvedValueOnce({ data: { success: false, message: "Error message" } });

        const { getByTestId } = render(
            <MemoryRouter>
                <CreateProduct />
            </MemoryRouter>
        );

        fireEvent.click(getByTestId("create-product-btn"));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/create-product", expect.any(FormData));
            expect(axios.post).toHaveBeenCalledTimes(1);
            expect(toast.error).toHaveBeenCalledWith("Error message");
        });
    });

    it('should render error toast if api error', async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, category: mockCategories } });
        axios.post.mockRejectedValueOnce(new Error('Internal Server Error'));

        const { getByTestId } = render(
            <MemoryRouter>
                <CreateProduct />
            </MemoryRouter>
        );

        fireEvent.click(getByTestId("create-product-btn"));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/create-product", expect.any(FormData));
            expect(axios.post).toHaveBeenCalledTimes(1);
            expect(toast.error).toHaveBeenCalledWith("Something went wrong");
        });
    });


});