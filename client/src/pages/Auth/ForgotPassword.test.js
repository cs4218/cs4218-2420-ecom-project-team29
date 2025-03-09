import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import ForgotPassword from './ForgotPassword';

jest.mock('axios');
jest.mock('react-hot-toast');

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
  }));

  jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
  }));
    
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
  }));  

  Object.defineProperty(window, 'localStorage', {
    value: {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
  });

window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
  };  

describe('ForgotPassword Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
  it('should render the component', () => {
    render(
    <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
            <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
    </MemoryRouter>
    );

    expect(screen.getByText('FORGOT PASSWORD FORM')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Your New Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Your Answer')).toBeInTheDocument();
    expect(screen.getByText('FORGOT PASSWORD')).toBeInTheDocument();
  });

  it('should handle form submission where success is false', async () => {
    axios.post.mockResolvedValue({
      data: {
        success: false,
        message: 'Wrong Email Or Answer',
      },
    });
    render(
    <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
            <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
    </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your New Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Answer'), { target: { value: 'answer' } });

    fireEvent.click(screen.getByText('FORGOT PASSWORD'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Wrong Email Or Answer');
    });
  });

  it('should handle invalid form submission', async () => {
    render(
    <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
            <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
    </MemoryRouter>
    ); 

    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your New Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Answer'), { target: { value: 'answer' } });

    fireEvent.click(screen.getByText('FORGOT PASSWORD'));

    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  it('should handle form submission with empty fields', async () => {
    render(
    <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
            <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
    </MemoryRouter>
    );

    fireEvent.click(screen.getByText('FORGOT PASSWORD'));

    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  it('should handle successful password reset', async () => {
    axios.post.mockResolvedValue({
      data: {
        success: true,
        message: 'Password Reset Successfully',
      },
    });
    render(
    <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
            <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
    </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your New Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Answer'), { target: { value: 'answer' } });

    fireEvent.click(screen.getByText('FORGOT PASSWORD'));

    await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/forgot-password', {
          email: 'test@example.com',
          newPassword: 'password123',
          answer: 'answer',
        });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Password Reset Successfully', {
        duration: 5000,
        icon: "🙏",
        style: {
          background: "green",
          color: "white",
        },
      });
    });
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should handle error during password reset', async () => {
    axios.post.mockRejectedValue({
      data: {
        success: false,
        message: 'Wrong Email Or Answer',
      },
    });
    render(
    <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
            <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
    </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your New Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Answer'), { target: { value: 'answer' } });

    fireEvent.click(screen.getByText('FORGOT PASSWORD'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });
  });  
});
