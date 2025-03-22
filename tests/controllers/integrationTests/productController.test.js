import { describe, expect, jest } from "@jest/globals";
import { 
    deleteProductController, 
    createProductController, 
    updateProductController, 
    getProductController, 
    getSingleProductController,
    productPhotoController,
    productFiltersController,
    productCountController,
    productListController,
    searchProductController,
    realtedProductController,
    productCategoryController,
 } from "../../../controllers/productController";
import productModel from "../../../models/productModel";
import categoryModel from "../../../models/categoryModel";
import fs from "fs";

jest.mock("../../models/productModel");
jest.mock("../../models/categoryModel");
jest.mock("fs");

let req = {
    body: {}, params: {}, fields: {}, files: {},
}

let res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
};

const mockProduct = {
    name: "Product 1",
    description: "Product 1 description",
    price: 100,
    category: "1",
    quantity: 100,
    shipping: true,
    photo: {
        data: Buffer.from("data"),
        contentType: "image/png",
    }
}

describe('Product Filtering Integration Tests', () => {
    it('should filter products by category and price range', async () => {
    });
});