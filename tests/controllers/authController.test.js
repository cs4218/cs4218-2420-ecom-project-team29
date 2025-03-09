import { expect, jest } from "@jest/globals";
import {
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
} from "../../controllers/authController";
import orderModel from "../../models/orderModel.js";

jest.mock("../../models/orderModel", () => ({}));
describe("getOrders Controller Test", () => {
  let req, res;
  const mockOrders = [
    {
      _id: "order1",
      products: [{ name: "Product 1", price: 100 }],
      buyer: { _id: "user1", name: "Test User" },
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: {
        _id: "user1",
        name: "Green",
      },
    };

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // Mock Populate & Find functions
    mockPopulateBuyer = jest.fn().mockResolvedValue(mockOrders);
    mockPopulateProducts = jest
      .fn()
      .mockReturnValue({ populate: mockPopulateBuyer });
    mockFind = jest.fn().mockReturnValue({ populate: mockPopulateProducts });

    orderModel.find = mockFind;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch orders only for the authenticated user", async () => {
    await getOrdersController(req, res);

    expect(orderModel.find).toHaveBeenCalledWith({ buyer: "user1" });
    expect(orderModel.find).toHaveBeenCalledWith({ buyer: req.user._id });
    expect(mockPopulateProducts).toHaveBeenCalledWith("products", "-photo");
    expect(mockPopulateBuyer).toHaveBeenCalledWith("buyer", "name");
    expect(res.json).toHaveBeenCalledWith(mockOrders);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return error status 400 when no user in request", async () => {
    req.user = undefined;
    console.log(req.user);

    await getOrdersController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "UserId is required",
      error: expect.any(Error),
    });
  });

  it("should return error status 400 when no userId in request", async () => {
    req.user._id = undefined;
    console.log(req.user);

    await getOrdersController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "UseriD is required",
      error: expect.any(Error),
    });
  });

  it("should return empty array when no orders exists", async () => {
    mockPopulateBuyer.mockResolvedValue([]);
    await getOrdersController(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("should return error status 500 when there are errors from database", async () => {
    const error = new Error("Database Error");
    orderModel.find.mockImplementation(() => {
      throw error;
    });

    // Mock console.log to check for error logging
    const logSpy = jest.spyOn(console, "log");

    await getOrdersController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting orders",
      error: expect.any(Error),
    });
    expect(logSpy).toBeCalledWith(error);
    logSpy.mockRestore();
  });
});

describe("getAllOrders Controller Test", () => {
  let req, res;

  let mockSortedOrders, mockUnsortedOrders, mockQuery;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {};
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    mockSortedOrders = [
      {
        _id: "order2",
        products: [
          { name: "Product 2", price: 200 },
          { name: "Product 3", price: 300 },
        ],
        buyer: { _id: "user2", name: "Blue" },
        createdAt: new Date("2024-03-02T10:00:00Z"),
      },
      {
        _id: "order1",
        products: [{ name: "Product 1", price: 100 }],
        buyer: { _id: "user1", name: "Green" },
        createdAt: new Date("2024-03-01T10:00:00Z"),
      },
    ];

    mockUnsortedOrders = [
      {
        _id: "order1",
        products: [{ name: "Product 1", price: 100 }],
        buyer: { _id: "user1", name: "Green" },
        createdAt: new Date("2024-03-01T10:00:00Z"),
      },
      {
        _id: "order2",
        products: [
          { name: "Product 2", price: 200 },
          { name: "Product 3", price: 300 },
        ],
        buyer: { _id: "user2", name: "Blue" },
        createdAt: new Date("2024-03-02T10:00:00Z"),
      },
    ];

    mockQuery = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockImplementation(function (sortCriteria) {
        const orders = mockUnsortedOrders.slice();
        if (sortCriteria.createdAt === -1) {
          orders.sort((a, b) => b.createdAt - a.createdAt);
        }
        console.log(orders);
        return Promise.resolve(orders);
      }),
    };

    orderModel.find = jest.fn().mockReturnValue(mockQuery);
  });

  it("should fetch all orders in descending order", async () => {
    await getAllOrdersController(req, res);

    expect(orderModel.find).toHaveBeenCalledWith({});
    expect(mockQuery.populate).toHaveBeenCalledWith("products", "-photo");
    expect(mockQuery.populate).toHaveBeenCalledWith("buyer", "name");
    expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });

    expect(res.json).toHaveBeenCalledWith(mockSortedOrders);
  });

  it("should return 500 error status when there is a database error", async () => {
    const error = new Error("Database Error");
    orderModel.find.mockImplementation(() => {
      throw error;
    });

    const logSpy = jest.spyOn(console, "log");
    await getAllOrdersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting all orders",
      error: expect.any(Error),
    });
    expect(logSpy).toBeCalledWith(error);
    logSpy.mockRestore();
  });

  it("should return empty array when no orders exists", async () => {
    const mockSort = jest.fn().mockResolvedValue([]);
    const mockPopulateBuyer = jest.fn().mockReturnValue({ sort: mockSort });
    const mockPopulate = jest
      .fn()
      .mockReturnValue({ populate: mockPopulateBuyer });

    orderModel.find.mockReturnValue({
      populate: mockPopulate,
    });

    await getAllOrdersController(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });
});

describe("orderStatus Controller Test", () => {
  // should check with valid order id and status
  // should check with missing order id
  // should check with order not found
  // should check with invalid order status
  // should check with missing status in request body
  // should check with database error -> 500

  let req, res;

  const mockUpdatedOrder = {
    _id: "order1",
    status: "Shipped",
  };
  beforeEach(() => {
    req = {
      params: { orderId: "order1" },
      body: { status: "Shipped" },
    };

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    const mockFindByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedOrder);
    orderModel.findByIdAndUpdate = mockFindByIdAndUpdate;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should update order status successfully with valid orderId and status", async () => {
    await orderStatusController(req, res);

    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "order1",
      { status: "Shipped" },
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith(mockUpdatedOrder);
  });

  it("should return 400 error if orderId is missing", async () => {
    req.params.orderId = undefined;

    await orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "OrderId is required",
      error: expect.any(Error),
    });
  });

  it("should return 404 if order not found", async () => {
    orderModel.findByIdAndUpdate.mockResolvedValue(null);

    await orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "No order found",
      error: expect.any(Error),
    });
  });

  it("should return 400 for invalid order status", async () => {
    req.body.status = "Invalid state";
    orderModel.findByIdAndUpdate.mockRejectedValue(new Error("Invalid State"));

    await orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid status",
      error: expect.any(Error),
    });
  });

  it("should return 400 if status is missing in request body", async () => {
    req.body.status = undefined;

    await orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Status is required",
      error: expect.any(Error),
    });
  });

  it("should return 500 on database error", async () => {
    orderModel.findByIdAndUpdate.mockRejectedValue(new Error("Database Error"));

    await orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while updating order",
      error: expect.any(Error),
    });
  });
});
