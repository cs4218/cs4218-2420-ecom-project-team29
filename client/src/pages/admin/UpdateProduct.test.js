import React from "react";
import { getByTestId, render, screen, waitFor, fireEvent } from "@testing-library/react";
import UpdateProduct from "./UpdateProduct";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import useCategory from "../../hooks/useCategory";
import { MemoryRouter } from "react-router-dom";
import { toast } from "react-hot-toast";



jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: jest.fn(),
    useParams: jest.fn(),
}));
// mock components
jest.mock('../../components/AdminMenu', () => () => <div>Admin Menu</div>);

// Mock the useAuth hook
jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(),
}));

// mock the useCart hook
jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function for setCart
}));

// mock the useSearch hook
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));

// mock the getCategories hook
jest.mock('../../hooks/useCategory', () => jest.fn(() => []));

jest.mock("../../components/Layout", () => ({ children }) => (
    <div>{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => <div>Mock AdminMenu</div>);


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
const mockProduct = {
    _id: "1",
    name: "Product 1",
    description: "Product 1 description",
    price: 100,
    quantity: 10,
    shipping: true,
    category: { _id: "2", name: "Books" },
};

// const mockNavigate = jest.fn();
describe("UpdateProduct Component", () => {

    beforeEach(() => {
        useParams.mockReturnValue({ slug: "product-1" });
        useNavigate.mockReturnValue(jest.fn());
        useCategory.mockReturnValue(mockCategories);
    });

    it("should render correct product details", async () => {
        axios.get.mockResolvedValue({ data: { success: true, product: mockProduct } });

        const { getByPlaceholderText } = render(
            <MemoryRouter>
                <UpdateProduct />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product/product-1");
            expect(getByPlaceholderText("Write a name")).toHaveValue("Product 1");
            expect(getByPlaceholderText("Write a description")).toHaveValue("Product 1 description");
            expect(getByPlaceholderText("Write a price")).toHaveValue(100);
            expect(getByPlaceholderText("Write a quantity")).toHaveValue(10);
        });

    });

    it("error if can't get product", async () => {
        axios.get.mockRejectedValueOnce(new Error("Internal Server Error"));

        render(
            <MemoryRouter>
                <UpdateProduct />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting product")
        });
    })

    it("error if can't get api success is false", async () => {
        axios.get.mockResolvedValue({ data: { success: false, message: "Error message" } });

        render(
            <MemoryRouter>
                <UpdateProduct />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error message")
        });
    })

    it("it should update product if ok", async () => {
        axios.get.mockResolvedValue({ data: { success: true, product: mockProduct } });
        axios.put.mockResolvedValue({ data: { success: true } });

        const { getByTestId, getByPlaceholderText } = render(
            <MemoryRouter>
                <UpdateProduct />
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText("Write a price"), { target: { value: 123 } });
        fireEvent.click(getByTestId("update-product-btn"));

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalled()
            expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
        });
    });

    it("toast error if update api not success", async () => {
        axios.get.mockResolvedValue({ data: { success: true, product: mockProduct } });
        axios.put.mockResolvedValue({ data: { success: false, message: "Error message" } });

        const { getByTestId, getByPlaceholderText } = render(
            <MemoryRouter>
                <UpdateProduct />
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText("Write a price"), { target: { value: 123 } });
        fireEvent.click(getByTestId("update-product-btn"));

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalled()
            expect(toast.error).toHaveBeenCalledWith("Error message");
        });
    });

    it("should not delete product when cancel", async () => {
        axios.get.mockResolvedValue({ data: { success: true, product: mockProduct } });
        axios.delete.mockResolvedValue({ data: { success: true } });

        const { getByTestId } = render(
            <MemoryRouter>
                <UpdateProduct />
            </MemoryRouter>
        );
        
        await waitFor(() => {
            window.prompt = jest.fn(() => 'no')
            fireEvent.click(getByTestId("delete-product-btn"));
            expect(axios.delete).not.toHaveBeenCalled()
            // expect(toast.success).toHaveBeenCalledWith("Product Deleted Successfully");
        });
    });

    it("should delete product when yes", async () => {
        axios.get.mockResolvedValue({ data: { success: true, product: mockProduct } });
        axios.delete.mockResolvedValue({ data: { success: true } });

        const { getByTestId } = render(
            <MemoryRouter>
                <UpdateProduct />
            </MemoryRouter>
        );
        
        await waitFor(() => {
            window.prompt = jest.fn(() => 'yes')
            fireEvent.click(getByTestId("delete-product-btn"));
            expect(axios.delete).toHaveBeenCalled()
            expect(toast.success).toHaveBeenCalledWith("Product Deleted Successfully");
        });
    });

    it("should error delete product is unsuccessful", async () => {
        axios.get.mockResolvedValue({ data: { success: true, product: mockProduct } });
        axios.delete.mockResolvedValue({ data: { success: false, message: "Error message" } });

        const { getByTestId } = render(
            <MemoryRouter>
                <UpdateProduct />
            </MemoryRouter>
        );
        
        await waitFor(() => {
            window.prompt = jest.fn(() => 'yes')
            fireEvent.click(getByTestId("delete-product-btn"));
            expect(axios.delete).toHaveBeenCalled()
            expect(toast.error).toHaveBeenCalledWith("Error message");
        });
    });


});