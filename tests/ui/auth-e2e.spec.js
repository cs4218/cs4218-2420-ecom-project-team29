import { test, expect } from '@playwright/test';
import userModel from '../../models/userModel';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
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

async function createTestUser(email, password) {
    return await userModel.create({
        ...user,
        email,
        password: await bcrypt.hash(password, 10)
    });
}

async function fillLoginForm(page, email, password) {
    await page.getByPlaceholder('Enter your email').fill(email);
    await page.getByPlaceholder('Enter your password').fill(password);
    await page.getByRole('button', { name: 'LOGIN' }).click();
}

async function fillForgotPasswordForm(page, email, newPassword, answer) {
    await page.getByPlaceholder('Enter your email').fill(email);
    await page.getByPlaceholder('Enter your new password').fill(newPassword);
    await page.getByPlaceholder('Enter your answer').fill(answer);
    await page.getByRole('button', { name: 'FORGOT PASSWORD' }).click();
}

async function fillRegistrationForm(page, userData) {
    await page.getByPlaceholder('Enter your name').fill(userData.name);
    await page.getByPlaceholder('Enter your email').fill(userData.email);
    await page.getByPlaceholder('Enter your password').fill(userData.password);
    await page.getByPlaceholder('Enter your phone').fill(userData.phone);
    await page.getByPlaceholder('Enter your address').fill(userData.address);
    await page.getByPlaceholder('Enter your DOB').fill(userData.dob);
    await page.getByPlaceholder('What is your favorite sports').fill(userData.answer);
    await page.getByRole('button', { name: 'REGISTER' }).click();
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

test.describe('Login', () => {
    test.beforeEach(async ({ page }, testInfo) => {
        await page.goto(`${BASE_URL}/login`);
        await createTestUser(getUniqueEmail(testInfo), user.password);
    });
    
    test.afterEach(async ({}, testInfo) => {
        await userModel.deleteOne({ email: getUniqueEmail(testInfo) });
    });

    test('should login successfully', async ({ page }, testInfo) => {
        await fillLoginForm(page, getUniqueEmail(testInfo), user.password);
        await expect(page).toHaveURL(`${BASE_URL}/`);
    });

    const invalidLoginCases = [
        { scenario: 'incorrect password', email: user.email, password: 'incorrect-password' },
        { scenario: 'incorrect email', email: 'incorrect-email', password: user.password },
        { scenario: 'empty fields', email: '', password: '' }
    ];

    for (const testCase of invalidLoginCases) {
        test(`should not login with ${testCase.scenario}`, async ({ page }) => {
            await fillLoginForm(page, testCase.email, testCase.password);
            await expect(page).toHaveURL(`${BASE_URL}/login`);
        });
    }
});

test.describe('Forgot Password', () => {
    test.beforeEach(async ({ page }, testInfo) => {
        await page.goto(`${BASE_URL}/forgot-password`);
        await createTestUser(getUniqueEmail(testInfo), user.password);
    });
    
    test.afterEach(async ({}, testInfo) => {
        await userModel.deleteOne({ email: getUniqueEmail(testInfo) });
    });

    test('should correctly reset password', async ({ page }, testInfo) => {
        const newPassword = "newPassword";
        const userEmail = getUniqueEmail(testInfo);

        await fillForgotPasswordForm(page, userEmail, newPassword, user.answer);
        await expect(page).toHaveURL(`${BASE_URL}/login`);
        
        await fillLoginForm(page, userEmail, newPassword);
        await expect(page).toHaveURL(`${BASE_URL}/`);
    });

    const invalidResetCases = [
        { scenario: 'incorrect email', email: 'incorrect-email', password: 'newPassword', answer: user.answer },
        { scenario: 'incorrect answer', email: user.email, password: 'newPassword', answer: 'wrong-answer' },
        { scenario: 'empty fields', email: '', password: '', answer: '' }
    ];

    for (const testCase of invalidResetCases) {
        test(`should not reset password with ${testCase.scenario}`, async ({ page }, testInfo) => {
            const email = testCase.email === user.email ? getUniqueEmail(testInfo) : testCase.email;
            await fillForgotPasswordForm(page, email, testCase.password, testCase.answer);
            await expect(page).toHaveURL(`${BASE_URL}/forgot-password`);
        });
    }
});

test.describe('Register', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE_URL}/register`);
    });

    test('should register successfully', async ({ page }, testInfo) => {
        const newUser = { ...user, email: `new${getUniqueEmail(testInfo)}` };
        await fillRegistrationForm(page, newUser);
        await expect(page).toHaveURL(`${BASE_URL}/login`);

        await fillLoginForm(page, newUser.email, newUser.password);
        await expect(page).toHaveURL(`${BASE_URL}/`);

        await userModel.deleteOne({ email: newUser.email });
    });

    const invalidRegistrationCases = [
        { scenario: 'empty fields', userData: { ...user, name: '', email: '', password: '' } },
        { scenario: 'invalid email', userData: { ...user, email: 'invalid-email' } },
        { scenario: 'invalid phone', userData: { ...user, phone: 'invalid-phone' } }
    ];

    for (const testCase of invalidRegistrationCases) {
        test(`should not register with ${testCase.scenario}`, async ({ page }) => {
            await fillRegistrationForm(page, testCase.userData);
            await expect(page).toHaveURL(`${BASE_URL}/register`);
            expect(await userModel.findOne({ email: testCase.userData.email })).toBeNull();
        });
    }
});
