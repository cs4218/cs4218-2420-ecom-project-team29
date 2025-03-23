import { describe, expect, jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { getProductDetailsController } from "../../../controllers/productController";
import productModel from "../../../models/productModel";
import categoryModel from "../../../models/categoryModel";

// Set a shorter timeout for MongoMemoryServer operations
jest.setTimeout(30000);

describe("getProductDetailsController Integration Test", () => {
  let mongoServer;
  let testData = {};
  
  beforeAll(async () => {
    try {
      mongoServer = await MongoMemoryServer.create();
      
      const mongoUri = mongoServer.getUri();
      
      // Connect with explicit options for better stability
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      // Clear any existing data to ensure clean state
      await mongoose.connection.dropDatabase();
    
      const category1 = new categoryModel({
        name: "Int Test Category",
        slug: "int-test-category",
      });
      
      const savedCategory = await category1.save();
      
      const product1 = new productModel({
        name: "Int Test Product",
        slug: "int-test-product",
        price: 100,
        description: "Description for product 1",
        quantity: 10,
        category: savedCategory._id,
        shipping: true,
      });
      
      const product2 = new productModel({
        name: "Int Test Product 2",
        slug: "int-test-product-2",
        price: 200,
        description: "Description for product 2",
        quantity: 20,
        category: savedCategory._id,
        shipping: false,
      });
      
      const savedProduct1 = await product1.save();
      const savedProduct2 = await product2.save();
      
      testData = {
        product1: savedProduct1,
        product2: savedProduct2,
      };
    } catch (error) {
      console.error("Error in test setup:", error);
      throw error;
    }
  });
  
  afterAll(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        // Clear all collections instead of deleting many
        const collections = mongoose.connection.collections;
        for (const key in collections) {
          await collections[key].deleteMany({});
        }
        
        await mongoose.disconnect();
      }
      
      if (mongoServer) {
        await mongoServer.stop({
          doCleanup: true,
          force: true
        });
      }
    } catch (error) {
      console.error("Error in test teardown:", error);
    }
  });
  
  // Reset mocks after each test
  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });
  
  it("should return product details for valid product IDs", async () => {
    try {
      // Mocking the request and response objects
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
          expect.objectContaining({
            _id: expect.anything(),
            name: testData.product1.name,
            price: testData.product1.price,
            description: testData.product1.description,
            quantity: testData.product1.quantity,
            category: expect.anything(),
            shipping: testData.product1.shipping,
            slug: testData.product1.slug,
          }),
          expect.objectContaining({
            _id: expect.anything(),
            name: testData.product2.name,
            price: testData.product2.price,
            description: testData.product2.description,
            quantity: testData.product2.quantity,
            category: expect.anything(),
            shipping: testData.product2.shipping,
            slug: testData.product2.slug,
          }),
        ],
      });
    } catch (error) {
      console.error("Test error:", error);
      throw error;
    }
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
          _id: expect.anything(),
          name: testData.product1.name,
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
    
    jest.spyOn(productModel, "find").mockRestore();
  });
});