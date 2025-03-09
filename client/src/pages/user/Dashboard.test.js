import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

const user = {
    name: 'John Doe',
    email: 'test@mail.com',
    address: '123 Main St',
}

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [{ user }, jest.fn()])
}));

jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));  

describe('<Dashboard />', () => {
    it('should render', () => {
        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        )

        expect(screen.getByRole('heading', { name: user.name })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: user.email })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: user.address })).toBeInTheDocument();
    });
});