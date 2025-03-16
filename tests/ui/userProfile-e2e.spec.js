import { test, expect } from '@playwright/test';
import userModel from '../../models/userModel';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://127.0.0.1:3000';
const user = {
    email: 'test@test.com',
    password: 'password',
    name: 'Test User',
    phone: '1234567890',
    address: '123 Main St, Anytown, USA',
    role: 0,
    answer: 'test',
    dob: '1990-01-01'
};

async function fillLoginForm(page, email, password) {
    await page.getByPlaceholder('Enter your email').fill(email);
    await page.getByPlaceholder('Enter your password').fill(password);
    await page.getByRole('button', { name: 'LOGIN' }).click();
}

function getUniqueEmail(testInfo) {
    return `test_${testInfo.title.replace(/[\s,]+/g, '_')}@test.com`;
}


test.beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL);
});

test.afterAll(async () => {
    await mongoose.connection.close();
});

test.describe('User Profile', () => {
    test.beforeEach(async ({ page }, testInfo) => {
        await userModel.create({ ...user, email: getUniqueEmail(testInfo), password: bcrypt.hashSync(user.password, 10) });
        await page.goto(`${BASE_URL}/login`);
        await fillLoginForm(page, getUniqueEmail(testInfo), user.password);
        await expect(page).toHaveURL(`${BASE_URL}/`);
        await page.goto(`${BASE_URL}/dashboard/user/profile`);
    });

    test.afterEach(async ({}, testInfo) => {
        await userModel.deleteOne({ email: getUniqueEmail(testInfo) });
    });

    test('should display user profile', async ({ page }, testInfo) => {
        await expect(page.getByPlaceholder('Enter your name')).toHaveValue(user.name);
        await expect(page.getByPlaceholder('Enter your email')).toHaveValue(getUniqueEmail(testInfo));
        await expect(page.getByPlaceholder('Enter your email')).toBeDisabled();
        await expect(page.getByPlaceholder('Enter your phone')).toHaveValue(user.phone);
        await expect(page.getByPlaceholder('Enter your address')).toHaveValue(user.address);
        await expect(page.getByPlaceholder('Enter your new password')).toBeVisible();
        await expect(page.getByPlaceholder('Enter your new password')).toBeEmpty();
        await expect(page.getByRole('button', { name: 'UPDATE' })).toBeVisible();
    });

    const validUpdateCases = [
        { scenario: 'name', value: 'New Name' },
        { scenario: 'phone', value: '123456' },
        { scenario: 'address', value: 'New Address' },
        { scenario: 'new password', value: 'newPassword' }
    ];

    for (const testCase of validUpdateCases) {
        test(`should update ${testCase.scenario}`, async ({ page }, testInfo) => {
            await page.getByPlaceholder("Enter your " + testCase.scenario).fill(testCase.value);
            await page.getByRole('button', { name: 'UPDATE' }).click();
            await expect(page.getByText("Profile updated successfully")).toBeVisible();
            const updatedUser = (await userModel.findOne({ email: getUniqueEmail(testInfo) })).toObject();

            if (testCase.scenario === 'new password') expect(bcrypt.compareSync(testCase.value, updatedUser.password)).toBe(true);
            else expect(updatedUser[testCase.scenario]).toBe(testCase.value);
        });
    }

    const invalidUpdateCases = [
        { scenario: 'name', value: '', message: "Name cannot be empty" },
        { scenario: 'phone', value: 'invalid-phone', message: "Phone number should contain only numbers" },
        { scenario: 'address', value: '', message: "Address cannot be empty" },
    ];

    for (const testCase of invalidUpdateCases) {
        test(`should not update ${testCase.scenario}`, async ({ page }) => {
            await page.getByPlaceholder("Enter your " + testCase.scenario).fill(testCase.value);
            await page.getByRole('button', { name: 'UPDATE' }).click();
            await expect(page.getByText(testCase.message)).toBeVisible();
        });
    }
    
    test('should not update password if new password is not provided', async ({ page }, testInfo) => {
        await page.getByRole('button', { name: 'UPDATE' }).click();
        await expect(page.getByText("Profile Updated Successfully")).toBeVisible();
        const updatedUser = (await userModel.findOne({ email: getUniqueEmail(testInfo) })).toObject();
        expect(bcrypt.compareSync(user.password, updatedUser.password)).toBe(true);
    });
});