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

test.describe("Cart Tests for registered user", () => {
  test.describe.configure({ mode: "serial" });

  let testData;
  let testUserforDB;
  let testUserWithPassword;
  let testCategory;
  let testProduct;
  let testProduct2;

  let testUser2forDB;
  let testUser2WithPassword;

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

    testUser2WithPassword = {
      email: `bluetesting@email.com${Math.random()}`,
      password: "password456",
      name: "Testing CART User 2",
      phone: "0987654321",
      address: "456 Blue Street",
      role: 0,
      answer: "test",
    };
    // Set up initial test data
    testUser2forDB = {
      ...testUser2WithPassword,
      password: await bcrypt.hash(testUser2WithPassword.password, 10),
    };

    const savedUser2 = await userModel.create(testUser2forDB);

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
      user2: savedUser2,
      category: savedCategory,
      product1: savedProduct,
      product2: savedProduct2,
    };
  });

  test.afterEach(async () => {
    // clean up - find and delete all test data
    console.log(testData.user.email);
    await userModel.deleteOne({ email: testData.user.email });
    await userModel.deleteOne({ email: testData.user2.email });
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

  async function logout(page, testUser) {
    await expect(
      page.getByRole("button", { name: testUser.name })
    ).toBeVisible();
    await page.getByRole("button", { name: testUser.name }).click();
    await expect(page.getByRole("link", { name: "Logout" })).toBeVisible();
    await page.getByRole("link", { name: "Logout" }).click();
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  }

  // case 1:
  // login and add item to cart
  // logout and check if cart is empty
  // login again with another account and check if cart is still empty
  // logout and check if cart is empty
  // login to first user and check if cart still has 1 item

  test("should still have same item on next login", async ({ page }) => {
    // should be empty cart page
    await page.goto(`${BASE_URL}/cart`);
    await expect(page.getByTitle(0)).toBeVisible();
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

    await fillLoginForm(
      page,
      testUserWithPassword.email,
      testUserWithPassword.password
    );
    await expect(page).toHaveURL(`${BASE_URL}/cart`);
    await expect(page.getByTitle(0)).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Current Address" })
    ).toBeVisible();
    await expect(page.locator("h5")).toContainText(
      testUserWithPassword.address
    );
    await expect(page.locator("h1")).toContainText(
      `Hello ${testUserWithPassword.name} Your Cart Is Empty`
    );

    await page.goto(`${BASE_URL}/`);
    await addProductToCartFromHome(page, testData.product1, "1");
    await expect(page.getByTitle("1")).toBeVisible();

    await checkProductInCart(
      page,
      testData.product1,
      "1",
      testUserWithPassword
    );

    await expect(page.locator(".col-md-7 > .row")).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByRole("main")).toContainText(testData.product1.name);
    await expect(page.getByRole("main")).toContainText(
      testData.product1.description
    );
    await expect(page.getByRole("main")).toContainText(
      `Price: ${testData.product1.price.toFixed(2)}`
    );

    // logout

    await logout(page, testUserWithPassword);
    await expect(
      page.getByRole("button", { name: testUserWithPassword.name })
    ).not.toBeVisible();

    await fillLoginForm(
      page,
      testUser2WithPassword.email,
      testUser2WithPassword.password
    );
    await expect(page).toHaveURL(`${BASE_URL}/`);

    // check cart empty
    await expect(page.getByTitle("0")).toBeVisible();

    await page.getByRole("link", { name: "Cart" }).click();

    await expect(page).toHaveURL(`${BASE_URL}/cart`);

    await expect(page.locator("h1")).toContainText(
      `Hello ${testUser2WithPassword.name} Your Cart Is Empty`
    );
    await expect(page.getByRole("main")).toContainText("Total : $0.00");
    await expect(page.locator("h5")).toContainText(
      testUser2WithPassword.address
    );

    // logout

    await expect(
      page.getByRole("button", { name: testUser2WithPassword.name })
    ).toBeVisible();
    await page
      .getByRole("button", { name: testUser2WithPassword.name })
      .click();
    await expect(page.getByRole("link", { name: "Logout" })).toBeVisible();
    await page.getByRole("link", { name: "Logout" }).click();
    await expect(page).toHaveURL(`${BASE_URL}/login`);

    await expect(page.getByTitle("0")).toBeVisible();

    // login to first user
    await fillLoginForm(
      page,
      testUserWithPassword.email,
      testUserWithPassword.password
    );

    await expect(page).toHaveURL(`${BASE_URL}/`);
    await expect(page.getByRole("link", { name: "Cart" })).toBeVisible();
    await page.getByRole("link", { name: "Cart" }).click();

    await expect(page).toHaveURL(`${BASE_URL}/cart`);
    await expect(page.getByTitle("1")).toBeVisible();

    await checkProductInCart(
      page,
      testData.product1,
      "1",
      testUserWithPassword
    );
    await expect(page.locator(".col-md-7 > .row")).toBeVisible();

    await expect(page.getByRole("main")).toContainText(testData.product1.name);
    await expect(page.getByRole("main")).toContainText(
      testData.product1.description
    );
    await expect(page.getByRole("main")).toContainText(
      `Price: ${testData.product1.price.toFixed(2)}`
    );
  });

  // case 2: (new browser?? so nothing in local storage)
  // login and add item to cart
  // logout and check if cart is empty
  // login again with another account and check if cart is still empty
  // add another item to cart
  // logout and check if cart is empty
  // login to first user and check if cart still has 1 item
  // login to second user and check if cart has the same item
  test("should not add product to another user's cart", async ({ page }) => {
    // Login user 1 + add product 2 in cart
    await page.goto(`${BASE_URL}/login`);
    fillLoginForm(
      page,
      testUserWithPassword.email,
      testUserWithPassword.password
    );
    await expect(page).toHaveURL(`${BASE_URL}/`);

    await page.getByRole("link", { name: "Cart" }).click();

    await expect(page).toHaveURL(`${BASE_URL}/cart`);

    // check cart empty
    await expect(page.getByTitle("0")).toBeVisible();
    await expect(page.locator("h1")).toContainText(
      `Hello ${testUserWithPassword.name} Your Cart Is Empty`
    );
    await expect(page.getByRole("main")).toContainText("Total : $0.00");

    await addProductToCartFromHome(page, testData.product2, "1");
    await expect(page.getByTitle("1")).toBeVisible();

    await checkProductInCart(
      page,
      testData.product1,
      "1",
      testUserWithPassword
    );

    await expect(page.locator(".col-md-7 > .row")).toBeVisible();
    await expect(page.getByRole("main")).toContainText(testData.product2.name);
    await expect(page.getByRole("main")).toContainText(
      testData.product2.description
    );
    await expect(page.getByRole("main")).toContainText(
      `Price: ${testData.product2.price.toFixed(2)}`
    );
    const totalFormattedPriceProduct2 = testData.product2.price.toLocaleString(
      "en-US",
      {
        style: "currency",
        currency: "USD",
      }
    );
    await expect(page.getByRole("main")).toContainText(
      `Total : ${totalFormattedPriceProduct2}`
    );

    await logout(page, testUserWithPassword);

    // Login user 2 + add Product 1 in cart
    await fillLoginForm(
      page,
      testUser2WithPassword.email,
      testUser2WithPassword.password
    );
    await expect(page).toHaveURL(`${BASE_URL}/`);

    await page.getByRole("link", { name: "Cart" }).click();

    await expect(page).toHaveURL(`${BASE_URL}/cart`);

    // check cart empty
    await expect(page.getByTitle("0")).toBeVisible();
    await expect(page.locator("h1")).toContainText(
      `Hello ${testUser2WithPassword.name} Your Cart Is Empty`
    );
    await expect(page.getByRole("main")).toContainText("Total : $0.00");

    await addProductToCartFromHome(page, testData.product1, "1");
    await expect(page.getByTitle("1")).toBeVisible();

    await checkProductInCart(
      page,
      testData.product1,
      "1",
      testUser2WithPassword
    );

    await expect(page.locator(".col-md-7 > .row")).toBeVisible();
    await expect(page.getByRole("main")).toContainText(testData.product1.name);
    await expect(page.getByRole("main")).toContainText(
      testData.product1.description
    );
    await expect(page.getByRole("main")).toContainText(
      `Price: ${testData.product1.price.toFixed(2)}`
    );

    const totalFormattedPriceProduct1 = testData.product1.price.toLocaleString(
      "en-US",
      {
        style: "currency",
        currency: "USD",
      }
    );
    await expect(page.getByRole("main")).toContainText(
      `Total : ${totalFormattedPriceProduct1}`
    );

    await logout(page, testUser2WithPassword);

    await expect(page.getByTitle("0")).toBeVisible();

    await page.goto(`${BASE_URL}/cart`);

    await expect(page.locator("h1")).toContainText(
      "Hello Guest Your Cart Is Empty"
    );

    // login user 1 + check cart still has 1 item only product 2
    page.goto(`${BASE_URL}/login`);
    await fillLoginForm(
      page,
      testUserWithPassword.email,
      testUserWithPassword.password
    );

    await expect(page).toHaveURL(`${BASE_URL}/`);
    await expect(page.getByRole("link", { name: "Cart" })).toBeVisible();
    await page.getByRole("link", { name: "Cart" }).click();

    await expect(page).toHaveURL(`${BASE_URL}/cart`);
    await expect(page.getByTitle("1")).toBeVisible();

    await checkProductInCart(
      page,
      testData.product2,
      "1",
      testUserWithPassword
    );

    await expect(page.locator(".col-md-7 > .row")).toBeVisible();
    await expect(page.getByRole("main")).toContainText(testData.product2.name);
    await expect(page.getByRole("main")).toContainText(
      testData.product2.description
    );
    await expect(page.getByRole("main")).toContainText(
      `Price: ${testData.product2.price.toFixed(2)}`
    );
    await expect(page.getByRole("main")).toContainText(
      `Total : ${totalFormattedPriceProduct2}`
    );

    // check no product 1
    await expect(page.getByRole("main")).not.toContainText(
      testData.product1.name
    );
    await expect(page.getByRole("main")).not.toContainText(
      testData.product1.description
    );
    await expect(page.getByRole("main")).not.toContainText(
      `Price: ${testData.product1.price.toFixed(2)}`
    );
  });

  test("should go to Cart Page with no products in cart", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await fillLoginForm(
      page,
      testUserWithPassword.email,
      testUserWithPassword.password
    );
    await expect(page).toHaveURL(`${BASE_URL}/`);
    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page.locator("h1")).toContainText(
      `Hello ${testUserWithPassword.name} Your Cart Is Empty`
    );
    await expect(page.getByRole("main")).toContainText("Total : $0.00");

    await expect(page.locator("h5")).toContainText(
      testUserWithPassword.address
    );
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

