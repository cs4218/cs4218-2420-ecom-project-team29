import { test, expect } from '@playwright/test';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

test.describe('Orders', () => {

    /**
     * Tests:
     * 
     * - valid:
     * order details correctly displayed in admin orders page
     * update order status, visible in admin orders and user's page
     * 
     */

    const tempOrder = {
        _id: new mongoose.Types.ObjectId('60f1b9e3e1b3e3b3b8b1b1b1'),
        products: [
            {
                _id: new mongoose.Types.ObjectId('60f1b9e3e1b3e3b3b8b1b1b2'),
                name: 'product1_name',
                description: 'product1_description',
                price: 100,
            },
            {
                _id: new mongoose.Types.ObjectId('60f1b9e3e1b3e3b3b8b1b1b3'),
                name: 'product2_name',
                description: 'product2_description',
                price: 200,
            }
        ],
        payment: {
            transaction: {},
            success: true
        },
        buyer: new mongoose.Types.ObjectId('672f05f78e4ca7dabcdabae7'), // user@test.sg
        status: 'Not Processed',
        createdAt: new Date(),
        updatedAt: new Date()
    }

    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URL_TEST, { useNewUrlParser: true, useUnifiedTopology: true });
        // create temp order
        const collection = mongoose.connection.collection("orders");
        await collection.insertOne(tempOrder);
    });

    test.afterAll(async () => {
        const collection = mongoose.connection.collection("orders");
        await collection.deleteOne({ _id: tempOrder._id });
        await mongoose.connection.close();
    });

    test.beforeEach(async ({ page }) => {
        // Login as admin and go to manage category page
        await page.goto('http://localhost:3000/login');
        await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@test.sg');
        await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('admin@test.sg');
        await page.getByRole('button', { name: 'LOGIN' }).click();
        await page.getByRole('button', { name: 'admin@test.sg' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Orders' }).click();
    });

    test('order details correctly displayed in admin orders page', async ({ page }) => {
        await expect(page.getByText('All Orders')).toBeVisible();
        await expect(page.getByTestId(`statusId-${tempOrder._id}`).locator('div')).toContainText('Not Processed'); // default status
        await expect(page.getByTestId(`order-${tempOrder._id}`).locator('tbody')).toContainText('user@test.com');
        await expect(page.getByTestId(`order-${tempOrder._id}`).locator('tbody')).toContainText('Success');
        await expect(page.getByTestId(`order-${tempOrder._id}`).locator('tbody')).toContainText('2');
        await expect(page.getByTestId(`order-${tempOrder._id}`)).toContainText('product1_name');
        await expect(page.getByTestId(`order-${tempOrder._id}`)).toContainText('product1_description');
        await expect(page.getByTestId(`order-${tempOrder._id}`)).toContainText('Price : 100');
        await expect(page.getByTestId(`order-${tempOrder._id}`)).toContainText('product2_name');
        await expect(page.getByTestId(`order-${tempOrder._id}`)).toContainText('product2_description');
        await expect(page.getByTestId(`order-${tempOrder._id}`)).toContainText('Price : 200');
    });

    test('update order status to processing, visible in admin orders and user page', async ({ page }) => {
        // change order status
        await expect(page.getByTestId('statusId-60f1b9e3e1b3e3b3b8b1b1b1')).toBeVisible();
        await page.getByTestId('statusId-60f1b9e3e1b3e3b3b8b1b1b1').locator('div').click();
        await page.getByTitle('Processing').click();

        // check status in admin orders page
        await page.getByRole('link', { name: 'Home' }).click();
        await page.getByRole('button', { name: 'admin@test.sg' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Orders' }).click();
        await expect(page.getByTestId(`statusId-${tempOrder._id}`).locator('div')).toContainText('Processing');
        await expect(page.locator('tbody')).toContainText('Processing');

        // check status in user orders page
        await page.getByRole('button', { name: 'admin@test.sg' }).click();
        await page.getByRole('link', { name: 'Logout' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('user@test.com');
        await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('user@test.com');
        await page.getByRole('button', { name: 'LOGIN' }).click();
        await page.getByRole('button', { name: 'user@test.com' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Orders' }).click();
        await expect(page.getByTestId('order-60f1b9e3e1b3e3b3b8b1b1b1').locator('tbody')).toContainText('Processing');
    });

    test('update order status to shipped, visible in admin orders and user page', async ({ page }) => {
        // change order status
        await expect(page.getByTestId('statusId-60f1b9e3e1b3e3b3b8b1b1b1')).toBeVisible();
        await page.getByTestId('statusId-60f1b9e3e1b3e3b3b8b1b1b1').locator('div').click();
        await page.getByTitle('Shipped').click();

        // check status in admin orders page
        await page.getByRole('link', { name: 'Home' }).click();
        await page.getByRole('button', { name: 'admin@test.sg' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Orders' }).click();
        await expect(page.getByTestId(`statusId-${tempOrder._id}`).locator('div')).toContainText('Shipped');

        // check status in user orders page
        await page.getByRole('button', { name: 'admin@test.sg' }).click();
        await page.getByRole('link', { name: 'Logout' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('user@test.com');
        await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('user@test.com');
        await page.getByRole('button', { name: 'LOGIN' }).click();
        await page.getByRole('button', { name: 'user@test.com' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Orders' }).click();
        await expect(page.getByTestId('order-60f1b9e3e1b3e3b3b8b1b1b1').locator('tbody')).toContainText('Shipped');
    });

    test('update order status to delivered, visible in admin orders and user page', async ({ page }) => {
        // change order status
        await expect(page.getByTestId('statusId-60f1b9e3e1b3e3b3b8b1b1b1')).toBeVisible();
        await page.getByTestId('statusId-60f1b9e3e1b3e3b3b8b1b1b1').locator('div').click();
        await page.getByTitle('Delivered').click();

        // check status in admin orders page
        await page.getByRole('link', { name: 'Home' }).click();
        await page.getByRole('button', { name: 'admin@test.sg' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Orders' }).click();
        await expect(page.getByTestId(`statusId-${tempOrder._id}`).locator('div')).toContainText('Delivered');

        // check status in user orders page
        await page.getByRole('button', { name: 'admin@test.sg' }).click();
        await page.getByRole('link', { name: 'Logout' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('user@test.com');
        await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('user@test.com');
        await page.getByRole('button', { name: 'LOGIN' }).click();
        await page.getByRole('button', { name: 'user@test.com' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Orders' }).click();
        await expect(page.getByTestId('order-60f1b9e3e1b3e3b3b8b1b1b1').locator('tbody')).toContainText('Delivered');
    });

    test('update order status to cancelled, visible in admin orders and user page', async ({ page }) => {
        // change order status
        await expect(page.getByTestId('statusId-60f1b9e3e1b3e3b3b8b1b1b1')).toBeVisible();
        await page.getByTestId('statusId-60f1b9e3e1b3e3b3b8b1b1b1').locator('div').click();
        await page.getByTitle('Cancelled').click();

        // check status in admin orders page
        await page.getByRole('link', { name: 'Home' }).click();
        await page.getByRole('button', { name: 'admin@test.sg' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Orders' }).click();
        await expect(page.getByTestId(`statusId-${tempOrder._id}`).locator('div')).toContainText('Cancelled');

        // check status in user orders page
        await page.getByRole('button', { name: 'admin@test.sg' }).click();
        await page.getByRole('link', { name: 'Logout' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('user@test.com');
        await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('user@test.com');
        await page.getByRole('button', { name: 'LOGIN' }).click();
        await page.getByRole('button', { name: 'user@test.com' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Orders' }).click();
        await expect(page.getByTestId('order-60f1b9e3e1b3e3b3b8b1b1b1').locator('tbody')).toContainText('Cancelled');
    });


});