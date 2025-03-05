import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom';
import UserMenu from './UserMenu';

describe('<UserMenu />', () => {
    it('should render', () => {
        render(
            <MemoryRouter>
                <UserMenu />
            </MemoryRouter>
        )

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Orders')).toBeInTheDocument();
    });
});