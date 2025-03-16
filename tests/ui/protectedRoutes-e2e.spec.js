import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import userModel from '../../models/userModel';
import bcrypt from 'bcrypt';

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
const generateUniqueEmail = (testInfo, isAdmin = false) => {
    return `test_${testInfo.title.replace(/[\s,]+/g, '_')}${isAdmin ? '_admin' : ''}@test.com`;
};
const loginToAccount = async (page, testInfo, isAdmin = false) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('Enter your email').fill(generateUniqueEmail(testInfo, isAdmin));
    await page.getByPlaceholder('Enter your password').fill(user.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();
}

test.beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL);
})

test.afterAll(async () => {
    await mongoose.connection.close();
})

test.describe('Protected Routes', () => {
    test.beforeEach(async ({ page }, testInfo) => {
        // create a new user
        await userModel.create({ ...user, email: generateUniqueEmail(testInfo), password: bcrypt.hashSync(user.password, 10) });
        // create a new admin user
        await userModel.create({ ...user, email: generateUniqueEmail(testInfo, true), password: bcrypt.hashSync(user.password, 10), role: 1 });
    })

    test.afterEach(async ({}, testInfo) => {
        await userModel.deleteOne({ email: generateUniqueEmail(testInfo) });
        await userModel.deleteOne({ email: generateUniqueEmail(testInfo, true), role: 1 });
    })

    test.describe('When logged out', () => {
        test('when going to /dashboard/user, it redirects to /login, and then back to /dashboard/user', async ({ page }, testInfo) => {
            await page.goto(`${BASE_URL}/dashboard/user`);
            await expect(page).toHaveURL(`${BASE_URL}/login`);
            await loginToAccount(page, testInfo);
            await expect(page).toHaveURL(`${BASE_URL}/dashboard/user`);
        });
    });

    test.describe('When logged in as a user', () => {
        test('when going to /dashboard/admin, it redirects to /login, and then back to /dashboard/admin', async ({ page }, testInfo) => {
            await page.goto(`${BASE_URL}/dashboard/admin`);
            await expect(page).toHaveURL(`${BASE_URL}/login`);
            await loginToAccount(page, testInfo, true);
            await expect(page).toHaveURL(`${BASE_URL}/dashboard/admin`);
        });
    });

    test.describe('When logged in as an admin', () => {
        test('when going to /dashboard/user, it redirects to /dashboard/user', async ({ page }, testInfo) => {
            await page.goto(`${BASE_URL}/dashboard/user`);
            await expect(page).toHaveURL(`${BASE_URL}/login`);
            await loginToAccount(page, testInfo, true);
            await expect(page).toHaveURL(`${BASE_URL}/dashboard/user`);
        });
    });

});