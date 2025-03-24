import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

test.describe('HomePage', () => {
    
    /**
     * Tests:
     * 
     * navigate from home page to contact page and policy page
     * 
     */

    test.describe.configure({ mode: 'serial' });

    
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
    });

    test('view contact page', async ({ page }) => {
        await page.getByRole('link', { name: 'Contact' }).click();
        await expect(page).toHaveTitle('Contact Us');
    });

    test('view policy page', async ({ page }) => {
        await page.getByRole('link', { name: 'Privacy Policy' }).click();
        await expect(page).toHaveTitle('Privacy Policy');
    });

    test('view contact page then policy page', async ({ page }) => {
        await page.getByRole('link', { name: 'Contact' }).click();
        await expect(page).toHaveTitle('Contact Us');
        await page.getByRole('link', { name: 'Privacy Policy' }).click();
        await expect(page).toHaveTitle('Privacy Policy');
    });
});

