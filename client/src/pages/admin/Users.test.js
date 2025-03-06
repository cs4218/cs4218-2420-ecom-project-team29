import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Users from './Users';


// Mocking axios.post
jest.mock('axios');
// Mocking react-hot-toast
jest.mock('react-hot-toast');

// Mock the useAuth hook
jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
}));

// mock the useCart hook
jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function for setCart
}));

// mock the useSearch hook
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));

// mock the getCategories hook
jest.mock('../../hooks/useCategory', () => jest.fn(() => []));


window.matchMedia = window.matchMedia || function () {
    return {
        matches: false,
        addListener: function () { },
        removeListener: function () { }
    };
};

describe('Users Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders header only when no users', async () => {
        axios.get.mockResolvedValueOnce({ data: { users: [] } });

        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/users']}>
                <Routes>
                    <Route path="/users" element={<Users />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
        expect(getByText('All Users')).toBeInTheDocument();
        await waitFor(() => expect(document.querySelector('.card')).not.toBeInTheDocument());
    });

    it('renders 1 user', async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                countTotal: 1,
                message: 'All Users',
                success: true,
                users: [
                    {
                        _id: '1',
                        name: 'John Doe',
                        email: 'john@email.com',
                        address: '123 Main St',
                        phone: '1234567890',
                        role: 1
                    }
                ]
            }
        })

        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/users']}>
                <Routes>
                    <Route path="/users" element={<Users />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(getByText('All Users')).toBeInTheDocument();
            expect(getByText('John Doe')).toBeInTheDocument();
            expect(getByText('Email: john@email.com')).toBeInTheDocument();
            expect(getByText('Address: 123 Main St')).toBeInTheDocument();
            expect(getByText('Phone: 1234567890')).toBeInTheDocument();
            expect(getByText('Role: Admin')).toBeInTheDocument();
        });
        await waitFor(() => expect(document.querySelectorAll('.card').length).toBe(1));

    });

    it('renders multiple users', async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                countTotal: 1,
                message: 'All Users',
                success: true,
                users: [
                    {
                        _id: '1',
                        name: 'John Doe',
                        email: 'john@email.com',
                        address: '123 Main St',
                        phone: '1234567890',
                        role: 1
                    },
                    {
                        _id: '2',
                        name: 'Jane Doe',
                        email: 'jane@email.com',
                        address: '456 side St',
                        phone: '0987654321',
                        role: 0
                    },
                ]
            }
        })

        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/users']}>
                <Routes>
                    <Route path="/users" element={<Users />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(getByText('All Users')).toBeInTheDocument();

            expect(getByText('John Doe')).toBeInTheDocument();
            expect(getByText('Email: john@email.com')).toBeInTheDocument();
            expect(getByText('Address: 123 Main St')).toBeInTheDocument();
            expect(getByText('Phone: 1234567890')).toBeInTheDocument();
            expect(getByText('Role: Admin')).toBeInTheDocument();

            expect(getByText('Jane Doe')).toBeInTheDocument();
            expect(getByText('Email: jane@email.com')).toBeInTheDocument();
            expect(getByText('Address: 456 side St')).toBeInTheDocument();
            expect(getByText('Phone: 0987654321')).toBeInTheDocument();
            expect(getByText('Role: User')).toBeInTheDocument();
        });

        await waitFor(() => expect(document.querySelectorAll('.card').length).toBe(2));
    });

    it('renders error message on failure ', async () => {
        axios.get.mockRejectedValueOnce(new Error('Internal Server Error'));

        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/users']}>
                <Routes>
                    <Route path="/users" element={<Users />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(getByText('All Users')).toBeInTheDocument();
            expect(toast.error).toHaveBeenCalledWith('Something Went Wrong');
        });
        await waitFor(() => expect(document.querySelector('.card')).not.toBeInTheDocument());
    });

});
