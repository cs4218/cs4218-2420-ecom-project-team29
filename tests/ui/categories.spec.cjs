import { test, expect } from '@playwright/test';

test.describe('Category', () => {

    test('create', async ({ page }) => {
        await page.goto('http://localhost:3000/');
        await page.getByRole('link', { name: 'Login' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@test.sg');
        await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('admin@test.sg');
        await page.getByRole('button', { name: 'LOGIN' }).click();
        await page.getByRole('button', { name: 'admin@test.sg' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Category' }).click();
        await page.getByRole('textbox', { name: 'Enter new category' }).click();
        await page.getByRole('textbox', { name: 'Enter new category' }).fill('ui_new_category_test');
        await page.getByRole('button', { name: 'Submit' }).click();
        await expect(page.getByText('ui_new_category_test is created')).toBeVisible();

        await expect(page.locator('tbody')).toContainText('ui_new_category_test');
        // await expect(async () => {
        // }).toPass();

    });

    test('update', async ({ page }) => {
        await page.goto('http://localhost:3000/');
        await page.getByRole('link', { name: 'Login' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@test.sg');
        await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('admin@test.sg');
        await page.getByRole('button', { name: 'LOGIN' }).click();
        await page.getByRole('button', { name: 'admin@test.sg' }).click();
        let categoryRow;
        await expect(async () => {
            await page.getByRole('link', { name: 'Dashboard' }).click();
            await page.getByRole('link', { name: 'Create Category' }).click();
            categoryRow = await page.locator(`tr:has-text("ui_new_category_test")`); // Find the row containing the category name
            await expect(page.locator('tbody')).toContainText('ui_new_category_test');
        }).toPass({
            intervals: [1_000, 2_000, 10_000],
            timeout: 60_000
        });

        await categoryRow.locator('button:has-text("Edit")').click(); // Click the Edit button within that row
        await page.getByTestId('update-modal').getByRole('textbox', { name: 'Enter new category' }).click();
        await page.getByTestId('update-modal').getByRole('textbox', { name: 'Enter new category' }).fill('edited_ui_new_category_test');
        await page.getByTestId('update-modal').getByRole('button', { name: 'Submit' }).click();
        await expect(page.getByText('edited_ui_new_category_test is updated')).toBeVisible();
        await expect(page.locator('tbody')).toContainText('edited_ui_new_category_test');
    });

    test('delete', async ({ page }) => {
        await page.goto('http://localhost:3000/');
        await page.getByRole('link', { name: 'Login' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@test.sg');
        await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('admin@test.sg');
        await page.getByRole('button', { name: 'LOGIN' }).click();
        await page.getByRole('button', { name: 'admin@test.sg' }).click();
        let categoryRow1;
        await expect(async () => {
            await page.getByRole('link', { name: 'Dashboard' }).click();
            await page.getByRole('link', { name: 'Create Category' }).click();
            categoryRow1 = await page.locator(`tr:has-text("edited_ui_new_category_test")`); // Find the row containing the category name
            await expect(page.locator('tbody')).toContainText('edited_ui_new_category_test');

        }).toPass({
            intervals: [1_000, 2_000, 10_000],
            timeout: 60_000
        });

        await categoryRow1.locator('button:has-text("Delete")').click(); // Click the Delete button within that row
        await expect(page.getByText('Category is deleted')).toBeVisible();
        await expect(page.locator('tbody')).not.toContainText('edited_ui_new_category_test');

    });

});