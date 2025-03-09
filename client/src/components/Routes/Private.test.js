import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import { MemoryRouter, Outlet } from 'react-router-dom';
import PrivateRoute from './Private';
import { useAuth } from '../../context/auth';

jest.mock('axios');
jest.mock('../../context/auth');
jest.mock('../Spinner', () => () => <div>Loading...</div>);
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Outlet: () => <div>Outlet</div>,
}));

describe('PrivateRoute Component', () => {
  it('should render Outlet when authenticated', async () => {
    useAuth.mockReturnValue([{ token: 'test-token' }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: true } });

    render(
      <MemoryRouter>
        <PrivateRoute />
        <Outlet />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Outlet')).toBeInTheDocument();
    });
  });

  it('should render Spinner when not authenticated', async () => {
    useAuth.mockReturnValue([{ token: 'test-token' }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: false } });

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  it('should render Spinner when token is null', async () => {
    useAuth.mockReturnValue([{ token: null }, jest.fn()]);

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
});