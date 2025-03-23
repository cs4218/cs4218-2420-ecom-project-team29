import { expect, jest } from "@jest/globals";
import { deleteCategoryCOntroller, updateCategoryController, createCategoryController } from "../../../controllers/categoryController";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer;

let req = {
    body: {}, params: {}
}

let res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
};

describe("createCategoryController", () => {

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
    });

    afterEach(async () => {
        await mongoose.connection.db.dropDatabase();
    });

    it("Success creating category with status 201", async () => {
        req.body = { name: "category1" };

        await createCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "New category created",
            category: expect.objectContaining({
                name: "category1",
                slug: "category1",
            }),
        });
    })

    it("Success creating existing category with status 200", async () => {
        // populate the collection with a category
        const collection = mongoose.connection.collection("categories");
        const category = {
            _id: "60f1b9b3e1b3b3b3b3b3b3b3",
            name: "category1",
            slug: "category1",
        };
        await collection.insertOne(category);

        req.body = { name: "category1" };

        await createCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "A similar category already exists",
        });
    })

    it("Error when missing name with status 401", async () => {
        req.body = {};

        await createCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
            message: "Name is required",
        });
    })

});


describe("updateCategoryController", () => {

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
    });

    afterEach(async () => {
        await mongoose.connection.db.dropDatabase();
    });

    it("Success updating category with status 200", async () => {
        // populate the collection with a category
        const collection = mongoose.connection.collection("categories");
        const category = {
            _id: "60f1b9b3e1b3b3b3b3b3b3b3",
            name: "category1",
            slug: "category1",
        };
        await collection.insertOne(category);

        req.body = { name: "category_updated" };
        req.params.id = "60f1b9b3e1b3b3b3b3b3b3b3";

        await updateCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Category updated successfully",
            category: null,
        });
    });

});


describe("deleteCategoryController", () => {

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
    });

    afterEach(async () => {
        await mongoose.connection.db.dropDatabase();
    });

    it("Success deleting category with status 200", async () => {
        // populate the collection with a category
        const collection = mongoose.connection.collection("categories");
        const category = {
            _id: "60f1b9b3e1b3b3b3b3b3b3b3",
            name: "category1",
            slug: "category1",
        };
        await collection.insertOne(category);

        req.params.id = "60f1b9b3e1b3b3b3b3b3b3b3";

        await deleteCategoryCOntroller(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Category deleted successfully",
        });
    });

});

