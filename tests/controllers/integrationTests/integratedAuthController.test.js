// this file will make use of actual authHelper and mongodb memory server

import { expect, jest } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import * as authHelper from "../../../helpers/authHelper";
import userModel from "../../../models/userModel";
import { registerController, loginController, forgotPasswordController, testController, updateProfileController } from "../../../controllers/authController";
import JWT from "jsonwebtoken";

let mongod;

beforeAll(async () => {
  process.env.JWT_SECRET = "test-secret-key";
  
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  // Clean up environment variable
  delete process.env.JWT_SECRET;
  await mongod.stop();
});

beforeEach(async () => {
  await userModel.deleteMany({});
});

describe("Register Controller Integration Tests", () => {
  const mockUser = {
    name: "John Doe",
    email: "test@example.com",
    password: "password123",
    phone: "1234567890",
    address: "123 Test St",
    answer: "Football"
  };

  it("should register a new user successfully", async () => {
    const req = { body: mockUser };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "User registered successfully",
        user: expect.objectContaining({
          name: mockUser.name,
          email: mockUser.email,
          phone: mockUser.phone,
          address: mockUser.address,
          answer: mockUser.answer
        })
      })
    );

    // Verify user was actually saved in database
    const savedUser = await userModel.findOne({ email: mockUser.email });
    expect(savedUser).toBeTruthy();
    expect(savedUser.name).toBe(mockUser.name);
  });

  it("should not register user with existing email", async () => {
    // First registration
    const req = { body: mockUser };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    await registerController(req, res);

    // Second registration with same email
    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Already registered please login"
    });
  });

  it("should not register user with invalid email", async () => {
    const req = { 
      body: {
        ...mockUser,
        email: "invalid-email"
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    await registerController(req, res);

    expect(res.send).toHaveBeenCalledWith({
      message: "Invalid email"
    });
  });

  it("should not register user with invalid phone number", async () => {
    const req = { 
      body: {
        ...mockUser,
        phone: "invalid-phone"
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    await registerController(req, res);

    expect(res.send).toHaveBeenCalledWith({
      message: "Invalid phone number"
    });
  });
});

describe("Login Controller Integration Tests", () => {
  const mockUser = {
    name: "John Doe",
    email: "test@example.com",
    password: "password123",
    phone: "1234567890",
    address: "123 Test St",
    answer: "Football"
  };

  beforeEach(async () => {
    // Register a user before each login test
    const hashedPassword = await authHelper.hashPassword(mockUser.password);
    await new userModel({
      ...mockUser,
      password: hashedPassword
    }).save();
  });

  it("should login successfully with correct credentials", async () => {
    const req = {
      body: {
        email: mockUser.email,
        password: mockUser.password
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Logged in successfully",
        user: expect.objectContaining({
          name: mockUser.name,
          email: mockUser.email,
          phone: mockUser.phone,
          address: mockUser.address
        }),
        token: expect.any(String)
      })
    );
  });

  it("should not login with incorrect password", async () => {
    const req = {
      body: {
        email: mockUser.email,
        password: "wrongpassword"
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid password"
    });
  });

  it("should not login with non-existent email", async () => {
    const req = {
      body: {
        email: "nonexistent@example.com",
        password: "password123"
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Email is not registered"
    });
  });
});

describe("Forgot Password Controller Integration Tests", () => {
  const mockUser = {
    name: "John Doe",
    email: "test@example.com",
    password: "password123",
    phone: "1234567890",
    address: "123 Test St",
    answer: "Football"
  };

  beforeEach(async () => {
    // Register a user before each forgot password test
    const hashedPassword = await authHelper.hashPassword(mockUser.password);
    await new userModel({
      ...mockUser,
      password: hashedPassword
    }).save();
  });

  it("should reset password successfully with correct credentials", async () => {
    const req = {
      body: {
        email: mockUser.email,
        answer: mockUser.answer,
        newPassword: "newpassword123"
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Password reset successfully"
    });

    // Verify password was actually changed
    const updatedUser = await userModel.findOne({ email: mockUser.email });
    const isPasswordChanged = await authHelper.comparePassword("newpassword123", updatedUser.password);
    expect(isPasswordChanged).toBe(true);
  });

  it("should not reset password with wrong answer", async () => {
    const req = {
      body: {
        email: mockUser.email,
        answer: "Wrong Answer",
        newPassword: "newpassword123"
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Wrong email or answer"
    });
  });

  it("should not reset password with non-existent email", async () => {
    const req = {
      body: {
        email: "nonexistent@example.com",
        answer: "Football",
        newPassword: "newpassword123"
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Wrong email or answer"
    });
  });
});

describe("Test Controller Integration Tests", () => {
  it("should return protected routes message", async () => {
    const req = {};
    const res = {
      send: jest.fn()
    };

    await testController(req, res);

    expect(res.send).toHaveBeenCalledWith("Protected Routes");
  });
});

describe("Update Profile Controller Integration Tests", () => {
  const mockUser = {
    name: "John Doe",
    email: "test@example.com",
    password: "password123",
    phone: "1234567890",
    address: "123 Test St",
    answer: "Football"
  };

  beforeEach(async () => {
    // Register a user before each update profile test
    const hashedPassword = await authHelper.hashPassword(mockUser.password);
    const user = await new userModel({
      ...mockUser,
      password: hashedPassword
    }).save();
    
    // Mock JWT verification
    jest.spyOn(JWT, 'verify').mockReturnValue({ _id: user._id });
  });

  it("should update profile successfully", async () => {
    const req = {
      user: { _id: (await userModel.findOne({ email: mockUser.email }))._id },
      body: {
        name: "Updated Name",
        phone: "9876543210",
        address: "Updated Address"
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Profile updated successfully",
        updatedUser: expect.objectContaining({
          name: "Updated Name",
          phone: "9876543210",
          address: "Updated Address"
        })
      })
    );

    // Verify changes in database
    const updatedUser = await userModel.findOne({ email: mockUser.email });
    expect(updatedUser.name).toBe("Updated Name");
    expect(updatedUser.phone).toBe("9876543210");
    expect(updatedUser.address).toBe("Updated Address");
  });

  it("should update password successfully", async () => {
    const req = {
      user: { _id: (await userModel.findOne({ email: mockUser.email }))._id },
      body: {
        password: "newpassword123"
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Profile updated successfully"
      })
    );

    // Verify password was changed
    const updatedUser = await userModel.findOne({ email: mockUser.email });
    const isPasswordChanged = await authHelper.comparePassword("newpassword123", updatedUser.password);
    expect(isPasswordChanged).toBe(true);
  });

  it("should not update profile with invalid phone number", async () => {
    const req = {
      user: { _id: (await userModel.findOne({ email: mockUser.email }))._id },
      body: {
        phone: "invalid-phone"
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };

    await updateProfileController(req, res);

    expect(res.json).toHaveBeenCalledWith({
      error: "Phone number should contain only numbers"
    });
  });

  it("should not update profile with too short password", async () => {
    const req = {
      user: { _id: (await userModel.findOne({ email: mockUser.email }))._id },
      body: {
        password: "12345"
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };

    await updateProfileController(req, res);

    expect(res.json).toHaveBeenCalledWith({
      error: "Password should be at least 6 character long"
    });
  });

  it("should not update profile for non-existent user", async () => {
    const req = {
      user: { _id:  new mongoose.Types.ObjectId()},
      body: {
        name: "Updated Name"
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "User not found",
      error: expect.any(Error)
    });
  });
});

