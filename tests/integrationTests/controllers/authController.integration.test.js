import { describe, expect, jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import orderModel from "../../../models/orderModel";
import userModel from "../../../models/userModel";
import categoryModel from "../../../models/categoryModel";
import productModel from "../../../models/productModel";
import fs from "fs";
import {
  getAllOrdersController,
  getOrdersController,
} from "../../../controllers/authController";

describe("Order Controller Integration Tests", () => {
  let mongoServer;
  let testData;
  let testUserWithPassword;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGO_URL_TEST = mongoUri;
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // delete all collections
    if (mongoServer) {
      const collections = mongoose.connection.collections;

      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
      }
    }
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();

    const random = Math.random();
    testUserWithPassword = {
      name: `Test User ${random}`,
      email: `test-user${random}@gmail.com`,
      password: "password123",
      address: "123 Test St",
      phone: "1234567890",
      role: 0,
      answer: "fly",
    };
    const testUser = new userModel(testUserWithPassword);

    const savedUser = await testUser.save();

    const category1 = new categoryModel({
      name: `Int Test Category ${random}`,
      slug: `int-test-category-${random}`,
    });

    const savedCategory = await category1.save();

    const photo1 = fs.readFileSync("tests/assets/testProductImage.jpg");

    const random2 = Math.random();
    const product1 = new productModel({
      name: `Int Test Product ${random2}`,
      slug: `int-test-product-${random2}`,
      price: 100,
      description: "Description for product 1",
      quantity: 10,
      category: savedCategory._id,
      shipping: true,
      photo: photo1,
    });

    const product2 = new productModel({
      name: `Int Test Product 2 ${random2}`,
      slug: `int-test-product-2-${random2}`,
      price: 200,
      description: "Description for product 2",
      quantity: 20,
      category: savedCategory._id,
      shipping: false,
      photo: photo1,
    });

    // Save products and store the saved instances
    const savedProduct1 = await product1.save();
    const savedProduct2 = await product2.save();

    const testOrder = {
      buyer: savedUser._id,
      products: [
        {
          _id: savedProduct1._id,
          name: savedProduct1.name,
          description: savedProduct1.description,
          price: savedProduct1.price,
        },
      ],
      payment: {
        success: true,
      },
      status: "Processing",
    };

    const testOrder2 = {
      buyer: savedUser._id,
      products: [
        {
          _id: savedProduct2._id,
          name: savedProduct2.name,
          description: savedProduct2.description,
          price: savedProduct2.price,
        },
        {
          _id: savedProduct1._id,
          name: savedProduct1.name,
          description: savedProduct1.description,
          price: savedProduct1.price,
        },
      ],
      payment: {
        success: true,
      },
      status: "Not Processed",
    };

    const savedOrder = new orderModel(testOrder);
    await savedOrder.save();
    const savedOrder2 = new orderModel(testOrder2);
    await savedOrder2.save();

    testData = {
      product1: savedProduct1,
      product2: savedProduct2,
      user: savedUser,
      order: savedOrder,
      order2: savedOrder2,
    };
  });

  describe("getOrdersController Integration Test", () => {
    it("should return orders for a specific user", async () => {
      const req = {
        user: { _id: testData.user._id },
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await getOrdersController(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            buyer: expect.objectContaining({ name: testData.user.name }),
            products: expect.arrayContaining([
              expect.objectContaining({
                _id: testData.product1._id,
                name: testData.product1.name,
                description: testData.product1.description,
                price: testData.product1.price,
              }),
            ]),
            status: testData.order.status,
          }),
          expect.objectContaining({
            buyer: expect.objectContaining({ name: testData.user.name }),
            products: expect.arrayContaining([
              expect.objectContaining({
                _id: testData.product2._id,
                name: testData.product2.name,
                description: testData.product2.description,
                price: testData.product2.price,
              }),
              expect.objectContaining({
                _id: testData.product1._id,
                name: testData.product1.name,
                description: testData.product1.description,
                price: testData.product1.price,
              }),
            ]),
            status: testData.order2.status,
          }),
        ])
      );
    });

    it("should return a 400 error if no user is provided", async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await getOrdersController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "UserId is required",
        error: expect.any(Error),
      });
    });
  });

  describe("getAllOrdersController Integration tests", () => {
    it("should return all orders sorted by creation date", async () => {
      const req = {};
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await getAllOrdersController(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            buyer: expect.objectContaining({ name: testData.user.name }),
            products: expect.arrayContaining([
              expect.objectContaining({
                _id: testData.product1._id,
                name: testData.product1.name,
                description: testData.product1.description,
                price: testData.product1.price,
              }),
            ]),
            status: testData.order.status,
          }),
          expect.objectContaining({
            buyer: expect.objectContaining({ name: testData.user.name }),
            products: expect.arrayContaining([
              expect.objectContaining({
                _id: testData.product2._id,
                name: testData.product2.name,
                description: testData.product2.description,
                price: testData.product2.price,
              }),
              expect.objectContaining({
                _id: testData.product1._id,
                name: testData.product1.name,
                description: testData.product1.description,
                price: testData.product1.price,
              }),
            ]),
            status: testData.order2.status,
          }),
        ])
      );
    });

    it("should handle database errors", async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      jest.spyOn(orderModel, "find").mockImplementation(() => ({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValueOnce(new Error("Database error")),
      }));
      await getAllOrdersController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting all orders",
        error: expect.any(Error),
      });
    });
  });
});
