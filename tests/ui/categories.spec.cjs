import { test, expect } from '@playwright/test';

test.describe('Category', () => {

    /**
     * Tests:
     * 
     * - valid:
     * create, edit, delete category
     * 
     * - invalid:
     * create empty category
     * create duplicate category
     * create duplicate category with same name but different case
     * 
     * edit to a empty category
     * edit to a duplicate category
     * edit to a category with different case (duplicate)
     * 
     */

    test.describe.configure({ mode: 'serial' });

    test.beforeEach(async ({ page }) => {
        // Login as admin and go to manage category page
        await page.goto('http://localhost:3000/login');
        await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@test.sg');
        await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('admin@test.sg');
        await page.getByRole('button', { name: 'LOGIN' }).click();
        await page.goto('http://localhost:3000/dashboard/admin/create-category');
    });

    test('create, update and delete valid category', async ({ page }) => {
        // Create a new category
        await page.getByRole('textbox', { name: 'Enter new category' }).click();
        await page.getByRole('textbox', { name: 'Enter new category' }).fill('ui_new_category_test');
        await page.getByRole('button', { name: 'Submit' }).click();

        // Assert that the category is created
        await expect(page.getByText('ui_new_category_test is created')).toBeVisible();
        await expect(page.locator('tbody')).toContainText('ui_new_category_test');

        // Edit the category
        await page.locator(`tr:has-text("ui_new_category_test")`).locator('button:has-text("Edit")').click();
        await page.getByTestId('update-modal').getByRole('textbox', { name: 'Enter new category' }).click();
        await page.getByTestId('update-modal').getByRole('textbox', { name: 'Enter new category' }).fill('edited_ui_new_category_test');
        await page.getByTestId('update-modal').getByRole('button', { name: 'Submit' }).click();
        await page.getByRole('button', { name: 'Close' }).click();

        // Assert that the category is updated
        await expect(page.getByText('edited_ui_new_category_test is updated')).toBeVisible();
        await expect(page.locator('tbody')).toContainText('edited_ui_new_category_test');

        // Delete the category
        await page.locator(`tr:has-text("edited_ui_new_category_test")`).locator('button:has-text("Delete")').click();

        // Assert that the category is deleted
        await expect(page.getByText('Category is deleted')).toBeVisible();
        await expect(page.locator('tbody')).not.toContainText('edited_ui_new_category_test');
    });

    test('create empty category not allowed', async ({ page }) => {
        await page.getByRole('button', { name: 'Submit' }).click();
        await expect(page.getByText('Name is required')).toBeVisible();
    });

    test('create duplicate category not allowed', async ({ page }) => {
        await page.getByRole('textbox', { name: 'Enter new category' }).click();
        await page.getByRole('textbox', { name: 'Enter new category' }).fill('ui_new_category_test');
        await page.getByRole('button', { name: 'Submit' }).click();

        await page.getByRole('textbox', { name: 'Enter new category' }).click();
        await page.getByRole('textbox', { name: 'Enter new category' }).fill('ui_new_category_test');
        await page.getByRole('button', { name: 'Submit' }).click();

        await expect(page.getByText('A similar category already exists')).toBeVisible();

        // Cleanup
        await page.locator(`tr:has-text("ui_new_category_test")`).locator('button:has-text("Delete")').click();
    });

    test('create duplicate category with same name but different case not allowed', async ({ page }) => {
        await page.getByRole('textbox', { name: 'Enter new category' }).click();
        await page.getByRole('textbox', { name: 'Enter new category' }).fill('ui_new_category_test');
        await page.getByRole('button', { name: 'Submit' }).click();

        await page.getByRole('textbox', { name: 'Enter new category' }).click();
        await page.getByRole('textbox', { name: 'Enter new category' }).fill('UI_new_CATEGORY_test');
        await page.getByRole('button', { name: 'Submit' }).click();

        await expect(page.getByText('A similar category already exists')).toBeVisible();

        // Cleanup
        await page.locator(`tr:has-text("ui_new_category_test")`).locator('button:has-text("Delete")').click();
    });

    test('edit to a empty category not allowed', async ({ page }) => {
        await page.getByRole('textbox', { name: 'Enter new category' }).click();
        await page.getByRole('textbox', { name: 'Enter new category' }).fill('ui_new_category_test');
        await page.getByRole('button', { name: 'Submit' }).click();

        await page.locator(`tr:has-text("ui_new_category_test")`).locator('button:has-text("Edit")').click();
        await page.getByTestId('update-modal').getByRole('textbox', { name: 'Enter new category' }).click();
        await page.getByTestId('update-modal').getByRole('textbox', { name: 'Enter new category' }).fill('');
        await page.getByTestId('update-modal').getByRole('button', { name: 'Submit' }).click();
        await page.getByRole('button', { name: 'Close' }).click();

        await expect(page.getByText('Name is required')).toBeVisible();

        // Cleanup
        await page.locator(`tr:has-text("ui_new_category_test")`).locator('button:has-text("Delete")').click();
    });

    test('edit to a duplicate category not allowed', async ({ page }) => {
        await page.getByRole('textbox', { name: 'Enter new category' }).click();
        await page.getByRole('textbox', { name: 'Enter new category' }).fill('ui_new_category_test1');
        await page.getByRole('button', { name: 'Submit' }).click();

        await page.getByRole('textbox', { name: 'Enter new category' }).click();
        await page.getByRole('textbox', { name: 'Enter new category' }).fill('ui_new_category_test2');
        await page.getByRole('button', { name: 'Submit' }).click();

        await page.locator(`tr:has-text("ui_new_category_test2")`).locator('button:has-text("Edit")').click();
        await page.getByTestId('update-modal').getByRole('textbox', { name: 'Enter new category' }).click();
        await page.getByTestId('update-modal').getByRole('textbox', { name: 'Enter new category' }).fill('ui_new_category_test1');
        await page.getByTestId('update-modal').getByRole('button', { name: 'Submit' }).click();
        await page.getByRole('button', { name: 'Close' }).click();

        await expect(page.getByText('A similar category already exists')).toBeVisible();

        // Cleanup
        await page.locator(`tr:has-text("ui_new_category_test1")`).locator('button:has-text("Delete")').click();
        await page.locator(`tr:has-text("ui_new_category_test2")`).locator('button:has-text("Delete")').click();
    });

});