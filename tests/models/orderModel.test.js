import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import orderModel from "../../models/orderModel";

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.MONGO_URL = uri;
  await mongoose.connect(process.env.MONGO_URL);
});

afterAll(async () => {
  if (mongo) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany();
    }
    await mongoose.connection.close();
    await mongo.stop();
  }
});

afterEach(async () => {
  if (mongo) {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany();
    }
  }
});
describe("Order Model Tests", () => {
  const mockUserId = new mongoose.Types.ObjectId("67a33e7fdebc7593b711f99e");
  const mockProduct = {
    _id: new mongoose.Types.ObjectId("67b6cf3b20c63ccb0d33106b"),
    name: "First Product",
    description: "This is the description of the first product",
    price: 100,

  }
  const mockProduct1 = {
    _id: new mongoose.Types.ObjectId("67beb59fad534bfa7d718b42"),
    name: "Second Product",
    description: "This is the description of the second product",
    price: 200.2,
  }
  const mockProduct2 = {
    _id: new mongoose.Types.ObjectId("67c711658e64b7370fff9390"),
    name: "Third Product",
    description: "This is the description of the third product",
    price: 300.3,
  }
  const mockProduct3 = {
    _id: new mongoose.Types.ObjectId("67c711658e64b7370fff9391"),
    name: "Fourth Product",
    description: "This is the description of the fourth product",
    price: 400.4,
  }

  // Success Case

  it("should create a new order with valid data returned", async () => {
    const orderData = {
      products: [mockProduct],
      buyer: mockUserId,
      payment: { method: "credit_card", amount: 100 },
      status: "Processing",
    };

    const order = new orderModel(orderData);
    const savedOrder = await order.save();

    expect(savedOrder._id).toBeDefined();
    expect(savedOrder.products[0]._id.toString()).toBe(mockProduct._id.toString());
    expect(savedOrder.buyer.toString()).toBe(mockUserId.toString());
    expect(savedOrder.status).toBe("Processing");
    expect(savedOrder.createdAt).toBeDefined();
    expect(savedOrder.updatedAt).toBeDefined();
  });

  it("should not create a new order with no data", async () => {
    const order = new orderModel();

    try {
      await order.save();
      // should never execute the next line - order does not save
      expect(true).toBe(false);
    } catch (error) {
      // expect an error to be thrown
      expect(error).toBeDefined();
    }
  });

  // Products Tests

  it("should handle multiple products in an order", async () => {
    const order = new orderModel({
      products: [mockProduct, mockProduct1, mockProduct2],
      buyer: mockUserId,
      payment: { method: "credit_card", amount: 600.50 },
    });

    const savedOrder = await order.save();

    expect(savedOrder.products.length).toBe(3);
    expect(savedOrder.products[0]._id.toString()).toBe(mockProduct._id.toString());
    expect(savedOrder.products[1]._id.toString()).toBe(mockProduct1._id.toString());
    expect(savedOrder.products[2]._id.toString()).toBe(mockProduct2._id.toString());
  });

  it("should not create a order with empty products", async () => {
    const orderData = {
      buyer: mockUserId,
      payment: { method: "credit_card", amount: 29.99 },
      status: "Processing",
      products: [],
    };

    const order = new orderModel(orderData);

    try {
      await order.save();
      // should never execute the next line - order does not save
      expect(true).toBe(false);
    } catch (error) {
      // expect an error to be thrown
      expect(error).toBeDefined();
      expect(error.message).toContain("At least one product is required.");
      expect(error.name).toBe("ValidationError");
    }
  });

  it("should not create a order with no products", async () => {
    const orderData = {
      buyer: mockUserId,
      payment: { method: "credit_card", amount: 29.99 },
      status: "Processing",
    };

    const order = new orderModel(orderData);

    try {
      await order.save();
      // should never execute the next line - order does not save
      expect(true).toBe(false);
    } catch (error) {
      // expect an error to be thrown
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(error.message).toContain("At least one product is required.");
      expect(error.name).toBe("ValidationError");
    }
  });

  // Buyer Tests

  it("should not create a order with no buyer", async () => {
    const orderData = {
      products: [mockProduct],
      payment: { method: "credit_card", amount: 29.99 },
      status: "Processing",
    };

    const order = new orderModel(orderData);

    try {
      await order.save();
      // should never execute the next line - order does not save
      expect(true).toBe(false);
    } catch (error) {
      // expect an error to be thrown
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(error.message).toContain("Buyer userId is required");
      expect(error.name).toBe("ValidationError");
    }
  })


  // Payment Tests
  it("should not create a order with no payment", async () => {
    const orderData = {
      products: [mockProduct],
      buyer: mockUserId,
      status: "Processing",
    };

    const order = new orderModel(orderData);

    try {
      await order.save();
      // should never execute the next line - order does not save
      expect(true).toBe(false);
    } catch (error) {
      // expect an error to be thrown
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(error.message).toContain("Payment is required.");
      expect(error.name).toBe("ValidationError");
    }
  });

  // Status Tests

  it('should set default status to "Not Processed" when not provided', async () => {
    const orderData = {
      products: [mockProduct],
      buyer: mockUserId,
      payment: { method: "credit_card", amount: 100 },
    };

    const order = new orderModel(orderData);
    const savedOrder = await order.save();

    expect(savedOrder.status).toBe("Not Processed");
  });

  it("should reject invalid status", async () => {
    const mockUserId = new mongoose.Types.ObjectId();

    const orderData = {
      products: [mockProduct],
      buyer: mockUserId,
      payment: { method: "credit_card", amount: 100 },
      status: "Invalid Status",
    };

    const order = new orderModel(orderData);

    try {
      await order.save();
      // should never execute the next line - order does not save
      expect(true).toBe(false);
    } catch (error) {
      // expect an error to be thrown
      expect(error).toBeDefined();
      expect(error.errors.status).toBeDefined();
    }
  });

  it.each(["Processing", "Shipped", "Delivered", "Cancelled"])(
    'should accept "%s" as a valid status value',
    async (statusValue) => {
      const mockUserId = new mongoose.Types.ObjectId();

      const orderData = {
        products: [mockProduct],
        buyer: mockUserId,
        payment: { method: "credit_card", amount: 100 },
        status: statusValue,
      };

      const order = new orderModel(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.status).toBe(statusValue);
    }
  );

  it.each(["Pending", "Completed"])(
    'should reject "%s" as an invalid status value',
    async (invalidStatus) => {
      const orderData = {
        products: [mockProduct],
        buyer: mockUserId,
        payment: { method: "credit_card", amount: 100 },
        status: invalidStatus,
      };

      const order = new orderModel(orderData);

      await expect(order.save()).rejects.toThrow();
    }
  );

  // Update Status Tests

  it("should allow updating status to any valid status using findByIdAndUpdate", async () => {
    // create order with default status - "Not Processed"
    const orderData = {
      products: [mockProduct],
      buyer: mockUserId,
      payment: { method: "credit_card", amount: 100},
    };

    const order = new orderModel(orderData);
    const savedOrder = await order.save();
    const orderId = savedOrder._id;

    // update status to each valid status
    const validStatuses = [
      "Not Processed",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    for (const status of validStatuses) {
      const updatedOrder = await orderModel.findByIdAndUpdate(
        orderId,
        { status: status },
        { new: true }
      );

      expect(updatedOrder.status).toBe(status);
    }
  });

  it("should not allow updating status to invalid status using findByIdAndUpdate", async () => {
    const orderData = {
      products: [mockProduct],
      buyer: mockUserId,
      payment: { method: "credit_card", amount: 100 },
    };

    const order = new orderModel(orderData);
    const savedOrder = await order.save();
    const orderId = savedOrder._id;

    // update status to invalid status
    const invalidStatus = "Invalid Status";

    try {
      await orderModel.findByIdAndUpdate(orderId, { status: invalidStatus });
      // should never execute the next line - order does not update
      expect(true).toBe(false);
    } catch (error) {
      // expect an error to be thrown
      expect(error).toBeDefined();
    }
  });
});
