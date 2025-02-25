import { expect, jest } from "@jest/globals";
import { registerController, loginController, forgotPasswordController, testController } from "../../controllers/authController";
import userModel from "../../models/userModel";
import { comparePassword } from "../../helpers/authHelper";

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("token"),
}));
jest.mock("../../models/userModel");
jest.mock("../../helpers/authHelper", () => ({
  hashPassword: jest.fn().mockResolvedValue("hashedPassword"),
  comparePassword: jest.fn(),
}));

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
    it.each([
      ["name", "Name is Required"],
      ["email", "Email is Required"],
      ["password", "Password is Required"],
      ["phone", "Phone no is Required"],
      ["address", "Address is Required"],
      ["answer", "Answer is Required"],
    ])("should return %s is required", async (field, message) => {
      delete req.body[field];
      await registerController(req, res);
      expect(res.send).toHaveBeenCalledWith({ message });
    });
  });

  test("user model is not saved for existing email", async () => {
    // specify mock functionality
    userModel.findOne = jest.fn().mockResolvedValue({ email: "test@mail.com" });
    userModel.prototype.save = jest.fn();

    await registerController(req, res);
    expect(userModel.prototype.save).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Already Register please login",
    });
  });

  test("new user is saved successfully", async () => {
    // specify mock functionality
    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn().mockResolvedValue({...req.body, password: "hashedPassword"});

    await registerController(req, res);
    expect(userModel.prototype.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "User Register Successfully",
      user: { ...req.body, password: "hashedPassword" },
    });
  });

  test("error is handled", async () => {
    // specify mock functionality
    userModel.findOne = jest.fn().mockRejectedValue(new Error("Database error"));

    await registerController(req, res);
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
      await loginController(req, res);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password" 
      });
    });

    it("when both email and passwords is not provided", async () => {
      delete req.body.email;
      delete req.body.password;
      await loginController(req, res);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password" 
      });
    });
  });

  it("should return email is not registered", async () => {
    userModel.findOne = jest.fn().mockResolvedValue(null);

    await loginController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Email is not registerd",
    });
  });

  it("should return invalid password", async () => {
    userModel.findOne = jest.fn().mockResolvedValue(mockUser);
    comparePassword.mockResolvedValueOnce(false);

    await loginController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid Password",
    });
  });

  it("should return login successfully", async () => {
    userModel.findOne = jest.fn().mockResolvedValue(mockUser);
    comparePassword.mockResolvedValueOnce(true);

    await loginController(req, res);
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

    await loginController(req, res);
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
      await forgotPasswordController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message });
    });
  });

  it("should return wrong email or answer", async () => {
    userModel.findOne = jest.fn().mockResolvedValue(null);

    await forgotPasswordController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Wrong Email Or Answer",
    });
  });

  it("should reset password successfully", async () => {
    userModel.findOne = jest.fn().mockResolvedValue(mockUser);
    userModel.findByIdAndUpdate = jest.fn();

    await forgotPasswordController(req, res);
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(mockUser._id, { password: "hashedPassword" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Password Reset Successfully",
    });
  });

  it("should handle error", async () => {
    userModel.findOne = jest.fn().mockRejectedValue(new Error("Database error"));

    await forgotPasswordController(req, res);
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
    testController(req, res);
    expect(res.send).toHaveBeenCalledWith("Protected Routes");
  });

  it("should handle error", () => {
    const error = new Error('test error');
    res.send.mockImplementationOnce(() => {
      throw error;
    });

    testController(req, res);
    expect(res.send).toHaveBeenCalledWith({ error });
  });
});