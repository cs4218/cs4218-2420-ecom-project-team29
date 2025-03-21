import { test, expect } from "@playwright/test";
import userModel from "../../../models/userModel";
import dotenv from "dotenv";
import mongoose from "mongoose";
import orderModel from "../../../models/orderModel";
import bcrypt from "bcrypt";

dotenv.config();

const BASE_URL = "http://127.0.0.1:3000";

let mongoConnection;

// authentication needs
async function fillLoginForm(page, email, password) {
  await page.getByPlaceholder("Enter your email").fill(email);
  await page.getByPlaceholder("Enter your password").fill(password);
  await page.getByRole("button", { name: "LOGIN" }).click();
}

test.describe("Cart Tests for registered user with user's address", () => {
  test.describe.configure({ mode: "serial" });

  let testData;
  let testUserforDB;
  let testUserWithPassword;

  test.beforeEach(async ({ page }) => {
    await mongoose.connect(process.env.MONGO_URL_TEST);

    testUserWithPassword = {
      email: `greentesting@email.com${Math.random()}`,
      password: "password123",
      name: "Testing CART User",
      phone: "1234567890",
      address: "123 Green Street",
      role: 0,
      answer: "test",
    };
    // Set up initial test data
    testUserforDB = {
      ...testUserWithPassword,
      password: await bcrypt.hash(testUserWithPassword.password, 10),
    };

    const savedUser = await userModel.create(testUserforDB);

    testData = {
      user1: savedUser,
    };
    console.log(testData);
    await page.goto(`${BASE_URL}/login`);
    await fillLoginForm(
      page,
      testUserWithPassword.email,
      testUserWithPassword.password
    );
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });

  test.afterEach(async () => {
    // clean up - find and delete all test data
    await userModel.deleteOne({ email: testData.user1.email });
    await mongoose.connection.close();
  });

  test("should show current address of user in cart", async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(
      page.getByRole("heading", { name: "Current Address" })
    ).toBeVisible();
    await expect(page.locator("h5")).toContainText(
      testUserWithPassword.address
    );
  });
  
  test("should show updated address of user in cart", async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(page.getByRole('button', { name: testData.user1.name })).toBeVisible();
    await page.getByRole('button', { name: testData.user1.name }).click();
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('main')).toContainText('Profile');
    await page.getByRole('link', { name: 'Profile' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Address' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('New address 123 green');
    await page.getByRole('button', { name: 'UPDATE' }).click();
    await expect(page.getByText('Profile Updated Successfully')).toBeVisible();
    await expect(page.getByRole('status')).toContainText('Profile Updated Successfully');

    await page.goto(`${BASE_URL}/cart`);
    await expect(
      page.getByRole("heading", { name: "Current Address" })
    ).toBeVisible();
    await expect(page.locator("h5")).toContainText(
      'New address 123 green'
    );
  });


});
