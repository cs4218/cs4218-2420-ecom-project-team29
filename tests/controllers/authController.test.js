import { expect, jest } from "@jest/globals";
import userModel from "../../models/userModel";
import orderModel from "../../models/orderModel.js";

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("token"),
}));
jest.mock("../../models/userModel");
jest.mock("../../models/orderModel", () => ({}));
jest.unstable_mockModule("../../helpers/authHelper", () => ({
  hashPassword: jest.fn().mockResolvedValue("hashedPassword"),
  comparePassword: jest.fn(),
}));

const mockIsEmail = jest.fn().mockReturnValue(true);
const mockIsMobilePhone = jest.fn().mockReturnValue(true);

jest.mock("validator", () => ({
  isEmail: mockIsEmail,
  isMobilePhone: mockIsMobilePhone,
}));

const authController = await import("../../controllers/authController");
const authHelper = await import("../../helpers/authHelper");

describe("Register Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    authHelper.hashPassword.mockClear(); 
    authHelper.comparePassword.mockClear(); 

    req = {
      body: {
        name: "John Doe",
        email: "test@mail.com",
        password: "password123",
        phone: "12344000",
        address: "123 Street",
        answer: "Football",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  describe("Missing fields", () => {
    it.each([
      ["name", "Name is required"],
      ["email", "Email is required"],
      ["password", "Password is required"],
      ["phone", "Phone no is required"],
      ["address", "Address is required"],
      ["answer", "Answer is required"],
    ])("should return %s is required", async (field, message) => {
      delete req.body[field];
      await authController.registerController(req, res);
      expect(res.send).toHaveBeenCalledWith({ message });
    });
  });

  describe("Missing fields (Pairwise)", () => {
    const isPresent = (bit) => bit === 0;
  
    function makeTestRow(b2, b1, b0) {
      return {
        name: isPresent(b0),
        email: isPresent(b1),
        password: isPresent(b2),
        phone: isPresent(b0 ^ b1),
        address: isPresent(b1 ^ b2),
        answer: isPresent(b0 ^ b2),
      };
    }

    let testCases = [];
    for (let i = 0; i < 8; i++) {
      const b0 = i & 1;
      const b1 = (i >> 1) & 1;
      const b2 = (i >> 2) & 1;
      testCases.push(makeTestRow(b2, b1, b0));
    }

    // Remove the test case where all fields are present
    // as they will be tested in the next test
    testCases = testCases.filter(testCase => {
      return Object.values(testCase).some(value => !value);
    });

    const formattedTestCases = testCases.map(fields => {
      const missingFields = Object.keys(fields)
        .filter((key) => !fields[key])
        .join(", ");
      return [missingFields, fields];
    });
  
    it.each(formattedTestCases)(
      "should handle missing fields correctly: [%s]",
      async (fields) => {
        const modifiedReq = {
          body: Object.fromEntries(
            Object.entries(fields)
              .filter(([_, present]) => present)
              .map(([key]) => [key, req.body[key]])
          ),
        };
  
        await authController.registerController(modifiedReq, res);
  
        for (const [key, present] of Object.entries(fields)) {
          if (!present) {
            expect(res.send).toHaveBeenCalledWith({
              message: `${key.charAt(0).toUpperCase() + key.slice(1)} is required`,
            });
            break;
          }
        }
      }
    );
  });

  it("user model is not saved for existing email", async () => {
    userModel.findOne = jest.fn().mockResolvedValue({ email: "it@mail.com" });
    userModel.prototype.save = jest.fn();

    await authController.registerController(req, res);
    expect(userModel.prototype.save).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Already registered please login",
    });
  });

  it("new user is saved successfully", async () => {
    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn().mockResolvedValue({...req.body, password: "hashedPassword"});

    await authController.registerController(req, res);
    expect(userModel.prototype.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "User registered successfully",
      user: { ...req.body, password: "hashedPassword" },
    }); 
  });

  it("error is handled", async () => {
    userModel.findOne = jest.fn().mockRejectedValue(new Error("Database error"));

    await authController.registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in registration",
      error: new Error("Database error"),
    });
  });

  it("invalid email", async () => {
    mockIsEmail.mockReturnValueOnce(false);
    req.body.email = "invalidEmail";
    await authController.registerController(req, res);
    expect(res.send).toHaveBeenCalledWith({ message: "Invalid email" });
  });

  it("invalid phone number", async () => {
    mockIsMobilePhone.mockReturnValueOnce(false);
    req.body.phone = "invalidPhoneNumber";
    await authController.registerController(req, res);
    expect(res.send).toHaveBeenCalledWith({ message: "Invalid phone number" });
  });
  
  
});

describe("Login Controller Test", () => {
  let req, res;
  const mockUser = {
    _id: "123",
    name: "John Doe",
    email: "test@mail.com",
    password: "hashedPassword",
    phone: "12344000",
    address: "123 Street",
    role: 0,
  }

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {
        email: "test@mail.com",
        password: "password123",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  describe("Missing email or password", () => {
    it.each([
      ["email"],
      ["password"],
    ])("when %s is not provided", async (field) => {
      delete req.body[field];
      await authController.loginController(req, res);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password" 
      });
    });

    it("when both email and passwords is not provided", async () => {
      delete req.body.email;
      delete req.body.password;
      await authController.loginController(req, res);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password" 
      });
    });
  });

  it("should return email is not registered", async () => {
    userModel.findOne = jest.fn().mockResolvedValue(null);

    await authController.loginController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Email is not registered",
    });
  });

  it("should return invalid password", async () => {
    userModel.findOne = jest.fn().mockResolvedValue(mockUser);
    authHelper.comparePassword.mockResolvedValueOnce(false);

    await authController.loginController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid password",
    });
  });

  it("should return login successfully", async () => {
    userModel.findOne = jest.fn().mockResolvedValue(mockUser);
    authHelper.comparePassword.mockResolvedValueOnce(true);

    await authController.loginController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Logged in successfully",
      user: {
        _id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        phone: mockUser.phone,
        address: mockUser.address,
        role: mockUser.role,
      },
      token: "token",
    });
  });

  it("should handle error", async () => {
    userModel.findOne = jest.fn().mockRejectedValue(new Error("Database error"));

    await authController.loginController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in login",
      error: new Error("Database error"),
    });
  });
});

describe("Forgot Password Controller Test", () => {
  let req, res;
  const mockUser = {
    _id: "123",
    name: "John Doe",
    email: "test@mail.com",
    password: "hashedPassword",
    phone: "12344000",
    address: "123 Street",
    role: 0,
  }

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {
        email: "test@mail.com",
        answer: "Football",
        newPassword: "newPassword123",
      },
    }

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    }
  });

  describe("Missing fields", () => {
    it.each([
      ["email", "Email is required"],
      ["answer", "Answer is required"],
      ["newPassword", "New password is required"],
    ])("should return %s is required", async (field, message) => {
      delete req.body[field];
      await authController.forgotPasswordController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message });
    });
  });

  it("should return wrong email or answer", async () => {
    userModel.findOne = jest.fn().mockResolvedValue(null);

    await authController.forgotPasswordController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Wrong email or answer",
    });
  });

  it("should reset password successfully", async () => {
    userModel.findOne = jest.fn().mockResolvedValue(mockUser);
    userModel.findByIdAndUpdate = jest.fn();

    await authController.forgotPasswordController(req, res);
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(mockUser._id, { password: "hashedPassword" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Password reset successfully",
    });
  });

  it("should handle error", async () => {
    userModel.findOne = jest.fn().mockRejectedValue(new Error("Database error"));

    await authController.forgotPasswordController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Something went wrong",
      error: new Error("Database error"),
    });
  });
});

describe("Test controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = {
      send: jest.fn(),
    };
  });

  it("should return protected routes", () => {
    authController.testController(req, res);
    expect(res.send).toHaveBeenCalledWith("Protected Routes");
  });

  it("should handle error", () => {
    const error = new Error('test error');
    res.send.mockImplementationOnce(() => {
      throw error;
    });

    authController.testController(req, res);
    expect(res.send).toHaveBeenCalledWith({ error });
  });
});

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
    await authController.getOrdersController(req, res);

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

    await authController.getOrdersController(req, res);

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

    await authController.getOrdersController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "UserId is required",
      error: expect.any(Error),
    });
  });

  it("should return empty array when no orders exists", async () => {
    mockPopulateBuyer.mockResolvedValue([]);
    await authController.getOrdersController(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("should return error status 500 when there are errors from database", async () => {
    const error = new Error("Database Error");
    orderModel.find.mockImplementation(() => {
      throw error;
    });

    // Mock console.log to check for error logging
    const logSpy = jest.spyOn(console, "log");

    await authController.getOrdersController(req, res);
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
    await authController.getAllOrdersController(req, res);

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
    await authController.getAllOrdersController(req, res);

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

    await authController.getAllOrdersController(req, res);

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
    await authController.orderStatusController(req, res);

    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "order1",
      { status: "Shipped" },
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith(mockUpdatedOrder);
  });

  it("should return 400 error if orderId is missing", async () => {
    req.params.orderId = undefined;

    await authController.orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "OrderId is required",
      error: expect.any(Error),
    });
  });

  it("should return 404 if order not found", async () => {
    orderModel.findByIdAndUpdate.mockResolvedValue(null);

    await authController.orderStatusController(req, res);

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

    await authController.orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid status",
      error: expect.any(Error),
    });
  });

  it("should return 400 if status is missing in request body", async () => {
    req.body.status = undefined;

    await authController.orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Status is required",
      error: expect.any(Error),
    });
  });

  it("should return 500 on database error", async () => {
    orderModel.findByIdAndUpdate.mockRejectedValue(new Error("Database Error"));

    await authController.orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while updating order",
      error: expect.any(Error),
    });
  });
});