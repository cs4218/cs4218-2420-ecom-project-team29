import { comparePassword, hashPassword } from "../../helpers/authHelper";
import bcrypt from "bcrypt";
import { afterAll, beforeAll, jest } from "@jest/globals";

// Skip entire test suite if running in CI
const testFn = process.env.CI ? describe.skip : describe;

testFn("Auth Helper", () => {
  beforeAll(() => {
    jest.spyOn(bcrypt, "compare").mockImplementation(jest.fn());
    jest.spyOn(bcrypt, "hash").mockImplementation(jest.fn());
  });  
  afterAll(() => {
    jest.clearAllMocks();
  });
  describe("hashPassword", () => {
    it("should hash the password correctly", async () => {
      const password = "password123";
      const hashedPassword = "hashedPassword123";
      bcrypt.hash.mockResolvedValueOnce(hashedPassword);

      const result = await hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });

    it("should handle errors", async () => {
      const password = "password123";
      const error = new Error("Hashing error");
      bcrypt.hash.mockRejectedValue(error);

      const result = await hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBeUndefined();
    });
  });

  describe("comparePassword", () => {
    it("should compare the password correctly", async () => {
      const password = "password123";
      const hashedPassword = "hashedPassword123";
      bcrypt.compare.mockResolvedValueOnce(true);

      const result = await comparePassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });

    it("should return false for incorrect password", async () => {
      const password = "password123";
      const hashedPassword = "hashedPassword123";
      bcrypt.compare.mockResolvedValueOnce(false);

      const result = await comparePassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(false);
    });
  });
});