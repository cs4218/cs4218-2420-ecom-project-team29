import React from "react";
import toast from "react-hot-toast";
import { render, screen, fireEvent, waitFor, within, getByTestId } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { BrowserRouter } from "react-router-dom";
import CreateCategory from "../CreateCategory";
import { AuthProvider } from "../../../context/auth";
import { CartProvider } from "../../../context/cart";
import { SearchProvider } from "../../../context/search";
import { expect } from "@playwright/test";

jest.mock("axios");
jest.spyOn(toast, "success");
jest.spyOn(toast, "error");

console.log = jest.fn();

jest.mock("../../../components/Form/CategoryForm", () =>
    ({ handleSubmit, setValue, value }) =>
    (
        <form onSubmit={handleSubmit}>
            <input
                id="category-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
            <button type="submit">Submit</button>
        </form>
    )
);

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

describe("CreateCategory Component", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("Error when cannot get categories", async () => {

        axios.get.mockResolvedValue(new Error('Internal Server Error'));
        render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <BrowserRouter>
                            <CreateCategory />
                        </BrowserRouter>
                    </SearchProvider>
                </CartProvider>
            </AuthProvider>
        );

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting category");
        });
    });

    it("Header and current categories are listed", async () => {
        axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
        const { getByText } = render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <BrowserRouter>
                            <CreateCategory />
                        </BrowserRouter>
                    </SearchProvider>
                </CartProvider>
            </AuthProvider>
        );

        await waitFor(() => {
            expect(getByText("Manage Category")).toBeInTheDocument();
            expect(document.querySelectorAll('.category-item').length).toBe(2)
        });
    });

    it("Create a new category", async () => {
        axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
        axios.post.mockResolvedValue({ status: 201, data: { success: true } });

        const { getByPlaceholderText, getByText } = render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <BrowserRouter>
                            <CreateCategory />
                        </BrowserRouter>
                    </SearchProvider>
                </CartProvider>
            </AuthProvider>
        );

        fireEvent.change(document.getElementById("category-input"), { target: { value: "New Category" } });
        fireEvent.click(getByText("Submit"));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", { name: "New Category" });
            expect(toast.success).toHaveBeenCalledWith("New Category is created");
        });
    });

    it("Render error message when cant create new category with error", async () => {
        axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
        axios.post.mockResolvedValue(new Error('Internal Server Error'));

        const { getByText } = render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <BrowserRouter>
                            <CreateCategory />
                        </BrowserRouter>
                    </SearchProvider>
                </CartProvider>
            </AuthProvider>
        );

        fireEvent.change(document.getElementById("category-input"), { target: { value: "New Category" } });
        fireEvent.click(getByText("Submit"));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", { name: "New Category" });
            expect(toast.error).toHaveBeenCalledWith("Something went wrong");
        });
    });

    it('Updates a category', async () => {
        axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
        axios.put.mockResolvedValue({ data: { success: true } });

        const { getByText, getByTestId } = render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <BrowserRouter>
                            <CreateCategory />
                        </BrowserRouter>
                    </SearchProvider>
                </CartProvider>
            </AuthProvider>
        );

        await waitFor(async () => {
            fireEvent.click(getByTestId("edit-button-2"));
            const modal = screen.getByTestId("update-modal");
            fireEvent.change(within(modal).getByRole("textbox"), { target: { value: "Updated Category" } });
            fireEvent.click(within(modal).getByText("Submit"));
            expect(axios.put).toHaveBeenCalledWith("/api/v1/category/update-category/2", { name: "Updated Category" });
            expect(toast.success).toHaveBeenCalledWith("Updated Category is updated");
        });
    });

    it('Dont update category when only close modal', async () => {
        axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
        axios.put.mockResolvedValue({ data: { success: true } });

        const { getByText, getByTestId } = render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <BrowserRouter>
                            <CreateCategory />
                        </BrowserRouter>
                    </SearchProvider>
                </CartProvider>
            </AuthProvider>
        );

        await waitFor(async () => {
            fireEvent.click(getByTestId("edit-button-2"));
            const modal = screen.getByTestId("update-modal");
            fireEvent.change(within(modal).getByRole("textbox"), { target: { value: "Updated Category" } });
            fireEvent.click(within(modal).getByRole("button", { name: "Close" }));
            expect(axios.put).not.toHaveBeenCalled();
        });
    });

    it('Render error message when cant update new category with error', async () => {
        axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
        axios.put.mockResolvedValue(new Error('Internal Server Error'));

        const { getByText, getByTestId } = render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <BrowserRouter>
                            <CreateCategory />
                        </BrowserRouter>
                    </SearchProvider>
                </CartProvider>
            </AuthProvider>
        );

        await waitFor(async () => {
            fireEvent.click(getByTestId("edit-button-2"));
            const modal = screen.getByTestId("update-modal");
            fireEvent.change(within(modal).getByRole("textbox"), { target: { value: "Updated Category" } });
            fireEvent.click(within(modal).getByText("Submit"));
            expect(axios.put).toHaveBeenCalledWith("/api/v1/category/update-category/2", { name: "Updated Category" });
            expect(toast.error).toHaveBeenCalledWith("Something went wrong");
        });
    });

    it('Delete a category', async () => {
        axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
        axios.delete.mockResolvedValue({ data: { success: true } });

        const { getByText, getByTestId } = render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <BrowserRouter>
                            <CreateCategory />
                        </BrowserRouter>
                    </SearchProvider>
                </CartProvider>
            </AuthProvider>
        );

        await waitFor(async () => {
            fireEvent.click(getByTestId("delete-button-2"));
            expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/2");
            expect(toast.success).toHaveBeenCalledWith("Category is deleted");
        });
    });

    it('Render error message when cant delete category with error', async () => {
        axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
        axios.delete.mockResolvedValue(new Error('Internal Server Error'));

        const { getByText, getByTestId } = render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <BrowserRouter>
                            <CreateCategory />
                        </BrowserRouter>
                    </SearchProvider>
                </CartProvider>
            </AuthProvider>
        );

        await waitFor(async () => {
            fireEvent.click(getByTestId("delete-button-2"));
            expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/2");
            expect(toast.error).toHaveBeenCalledWith("Something went wrong");
        });
    });

    it('Render error message when cant delete category wtih no success', async () => {
        axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
        axios.delete.mockResolvedValue({ data: { success: false, message: "error message" } });

        const { getByText, getByTestId } = render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <BrowserRouter>
                            <CreateCategory />
                        </BrowserRouter>
                    </SearchProvider>
                </CartProvider>
            </AuthProvider>
        );

        await waitFor(async () => {
            fireEvent.click(getByTestId("delete-button-2"));
            expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/2");
            expect(toast.error).toHaveBeenCalledWith("error message");
        });
    });

    it('Render error message when cant update new category with no success', async () => {
        axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
        axios.put.mockResolvedValue({ data: { success: false, message: "error message" } });

        const { getByText, getByTestId } = render(
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <BrowserRouter>
                            <CreateCategory />
                        </BrowserRouter>
                    </SearchProvider>
                </CartProvider>
            </AuthProvider>
        );

        await waitFor(async () => {
            fireEvent.click(getByTestId("edit-button-2"));
            const modal = screen.getByTestId("update-modal");
            fireEvent.change(within(modal).getByRole("textbox"), { target: { value: "Updated Category" } });
            fireEvent.click(within(modal).getByText("Submit"));
            expect(axios.put).toHaveBeenCalledWith("/api/v1/category/update-category/2", { name: "Updated Category" });
            expect(toast.error).toHaveBeenCalledWith("error message");
        });
    });


});