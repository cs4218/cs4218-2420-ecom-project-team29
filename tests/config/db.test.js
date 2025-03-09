import mongoose from "mongoose";
import connectDB from "../../config/db";
import { expect, jest } from "@jest/globals";

jest.mock("mongoose");

describe("Database connection configuration", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mongoose.connect = jest.fn().mockResolvedValueOnce({
      connection: { host: "mock-localhost" },
    });
  });

  it("should connect to MongoDB successfully", async () => {
    mongoose.connect = jest.fn().mockResolvedValueOnce({
      connection: { host: "mock-localhost" },
    });

    // Capture console logs
    console.log = jest.fn();

    await connectDB();

    expect(console.log).toHaveBeenCalledWith(
      `Connected To Mongodb Database mock-localhost`.bgMagenta.white
    );
  });

  it("should show MongoDB connection error", async () => {
    mongoose.connect = jest.fn().mockRejectedValue(
      new Error("Connection to MongoDB failed")
    );

    console.log = jest.fn();

    await connectDB();

    expect(console.log).toHaveBeenCalledWith(
      `Error in Mongodb Error: Connection to MongoDB failed`.bgRed.white
    );
  });
});
