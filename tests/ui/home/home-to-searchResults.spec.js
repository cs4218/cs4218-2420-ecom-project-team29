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
    test('check if user can search for products and displayed the correct results', async ({ page }) => {
        await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible();
        
        // When the search input is empty, clicking the search button should not return any search results
        await expect(page.getByRole('searchbox', { name: 'Search' })).toBeEmpty();
        await page.getByRole('button', { name: 'Search' }).click();
        await expect(page.getByRole('heading', { name: 'Search Results' })).toBeHidden();
        // When the search input is not empty, clicking the search button should return search results
        await page.getByRole('searchbox', { name: 'Search' }).fill('macbook');
        await page.getByRole('button', { name: 'Search' }).click();
        await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();
        await expect(page.locator('h6')).toContainText('Found 1');
        await expect(page.getByRole('heading', { name: '-inch MacBook Air - Sky Blue' })).toBeVisible();
    });
    test('check if user can navigate to product details page for products in search results', async ({ page }) => {
        // When the search input is not empty, clicking the search button should return search results
        await page.getByRole('searchbox', { name: 'Search' }).fill('macbook');
        await page.getByRole('button', { name: 'Search' }).click();
        await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();
        await expect(page.locator('h6')).toContainText('Found 1');
        await expect(page.getByRole('heading', { name: '-inch MacBook Air - Sky Blue' })).toBeVisible();
        // Clicking the 'MORE DETAILS' button should navigate to the product details page
        await page.getByRole('button', { name: 'MORE DETAILS' }).click();
        await expect(page.getByRole('heading', { name: 'Search Results' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Name: 13-inch MacBook Air -' })).toBeVisible();
    });
});
