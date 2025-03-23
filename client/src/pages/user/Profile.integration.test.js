// this uses the real providers and context and backend
// !! This file requires the backend to be running

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Profile from './Profile';
import { AuthProvider } from '../../context/auth';
import { SearchProvider } from '../../context/search';
import { CartProvider } from '../../context/cart';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import axios from 'axios';
import dotenv from 'dotenv';
import PrivateRoute from '../../components/Routes/Private';

jest.mock('react-hot-toast');

dotenv.config();

// Mock auth context with initial user data
const mockUser = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '1234567890',
  address: '123 Test St'
};

beforeAll(async () => {
    axios.defaults.baseURL = 'http://localhost:' + process.env.PORT;
    // login user by contacting login endpoint
    const response = await axios.post('/api/v1/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    const token = response.data.token;
    localStorage.setItem('auth', JSON.stringify({ user: mockUser, token }));
});

describe('Profile Component', () => {
  it('should render the profile form with user data', async () => {
    render(
      <AuthProvider>
        <SearchProvider>
            <CartProvider>
                <MemoryRouter initialEntries={['/dashboard/user/profile']}>
                    <Routes>
                        <Route path="/dashboard" element={<PrivateRoute />}>
                            <Route path="user/profile" element={<Profile />} />
                        </Route>
                    </Routes>
                </MemoryRouter>
            </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('USER PROFILE')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue('123 Test St')).toBeInTheDocument();
    });
  });

  it('should successfully update profile', async () => {
    render(
      <AuthProvider>
        <SearchProvider>
            <CartProvider>
                <MemoryRouter initialEntries={['/dashboard/user/profile']}>
                    <Routes>
                        <Route path="/dashboard" element={<PrivateRoute />}>
                            <Route path="/dashboard/user/profile" element={<Profile />} />
                        </Route>
                    </Routes>
                </MemoryRouter>
            </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('USER PROFILE')).toBeInTheDocument();
    });

    // Change profile information
    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { 
      target: { value: 'Test User' } 
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { 
      target: { value: '9876543210' } 
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { 
      target: { value: '456 New St' } 
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Your New Password'), { 
      target: { value: 'password123' } 
    });

    fireEvent.click(screen.getByText('UPDATE'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Profile Updated Successfully');
    });
  });

  it('should show error for empty name field', async () => {
    render(
      <AuthProvider>
        <SearchProvider>
            <CartProvider>
                <MemoryRouter initialEntries={['/dashboard/user/profile']}>
                    <Routes>
                        <Route path="/dashboard" element={<PrivateRoute />}>
                            <Route path="user/profile" element={<Profile />} />
                        </Route>
                    </Routes>
                </MemoryRouter>
            </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('USER PROFILE')).toBeInTheDocument();
    });

    // Clear name field
    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { 
      target: { value: '' } 
    });

    fireEvent.click(screen.getByText('UPDATE'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Name cannot be empty');
    });
  });

  it('should show error for invalid phone number', async () => {
    render(
      <AuthProvider>
        <SearchProvider>
            <CartProvider>
                <MemoryRouter initialEntries={['/dashboard/user/profile']}>
                    <Routes>
                        <Route path="/dashboard" element={<PrivateRoute />}>
                            <Route path="user/profile" element={<Profile />} />
                        </Route>
                    </Routes>
                </MemoryRouter>
            </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('USER PROFILE')).toBeInTheDocument();
    });

    // Enter invalid phone number
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { 
      target: { value: 'invalid-phone' } 
    });

    fireEvent.click(screen.getByText('UPDATE'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Phone number should contain only numbers');
    });
  });

  it('should restore original values when validation fails', async () => {
    render(
      <AuthProvider>
        <SearchProvider>
            <CartProvider>
                <MemoryRouter initialEntries={['/dashboard/user/profile']}>
                    <Routes>
                        <Route path="/dashboard" element={<PrivateRoute />}>
                            <Route path="user/profile" element={<Profile />} />
                        </Route>
                    </Routes>
                </MemoryRouter>
            </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter Your Name').value).toBe('Test User');
    });

    // Clear required fields
    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { 
      target: { value: '' } 
    });

    fireEvent.click(screen.getByText('UPDATE'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    });
  });
});
