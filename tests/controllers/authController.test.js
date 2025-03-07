import { expect, jest } from "@jest/globals";
import userModel from "../../models/userModel";

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("token"),
}));
jest.mock("../../models/userModel");
jest.unstable_mockModule("../../helpers/authHelper", () => ({
  hashPassword: jest.fn().mockResolvedValue("hashedPassword"),
  comparePassword: jest.fn(),
}));

const authController = await import("../../controllers/authController");
const authHelper = await import("../../helpers/authHelper");

describe("Register Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
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
      const allFieldsPresent = Object.values(testCase).every(Boolean);
      return !allFieldsPresent;
    });
  
    it.each(testCases)(
      "should handle missing fields correctly: %o",
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
              message: `${key.charAt(0).toUpperCase() + key.slice(1)} is Required`,
            });
            break;
          }
        }
      }
    );
  });
  
  

  test("user model is not saved for existing email", async () => {
    userModel.findOne = jest.fn().mockResolvedValue({ email: "test@mail.com" });
    userModel.prototype.save = jest.fn();

    await authController.registerController(req, res);
    expect(userModel.prototype.save).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Already Register please login",
    });
  });

  test("new user is saved successfully", async () => {
    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn().mockResolvedValue({...req.body, password: "hashedPassword"});

    await authController.registerController(req, res);
    expect(userModel.prototype.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "User Register Successfully",
      user: { ...req.body, password: "hashedPassword" },
    });
  });

  test("error is handled", async () => {
    userModel.findOne = jest.fn().mockRejectedValue(new Error("Database error"));

    await authController.registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Errro in Registeration",
      error: new Error("Database error"),
    });
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
      message: "Email is not registerd",
    });
  });

  it("should return invalid password", async () => {
    userModel.findOne = jest.fn().mockResolvedValue(mockUser);
    authHelper.comparePassword.mockResolvedValueOnce(false);

    await authController.loginController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid Password",
    });
  });

  it("should return login successfully", async () => {
    userModel.findOne = jest.fn().mockResolvedValue(mockUser);
    authHelper.comparePassword.mockResolvedValueOnce(true);

    await authController.loginController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "login successfully",
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
      ["email", "Emai is required"],
      ["answer", "answer is required"],
      ["newPassword", "New Password is required"],
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
      message: "Wrong Email Or Answer",
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
      message: "Password Reset Successfully",
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