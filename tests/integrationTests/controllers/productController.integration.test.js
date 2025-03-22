import { describe, expect, jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { getProductDetailsController } from "../../../controllers/productController";
import productModel from "../../../models/productModel";
import categoryModel from "../../../models/categoryModel";


describe("getProductDetailsController Integration Test", () => {
  let mongoServer;
  let testData;

  beforeAll(async () => {
    // Start Mongo Memory Server before tests
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGO_URL_TEST = mongoUri;
    await mongoose.connect(mongoUri);

    const category1 = new categoryModel({
      name: `Int Test Category`,
      slug: `int-test-category`,
    });

    const savedCategory = await category1.save();

    const random2 = Math.random();
    const product1 = new productModel({
      name: `Int Test Product`,
      slug: `int-test-product`,
      price: 100,
      description: "Description for product 1",
      quantity: 10,
      category: savedCategory._id,
      shipping: true,
    });

    const product2 = new productModel({
      name: `Int Test Product 2`,
      slug: `int-test-product-2`,
      price: 200,
      description: "Description for product 2",
      quantity: 20,
      category: savedCategory._id,
      shipping: false,
    });

    // Save products and store the saved instances
    const savedProduct1 = await product1.save();
    const savedProduct2 = await product2.save();

    // Store the saved products for later reference in tests
    testData = {
      product1: savedProduct1,
      product2: savedProduct2,
    };
  });

  afterAll(async () => {
    if (mongoServer) {
      const collections = mongoose.connection.collections;

      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
      }
    }
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  afterEach(async () => {
    jest.restoreAllMocks();

  });

  it("should return product details for valid product IDs", async () => {
    // Mocking the request and response objects
    const req = {
      query: { ids: `${testData.product1._id},${testData.product2._id}` }, // Pass valid saved IDs
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    const savedProduct1 = testData.product1;
    const savedProduct2 = testData.product2;

    // Act: Call the controller function
    await getProductDetailsController(req, res);

    // Assert: Check if the correct status and response were sent
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product details fetched successfully",
      products: [
        expect.objectContaining({
          _id: savedProduct1._id,
          name: savedProduct1.name,
          price: savedProduct1.price,
          description: savedProduct1.description,
          quantity: savedProduct1.quantity,
          category: savedProduct1.category,
          shipping: savedProduct1.shipping,
          slug: savedProduct1.slug,
        }),
        expect.objectContaining({
          _id: savedProduct2._id,
          name: savedProduct2.name,
          price: savedProduct2.price,
          description: savedProduct2.description,
          quantity: savedProduct2.quantity,
          category: savedProduct2.category,
          shipping: savedProduct2.shipping,
          slug: savedProduct2.slug,
        }),
      ],
    });
  });

  it("should return empty objects for non-existing product IDs", async () => {
    const nonExistingId = new mongoose.Types.ObjectId();

    const req = {
      query: { ids: `${testData.product1._id},${nonExistingId}` },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await getProductDetailsController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product details fetched successfully",
      products: [
        expect.objectContaining({
          _id: testData.product1._id,
          name: testData.product1.name,
          price: testData.product1.price,
          description: testData.product1.description,
          quantity: testData.product1.quantity,
          category: testData.product1.category,
          shipping: testData.product1.shipping,
          slug: testData.product1.slug,
        }),
        { _id: nonExistingId.toString() },
      ],
    });
  });

  it("should return empty objects for all non-existing product IDs", async () => {
    const nonExistingId1 = new mongoose.Types.ObjectId();
    const nonExistingId2 = new mongoose.Types.ObjectId();

    const req = {
      query: { ids: `${nonExistingId1},${nonExistingId2}` },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await getProductDetailsController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product details fetched successfully",
      products: [
        { _id: nonExistingId1.toString() },
        { _id: nonExistingId2.toString() },
      ],
    });
  });

  it("should return a 400 error for a mix of valid and invalid product IDs", async () => {
    const req = {
      query: { ids: `${testData.product1._id},invalidID` },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await getProductDetailsController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid product Id(s) provided",
    });
  });

  it("should return a 400 error for invalid product IDs", async () => {
    const req = {
      query: { ids: "invalidid1,invalidid2" },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await getProductDetailsController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid product Id(s) provided",
    });
  });

  it("should return a 400 error if no IDs are provided", async () => {
    const req = {
      query: {},
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await getProductDetailsController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Ids are required",
    });
  });

  it("should handle database error correctly", async () => {
    jest
      .spyOn(productModel, "find")
      .mockRejectedValueOnce(new Error("Database error"));

    const req = {
      query: { ids: `${testData.product1._id},${testData.product2._id}` },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await getProductDetailsController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting product details",
      error: expect.any(Error),
    });
  });

  it("should return empty objects if no products exist in the database", async () => {
    // Clear all products from the database
    await productModel.deleteMany({});

    const req = {
      query: { ids: `${testData.product1._id},${testData.product2._id}` },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await getProductDetailsController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product details fetched successfully",
      products: [
        { _id: testData.product1._id.toString() },
        { _id: testData.product2._id.toString() },
      ],
    });
  });
});
