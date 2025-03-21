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
      description: "2nd product yapyap",
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

  async function cartToPaymentSuccess(
    page,
    cardNo,
    cvv,
    testName,
    testDataDetails
  ) {
    await addProductToCart(page, testDataDetails.product1, "1");

    await checkProductInCart(
      page,
      testDataDetails.product1,
      "1",
      testUserWithPassword
    );

    // check cart page content of products
    await expect(page.locator(".col-md-7 > .row")).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByRole("main")).toContainText(
      testDataDetails.product1.name
    );
    await expect(page.getByRole("main")).toContainText(
      testDataDetails.product1.description
    );
    await expect(page.getByRole("main")).toContainText(
      `Price: ${testDataDetails.product1.price.toFixed(2)}`
    );

    // fill up payment details

    await fillUpPaymentDetails(page, cardNo, cvv, "1234");

    // check navigation to order page
    await expect(page).toHaveURL(`${BASE_URL}/dashboard/user/orders`);

    // check order details
    await checkOrderDetails(page, testDataDetails);

    // check cart has no product left
    await expect(page.getByTitle(0)).toBeVisible();
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
    // add first product
    await page.goto(`${BASE_URL}/product/${testData.product1.slug}`);
    // check that the button is not disabled before clicking
    await page.waitForSelector("button.btn-dark:not(.disabled)");
    await page.getByRole("button", { name: "ADD TO CART" }).click();
    await expect(page.getByTitle("1")).toBeVisible();
    await checkProductInCart(
      page,
      testData.product1,
      "1",
      testUserWithPassword
    );

    // add second product
    await page.goto(`${BASE_URL}/product/${testData.product2.slug}`);
    await page.waitForSelector("button.btn-dark:not(.disabled)");
    await page.getByRole("button", { name: "ADD TO CART" }).click();
    await expect(page.getByTitle("2")).toBeVisible();

    await checkProductInCart(
      page,
      testData.product2,
      "2",
      testUserWithPassword
    );

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


  test("should place multiple orders successfully", async ({ page }) => {
    await addProductToCart(page, testData.product1, "1");

    await checkProductInCart(
      page,
      testData.product1,
      "1",
      testUserWithPassword
    );

    await expect(page.locator("h1")).toContainText(
      "You Have 1 item in your cart"
    );
    await expect(page.getByRole("main")).toContainText(
      `Total : $${testData.product1.price}`
    );
    await expect(page.locator("h1")).toContainText(
      `Hello ${testData.user.name}You Have 1 item in your cart`
    );

    await fillUpPaymentDetails(page, "4111 1111 1111 1111", "123", "1234");

    await expect(page).toHaveURL(`${BASE_URL}/dashboard/user/orders`);

    await expect(
      page.getByRole("heading", { name: "All Orders" })
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: "1" }).first()).toBeVisible();
    await expect(page.locator("tbody")).toContainText("Not Processed");
    await expect(page.locator("tbody")).toContainText(testData.user.name);
    await expect(page.locator("tbody")).toContainText("a few seconds ago");
    await expect(page.locator("tbody")).toContainText("Success");
    await expect(page.locator("tbody")).toContainText("1");
    await expect(page.getByRole("main")).toContainText(testData.product1.name);
    await expect(page.getByRole("main")).toContainText(
      testData.product1.description
    );
    await expect(page.getByRole("main")).toContainText(
      `Price: ${testData.product1.price.toFixed(2)}`
    );

    // check cart details page
    await addProductToCart(page, testData.product1, "1");
    await checkProductInCart(
      page,
      testData.product1,
      "1",
      testUserWithPassword
    );
    await addProductToCartFromHome(page, testData.product2, "2");
    await checkProductInCart(
      page,
      testData.product2,
      "2",
      testUserWithPassword
    );

    await expect(
      page.getByTestId(`cart-item-${testData.product1._id}`)
    ).toBeVisible();
    await expect(
      page.getByTestId(`cart-item-${testData.product2._id}`)
    ).toBeVisible();

    await fillUpPaymentDetails(page, "2223000048400011", "183", "1234");
    // check first order
    await expect(
      page.getByRole("columnheader", { name: "#" }).first()
    ).toBeVisible();
    await expect(page.getByRole("main")).toContainText("Not Processed");
    await expect(page.getByRole("main")).toContainText(testData.user.name);
    await expect(page.getByRole("main")).toContainText("a few seconds ago");
    await expect(page.getByRole("main")).toContainText("Success");
    await expect(page.getByRole("main")).toContainText("1");

    // check second order
    await expect(
      page.getByRole("columnheader", { name: "#" }).nth(1)
    ).toBeVisible();
    await expect(page.getByRole("main")).toContainText("Not Processed");
    await expect(page.getByRole("main")).toContainText(testData.user.name);
    await expect(page.getByRole("main")).toContainText("a few seconds ago");
    await expect(page.getByRole("main")).toContainText("Success");
    await expect(page.getByRole("main")).toContainText("2");
    await expect(
      page.locator("div:nth-child(3) > .container > div").first()
    ).toBeVisible();
    await expect(page.locator(".container > div:nth-child(2)")).toBeVisible();
    await expect(page.getByRole("main")).toContainText(testData.product1.name);
    await expect(page.getByRole("main")).toContainText(
      testData.product1.description
    );
    await expect(page.getByRole("main")).toContainText(
      `Price: ${testData.product1.price.toFixed(2)}`
    );

    await expect(page.getByRole("main")).toContainText(testData.product2.name);
    await expect(page.getByRole("main")).toContainText(
      testData.product2.description
    );
    await expect(page.getByRole("main")).toContainText(
      `Price: ${testData.product2.price.toFixed(2)}`
    );
  });

  test("should add product to cart from home page", async ({ page }) => {
    await addProductToCartFromHome(page, testData.product1, "1");

    await checkProductInCart(
      page,
      testData.product1,
      "1",
      testUserWithPassword
    );

    // check for details in cart
    await expect(page.getByRole("main")).toContainText(testData.product1.name);
    await expect(page.getByRole("main")).toContainText(
      testData.product1.description
    );
    await expect(page.getByRole("main")).toContainText(
      `Price: ${testData.product1.price.toFixed(2)}`
    );

    await fillUpPaymentDetails(page, "4012888888881881", "103", "1234");

    await expect(page).toHaveURL(`${BASE_URL}/dashboard/user/orders`);
  });

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
      `Price: ${testDataDetails.product1.price.toFixed(2)}`
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
      `Price: ${testData.product2.price.toFixed(2)}`
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
