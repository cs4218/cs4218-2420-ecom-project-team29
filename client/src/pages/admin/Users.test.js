import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Users from './Users';
import { useAuth } from '../../context/auth';

jest.mock('axios');
jest.mock('react-hot-toast');
jest.mock('../../context/auth', () => ({
    useAuth: jest.fn()
}));
jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()])
}));
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));
jest.mock('../../hooks/useCategory', () => jest.fn(() => []));
console.log = jest.fn();


describe('Users Component', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue([{ token: "sampletoken" }, jest.fn()]);
    });

    it('Renders header and admin panel only when no users', async () => {
        axios.get.mockResolvedValueOnce({ data: { users: [] } });

        const { getByText } = render(
            <MemoryRouter initialEntries={['/users']}>
                <Routes>
                    <Route path="/users" element={<Users />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(getByText('All Users')).toBeInTheDocument();
            expect(getByText('Admin Panel')).toBeInTheDocument();
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(document.querySelector('.card')).not.toBeInTheDocument();
        });
    });

    it('Renders 1 user', async () => {
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

        const { getByText } = render(
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
            expect(document.querySelectorAll('.card').length).toBe(1)
        });

    });

    it('Renders multiple users', async () => {
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

        const { getByText } = render(
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

            expect(document.querySelectorAll('.card').length).toBe(2)
        });

    });

    it('Renders error message on server error', async () => {
        axios.get.mockRejectedValueOnce(new Error('Internal Server Error'));

        const { getByText } = render(
            <MemoryRouter initialEntries={['/users']}>
                <Routes>
                    <Route path="/users" element={<Users />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(getByText('All Users')).toBeInTheDocument();
            expect(toast.error).toHaveBeenCalledWith('Something went wrong');
            expect(document.querySelector('.card')).not.toBeInTheDocument()
        });
    });

    it('No api calls when not authenticated', async () => {
        useAuth.mockReturnValueOnce([null, jest.fn()]);
        axios.get.mockResolvedValueOnce({ data: { users: [] } });

        render(
            <MemoryRouter initialEntries={['/users']}>
                <Routes>
                    <Route path="/users" element={<Users />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(axios.get).not.toHaveBeenCalled();
        });
    });

});
