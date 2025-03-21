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

test.describe("Order Tests for registered user", () => {
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
      role: 0,
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
      description: "Test Description 2",
      price: 3000,
      slug: `test-product-${Math.random()}`,
      quantity: 10,
      category: savedCategory._id,
      shipping: true,
    };

    const savedProduct = await productModel.create(testProduct);
    const savedProduct2 = await productModel.create(testProduct2);

    testData = {
      user: savedUser,
      category: savedCategory,
      product1: savedProduct,
      product2: savedProduct2,
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
    await productModel.deleteOne({ name: testData.product1.name });
    await productModel.deleteOne({ name: testData.product2.name });

    // find and delete all orders created by user
    await orderModel.deleteMany({ buyer: testData.user._id });

    const findCategory = await categoryModel.findOne({
      name: testData.category.name,
    });
    expect(findCategory).toBeNull();
    await mongoose.connection.close();
  });

  test("should go to Cart Page with no products in cart", async ({ page }) => {
    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page.locator("h1")).toContainText(
      `Hello ${testUserWithPassword.name} Your Cart Is Empty`
    );
    await expect(page.getByRole("main")).toContainText("Total : $0.00");

    await expect(page.locator("h5")).toContainText(
      testUserWithPassword.address
    );
  });

  async function cartToPaymentSuccess(
    page,
    cardNo,
    cvv,
    testName,
    testDataDetails
  ) {
    const cartItems = await page.evaluate((email) => {
      return JSON.parse(localStorage.getItem(`cart${email}`));
    }, testDataDetails.user.email);
    // add product to cart
    await page.goto(`${BASE_URL}/product/${testDataDetails.product1.slug}`);

    // check that the button is not disabled before clicking
    await page.waitForFunction(() => {
      const button = document.querySelector("button.btn-dark");
      return button && !button.classList.contains("disabled");
    });

    await page.getByRole("button", { name: "ADD TO CART" }).click();

    // go to cart page
    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL(`${BASE_URL}/cart`);

    // check header cart count (in red)
    await expect(page.getByTitle("1")).toBeVisible();

    await page.waitForSelector('[data-testid="loading"]', {
      state: "hidden",
      timeout: 15000,
    });

    await expect(page.locator(".col-md-7 > .row")).toBeVisible({
      timeout: 30000,
    });

    // check cart page content
    await expect(
      page.getByRole("heading", {
        name: `Hello ${testDataDetails.user.name} You Have 1 item`,
      })
    ).toBeVisible();
    await expect(page.locator("h1")).toContainText(
      `Hello ${testDataDetails.user.name}You Have 1 item in your cart`
    );
    await expect(page.getByRole("main")).toContainText(
      testDataDetails.product1.name
    );
    await expect(page.getByRole("main")).toContainText(
      testDataDetails.product1.description
    );
    await expect(page.getByRole("main")).toContainText(
      `Price : ${testDataDetails.product1.price.toFixed(2)}`
    );

    // fill up payment details
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
      .fill("1234");
    await page.getByTestId("make-payment").click();
    await page.waitForSelector(".cart-page", {
      state: "visible",
    });

    // check navigation to order page
    await expect(page).toHaveURL(`${BASE_URL}/dashboard/user/orders`);

    // check order details
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
      `Price : ${testDataDetails.product1.price.toFixed(2)}`
    );
  }

  const validOrderTestData = [
    {
      cardNo: "4111 1111 1111 1111",
      cvv: "123",
      testName: "visa payment",
    },
    {
      cardNo: "2223000048400011",
      cvv: "123",
      testName: "mastercard payment",
    },
    {
      cardNo: "6243030000000001",
      cvv: "123",
      testName: "unionpay payment",
    },
    {
      cardNo: "3530111333300000",
      cvv: "123",
      testName: "jcb payment",
    },
    {
      cardNo: "371449635398431",
      cvv: "1234",
      testName: "amex payment",
    },
  ];

  validOrderTestData.forEach((data) => {
    test(`should place order with ${data.testName} for added products in cart successfully `, async ({
      page,
    }) => {
      await cartToPaymentSuccess(
        page,
        data.cardNo,
        data.cvv,
        data.testName,
        testData
      );
    });
  });

  const incompleteOrderTestData = [
    {
      cardNo: "4111 1111 1111 1111",
      cvv: "12",
      testName: "visa payment",
    },
    {
      cardNo: "2223000048400010",
      cvv: "123",
      testName: "mastercard payment",
    },
  ];

  test("should remove product from cart successfully", async ({ page }) => {
    await page.goto(`${BASE_URL}/product/${testData.product1.slug}`);
    // check that the button is not disabled before clicking
    await page.waitForFunction(() => {
      const button = document.querySelector("button.btn-dark");
      return button && !button.classList.contains("disabled");
    });
    await page.getByRole("button", { name: "ADD TO CART" }).click();
    await expect(page.getByTitle("1")).toBeVisible();

    // check that the button is not disabled before clicking
    await page.waitForFunction(() => {
      const button = document.querySelector("button.btn-dark");
      return button && !button.classList.contains("disabled");
    });
    await page.goto(`${BASE_URL}/product/${testData.product2.slug}`);
    await page.getByRole("button", { name: "ADD TO CART" }).click();
    await expect(page.getByTitle("2")).toBeVisible();

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL(`${BASE_URL}/cart`);
    await page.waitForSelector('[data-testid="loading"]', {
      state: "hidden",
      timeout: 15000,
    });

    await expect(page.locator(".col-md-7 > div").first()).toBeVisible();
    await expect(page.locator(".col-md-7 > div:nth-child(2)")).toBeVisible();

    await expect(page.locator("h1")).toContainText(
      "You Have 2 items in your cart"
    );
    await expect(
      page.getByRole("heading", {
        name: `Hello ${testData.user.name} You Have 2 items`,
      })
    ).toBeVisible();
    await expect(page.locator(".col-md-7")).toBeVisible();
    await expect(
      page
        .locator("div")
        .filter({ hasText: /^Remove$/ })
        .nth(1)
    ).toBeVisible();
    await page.getByRole("button", { name: "Remove" }).nth(1).click();

    await page.waitForSelector('[data-testid="loading"]', {
      state: "hidden",
      timeout: 15000,
    });
    await expect(page.locator("h1")).toContainText(
      "You Have 1 item in your cart"
    );
    await expect(page.getByRole("main")).toContainText(
      `Total : $${testData.product1.price}`
    );
    await expect(page.locator("h1")).toContainText(
      `Hello ${testData.user.name}You Have 1 item in your cart`
    );
    await expect(page.locator(".col-md-7 > .row")).toBeVisible();
  });

  // TODO: Add tests for multiple orders

  // TODO: Add tests for add to cart in home page

  /** Failure Test Cases **/
  async function cartToPaymentFailure(
    page,
    cardNo,
    cvv,
    testName,
    testDataDetails
  ) {
    // navigate to product page
    await page.goto(`${BASE_URL}/product/${testDataDetails.product1.slug}`);
    // check that the button is not disabled before clicking
    await page.waitForFunction(() => {
      const button = document.querySelector("button.btn-dark");
      return button && !button.classList.contains("disabled");
    });
    await page.getByRole("button", { name: "ADD TO CART" }).click();

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL(`${BASE_URL}/cart`);

    // check header cart count (in red)
    await expect(page.getByTitle("1")).toBeVisible();

    // check cart page content
    await expect(page.locator(".col-md-7 > .row")).toBeVisible({
      timeout: 30000,
    });

    await expect(
      page.getByRole("heading", {
        name: `Hello ${testDataDetails.user.name} You Have 1 item`,
      })
    ).toBeVisible();
    await expect(page.locator("h1")).toContainText(
      `Hello ${testDataDetails.user.name}You Have 1 item in your cart`
    );
    await expect(page.getByRole("main")).toContainText(
      testDataDetails.product1.name
    );
    await expect(page.getByRole("main")).toContainText(
      testDataDetails.product1.description
    );
    await expect(page.getByRole("main")).toContainText(
      `Price : ${testDataDetails.product1.price.toFixed(2)}`
    );

    // fill up payment details

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
      .fill("1234");
    await page.getByTestId("make-payment").click();

    // check error toast
    const errorToast = page.getByText(
      "Something went wrong with your payment information."
    );
    await errorToast.waitFor();
    await expect(errorToast).toBeVisible();

    // stays at cart page
    await expect(page).toHaveURL(`${BASE_URL}/cart`);
  }

  incompleteOrderTestData.forEach((data) => {
    test(`should not place order with ${data.testName} for added products in cart successfully `, async ({
      page,
    }) => {
      await cartToPaymentFailure(
        page,
        data.cardNo,
        data.cvv,
        data.testName,
        testData
      );
    });
  });

  test("should have processor declined error during payment", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/product/${testData.product2.slug}`);

    await page.waitForSelector(".product-details-info", {
      state: "visible",
    });

    await page.getByRole("button", { name: "ADD TO CART" }).click();
    await expect(page.getByTitle("1")).toBeVisible();

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL(`${BASE_URL}/cart`);
    await page.waitForSelector('[data-testid="loading"]', {
      state: "hidden",
      timeout: 15000,
    });

    await expect(page.locator(".col-md-7 > div").first()).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: `Hello ${testData.user.name} You Have 1 item`,
      })
    ).toBeVisible();
    await expect(page.locator("h1")).toContainText(
      `Hello ${testData.user.name}You Have 1 item in your cart`
    );
    await expect(page.getByRole("main")).toContainText(testData.product2.name);
    await expect(page.getByRole("main")).toContainText(
      testData.product2.description
    );
    await expect(page.getByRole("main")).toContainText(
      `Price : ${testData.product2.price.toFixed(2)}`
    );

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
      .fill("4000 1111 1111 1115");
    await page
      .locator('iframe[name="braintree-hosted-field-expirationDate"]')
      .contentFrame()
      .getByRole("textbox", { name: "Expiration Date" })
      .click();
    await page
      .locator('iframe[name="braintree-hosted-field-cvv"]')
      .contentFrame()
      .getByRole("textbox", { name: "CVV" })
      .click();
    await page
      .locator('iframe[name="braintree-hosted-field-cvv"]')
      .contentFrame()
      .getByRole("textbox", { name: "CVV" })
      .fill("234");
    await page
      .locator('iframe[name="braintree-hosted-field-expirationDate"]')
      .contentFrame()
      .getByRole("textbox", { name: "Expiration Date" })
      .click();
    await page
      .locator('iframe[name="braintree-hosted-field-expirationDate"]')
      .contentFrame()
      .getByRole("textbox", { name: "Expiration Date" })
      .fill("1234");

    await page.getByTestId("make-payment").click();
    await expect(page.getByText("Something went wrong with")).toBeVisible();
    await expect(
      page.getByText(
        "Something went wrong with your payment information. Processor Network Unavailable - Try Again"
      )
    ).toBeVisible();

    // stays at cart page
    await expect(page).toHaveURL(`${BASE_URL}/cart`);

    // Check if credit card number field is empty
    const cardNumberValue = await page
      .locator('iframe[name="braintree-hosted-field-number"]')
      .contentFrame()
      .getByRole("textbox", { name: "Credit Card Number" })
      .inputValue();
    expect(cardNumberValue).toBe("");

    // Check if expiration date field is empty
    const expirationDateValue = await page
      .locator('iframe[name="braintree-hosted-field-expirationDate"]')
      .contentFrame()
      .getByRole("textbox", { name: "Expiration Date" })
      .inputValue();
    expect(expirationDateValue).toBe("");

    // Check if CVV field is empty
    const cvvValue = await page
      .locator('iframe[name="braintree-hosted-field-cvv"]')
      .contentFrame()
      .getByRole("textbox", { name: "CVV" })
      .inputValue();
    expect(cvvValue).toBe("");
  });
});

test.describe("Order Tests for no user", () => {
  test.describe.configure({ mode: "serial" });

  let testData;
  let testCategory;
  let testProduct;
  let testProduct2;

  test.beforeAll(async () => {
    mongoConnection = await mongoose.connect(process.env.MONGO_URL_TEST);
  });

  // After all tests
  test.afterAll(async () => {
    await mongoose.connection.close();
  });
  test.beforeEach(async ({ page }) => {
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
      description: "Test Description 2",
      price: 200,
      slug: `test-product-${Math.random()}`,
      quantity: 10,
      category: savedCategory._id,
      shipping: true,
    };

    const savedProduct = await productModel.create(testProduct);
    const savedProduct2 = await productModel.create(testProduct2);

    testData = {
      category: savedCategory,
      product1: savedProduct,
      product2: savedProduct2,
    };
  });

  test.afterEach(async () => {
    // clean up - find and delete all test data

    await categoryModel.deleteOne({ name: testData.category.name });
    await productModel.deleteOne({ name: testData.product1.name });
    await productModel.deleteOne({ name: testData.product2.name });

    const findCategory = await categoryModel.findOne({
      name: testData.category.name,
    });
    expect(findCategory).toBeNull();
  });

  test("should go to Cart Page but cannot add anything to cart", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(page).toHaveURL(`${BASE_URL}/cart`);

    // check header cart count (in red)
    await expect(page.getByRole("superscript")).toContainText("0");
    await expect(page.locator("h1")).toContainText(
      "Hello Guest Your Cart Is Empty"
    );
    await expect(page.getByRole("main")).toContainText("Total : $0.00");
    await expect(
      page.getByRole("button", { name: "Please login to add to cart" })
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Please login to add to cart" })
      .click();
  });

  test("product page cannot add anything to cart", async ({ page }) => {
    const checkProduct = await productModel.findOne({
      name: testData.product1.name,
    });
    expect(checkProduct).not.toBeNull();
    await page.goto(`${BASE_URL}/product/${testData.product1.slug}`, {
      waitUntil: "domcontentloaded",
    });

    // check that product details page is loaded
    await page.waitForSelector(".product-details-info", {
      state: "visible",
    });

    // check that the button is not disabled before clicking
    await page.waitForFunction(() => {
      const button = document.querySelector("button.btn-dark");
      return button && !button.classList.contains("disabled");
    });

    await page.getByRole("button", { name: "ADD TO CART" }).click();
    await expect(
      page
        .locator("div")
        .filter({ hasText: /^Please log in to add items to the cart$/ })
        .nth(2)
    ).toBeVisible();
    await expect(page.getByRole("status")).toContainText(
      "Please log in to add items to the cart"
    );
  });
});

// TODO:Add test for login logout of cart behaviour

// TODO: Add test for update address of user and check if it is reflected in cart page
