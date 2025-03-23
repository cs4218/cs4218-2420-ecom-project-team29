// this uses the real providers and context and backend
// !! This file requires the backend to be running

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';
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

describe('ForgotPassword Component', () => {
  it('should render the forgot password form', () => {
    render(
      <AuthProvider>
        <SearchProvider>
            <CartProvider>
                <MemoryRouter initialEntries={['/forgot-password']}>
                    <Routes>
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                    </Routes>
                </MemoryRouter>
            </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );

    expect(screen.getByText('FORGOT PASSWORD FORM')).toBeInTheDocument();
  });

  it('should successfully reset password with correct email and security answer', async () => {
    render(
      <AuthProvider>
        <SearchProvider>
            <CartProvider>
                <MemoryRouter initialEntries={['/forgot-password']}>
                    <Routes>
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                    </Routes>
                </MemoryRouter>
            </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { 
      target: { value: 'forgetpassword@example.com' } 
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Answer'), { 
      target: { value: 'Football' } 
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Your New Password'), { 
      target: { value: 'newpassword123' } 
    });

    fireEvent.click(screen.getByText('FORGOT PASSWORD'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Password reset successfully', {"duration": 5000, "icon": "🙏", "style": {"background": "green", "color": "white"}});
    });
  });

  it('should show error for incorrect security answer', async () => {
    render(
      <AuthProvider>
        <SearchProvider>
            <CartProvider>
                <MemoryRouter initialEntries={['/forgot-password']}>
                    <Routes>
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                    </Routes>
                </MemoryRouter>
            </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { 
      target: { value: 'forgetpassword@example.com' } 
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Answer'), { 
      target: { value: 'WrongSport' } 
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Your New Password'), { 
      target: { value: 'newpassword123' } 
    });

    fireEvent.click(screen.getByText('FORGOT PASSWORD'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });
  });

  it('should show error for non-existent email', async () => {
    render(
      <AuthProvider>
        <SearchProvider>
            <CartProvider>
                <MemoryRouter initialEntries={['/forgot-password']}>
                    <Routes>
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                    </Routes>
                </MemoryRouter>
            </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { 
      target: { value: 'nonexistent@example.com' } 
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Answer'), { 
      target: { value: 'Football' } 
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Your New Password'), { 
      target: { value: 'newpassword123' } 
    });

    fireEvent.click(screen.getByText('FORGOT PASSWORD'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });
  });
}); 