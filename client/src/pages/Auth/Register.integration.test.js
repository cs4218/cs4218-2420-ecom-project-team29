// this uses the real providers and context and backend
// !! This file requires the backend to be running

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Register from './Register';
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

describe('Register Component', () => {
  it('should render the register form', () => {
    render(
      <AuthProvider>
        <SearchProvider>
            <CartProvider>
                <MemoryRouter initialEntries={['/register']}>
                    <Routes>
                        <Route path="/register" element={<Register />} />
                    </Routes>
                </MemoryRouter>
            </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );

    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('should be able to contact the backend', async () => {
    render(
        <AuthProvider>
          <SearchProvider>
              <CartProvider>
                  <MemoryRouter initialEntries={['/register']}>
                      <Routes>
                          <Route path="/register" element={<Register />} />
                      </Routes>
                  </MemoryRouter>
              </CartProvider>
          </SearchProvider>
        </AuthProvider>
      );

    // we already have this user in the database
    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

    fireEvent.click(screen.getByText('REGISTER'));

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Already registered please login');
    });
  });
});
