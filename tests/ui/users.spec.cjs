import { test, expect } from '@playwright/test';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

test.describe('Users', () => {

    /**
     * Tests:
     * 
     * check existing user and admin role
     * check newly created user and user role
     * 
     */

    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URL_TEST, { useNewUrlParser: true, useUnifiedTopology: true });
    });

    test.afterAll(async () => {
        await mongoose.disconnect();
    });

    test('check existing user and admin role', async ({ page }) => {
        // Login as admin and go to manage users page
        await page.goto('http://localhost:3000/login');
        await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@test.sg');
        await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('admin@test.sg');
        await page.getByRole('button', { name: 'LOGIN' }).click();
        await page.goto('http://localhost:3000/dashboard/admin/users');

        await expect(page.getByRole('heading', { name: 'admin@test.sg' })).toBeVisible();
        await expect(page.getByText('Email: admin@test.sg')).toBeVisible();
        await expect(page.getByText('Address: admin@test.sg')).toBeVisible();
        await expect(page.getByText('Phone: admin@test.sg')).toBeVisible();
        await expect(page.locator('div.card:has-text("admin@test.sg")').locator('p:has-text("Role: Admin")')).toHaveText('Role: Admin');
    });

    test('check newly created user and user role', async ({ page }) => {
        // Create new user
        const collection = mongoose.connection.collection("users");
        const newUser = {
            name: 'ui_user_test',
            email: 'ui_user@email.com',
            password: 'ui_user_password',
            phone: '12345678',
            address: 'ui_user_address',
            answer: 'soccer',
            role: 0
        };
        await collection.insertOne(newUser);

        // Login as admin and go to manage users page
        await page.goto('http://localhost:3000/login');
        await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@test.sg');
        await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('admin@test.sg');
        await page.getByRole('button', { name: 'LOGIN' }).click();
        await page.goto('http://localhost:3000/dashboard/admin/users');

        await expect(page.getByRole('heading', { name: 'ui_user_test' })).toBeVisible();
        await expect(page.getByText('Email: ui_user@email.com')).toBeVisible();
        await expect(page.getByText('Address: ui_user_address')).toBeVisible();
        await expect(page.locator('div.card:has-text("ui_user_test")').locator('p:has-text("Phone: 12345678")')).toHaveText('Phone: 12345678');
        await expect(page.locator('div.card:has-text("ui_user_test")').locator('p:has-text("Role: User")')).toHaveText('Role: User');
    
        // Clean up
        await collection.deleteOne({ email: newUser.email });
    });

});