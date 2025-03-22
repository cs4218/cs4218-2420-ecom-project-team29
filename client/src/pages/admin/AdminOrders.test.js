import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import AdminOrders from './AdminOrders';
import { useAuth } from '../../context/auth';


jest.mock('axios');
jest.mock('react-hot-toast');

console.log = jest.fn();

jest.mock('../../components/Header', () => () => <div>Header</div>);
jest.mock('../../components/AdminMenu', () => () => <div>Admin Menu</div>);
jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(),
}));
jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) 
}));
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));
jest.mock('../../hooks/useCategory', () => jest.fn(() => []));
jest.mock("antd", () => {
    const antd = jest.requireActual("antd");
    const SelectMock = ({ children, "data-testid": testId, onChange, ...props }) => (
        <select
            data-testid={testId}
            onChange={(e) => onChange(e.target.value)}
            {...props}
        >
            {children}
        </select>
    );

    SelectMock.Option = ({ children, value }) => (
        <option value={value}>{children}</option>
    );

    return {
        ...antd,
        Select: SelectMock,
    };
});

const product1 = {
    _id: 1,
    createdAt: Date.now(),
    description: "hot drink",
    name: "hot choco",
    price: 4.8,
    quantity: 1,
    slug: "hot-choco",
    updatedAt: Date.now()
}

const product2 = {
    _id: 2,
    createdAt: Date.now(),
    description: "dog description",
    name: "dog",
    price: 123,
    quantity: 1,
    slug: "dog",
    updatedAt: Date.now()
}

const paymentError = {
    success: false,
    errors: [],
    params: [],
    message: 'Credit card number is not an accepted test number.',
}

const paymentSuccess = {
    success: true,
    transaction: {},
}


describe('AdminOrders Component', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue([{ token: "sampletoken" }, jest.fn()]);
    });

    it('Renders header and admin menu only when no orders', async () => {
        axios.get.mockResolvedValueOnce({ data: [] });

        const { getByText } = render(
            <MemoryRouter initialEntries={['/orders']}>
                <Routes>
                    <Route path="/orders" element={<AdminOrders />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(getByText('All Orders')).toBeInTheDocument();
            expect(getByText('Admin Menu')).toBeInTheDocument();
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(document.querySelector('.card')).not.toBeInTheDocument();
        })
    });

    it('Renders 1 order of 1 item', async () => {
        axios.get.mockResolvedValueOnce({
            data: [
                {
                    _id: 1,
                    products: [product1],
                    payment: paymentSuccess,
                    buyer: { _id: 1, name: 'somebuyer' },
                    status: 'Not Processed',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    __v: 0
                }
            ]
        })

        const { getByText } = render(
            <MemoryRouter initialEntries={['/orders']}>
                <Routes>
                    <Route path="/orders" element={<AdminOrders />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(getByText('All Orders')).toBeInTheDocument();
            expect(getByText('Admin Menu')).toBeInTheDocument();
            expect(document.querySelectorAll('.container').length).toBe(1)
            expect(screen.getByTestId('statusId-1').value).toBe('Not Processed');
            expect(getByText('somebuyer')).toBeInTheDocument();
            expect(getByText('Success')).toBeInTheDocument();
            expect(document.querySelectorAll('.card').length).toBe(1)
            expect(getByText('hot choco')).toBeInTheDocument();
            expect(getByText('hot drink')).toBeInTheDocument(); 
            expect(getByText('Price : 4.8')).toBeInTheDocument();
        });
    });

    it('Renders 1 order of multiple items', async () => {
        axios.get.mockResolvedValueOnce({
            data: [
                {
                    _id: 1,
                    products: [product1, product2],
                    payment: paymentError,
                    buyer: { _id: 1, name: 'buyer1' },
                    status: 'Processing',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    __v: 0
                }
            ]
        })

        const { getByText } = render(
            <MemoryRouter initialEntries={['/orders']}>
                <Routes>
                    <Route path="/orders" element={<AdminOrders />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(getByText('All Orders')).toBeInTheDocument();
            expect(getByText('Admin Menu')).toBeInTheDocument();
            expect(document.querySelectorAll('.container').length).toBe(1)
            expect(screen.getByTestId('statusId-1').value).toBe('Processing');
            expect(getByText('buyer1')).toBeInTheDocument();
            expect(getByText('Failed')).toBeInTheDocument(); 
            expect(document.querySelectorAll('.card').length).toBe(2) 
            expect(getByText('hot choco')).toBeInTheDocument(); 
            expect(getByText('hot drink')).toBeInTheDocument(); 
            expect(getByText('Price : 4.8')).toBeInTheDocument(); 
            expect(getByText('dog')).toBeInTheDocument(); 
            expect(getByText('dog description')).toBeInTheDocument(); 
            expect(getByText('Price : 123')).toBeInTheDocument();
        });
    });

    it('Renders multiple orders', async () => {
        axios.get.mockResolvedValueOnce({
            data: [
                {
                    _id: 1,
                    products: [product1],
                    payment: paymentError,
                    buyer: { _id: 1, name: 'buyer1' },
                    status: 'Shipped',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    __v: 0
                },
                {
                    _id: 2,
                    products: [product1],
                    payment: paymentError,
                    buyer: { _id: 2, name: 'buyer2' },
                    status: 'Delivered',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    __v: 0
                },
                {
                    _id: 3,
                    products: [product1],
                    payment: paymentError,
                    buyer: { _id: 3, name: 'buyer3' },
                    status: 'Cancelled',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    __v: 0
                }
            ]
        })

        const { getByText, getAllByText } = render(
            <MemoryRouter initialEntries={['/orders']}>
                <Routes>
                    <Route path="/orders" element={<AdminOrders />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(getByText('All Orders')).toBeInTheDocument();
            expect(getByText('Admin Menu')).toBeInTheDocument();
            expect(document.querySelectorAll('.container').length).toBe(3)
            expect(screen.getByTestId('statusId-1').value).toBe('Shipped');
            expect(screen.getByTestId('statusId-2').value).toBe('Delivered');
            expect(screen.getByTestId('statusId-3').value).toBe('Cancelled');
            expect(getByText('buyer1')).toBeInTheDocument();
            expect(getByText('buyer2')).toBeInTheDocument(); 
            expect(getByText('buyer3')).toBeInTheDocument(); 
            expect(getAllByText('Failed').length).toBe(3); 
            expect(document.querySelectorAll('.card').length).toBe(3) 
            expect(getAllByText('hot choco').length).toBe(3); 
            expect(getAllByText('hot drink').length).toBe(3); 
            expect(getAllByText('Price : 4.8').length).toBe(3); 
        });
    });

    it('Change order status', async () => {
        axios.get.mockResolvedValueOnce({
            data: [
                {
                    _id: 1,
                    products: [product1],
                    payment: paymentSuccess,
                    buyer: { _id: 1, name: 'somebuyer' },
                    status: 'Not Processed',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    __v: 0
                }
            ]
        })

        axios.put.mockResolvedValueOnce(jest.fn());

        const { getByText } = render(
            <MemoryRouter initialEntries={['/orders']}>
                <Routes>
                    <Route path="/orders" element={<AdminOrders />} />
                </Routes>
            </MemoryRouter>
        );


        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(getByText('Not Processed')).toBeInTheDocument();
            const select = screen.getByTestId('statusId-1');
            expect(select.value).toBe('Not Processed');
            fireEvent.change(select, { target: { value: 'Cancelled' } });
            expect(axios.put).toHaveBeenCalledTimes(1);
            expect(axios.put).toHaveBeenCalledWith('/api/v1/auth/order-status/1', { status: 'Cancelled' });
            expect(select.value).toBe('Cancelled');
        });

    });

    it('Renders error message on failure to get orders', async () => {
        axios.get.mockRejectedValueOnce(new Error('Internal Server Error'));

        const { getByText } = render(
            <MemoryRouter initialEntries={['/orders']}>
                <Routes>
                    <Route path="/orders" element={<AdminOrders />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(getByText('All Orders')).toBeInTheDocument();
            expect(toast.error).toHaveBeenCalledWith('Something went wrong');
            expect(document.querySelector('.card')).not.toBeInTheDocument()
        });
    });

    it('Renders error message on failure to update order status', async () => {
        axios.get.mockResolvedValueOnce({
            data: [
                {
                    _id: 1,
                    products: [product1],
                    payment: paymentSuccess,
                    buyer: { _id: 1, name: 'somebuyer' },
                    status: 'Not Processed',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    __v: 0
                }
            ]
        })
        axios.put.mockRejectedValueOnce(new Error('Internal Server Error'));

        render(
            <MemoryRouter initialEntries={['/orders']}>
                <Routes>
                    <Route path="/orders" element={<AdminOrders />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
            const select = screen.getByTestId('statusId-1');
            fireEvent.change(select, { target: { value: 'Cancelled' } });
            expect(toast.error).toHaveBeenCalledWith('Something went wrong');
        });
    });

    it('No api calls when not authenticated', async () => {
        useAuth.mockReturnValueOnce([null, jest.fn()]);

        axios.get.mockResolvedValueOnce({ data: [] });

        const { getByText } = render(
            <MemoryRouter initialEntries={['/orders']}>
                <Routes>
                    <Route path="/orders" element={<AdminOrders />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(axios.get).not.toHaveBeenCalled();
        })
    });


});