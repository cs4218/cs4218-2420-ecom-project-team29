import React from "react";
import { render, screen, act, fireEvent, waitFor  } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { useCart } from "../context/cart";
import axios from "axios";
import toast from "react-hot-toast";
import '@testing-library/jest-dom';
import { Checkbox, Radio } from "antd";
import HomePage from "../pages/HomePage";
import Layout from "../components/Layout";
import { Prices } from "../components/Prices";


// Mock useCart hook to return null state and a mock function
jest.mock("../context/cart", () => ({
    useCart: jest.fn(() => [null, jest.fn()]),
}));

// Mock useAuth hook to return null state and a mock function for setAuth
jest.mock("../context/auth", () => ({
    useAuth: jest.fn(() => [null, jest.fn()]), 
}));

// Mock useSearch hook to return null state and a mock function
jest.mock("../context/search", () => ({
useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]), 
}));

jest.mock("../hooks/useCategory", () => jest.fn(() => []));

// Mock the Layout component
jest.mock("../components/Layout", () => {
    return ({ children }) => <div>{children}</div>;
});

// Mock axios
jest.mock("axios");

// Mock toast
jest.mock("react-hot-toast", () => ({
    success: jest.fn(),
}));

const product1 = {
    _id: 1,
    name: "hot choco",
    createdAt: Date.now(),
    description: "hot drink",
    price: 4.8,
    category: "drink",
    quantity: 1,
    shipping: true,
    photo: {
        data: Buffer.from("data"),
        contentType: "image/png",
    },
    slug: "hot-choco",
    updatedAt: Date.now()
}

const product2 = {
    _id: 2,
    name: "dog",
    createdAt: Date.now(),
    description: "dog description",
    price: 123,
    category: "animal",
    quantity: 1,
    shipping: true,
    photo: {
        data: Buffer.from("data"),
        contentType: "image/png",
    },
    slug: "dog",
    updatedAt: Date.now()
}


describe("HomePage Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders home page", async () => {
        await act(async () => {
            render(
                <MemoryRouter initialEntries={["/"]}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                    </Routes>
                </MemoryRouter>
            );
        });

        expect(screen.getByText("Filter By Category")).toBeInTheDocument();
        expect(screen.getByText("Filter By Price")).toBeInTheDocument();
        expect(screen.getByText("All Products")).toBeInTheDocument();
        expect(screen.getByText("RESET FILTERS")).toBeInTheDocument();
    });

    it("inputs should be initially empty", async () => {
        await act(async () => {
            render(
                <MemoryRouter initialEntries={["/"]}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                    </Routes>
                </MemoryRouter>
            );
        });

        // Verify that checkboxes are not checked initially
        // const checkboxes = screen.getAllByRole('checkbox');
        // checkboxes.forEach(checkbox => {
        //     expect(checkbox.checked).toBe(false);
        // });

        // Verify that radio buttons are not selected initially
        const radioButtons = screen.getAllByRole('radio');
        radioButtons.forEach(radio => {
            expect(radio.checked).toBe(false);
        });
    })

  it("fetches and displays categories", async () => {
    // Mock axios response for categories
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "book" }] },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Check if categories are rendered
    expect(await screen.findByText(/book/i)).toBeInTheDocument();
  });

  it("fetches and displays products", async () => {
    // Mock axios response for products
    axios.get.mockResolvedValueOnce({
      data: { products: [product1, product2]},
    });

    render(
        <MemoryRouter>
            <HomePage />
        </MemoryRouter>
    );

    // Check if products are rendered
    // expect(await screen.findByText(/hot choco/i)).toBeInTheDocument();
    expect(await screen.findByText(/dog/i)).toBeInTheDocument();

  });

//   test("handles filter by category", async () => {
//     // Mock axios responses
//     axios.get.mockResolvedValueOnce({
//       data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
//     });
//     axios.post.mockResolvedValueOnce({
//       data: { products: [{ _id: "2", name: "Smartphone", price: 500, description: "Latest smartphone", slug: "smartphone" }] },
//     });

//     render(
//         <MemoryRouter>
//             <HomePage />
//         </MemoryRouter>
//     );

//     // Simulate category filter
//     const categoryCheckbox = await screen.findByText(/Electronics/i);
//     categoryCheckbox.click();

//     // Check if filtered products are rendered
//     expect(await screen.findByText(/Smartphone/i)).toBeInTheDocument();
//   });

//   test("handles load more functionality", async () => {
//     // Mock axios responses for initial and subsequent product fetch
//     axios.get
//       .mockResolvedValueOnce({
//         data: { products: [{ _id: "1", name: "Laptop", price: 1000, description: "High-end laptop", slug: "laptop" }] },
//       })
//       .mockResolvedValueOnce({
//         data: { products: [{ _id: "2", name: "Smartphone", price: 500, description: "Latest smartphone", slug: "smartphone" }] },
//       });

//     render(
//         <MemoryRouter>
//             <HomePage />
//         </MemoryRouter>
//     );

//     // Check if initial products are rendered
//     expect(await screen.findByText(/Laptop/i)).toBeInTheDocument();

//     // Simulate Load More button click
//     const loadMoreButton = screen.getByText(/Loadmore/i);
//     loadMoreButton.click();

//     // Check if additional products are rendered
//     expect(await screen.findByText(/Smartphone/i)).toBeInTheDocument();
//   });

//   test("adds product to cart", async () => {
//     // Mock axios response for products
//     axios.get.mockResolvedValueOnce({
//       data: { products: [{ _id: "1", name: "Laptop", price: 1000, description: "High-end laptop", slug: "laptop" }] },
//     });

//     render(
//         <MemoryRouter>
//             <HomePage />
//         </MemoryRouter>
//     );

//     // Simulate adding product to cart
//     const addToCartButton = await screen.findByText(/ADD TO CART/i);
//     addToCartButton.click();

//     // Check if toast notification is shown
//     expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
//   });
//   test("should render price filters correctly", () => {
//     expect(Prices).toHaveLength(6); // Ensure there are 6 price ranges
//     expect(Prices[0].name).toBe("$0 to 19"); // Check the first price range
//   });
});
