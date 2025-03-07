import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Users from './Users';


// mock modules
jest.mock('axios');
jest.mock('react-hot-toast');

// mock components
jest.mock('../../components/Layout', () => ({ children }) => <div>{children}</div>);
jest.mock('../../components/AdminMenu', () => () => <div>Admin Menu</div>);
    

describe('Users Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders header and admin menu only when no users', async () => {
        axios.get.mockResolvedValueOnce({ data: { users: [] } });

        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/users']}>
                <Routes>
                    <Route path="/users" element={<Users />} />
                </Routes>
            </MemoryRouter>
        );

        expect(getByText('All Users')).toBeInTheDocument();
        expect(getByText('Admin Menu')).toBeInTheDocument();
        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
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
