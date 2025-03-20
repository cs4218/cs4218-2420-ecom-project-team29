import React from "react";
import toast from "react-hot-toast";
import { render, screen, fireEvent, waitFor, within, getByTestId } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import CreateCategory from "./CreateCategory";

jest.mock("axios");
jest.mock("react-hot-toast");


console.log = jest.fn();

jest.mock("../../components/Layout", () => ({ children }) => (
    <div>{children}</div>
));
jest.mock("../../components/AdminMenu", () => () => <div>Mock AdminMenu</div>);
jest.mock("../../components/Form/CategoryForm", () =>
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

const mockCategories = [{ _id: "1", name: "Cars" }, { _id: "2", name: "Books" }];

describe("CreateCategory Component", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("Error when cannot get categories", async () => {
        axios.get.mockResolvedValue(new Error('Internal Server Error'));
        render(<CreateCategory />);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting category");
        });
    });

    it("Header and current categories are listed", async () => {
        axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
        const { getByText } = render(<CreateCategory />);

        await waitFor(() => {
            expect(getByText("Manage Category")).toBeInTheDocument();
            expect(document.querySelectorAll('.category-item').length).toBe(2)
        });
    });

    it("Create a new category", async () => {
        axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
        axios.post.mockResolvedValue({ status: 201, data: { success: true } });

        const { getByPlaceholderText, getByText } = render(<CreateCategory />);

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

        const { getByText } = render(<CreateCategory />);

        fireEvent.change(document.getElementById("category-input"), { target: { value: "New Category" } });
        fireEvent.click(getByText("Submit"));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", { name: "New Category" });
            expect(toast.error).toHaveBeenCalledWith("Something went wrong in input form");
        });
    });

    it('Updates a category', async () => {
        axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
        axios.put.mockResolvedValue({ data: { success: true } });

        const { getByText, getByTestId } = render(<CreateCategory />);

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

        const { getByText, getByTestId } = render(<CreateCategory />);

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

        const { getByText, getByTestId } = render(<CreateCategory />);

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

        const { getByText, getByTestId } = render(<CreateCategory />);

        await waitFor(async () => {
            fireEvent.click(getByTestId("delete-button-2"));
            expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/2");
            expect(toast.success).toHaveBeenCalledWith("Category is deleted");
        });
    });

    it('Render error message when cant delete category with error', async () => {
        axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
        axios.delete.mockResolvedValue(new Error('Internal Server Error'));

        const { getByText, getByTestId } = render(<CreateCategory />);

        await waitFor(async () => {
            fireEvent.click(getByTestId("delete-button-2"));
            expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/2");
            expect(toast.error).toHaveBeenCalledWith("Something went wrong");
        });
    });

    it('Render error message when cant delete category wtih no success', async () => {
        axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
        axios.delete.mockResolvedValue({ data: { success: false, message: "error message" } });

        const { getByText, getByTestId } = render(<CreateCategory />);

        await waitFor(async () => {
            fireEvent.click(getByTestId("delete-button-2"));
            expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/2");
            expect(toast.error).toHaveBeenCalledWith("error message");
        });
    });

    it('Render error message when cant update new category with no success', async () => {
        axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
        axios.put.mockResolvedValue({ data: { success: false, message: "error message" } });

        const { getByText, getByTestId } = render(<CreateCategory />);

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