import React from "react";
import toast from "react-hot-toast";
import { render, screen, fireEvent, waitFor, within, act } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { BrowserRouter } from "react-router-dom";
import CreateCategory from "../CreateCategory";
import { AuthProvider } from "../../../context/auth";
import { CartProvider } from "../../../context/cart";
import { SearchProvider } from "../../../context/search";
import { expect } from "@playwright/test";

jest.spyOn(toast, "success");
jest.spyOn(toast, "error");

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

const mockAuth = { user: { name: "admin", email: "admin@test.sg" }, token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2N2RmYTc1YWE4ODU0ZDgzYTIzMWEyODYiLCJpYXQiOjE3NDI3MTUyMTR9.cSfnzdY6mkc2oacp440caYoyyG7-7oqPaQQUX79u5mU" };
localStorage.setItem("auth", JSON.stringify(mockAuth));

describe("CreateCategory Component", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        axios.defaults.baseURL = "http://localhost:6060";
        axios.defaults.timeout = 5000;
    });

    it("Header and current categories are listed", async () => {
        await act(async () => {
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
        });

        await waitFor(() => {
            expect(screen.getByText("Manage Category")).toBeInTheDocument();
            expect(screen.getByText("Electronic", { selector: "td" })).toBeInTheDocument();
            expect(screen.getByText("Book", { selector: "td" })).toBeInTheDocument();
            expect(screen.getByText("Drink", { selector: "td" })).toBeInTheDocument();
            expect(screen.getByText("Food", { selector: "td" })).toBeInTheDocument();
        });
    });

    it("Create a new category", async () => {
        await act(async () => {
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
        });

        fireEvent.change(document.getElementById("category-input"), { target: { value: "integration_test_category" } });
        fireEvent.click(screen.getByText("Submit"));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("integration_test_category is created");
            expect(screen.getByText("integration_test_category", { selector: "td" })).toBeInTheDocument();
        });
    });

    it('Updates a category', async () => {

        await act(async () => {
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
        });

        await waitFor(async () => {
            const row = screen.getByText("integration_test_category", { selector: "td" }).closest("tr");
            const editButton = row.querySelector(".btn-primary");
            fireEvent.click(editButton);
            const modal = screen.getByTestId("update-modal");
            fireEvent.change(within(modal).getByRole("textbox"), { target: { value: "updated_integration_test_category" } });
            fireEvent.click(within(modal).getByText("Submit"));
            await waitFor(() => {
                expect(toast.success).toHaveBeenCalledWith("updated_integration_test_category is updated");
            });
        });
    });

    it('Delete a category', async () => {

        await act(async () => {
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
        });

        await waitFor(async () => {
            const row = screen.getByText("updated_integration_test_category", { selector: "td" }).closest("tr");
            const deleteButton = row.querySelector(".btn-danger");
            fireEvent.click(deleteButton);
            await waitFor(() => {
                expect(toast.success).toHaveBeenCalledWith("Category is deleted");
            });
        });
    });



});