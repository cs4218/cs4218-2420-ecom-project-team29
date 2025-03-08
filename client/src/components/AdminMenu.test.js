import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import AdminMenu from './AdminMenu';
import '@testing-library/jest-dom/extend-expect';

describe('AdminMenu component', () => {
    test('renders AdminMenu', async () => {
        const { getByText } = render(
            <Router>
                <AdminMenu />
            </Router>
        );

        await waitFor(() => {
            expect(getByText('Admin Panel')).toBeInTheDocument();
        });
    });

    test('renders correct menu items', () => {
        const { getByText, container } = render(
            <Router>
                <AdminMenu />
            </Router>
        );

        const navLinks = container.querySelectorAll('a');
        expect(navLinks.length).toBe(5);
        expect(getByText('Create Category')).toBeInTheDocument();
        expect(getByText('Create Product')).toBeInTheDocument();
        expect(getByText('Products')).toBeInTheDocument();
        expect(getByText('Orders')).toBeInTheDocument();
        expect(getByText('Users')).toBeInTheDocument();
    });

    test('renders correct links to menu items', () => {
        const { getByText } = render(
            <Router>
                <AdminMenu />
            </Router>
        );

        expect(getByText('Create Category').closest('a')).toHaveAttribute('href', '/dashboard/admin/create-category');
        expect(getByText('Create Product').closest('a')).toHaveAttribute('href', '/dashboard/admin/create-product');
        expect(getByText('Products').closest('a')).toHaveAttribute('href', '/dashboard/admin/products');
        expect(getByText('Orders').closest('a')).toHaveAttribute('href', '/dashboard/admin/orders');
        expect(getByText('Users').closest('a')).toHaveAttribute('href', '/dashboard/admin/users');
    });
});