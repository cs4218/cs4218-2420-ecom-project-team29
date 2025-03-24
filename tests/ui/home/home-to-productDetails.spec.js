import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

test.describe('HomePage', () => {
    
    /**
     * Tests:
     * 
     * check home page navigate to product details page
     * 
     */

    test.describe.configure({ mode: 'serial' });

    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await expect(page).toHaveTitle('All Products - Best offers');

    });

    test('check if user can go to product details page and add to cart without logging in', async ({ page }) => {
        await page.locator('.card-name-price > button').first().click();
        await page.getByRole('button', { name: 'ADD TO CART' }).click();
        await expect(page.locator('div').filter({ hasText: /^Please log in to add items to the cart$/ }).nth(2)).toBeVisible();
    });

    test('check if user can go to product details page and access the similar products page', async ({ page }) => {
        await page.locator('.card-name-price > button').first().click();
        await expect(page.getByRole('heading', { name: 'Name: 13-inch MacBook Air -' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Similar Products ➡️' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Wisepad 3 Reader' })).toBeVisible();
        await page.getByRole('button', { name: 'More Details' }).click();
        await expect(page.getByRole('heading', { name: 'Name: Wisepad 3 Reader' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Description: Use this card' })).toBeVisible();
    });

    
});

