import { expect, jest } from "@jest/globals";
import { deleteProductController, createProductController, updateProductController } from "../../controllers/productController";
import productModel from "../../models/productModel";
import fs from "fs";

jest.mock("../../models/productModel");
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

describe("createProductController", () => {

    beforeEach(() => {
        jest.clearAllMocks();

        req.fields = {
            name: "Product 1",
            description: "Product 1 description",
            price: 100,
            category: "1",
            quantity: 100,
            shipping: true,
        };
        req.files = {
            photo: {
                size: 32,
                path: '/folder/photo.png',
                name: 'photo.png',
                type: 'image/png',
            },
        }
        fs.readFileSync = jest.fn().mockReturnValue(Buffer.from("data"));
    });

    it("success creating product", async () => {
        productModel.prototype.save = jest.fn().mockResolvedValue(mockProduct);
        await createProductController(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it("create product error with missing name", async () => {
        req.fields.name = null

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Name is Required",
        });
    });

    it("create product error with missing description", async () => {
        req.fields.description = null

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Description is Required",
        });
    });

    it("create product error with missing price", async () => {
        req.fields.price = null

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Price is Required",
        });
    });

    it("create product error with invalid price", async () => {
        req.fields.price = -1

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Price should be greater than 0",
        });
    });

    it("create product error with missing category", async () => {
        req.fields.category = null

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Category is Required",
        });
    });

    it("create product error with missing quantity", async () => {
        req.fields.quantity = null

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Quantity is Required",
        });
    });

    it("create product error with invalid quantity", async () => {
        req.fields.quantity = -1

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Quantity should be greater than 0",
        });
    });

    it("create product error with photo size", async () => {
        req.files.photo.size = 1000001;

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Photo is required and should be less then 1mb",
        });
    });

    it("create product with missing photo wont crash", async () => {
        req.files.photo = null;

        productModel.prototype.save = jest.fn().mockResolvedValue(mockProduct);

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });


    it("create product with missing shipping wont crash", async () => {
        req.fields.shipping = null;

        productModel.prototype.save = jest.fn().mockResolvedValue(mockProduct);

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    it("create product with api error", async () => {
        productModel.prototype.save = jest.fn().mockRejectedValue(new Error("Internal Server Error"));

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error in creating product",
            error: new Error("Internal Server Error"),
        });
    });

});

describe("deleteProductController", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("success deleting product", async () => {
        req.params.pid = "1";

        productModel.findByIdAndDelete = jest.fn().mockReturnValue({
            findByIdAndDelete: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue({}),
        });

        await deleteProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Product deleted successfully",
        });
    });

    it("deleting product error with api error", async () => {
        req.params.id = "1";

        productModel.findByIdAndDelete = jest.fn().mockReturnValue({
            findByIdAndDelete: jest.fn().mockRejectedValue(new Error("Internal Server Error")),
            select: jest.fn().mockRejectedValue(new Error("Internal Server Error")),
        });

        await deleteProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error while deleting product",
            error: new Error("Internal Server Error"),
        });
    });

});

describe("updateProductController", () => {

    beforeEach(() => {
        jest.clearAllMocks();

        req.fields = {
            name: "Product 1",
            description: "Product 1 description",
            price: 100,
            category: "1",
            quantity: 100,
            shipping: true,
        };
        req.files = {
            photo: {
                size: 32,
                path: '/folder/photo.png',
                name: 'photo.png',
                type: 'image/png',
            },
        }
        req.params.pid = "1";

        fs.readFileSync = jest.fn().mockReturnValue(Buffer.from("data"));

        productModel.findByIdAndUpdate = jest.fn().mockReturnValue({
            findByIdAndUpdate: jest.fn().mockResolvedValue(mockProduct),
            save: jest.fn().mockResolvedValue(mockProduct),
        });
        productModel.prototype.save = jest.fn().mockResolvedValue(mockProduct);
    });

    it("Success updating product", async () => {

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    it("update product error with missing name", async () => {
        req.fields.name = null;

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Name is Required",
        });
    });

    it("update product error with missing description", async () => {
        req.fields.description = null;

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Description is Required",
        });
    });

    it("update product error with missing price", async () => {
        req.fields.price = null;

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Price is Required",
        });
    });

    it("update product error with invalid price", async () => {
        req.fields.price = -1;

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Price should be greater than 0",
        });
    });

    it("update product error with missing category", async () => {
        req.fields.category = null;

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Category is Required",
        });
    });

    it("update product error with missing quantity", async () => {
        req.fields.quantity = null

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Quantity is Required",
        });
    });

    it("update product error with invalid quantity", async () => {
        req.fields.quantity = -1

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Quantity should be greater than 0",
        });
    });

    it("update product error with photo size", async () => {
        req.files.photo.size = 1000001;

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Photo is required and should be less then 1mb",
        });
    });

    it("update product with missing photo wont crash", async () => {
        req.files.photo = null;

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });


    it("update product with missing shipping wont crash", async () => {
        req.fields.shipping = null;

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    it("update product with api error", async () => {
        req.params.pid = "1";

        productModel.findByIdAndUpdate = jest.fn().mockReturnValue({
            findByIdAndUpdate: jest.fn().mockRejectedValue(new Error("Internal Server Error")),
            save: jest.fn().mockRejectedValue(new Error("Internal Server Error")),
        });
        productModel.prototype.save = jest.fn().mockRejectedValue(new Error("Internal Server Error"));

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error in updating product",
            error: new Error("Internal Server Error"),
        });
    });

});