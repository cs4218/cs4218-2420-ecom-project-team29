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

    test('check if user can apply filters and get the correct results', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();
        // Expected original product list when no filters are applied
        await expect(page.getByRole('heading', { name: '-inch MacBook Air - Sky Blue' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Wisepad 3 Reader' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Truffle Yakiniku Donburi' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Garlic Butter Chicken Donburi' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Delightful Nyonya Treats' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Let’s Meat and Cheese Party' })).toBeVisible();
        // Apply Book Category filter
        await page.getByRole('checkbox', { name: 'Book' }).check();
        // Expected filtered product list for books
        await expect(page.getByRole('heading', { name: '-inch MacBook Air - Sky Blue' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Wisepad 3 Reader' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Truffle Yakiniku Donburi' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Garlic Butter Chicken Donburi' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Let’s Meat and Cheese Party' })).toBeHidden();

        await expect(page.getByRole('heading', { name: 'Save me an orange' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'You Become What You Think' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'The Journey to the West' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Delightful Nyonya Treats' })).toBeVisible();

        // Apply Price Range ($0 - 19.99) filter
        await page.getByText('$0 to').click();
        // Expected filtered product list for price range ($0 - 19.99) and books
        await expect(page.getByRole('heading', { name: 'You Become What You Think' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'The Journey to the West' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Save me an orange' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Delightful Nyonya Treats' })).toBeVisible();

        //Apply Drink Category filter
        await page.getByRole('checkbox', { name: 'Drink' }).check();
        // Expected filtered product list for drinks and books under $0 - 19.99
        await expect(page.getByRole('heading', { name: 'Save me an orange' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Delightful Nyonya Treats' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Yellow Bird Drink' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Shirley Temple Drink' })).toBeVisible();

        // Apply Price Range ($40 - 59.99) filter 
        await page.getByRole('radio', { name: '$40 to' }).check();
        // Expected filtered product list for drinks and books under $40 - 59.99
        await expect(page.getByRole('heading', { name: 'Save me an orange' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Delightful Nyonya Treats' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Yellow Bird Drink' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Shirley Temple Drink' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'The Journey to the West' })).toBeVisible();

        // Apply Food Category filter and Price Range ($100 or more) filter
        await page.getByRole('checkbox', { name: 'Food' }).check();
        await page.getByRole('radio', { name: '$100 or more' }).check();
        // Expected filtered product list for food, drinks and books under $100 or more
        await expect(page.getByRole('heading', { name: 'The Journey to the West' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Let’s Meat and Cheese Party' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Pahit Pink Gin' })).toBeVisible();

        // Remove Drink Category filter
        await page.getByRole('checkbox', { name: 'Drink' }).uncheck();
        // Expected filtered product list only left with this
        await expect(page.getByRole('heading', { name: 'Let’s Meat and Cheese Party' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Pahit Pink Gin' })).toBeHidden();
    });

    test('test for reset button', async ({ page }) => {
        // Apply filters
        await page.getByRole('checkbox', { name: 'Book' }).check();
        await page.getByRole('checkbox', { name: 'Food' }).check();
        await page.getByRole('radio', { name: '$40 to' }).check();
        // Expected filtered product list for books and food under $40 - 59.99
        await expect(page.getByRole('heading', { name: 'The Journey to the West' })).toBeVisible();

        await expect(page.getByRole('heading', { name: '-inch MacBook Air - Sky Blue' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Wisepad 3 Reader' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Truffle Yakiniku Donburi' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Garlic Butter Chicken Donburi' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Delightful Nyonya Treats' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Let’s Meat and Cheese Party' })).toBeHidden();

        // Reset filters should show all products
        await page.getByRole('button', { name: 'RESET FILTERS' }).click();
        await expect(page.getByRole('heading', { name: 'The Journey to the West' })).toBeHidden();

        await expect(page.getByRole('heading', { name: '-inch MacBook Air - Sky Blue' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Wisepad 3 Reader' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Truffle Yakiniku Donburi' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Garlic Butter Chicken Donburi' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Delightful Nyonya Treats' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Let’s Meat and Cheese Party' })).toBeVisible();
    });

    test('test for loadmore button', async ({ page }) => {
        // Expected original product list in Home Page
        await expect(page.getByRole('heading', { name: '-inch MacBook Air - Sky Blue' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Wisepad 3 Reader' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Truffle Yakiniku Donburi' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Garlic Butter Chicken Donburi' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Delightful Nyonya Treats' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Let’s Meat and Cheese Party' })).toBeVisible();

        await expect(page.getByRole('heading', { name: 'Superstar Roll (8 pcs)' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Sapporo Premium Can Beer' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Jack Daniels Old No. 7 Black' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Kubota Senjyu Ginjyo Sake' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Pahit Pink Gin' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Shirley Temple Drink' })).toBeHidden();
        await expect(page.getByRole('button', { name: 'Loadmore' })).toBeVisible();

        // Click Loadmore button for 6 or less products
        await page.getByRole('button', { name: 'Loadmore' }).click();
        await expect(page.getByRole('heading', { name: '-inch MacBook Air - Sky Blue' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Wisepad 3 Reader' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Truffle Yakiniku Donburi' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Garlic Butter Chicken Donburi' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Delightful Nyonya Treats' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Let’s Meat and Cheese Party' })).toBeVisible();

        await expect(page.getByRole('heading', { name: 'Superstar Roll (8 pcs)' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Sapporo Premium Can Beer' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Jack Daniels Old No. 7 Black' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Kubota Senjyu Ginjyo Sake' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Pahit Pink Gin' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Shirley Temple Drink' })).toBeVisible();

        await expect(page.getByRole('heading', { name: 'Yellow Bird Drink' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'The Journey to the West' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'You Become What You Think' })).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Save me an orange' })).toBeHidden();
        await expect(page.getByRole('button', { name: 'Loadmore' })).toBeVisible();

        await page.getByRole('button', { name: 'Loadmore' }).click();
        await expect(page.getByRole('heading', { name: '-inch MacBook Air - Sky Blue' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Wisepad 3 Reader' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Truffle Yakiniku Donburi' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Garlic Butter Chicken Donburi' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Delightful Nyonya Treats' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Let’s Meat and Cheese Party' })).toBeVisible();

        await expect(page.getByRole('heading', { name: 'Superstar Roll (8 pcs)' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Sapporo Premium Can Beer' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Jack Daniels Old No. 7 Black' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Kubota Senjyu Ginjyo Sake' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Pahit Pink Gin' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Shirley Temple Drink' })).toBeVisible();

        await expect(page.getByRole('heading', { name: 'Yellow Bird Drink' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'The Journey to the West' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'You Become What You Think' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Save me an orange' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Loadmore' })).toBeHidden();
    });
});