import { test, expect } from '@playwright/test';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import productModel from '../../../models/productModel';

dotenv.config();

test.describe('HomePage', () => {
    
    /**
     * Tests:
     * 
     * check home page navigate to product details page
     * 
     */

    test.describe.configure({ mode: 'serial' });

    // test.beforeAll(async ( page ) => {
    //     // await mongoose.connect(process.env.MONGO_URL_TEST, { useNewUrlParser: true, useUnifiedTopology: true });
    // });

    // test.afterAll(async () => {
    //     await mongoose.disconnect();
    // });

    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await expect(page).toHaveTitle('All Products - Best offers');

    });

    test('', async ({ page }) => {
        await page.goto('http://localhost:3000/');
  
        await expect(page).toHaveTitle('All Products - Best offers');

    });
   
});

