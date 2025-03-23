// this uses the real providers and context and backend
// !! This file requires the backend to be running

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import { AuthProvider } from '../../context/auth';
import { SearchProvider } from '../../context/search';
import { CartProvider } from '../../context/cart';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import axios from 'axios';
import dotenv from 'dotenv';

jest.mock('react-hot-toast');

dotenv.config();

beforeAll(() => {
    axios.defaults.baseURL = 'http://localhost:' + process.env.PORT;
});

describe('Login Component', () => {
  it('should render the login form', () => {
    render(
      <AuthProvider>
        <SearchProvider>
            <CartProvider>
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );

    expect(screen.getByText('LOGIN FORM')).toBeInTheDocument();
  });

  it('should successfully login with valid credentials', async () => {
    render(
      <AuthProvider>
        <SearchProvider>
            <CartProvider>
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { 
      target: { value: 'test@example.com' } 
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { 
      target: { value: 'password123' } 
    });

    fireEvent.click(screen.getByText('LOGIN'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Logged in successfully", {"duration": 5000, "icon": "🙏", "style": {"background": "green", "color": "white"}});
    });
  });

  it('should show error for invalid credentials', async () => {
    render(
      <AuthProvider>
        <SearchProvider>
            <CartProvider>
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { 
      target: { value: 'wrong@example.com' } 
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { 
      target: { value: 'wrongpassword' } 
    });

    fireEvent.click(screen.getByText('LOGIN'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });
  });
});
