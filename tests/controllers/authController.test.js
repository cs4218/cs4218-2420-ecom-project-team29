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

describe("Update Profile Controller", () => {
  let req, res;
  const mockUser = {
    _id: "user123",
    name: "Old Name",
    email: "test@example.com",
    phone: "9876543210",
    address: "Old Address",
    password: "hashedPassword",
  };

  beforeEach(() => {
    req = {
      user: { _id: "user123" },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };
    userModel.findById = jest.fn().mockResolvedValue(mockUser);
    userModel.findByIdAndUpdate = jest
      .fn()
      .mockImplementation((id, updateData) =>
        Promise.resolve({ ...mockUser, ...updateData })
      );
    authHelper.hashPassword.mockImplementationOnce((password) =>
      Promise.resolve(`hashed_${password}`)
    );
  });

  it("should update all fields successfully", async () => {
    req.body = {
      name: "New Name",
      password: "newPassword123",
      phone: "1234567890",
      address: "New Address",
    };
    authHelper.hashPassword.mockResolvedValue("hashedPassword");

    await authController.updateProfileController(req, res);

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      {
        name: "New Name",
        password: "hashed_newPassword123",
        phone: "1234567890",
        address: "New Address",
      },
      { new: true }
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Profile Updated Successfully",
      })
    );
  });

  // Test each attribute individually
  it.each([
    [{ name: "New Name" }, "name"],
    [{ password: "newPassword123" }, "password"],
    [{ phone: "1234567890" }, "phone"],
    [{ address: "New Address" }, "address"],
  ])("should update only the %s field", async (updatedFields, fieldName) => {
    req.body = updatedFields;

    if (fieldName === "password") {
      authHelper.hashPassword.mockResolvedValue("hashedPassword");
    }

    await authController.updateProfileController(req, res);
    const expectedUpdate = { ...updatedFields };

    if (fieldName === "password") {
      expectedUpdate.password = "hashed_newPassword123";
    }

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      expect.objectContaining(expectedUpdate),
      { new: true }
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      })
    );
  });

  // Test any 2 attributes out of the 4 attributes
  it.each([
    [{ name: "New Name", password: "newPassword123" }],
    [{ name: "New Name", phone: "1234567890" }],
    [{ name: "New Name", address: "New Address" }],
    [{ password: "newPassword123", phone: "1234567890" }],
    [{ password: "newPassword123", address: "New Address" }],
    [{ phone: "1234567890", address: "New Address" }],
  ])("should update fields: %p", async (updatedFields) => {
    req.body = updatedFields;

    if (updatedFields.password) {
      authHelper.hashPassword.mockResolvedValue("hashedPassword");
    }

    await authController.updateProfileController(req, res);
    const expectedUpdate = { ...updatedFields };

    if (updatedFields.password) {
      expectedUpdate.password = `hashed_${updatedFields.password}`; 
    }

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      expect.objectContaining(expectedUpdate),
      { new: true }
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      })
    );
  });

  it("should have no updates if no fields are provided", async () => {
    await authController.updateProfileController(req, res);

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      {
        name: mockUser.name,
        password: mockUser.password,
        phone: mockUser.phone,
        address: mockUser.address,
      },
      { new: true }
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      })
    );
  });

  it("should return error if password is too short", async () => {
    req.body.password = "short";

    await authController.updateProfileController(req, res);

    expect(res.json).toHaveBeenCalledWith({
      error: "Password is required and at least 6 character long",
    });
  });

  it("should return error when user is not found", async () => {
    userModel.findById.mockResolvedValue(null);

    await authController.updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "User Not Found",
      error: new Error("User Not Found"),
    });
  });

  it("should return error when there are database errors", async () => {
    userModel.findById.mockRejectedValue(new Error("Database error"));
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await authController.updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error While Updating Profile",
      error: new Error("Database error"),
    });

    logSpy.mockRestore();
  });
});
