const { test, expect } = require('@playwright/test');

// Test file to show that playwright can find test files in the tests/ui directory

test('Navigate to Homepage', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('http://localhost:3000/');
    
    // Verify that the homepage is loaded successfully
    const pageTitle = await page.title();
    expect(pageTitle).toContain('ALL Products - Best offers');
  });
  
