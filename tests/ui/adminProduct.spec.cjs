import { test, expect } from '@playwright/test';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
     * Tests:
     * 
     * create, update, delete product
     * 
     * Create product:
     * invalid:
     * - create product with category missing
     * - create product with name missing
     * - create product with description missing
     * - create product with price missing
     * - create product with quantity missing
     * - create product with invalid price
     * - create product with invalid quantity
     * - create product with invalid photo size
     * - create same product name
     * - create same product slug
     * valid:
     * - create product without photo
     * - create product without shipping
     * 
     * 
     * Update product:
     * invalid:
     * - update product with name missing
     * - update product with description missing
     * - update product with price missing
     * - update product with quantity missing
     * - update product with invalid price
     * - update product with invalid quantity
     * - update product with invalid photo size
     * - update product to same product name
     * - update product to same product slug
     * 
     * 
     * Delete product:
     * invalid:
     * - delete product but cancelling
     */

const sampleProduct = {
    name: 'ui_test_product_name',
    slug: 'ui_test_product_name',
    description: 'ui_test_product_description',
    price: 123,
    quantity: 111,
    category: 'ui_category_test',
    shipping: false,
    photo: {}
}

test.describe('Product', () => {

    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URL_TEST, { useNewUrlParser: true, useUnifiedTopology: true });
        // create temp category
        const collection = mongoose.connection.collection("categories");
        await collection.insertOne({
            name: 'ui_category_test',
            slug: 'ui_category_test'
        });
        await collection.insertOne({
            name: 'ui_another_category_test',
            slug: 'ui_another_category_test'
        });
    });

    test.afterAll(async () => {
        // Clean up
        const collection = mongoose.connection.collection("categories");
        await collection.deleteOne({ name: "ui_category_test" });
        await collection.deleteOne({ name: "ui_another_category_test" });
        await mongoose.disconnect();
    });

    test.beforeEach(async ({ page }) => {
        // Login as admin and go to manage users page
        await page.goto('http://localhost:3000/login');
        await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@test.sg');
        await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('admin@test.sg');
        await page.getByRole('button', { name: 'LOGIN' }).click();
        await page.getByRole('button', { name: 'admin@test.sg' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Product' }).click();
    });


    test('create, update and delete product', async ({ page }) => {
        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // verify product is created and correct details
        await expect(page.getByText('Product created successfully')).toBeVisible();
        await expect(page.getByText('ui_test_product_name')).toBeVisible();
        await page.getByRole("link", { name: "ui_test_product_name" }).click();
        await expect(page.getByTestId('category-select').getByText('ui_category_test')).toBeVisible();
        await expect(page.getByRole('img', { name: 'product_photo' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Write a name' })).toHaveValue('ui_test_product_name');
        await expect(page.getByRole('textbox', { name: 'Write a description' })).toHaveValue('ui_test_product_description');
        await expect(page.getByPlaceholder('Write a price')).toHaveValue('123');
        await expect(page.getByPlaceholder('Write a quantity')).toHaveValue('111');
        await expect(page.getByTestId('shipping-select').getByText('No')).toBeVisible();

        // update product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_another_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/grass.png');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_another_test_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_another_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('456');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('222');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('Yes', { exact: true }).click();
        await page.getByTestId('update-product-btn').click();

        // verify product is updated
        await expect(page.getByText('Product updated successfully')).toBeVisible();
        await expect(page.getByText('ui_another_test_product_name')).toBeVisible();
        await page.getByRole("link", { name: "ui_another_test_product_name" }).click();
        await expect(page.getByTestId('category-select').getByText('ui_another_category_test')).toBeVisible();
        await expect(page.getByRole('img', { name: 'product_photo' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Write a name' })).toHaveValue('ui_another_test_product_name');
        await expect(page.getByRole('textbox', { name: 'Write a description' })).toHaveValue('ui_another_test_product_description');
        await expect(page.getByPlaceholder('Write a price')).toHaveValue('456');
        await expect(page.getByPlaceholder('Write a quantity')).toHaveValue('222');
        await expect(page.getByTestId('shipping-select').getByText('Yes')).toBeVisible();

        // delete product
        page.once("dialog", async (dialog) => {
            console.log(`Dialog message: ${dialog.message()}`);
            await dialog.accept("yes");
        });
        await page.getByTestId('delete-product-btn').click();

        // verify product is deleted
        await page.goto('http://localhost:3000/dashboard/admin/products');
        await expect(page.getByText('ui_another_test_product_name')).not.toBeVisible();
    });

    // Create

    test('create product with category missing', async ({ page }) => {
        // create product
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // assert error message
        await expect(page.getByText('Category is Required')).toBeVisible();
    });

    test('create product with name missing', async ({ page }) => {
        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // assert error message
        await expect(page.getByText('Name is Required')).toBeVisible();
    });

    test('create product with description missing', async ({ page }) => {
        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product_name');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // assert error message
        await expect(page.getByText('Description is Required')).toBeVisible();
    });

    test('create product with price missing', async ({ page }) => {
        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // assert error message
        await expect(page.getByText('Price is Required')).toBeVisible();
    });

    test('create product with quantity missing', async ({ page }) => {
        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // assert error message
        await expect(page.getByText('Quantity is Required')).toBeVisible();
    });

    test('create product with invalid price', async ({ page }) => {
        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('-1');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // assert error message
        await expect(page.getByText('Price should be greater than 0')).toBeVisible();
    });

    test('create product with invalid quantity', async ({ page }) => {
        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('-1');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // assert error message
        await expect(page.getByText('Quantity should be greater than 0')).toBeVisible();
    });

    test('create product with invalid photo size', async ({ page }) => {
        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/largeimage.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // assert error message
        await expect(page.getByText('Photo size should be at most 1MB')).toBeVisible();
    });

    test('create same product name', async ({ page }) => {
        // create product
        const collection = mongoose.connection.collection("products");
        await collection.insertOne(sampleProduct);

        // create another product with same name
        await page.getByRole('link', { name: 'Create Product' }).click();
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // assert error message
        await expect(page.getByText('Product with a similar name exists')).toBeVisible();

        // cleanup
        await collection.deleteOne({ name: "ui_test_product_name" });
    });

    test('create same product slug', async ({ page }) => {
        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product _name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // verify product created
        await expect(page.getByText('Product created successfully')).toBeVisible();
        await expect(page.getByText('ui_test_product _name')).toBeVisible();

        // create another product with same name
        await page.getByRole('link', { name: 'Create Product' }).click();
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product-_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // assert error message
        await expect(page.getByText('Product with a similar name exists')).toBeVisible();

        // cleanup
        const collection = mongoose.connection.collection("products");
        await collection.deleteOne({ name: "ui_test_product _name" });
    });

    test('create product without photo', async ({ page }) => {
        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // verify product created
        await expect(page.getByText('Product created successfully')).toBeVisible();
        await expect(page.getByText('ui_test_product_name')).toBeVisible();

        // cleanup
        const collection = mongoose.connection.collection("products");
        await collection.deleteOne({ name: "ui_test_product_name" });
    });

    test('create product without shipping', async ({ page }) => {
        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('create-product-btn').click();

        // verify product created
        await expect(page.getByText('Product created successfully')).toBeVisible();
        await expect(page.getByText('ui_test_product_name')).toBeVisible();

        // cleanup
        const collection = mongoose.connection.collection("products");
        await collection.deleteOne({ name: "ui_test_product_name" });
    });

    // Update

    test('update product with name missing', async ({ page }) => {
        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // verify product is created and correct details
        await expect(page.getByText('Product created successfully')).toBeVisible();
        await expect(page.getByText('ui_test_product_name')).toBeVisible();
        await page.getByRole("link", { name: "ui_test_product_name" }).click();
        await expect(page.getByTestId('category-select').getByText('ui_category_test')).toBeVisible();
        await expect(page.getByRole('img', { name: 'product_photo' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Write a name' })).toHaveValue('ui_test_product_name');
        await expect(page.getByRole('textbox', { name: 'Write a description' })).toHaveValue('ui_test_product_description');
        await expect(page.getByPlaceholder('Write a price')).toHaveValue('123');
        await expect(page.getByPlaceholder('Write a quantity')).toHaveValue('111');
        await expect(page.getByTestId('shipping-select').getByText('No')).toBeVisible();

        // update product
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('');
        await page.getByTestId('update-product-btn').click();

        // verify product is updated
        await expect(page.getByText('Name is Required')).toBeVisible();

        // cleanup
        const collection = mongoose.connection.collection("products");
        await collection.deleteOne({ name: "ui_test_product_name" });
    });

    test('update product with description missing', async ({ page }) => {
        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // verify product is created and correct details
        await expect(page.getByText('Product created successfully')).toBeVisible();
        await expect(page.getByText('ui_test_product_name')).toBeVisible();
        await page.getByRole("link", { name: "ui_test_product_name" }).click();
        await expect(page.getByTestId('category-select').getByText('ui_category_test')).toBeVisible();
        await expect(page.getByRole('img', { name: 'product_photo' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Write a name' })).toHaveValue('ui_test_product_name');
        await expect(page.getByRole('textbox', { name: 'Write a description' })).toHaveValue('ui_test_product_description');
        await expect(page.getByPlaceholder('Write a price')).toHaveValue('123');
        await expect(page.getByPlaceholder('Write a quantity')).toHaveValue('111');
        await expect(page.getByTestId('shipping-select').getByText('No')).toBeVisible();

        // update product
        // await page.getByTestId('category-select').locator('div').click();
        // await page.getByTitle('ui_another_category_test').locator('div').click();
        // await page.getByText('Upload Photo').click();
        // await page.getByText('Upload Photo').setInputFiles('./tests/ui/grass.png');
        // await page.getByRole('textbox', { name: 'Write a name' }).click();
        // await page.getByRole('textbox', { name: 'Write a name' }).fill('');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('');
        // await page.getByPlaceholder('Write a price').click();
        // await page.getByPlaceholder('Write a price').fill('456');
        // await page.getByPlaceholder('Write a quantity').click();
        // await page.getByPlaceholder('Write a quantity').fill('222');
        // await page.getByTestId('shipping-select').locator('div').click();
        // await page.getByTitle('Yes', { exact: true }).click();
        await page.getByTestId('update-product-btn').click();

        // verify product is updated
        await expect(page.getByText('Description is Required')).toBeVisible();

        // cleanup
        const collection = mongoose.connection.collection("products");
        await collection.deleteOne({ name: "ui_test_product_name" });
    });

    test('update product with price missing', async ({ page }) => {
        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // verify product is created and correct details
        await expect(page.getByText('Product created successfully')).toBeVisible();
        await expect(page.getByText('ui_test_product_name')).toBeVisible();
        await page.getByRole("link", { name: "ui_test_product_name" }).click();
        await expect(page.getByTestId('category-select').getByText('ui_category_test')).toBeVisible();
        await expect(page.getByRole('img', { name: 'product_photo' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Write a name' })).toHaveValue('ui_test_product_name');
        await expect(page.getByRole('textbox', { name: 'Write a description' })).toHaveValue('ui_test_product_description');
        await expect(page.getByPlaceholder('Write a price')).toHaveValue('123');
        await expect(page.getByPlaceholder('Write a quantity')).toHaveValue('111');
        await expect(page.getByTestId('shipping-select').getByText('No')).toBeVisible();

        // update product
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('');
        await page.getByTestId('update-product-btn').click();

        // verify product is updated
        await expect(page.getByText('Price is Required')).toBeVisible();

        // cleanup
        const collection = mongoose.connection.collection("products");
        await collection.deleteOne({ name: "ui_test_product_name" });
    });

    test('update product with quantity missing', async ({ page }) => {
        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // verify product is created and correct details
        await expect(page.getByText('Product created successfully')).toBeVisible();
        await expect(page.getByText('ui_test_product_name')).toBeVisible();
        await page.getByRole("link", { name: "ui_test_product_name" }).click();
        await expect(page.getByTestId('category-select').getByText('ui_category_test')).toBeVisible();
        await expect(page.getByRole('img', { name: 'product_photo' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Write a name' })).toHaveValue('ui_test_product_name');
        await expect(page.getByRole('textbox', { name: 'Write a description' })).toHaveValue('ui_test_product_description');
        await expect(page.getByPlaceholder('Write a price')).toHaveValue('123');
        await expect(page.getByPlaceholder('Write a quantity')).toHaveValue('111');
        await expect(page.getByTestId('shipping-select').getByText('No')).toBeVisible();

        // update product
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('');
        await page.getByTestId('update-product-btn').click();

        // verify product is updated
        await expect(page.getByText('Quantity is Required')).toBeVisible();

        // cleanup
        const collection = mongoose.connection.collection("products");
        await collection.deleteOne({ name: "ui_test_product_name" });
    });

    test('update product with invalid price', async ({ page }) => {
        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // verify product is created and correct details
        await expect(page.getByText('Product created successfully')).toBeVisible();
        await expect(page.getByText('ui_test_product_name')).toBeVisible();
        await page.getByRole("link", { name: "ui_test_product_name" }).click();
        await expect(page.getByTestId('category-select').getByText('ui_category_test')).toBeVisible();
        await expect(page.getByRole('img', { name: 'product_photo' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Write a name' })).toHaveValue('ui_test_product_name');
        await expect(page.getByRole('textbox', { name: 'Write a description' })).toHaveValue('ui_test_product_description');
        await expect(page.getByPlaceholder('Write a price')).toHaveValue('123');
        await expect(page.getByPlaceholder('Write a quantity')).toHaveValue('111');
        await expect(page.getByTestId('shipping-select').getByText('No')).toBeVisible();

        // update product
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('-1');
        await page.getByTestId('update-product-btn').click();

        // verify product is updated
        await expect(page.getByText('Price should be greater than 0')).toBeVisible();

        // cleanup
        const collection = mongoose.connection.collection("products");
        await collection.deleteOne({ name: "ui_test_product_name" });
    });

    test('update product with invalid quantity', async ({ page }) => {
        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // verify product is created and correct details
        await expect(page.getByText('Product created successfully')).toBeVisible();
        await expect(page.getByText('ui_test_product_name')).toBeVisible();
        await page.getByRole("link", { name: "ui_test_product_name" }).click();
        await expect(page.getByTestId('category-select').getByText('ui_category_test')).toBeVisible();
        await expect(page.getByRole('img', { name: 'product_photo' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Write a name' })).toHaveValue('ui_test_product_name');
        await expect(page.getByRole('textbox', { name: 'Write a description' })).toHaveValue('ui_test_product_description');
        await expect(page.getByPlaceholder('Write a price')).toHaveValue('123');
        await expect(page.getByPlaceholder('Write a quantity')).toHaveValue('111');
        await expect(page.getByTestId('shipping-select').getByText('No')).toBeVisible();

        // update product
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('-1');
        await page.getByTestId('update-product-btn').click();

        // verify product is updated
        await expect(page.getByText('Quantity should be greater than 0')).toBeVisible();

        // cleanup
        const collection = mongoose.connection.collection("products");
        await collection.deleteOne({ name: "ui_test_product_name" });
    });

    test('update product with invalid photo size', async ({ page }) => {
        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // verify product is created and correct details
        await expect(page.getByText('Product created successfully')).toBeVisible();
        await expect(page.getByText('ui_test_product_name')).toBeVisible();
        await page.getByRole("link", { name: "ui_test_product_name" }).click();
        await expect(page.getByTestId('category-select').getByText('ui_category_test')).toBeVisible();
        await expect(page.getByRole('img', { name: 'product_photo' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Write a name' })).toHaveValue('ui_test_product_name');
        await expect(page.getByRole('textbox', { name: 'Write a description' })).toHaveValue('ui_test_product_description');
        await expect(page.getByPlaceholder('Write a price')).toHaveValue('123');
        await expect(page.getByPlaceholder('Write a quantity')).toHaveValue('111');
        await expect(page.getByTestId('shipping-select').getByText('No')).toBeVisible();

        // update product
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/largeimage.jpg');
        await page.getByTestId('update-product-btn').click();

        // verify product is updated
        await expect(page.getByText('Photo size should be at most 1MB')).toBeVisible();

        // cleanup
        const collection = mongoose.connection.collection("products");
        await collection.deleteOne({ name: "ui_test_product_name" });
    });

    test('update product to same product name', async ({ page }) => {
        // create product
        const collection = mongoose.connection.collection("products");
        await collection.insertOne(sampleProduct);

        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_another_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // verify product is created and correct details
        await expect(page.getByText('Product created successfully')).toBeVisible();
        await expect(page.getByText('ui_test_another_product_name')).toBeVisible();
        await page.getByRole("link", { name: "ui_test_another_product_name" }).click();
        await expect(page.getByTestId('category-select').getByText('ui_category_test')).toBeVisible();
        await expect(page.getByRole('img', { name: 'product_photo' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Write a name' })).toHaveValue('ui_test_another_product_name');
        await expect(page.getByRole('textbox', { name: 'Write a description' })).toHaveValue('ui_test_product_description');
        await expect(page.getByPlaceholder('Write a price')).toHaveValue('123');
        await expect(page.getByPlaceholder('Write a quantity')).toHaveValue('111');
        await expect(page.getByTestId('shipping-select').getByText('No')).toBeVisible();

        // update product
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product_name');
        await page.getByTestId('update-product-btn').click();

        // verify product is updated
        await expect(page.getByText('Product with a similar name exists')).toBeVisible();

        // cleanup
        await collection.deleteOne({ name: "ui_test_another_product_name" });
        await collection.deleteOne({ name: "ui_test_product_name" });
    });

    test('update product to same product slug', async ({ page }) => {
        // create product
        const collection = mongoose.connection.collection("products");
        await collection.insertOne({
            ...sampleProduct,
            name: "ui_test _product_name",
            slug: "ui_test-_product_name"
        });

        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_another_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // verify product is created and correct details
        await expect(page.getByText('Product created successfully')).toBeVisible();
        await expect(page.getByText('ui_test_another_product_name')).toBeVisible();
        await page.getByRole("link", { name: "ui_test_another_product_name" }).click();
        await expect(page.getByTestId('category-select').getByText('ui_category_test')).toBeVisible();
        await expect(page.getByRole('img', { name: 'product_photo' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Write a name' })).toHaveValue('ui_test_another_product_name');
        await expect(page.getByRole('textbox', { name: 'Write a description' })).toHaveValue('ui_test_product_description');
        await expect(page.getByPlaceholder('Write a price')).toHaveValue('123');
        await expect(page.getByPlaceholder('Write a quantity')).toHaveValue('111');
        await expect(page.getByTestId('shipping-select').getByText('No')).toBeVisible();

        // update product
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test-_product_name');
        await page.getByTestId('update-product-btn').click();

        // verify product is updated
        await expect(page.getByText('Product with a similar name exists')).toBeVisible();

        // cleanup
        await collection.deleteOne({ name: "ui_test _product_name" });
        await collection.deleteOne({ name: "ui_test_another_product_name" });
    });

    // Delete 

    test('delete product but cancelling', async ({ page }) => {
        // create product
        await page.getByTestId('category-select').locator('div').click();
        await page.getByTitle('ui_category_test').locator('div').click();
        await page.getByText('Upload Photo').click();
        await page.getByText('Upload Photo').setInputFiles('./tests/ui/sky.jpg');
        await page.getByRole('textbox', { name: 'Write a name' }).click();
        await page.getByRole('textbox', { name: 'Write a name' }).fill('ui_test_product_name');
        await page.getByRole('textbox', { name: 'Write a description' }).click();
        await page.getByRole('textbox', { name: 'Write a description' }).fill('ui_test_product_description');
        await page.getByPlaceholder('Write a price').click();
        await page.getByPlaceholder('Write a price').fill('123');
        await page.getByPlaceholder('Write a quantity').click();
        await page.getByPlaceholder('Write a quantity').fill('111');
        await page.getByTestId('shipping-select').locator('div').click();
        await page.getByTitle('No', { exact: true }).click();
        await page.getByTestId('create-product-btn').click();

        // verify product is created and correct details
        await expect(page.getByText('Product created successfully')).toBeVisible();
        await expect(page.getByText('ui_test_product_name')).toBeVisible();
        await page.getByRole("link", { name: "ui_test_product_name" }).click();
        await expect(page.getByTestId('category-select').getByText('ui_category_test')).toBeVisible();
        await expect(page.getByRole('img', { name: 'product_photo' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Write a name' })).toHaveValue('ui_test_product_name');
        await expect(page.getByRole('textbox', { name: 'Write a description' })).toHaveValue('ui_test_product_description');
        await expect(page.getByPlaceholder('Write a price')).toHaveValue('123');
        await expect(page.getByPlaceholder('Write a quantity')).toHaveValue('111');
        await expect(page.getByTestId('shipping-select').getByText('No')).toBeVisible();

        // delete product
        page.once("dialog", async (dialog) => {
            console.log(`Dialog message: ${dialog.message()}`);
            await dialog.dismiss();
        });
        await page.getByTestId('delete-product-btn').click();

        // verify product is not deleted
        await page.goto('http://localhost:3000/dashboard/admin/products');
        await expect(page.getByText('ui_test_product_name')).toBeVisible();

        // cleanup
        const collection = mongoose.connection.collection("products");
        await collection.deleteOne({ name: "ui_test_product_name" });
    });



});
