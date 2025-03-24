import { describe, expect, jest } from "@jest/globals";
import {
    deleteProductController,
    createProductController,
    updateProductController,
} from "../../../controllers/productController";
// import productModel from "../../../models/productModel";
import fs from "fs";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer;

jest.mock("fs");

let req = {
    body: {},
    params: {},
    fields: {},
    files: {},
};

let res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
};

const mockProduct = {
    _id: "60f1b9b3e1b3b3b3b3b3b3b3",
    name: "Product 1",
    description: "Product 1 description",
    price: 100,
    category: "1",
    quantity: 100,
    shipping: true,
    photo: {
        data: Buffer.from("data"),
        contentType: "image/png",
    },
};

describe("createProductController", () => {

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("connected to in-memory database");
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(() => {
        jest.clearAllMocks();

        req.fields = {
            _id: "60f1b9b3e1b3b3b3b3b3b3b3",
            name: "Product 1",
            description: "Product 1 description",
            price: 100,
            category: "60f1b9b3e1b3b3b3b3b3b3b3",
            quantity: 100,
            shipping: true,
        };
        req.files = {
            photo: {
                size: 32,
                path: "/folder/photo.png",
                name: "photo.png",
                type: "image/png",
            },
        };
        fs.readFileSync = jest.fn().mockReturnValue(Buffer.from("data"));
    });

    afterEach(async () => {
        await mongoose.connection.db.dropDatabase();
    });

    it("success creating product", async () => {

        await createProductController(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Product created successfully",
            products: expect.objectContaining({
                name: "Product 1"
            }),
        });
    });

    it("create product error with missing name", async () => {
        req.fields.name = null;

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Name is Required",
        });
    });

    it("create product error with missing description", async () => {
        req.fields.description = null;

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Description is Required",
        });
    });

    it("create product error with missing price", async () => {
        req.fields.price = null;

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Price is Required",
        });
    });

    it("create product error with invalid price", async () => {
        req.fields.price = -1;

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Price should be greater than 0",
        });
    });

    it("create product error with missing category", async () => {
        req.fields.category = null;

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Category is Required",
        });
    });

    it("create product error with missing quantity", async () => {
        req.fields.quantity = null;

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Quantity is Required",
        });
    });

    it("create product error with invalid quantity", async () => {
        req.fields.quantity = -1;

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
            error: "Photo size should be at most 1MB",
        });
    });

    it("create product with missing photo wont crash", async () => {
        req.files.photo = null;

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    it("create product with missing shipping wont crash", async () => {
        req.fields.shipping = null;

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });

});

describe("deleteProductController", () => {

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("connected to in-memory database");
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
    });

    afterEach(async () => {
        await mongoose.connection.db.dropDatabase();
    });

    it("success deleting product", async () => {

        const collection = mongoose.connection.db.collection("products");
        await collection.insertOne(mockProduct);

        req.params.pid = "60f1b9b3e1b3b3b3b3b3b3b3";

        await deleteProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Product deleted successfully",
        });
    });

});

describe("updateProductController", () => {

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("connected to in-memory database");
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });


    beforeEach(() => {
        jest.clearAllMocks();

        req.fields = {
            _id: "60f1b9b3e1b3b3b3b3b3b3b3",
            name: "edited Product 1",
            description: "edited Product 1 description",
            price: 200,
            category: "60f1b9b3e1b3b3b3b3b3b3b3",
            quantity: 200,
            shipping: true,
            photo: "photo.png",
        };
        req.files = {
            photo: {
                size: 32,
                path: "/folder/photo.png",
                name: "photo.png",
                type: "image/png",
            },
        };
        req.params.pid = "60f1b9b3e1b3b3b3b3b3b3b3";

        fs.readFileSync = jest.fn().mockReturnValue(Buffer.from("data"));
    });

    afterEach(async () => {
        await mongoose.connection.db.dropDatabase();
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
        req.fields.quantity = null;

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Quantity is Required",
        });
    });

    it("update product error with invalid quantity", async () => {
        req.fields.quantity = -1;

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
            error: "Photo size should be at most 1MB",
        });
    });

});
