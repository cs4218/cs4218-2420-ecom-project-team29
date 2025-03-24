import { test, expect } from "@playwright/test";
import userModel from "../../../models/userModel";
import productModel from "../../../models/productModel";
import categoryModel from "../../../models/categoryModel";
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

async function addProductToCartFromHome(page, product, productNoInCart) {
  await page.goto(`${BASE_URL}/`);

  // check whether the button with testid exists:
  await page.waitForSelector(`[data-testid="add-to-cart-${product.slug}"]`, {
    state: "visible",
  });

  await page.getByTestId(`add-to-cart-${product.slug}`).click();

  await expect(page.getByTitle(productNoInCart)).toBeVisible();
}

async function addProductToCart(page, product, productNoInCart) {
  await page.goto(`${BASE_URL}/product/${product.slug}`);
  // check that the button is not disabled before clicking
  await page.waitForFunction(() => {
    const button = document.querySelector("button.btn-dark");
    return button && !button.classList.contains("disabled");
  });
  await page.getByRole("button", { name: "ADD TO CART" }).click();
  await expect(page.getByTitle(productNoInCart)).toBeVisible();
}
async function checkProductInCart(
  page,
  product,
  productNoInCart,
  testUserWithPassword
) {
  await page.getByRole("link", { name: "Cart" }).click();
  await expect(page).toHaveURL(`${BASE_URL}/cart`);

  await page.waitForSelector('[data-testid="loading"]', {
    state: "hidden",
    timeout: 15000,
  });
  // TODO: check for paypal dummy error

  if (productNoInCart === "1") {
    await expect(page.locator("h1")).toContainText(
      `Hello ${testUserWithPassword.name}You Have ${productNoInCart} item in your cart`
    );
  } else if (productNoInCart === "0") {
    await expect(page.locator("h1")).toContainText(
      `Hello ${testUserWithPassword.name} Your Cart Is Empty`
    );
  } else {
    await expect(page.locator("h1")).toContainText(
      `Hello ${testUserWithPassword.name}You Have ${productNoInCart} items in your cart`
    );
  }
}
async function fillUpPaymentDetails(page, cardNo, cvv, expiryDate) {
  await expect(page.getByText("Edit Choose a way to pay")).toBeVisible();
  await page.getByText("Pay with card Card Number").click();
  await page
    .locator('iframe[name="braintree-hosted-field-number"]')
    .contentFrame()
    .getByRole("textbox", { name: "Credit Card Number" })
    .click();
  await expect(page.getByText("Pay with card Card Number")).toBeVisible();
  await expect(page.getByText("PayPal payment option is")).toBeVisible();

  await page
    .locator('iframe[name="braintree-hosted-field-number"]')
    .contentFrame()
    .getByRole("textbox", { name: "Credit Card Number" })
    .fill(cardNo);
  await page
    .locator('iframe[name="braintree-hosted-field-cvv"]')
    .contentFrame()
    .getByRole("textbox", { name: "CVV" })
    .click();
  await page
    .locator('iframe[name="braintree-hosted-field-cvv"]')
    .contentFrame()
    .getByRole("textbox", { name: "CVV" })
    .fill(cvv);
  await page
    .locator('iframe[name="braintree-hosted-field-expirationDate"]')
    .contentFrame()
    .getByRole("textbox", { name: "Expiration Date" })
    .click();
  await page
    .locator('iframe[name="braintree-hosted-field-expirationDate"]')
    .contentFrame()
    .getByRole("textbox", { name: "Expiration Date" })
    .fill(expiryDate);
  await page.getByTestId("make-payment").click();
  await page.waitForSelector(".cart-page", {
    state: "visible",
  });
}

test.describe("Update Product Tests for registered user orders", () => {
  test.describe.configure({ mode: "serial" });

  let testData;
  let testUserforDB;
  let testUserWithPassword;
  let testCategory;
  let testProduct;
  let testProduct2;

  test.beforeEach(async ({ page }) => {
    await mongoose.connect(process.env.MONGO_URL_TEST);

    testUserWithPassword = {
      email: `greentesting@email.com${Math.random()}`,
      password: "password123",
      name: "Testing Order User",
      phone: "1234567890",
      address: "123 Green Street",
      role: 1,
      answer: "test",
    };
    // Set up initial test data
    testUserforDB = {
      ...testUserWithPassword,
      password: await bcrypt.hash(testUserWithPassword.password, 10),
    };

    const savedUser = await userModel.create(testUserforDB);

    testCategory = {
      name: `Test Category ${Math.random()}`,
      slug: `test-category-${Math.random()}`,
    };

    const savedCategory = await categoryModel.create(testCategory);

    testProduct = {
      name: `Test Product ${Math.random()}`,
      description: "Test Description",
      price: 100,
      slug: `test-product-${Math.random()}`,
      quantity: 10,
      category: savedCategory._id,
      shipping: true,
    };

    testProduct2 = {
      name: "Test Product 2",
      description: "2nd product yapyap",
      price: 3000,
      slug: `test-product-${Math.random()}`,
      quantity: 10,
      category: savedCategory._id,
      shipping: true,
    };

    const savedProduct = await productModel.create(testProduct);
    const savedProduct2 = await productModel.create(testProduct2);

    const order = {
      products: [
        {
          _id: savedProduct._id,
          name: savedProduct.name,
          description: savedProduct.description,
          price: savedProduct.price,
        },
      ],
      buyer: savedUser._id,
      payment: {
        success: true,
      },
      status: "Not Processed",
    };

    const savedOrder = await orderModel.create(order);

    testData = {
      user: savedUser,
      category: savedCategory,
      product1: savedProduct,
      product2: savedProduct2,
      order: savedOrder,
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
    console.log(testData.user.email);
    await userModel.deleteOne({ email: testData.user.email });
    await categoryModel.deleteOne({ name: testData.category.name });
    // Delete by ID
    await productModel.deleteOne({ _id: testData.product1._id });
    await productModel.deleteOne({ _id: testData.product2._id });

    // find and delete all orders created by user
    await orderModel.deleteMany({ buyer: testData.user._id });

    const findCategory = await categoryModel.findOne({
      name: testData.category.name,
    });
    expect(findCategory).toBeNull();
    await mongoose.connection.close();
  });

  async function checkOrderDetails(page, testDataDetails) {
    await expect(
      page.getByRole("heading", { name: "All Orders" })
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: "1" }).first()).toBeVisible();
    await expect(page.locator("tbody")).toContainText("Not Processed");
    await expect(page.locator("tbody")).toContainText(
      testDataDetails.user.name
    );
    await expect(page.locator("tbody")).toContainText("a few seconds ago");
    await expect(page.locator("tbody")).toContainText("Success");
    await expect(page.locator("tbody")).toContainText("1");
    await expect(page.getByRole("main")).toContainText(
      testDataDetails.product1.name
    );
    await expect(page.getByRole("main")).toContainText(
      testDataDetails.product1.description
    );
    await expect(page.getByRole("main")).toContainText(
      `Price: ${testDataDetails.product1.price.toFixed(2)}`
    );
  }

  test("should have correct product details after updating name", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/dashboard/user/orders`);
    await checkOrderDetails(page, testData);

    await page.getByRole("button", { name: testData.user.name }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Products" }).click();

    // click with testId
    await page.getByTestId(`product-${testData.product1._id}`).click();

    expect(page).toHaveURL(
      `${BASE_URL}/dashboard/admin/product/${testData.product1.slug}`
    );
    await expect(
      page.getByRole("textbox", { name: "Write a name" })
    ).toHaveValue(testData.product1.name);

    await page.getByRole("textbox", { name: "Write a name" }).click();
    await page
      .getByRole("textbox", { name: "Write a name" })
      .fill("New Product Name");
    await page.getByTestId("update-product-btn").click();

    await page
      .getByText("Product updated successfully")
      .waitFor({ state: "visible", timeout: 50000 });
    await expect(page.getByText("New Product Name")).toBeVisible();

    await page.goto(`${BASE_URL}/dashboard/user/orders`);

    await checkOrderDetails(page, testData);

    await expect(page.locator("tbody")).not.toContainText("New Product Name");
  });

  test("should have correct product details in cart after updating description", async ({
    page,
  }) => {
    await addProductToCart(page, testData.product1, "1");
    await page.goto(`${BASE_URL}/dashboard/user/orders`);
    await checkOrderDetails(page, testData);

    await page.getByRole("button", { name: testData.user.name }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Products" }).click();

    // click with testId
    await page.getByTestId(`product-${testData.product1._id}`).click();

    expect(page).toHaveURL(
      `${BASE_URL}/dashboard/admin/product/${testData.product1.slug}`
    );
    await expect(
      page.getByRole("textbox", { name: "Write a name" })
    ).toHaveValue(testData.product1.name);

    await page.getByRole("textbox", { name: "Write a name" }).click();
    await page
      .getByRole("textbox", { name: "Write a name" })
      .fill("New Product nameeeeeeeee");
    await page.getByTestId("update-product-btn").click();

    await page
      .getByText("Product updated successfully")
      .waitFor({ state: "visible", timeout: 50000 });

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL(`${BASE_URL}/cart`);

    await checkProductInCart(
      page,
      testData.product1,
      "1",
      testUserWithPassword
    );

    await expect(page.locator(".col-md-7 > .row")).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByRole("main")).toContainText(
      "New Product nameeeeeeeee"
    );
    await expect(page.getByRole("main")).not.toContainText(
      testData.product1.name
    );

    await expect(page.getByRole("main")).toContainText(
      testData.product1.description
    );
    await expect(page.getByRole("main")).toContainText(
      `Price: ${testData.product1.price.toFixed(2)}`
    );
  });
});
