import React from "react";
import "@testing-library/jest-dom/extend-expect";
import { render } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';
import { useAuth } from '../../context/auth';

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../../components/AdminMenu', () => () => <div>Admin Menu</div>);
jest.mock('../../components/Layout', () => ({ children }) => <div>{children}</div>);

describe('AdminDashboard', () => {
    it('renders the admin information correctly', () => {
        useAuth.mockReturnValue([{
            user: { name: 'admin user name', email: 'admin@email.com', phone: '1234567890' }
        }]);

        const { getByText } = render(<AdminDashboard />);

        expect(getByText('Admin Menu')).toBeInTheDocument();
        expect(getByText('Admin Name : admin user name')).toBeInTheDocument();
        expect(getByText('Admin Email : admin@email.com')).toBeInTheDocument();
        expect(getByText('Admin Contact : 1234567890')).toBeInTheDocument();
    });

    it('renders empty values when not admin', () => {
        useAuth.mockReturnValue([{ user: null }]);

        const { getByText } = render(<AdminDashboard />);

        expect(getByText('Admin Menu')).toBeInTheDocument();
        expect(getByText('Admin Name :')).toBeInTheDocument();
        expect(getByText('Admin Email :')).toBeInTheDocument();
        expect(getByText('Admin Contact :')).toBeInTheDocument();
    });
});