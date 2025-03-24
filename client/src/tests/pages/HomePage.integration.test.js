import React from "react";
import { render, screen, act, fireEvent, waitFor  } from "@testing-library/react";
import { testApi, apiConfig } from './testConfig';
import { AuthProvider } from "../../context/auth";
import { SearchProvider } from "../../context/search";
import { CartProvider } from "../../context/cart";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import '@testing-library/jest-dom';
import HomePage from "../../pages/HomePage";
import ProductDetails from "../../pages/ProductDetails";
import Contact from "../../pages/Contact";
import Search from "../../pages/Search";
import Policy from "../../pages/Policy";


const renderHomePage = async () => {
    await act(async () => {
        render(
            <AuthProvider>
                <SearchProvider>
                    <CartProvider>
                        <MemoryRouter initialEntries={['/']}>
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route 
                                    path="/product/:slug" 
                                    element={<ProductDetails />} 
                                />
                                <Route path="/contact" element={<Contact />} />
                                <Route path="/search" element={<Search />} />
                                <Route path="/policy" element={<Policy />} />
                            </Routes>
                        </MemoryRouter>
                    </CartProvider>
                </SearchProvider>
            </AuthProvider>
        );
    });
}

  
describe("HomePage Integration Tests", () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        axios.defaults.baseURL = apiConfig.baseURL;
        axios.defaults.timeout = apiConfig.timeout;
    });

    beforeAll(async () => {
        try {
            // console.log('Testing connection to:', axios.defaults.baseURL + '/api/v1/category/get-category');
            
            const response = await testApi.get('/api/v1/category/get-category');

            // console.log('API Response:', {
            //     status: response?.status,
            //     data: response?.data
            // });

            expect(response).toBeDefined();
            expect(response.status).toBeDefined();

        } catch (err) {
            console.log('Detailed error:', {
                name: err.name,
                message: err.message,
                stack: err.stack,
                axiosError: err.isAxiosError,
                response: err.response,
                request: err.request
            });
            throw err;
        }
    });

    it("loads products from real backend API", async () => {
        await renderHomePage();
    
        await waitFor(() => {
            expect(screen.getByText(/All Products/i)).toBeInTheDocument();
            expect(screen.getByText("Filter By Category")).toBeInTheDocument();
            expect(screen.getByText(/MacBook/i)).toBeInTheDocument();
        }, { timeout: axios.defaults.timeout });
    });

    it("should navigate to product details page after click the More Details Button", async () => {
        await renderHomePage();

        await waitFor(() => {
            // Wait for products to load
            const productHeading = screen.getByText('All Products');
            expect(productHeading).toBeInTheDocument();
            const initialProduct = screen.getByText(/MacBook/i);
            expect(initialProduct).toBeInTheDocument();
        }, { timeout: axios.defaults.timeout });

        const detailsButtons = await screen.findAllByRole('button', {
            name: /more details/i
        });
    
        await act(async () => {
            fireEvent.click(detailsButtons[0]);
        });         
        
        const productDetailsPage = await screen.findByTestId('product-details-page');
        expect(productDetailsPage).toBeInTheDocument();
    }, 15000);
    
    it("should filter products by price range", async () => {
        await renderHomePage();

        await waitFor(() => {
            // Wait for products to load
            const productHeading = screen.getByText('All Products');
            expect(productHeading).toBeInTheDocument();
            const priceFilterHeading = screen.getByText('Filter By Price');
            expect(priceFilterHeading).toBeInTheDocument();
            const initialProduct = screen.getByText(/MacBook/i);
            expect(initialProduct).toBeInTheDocument();
        }, { timeout: axios.defaults.timeout });

        const radioButton = await screen.findByRole('radio', { name: '$0 to 19.99' });

        // initial state
        expect(radioButton).not.toBeChecked();

        await act(async () => {
            fireEvent.click(radioButton);
        });

        
        await waitFor(() => {
            expect(radioButton).toBeChecked();
            expect(screen.queryByText(/Macbook/i)).not.toBeInTheDocument();

           
            const expectedItems = [
                /Save me an orange/i,
                /Yellow Bird Drink/i,
                /Shirley Temple Drink/i,
                /Delightful Nyonya Treats/i,
                /Garlic Butter Chicken/i,
                /Superstar Roll/i,

            ];

            expectedItems.forEach(product => {
                expect(screen.getAllByText(product)).not.toHaveLength(0);
            });
            
        }, { timeout: 15000 });

    }, 15000);

    it("should filter products by category", async () => {
        await renderHomePage();

        const checkbox = await screen.findByRole('checkbox', { name: 'Book' });
        // Initial state
        expect(checkbox).not.toBeChecked();
        await act(async () => {
            fireEvent.click(checkbox);
        });

        await waitFor(() => {
            expect(checkbox).toBeChecked();
            expect(screen.queryByText(/Macbook/i)).not.toBeInTheDocument();

            const expectedItems = [
                /Save me an orange/i,
                /You become what you think/i,
                /The journey to the west/i,
                /Delightful nyonya Treats/i,
            ];
        
            expectedItems.forEach(product => {
                expect(screen.getAllByText(product)).not.toHaveLength(0);
            });    
        }, { timeout: 15000 });

    }, 15000);

    it("should filter products by categories", async () => {
        await renderHomePage(); 
    
        const bookCheckbox = await screen.findByRole('checkbox', { name: 'Book' });
        const drinkCheckbox = await screen.findByRole('checkbox', { name: 'Drink' });

        // Initial state
        expect(bookCheckbox).not.toBeChecked();
        expect(drinkCheckbox).not.toBeChecked();

        await act(async () => {
            fireEvent.click(bookCheckbox);
            fireEvent.click(drinkCheckbox);
        });

        await waitFor(() => {
            expect(bookCheckbox).toBeChecked();
            expect(drinkCheckbox).toBeChecked();
            expect(screen.queryByText(/Macbook/i)).not.toBeInTheDocument();

            const expectedItems = [
                /Save me an orange/i,
                /You become what you think/i,
                /The journey to the west/i,
                /Yellow Bird Drink/i,
                /Shirley Temple Drink/i,
                /Pahit Pink Gin/i,
                /Kubota Senjyu Ginjyo/i,
                /Jack Daniels/i,
                /Sapporo/i,
                /Delightful nyonya Treats/i,
            ];
        
            expectedItems.forEach(product => {
                expect(screen.getAllByText(product)).not.toHaveLength(0);
            });  
        }, { timeout: 15000 });
    }, 15000);

    it("should filter products by both category and price range", async () => {
        await renderHomePage(); 
    
        const radioButton = await screen.findByRole('radio', { name: '$20 to 39.99' });
        const bookCheckbox = await screen.findByRole('checkbox', { name: 'Book' });
        const drinkCheckbox = await screen.findByRole('checkbox', { name: 'Drink' });

        // initial state
        expect(radioButton).not.toBeChecked();
        expect(bookCheckbox).not.toBeChecked();
        expect(drinkCheckbox).not.toBeChecked();

        await act(async () => {
            fireEvent.click(bookCheckbox);
            fireEvent.click(drinkCheckbox);
            fireEvent.click(radioButton);
        });

        await waitFor(() => {
            expect(radioButton).toBeChecked();
            expect(bookCheckbox).toBeChecked();
            expect(drinkCheckbox).toBeChecked();
            expect(screen.queryByText(/Macbook/i)).not.toBeInTheDocument();

            const expectedItems = [
                /You become what you think/i,
                /Sapporo/i,
            ];
        
            expectedItems.forEach(product => {
                expect(screen.getAllByText(product)).not.toHaveLength(0);
            });  
        }, { timeout: 15000 });
    }, 15000);
    
    
    describe("Reset Filters tests", () => {
        const originalWindow = window.location;
        const mockReload = jest.fn();
        beforeEach(() => {
            delete window.location;
            window.location = { reload: mockReload };
        });
    
        afterEach(() => {
            window.location = originalWindow;
        });

        // mock reload() here as Jest and React Testing Library do not natively support window.location.reload()
        it('should call window.location.reload when reset button is clicked', async () => {
            await renderHomePage();
        
            // Find and click the reset button
            const resetButton = await screen.findByRole('button', { name: 'RESET FILTERS' });
            await act(async () => {
              fireEvent.click(resetButton);
            });
            expect(window.location.reload).toHaveBeenCalled();
        });
        
        
    
        it("should reset filters", async () => {
            await renderHomePage();
    
            await waitFor(() => {
                // Wait for products to load
                const productHeading = screen.getByText('All Products');
                expect(productHeading).toBeInTheDocument();
                const initialProduct = screen.getByText(/MacBook/i);
                expect(initialProduct).toBeInTheDocument();
            }, { timeout: axios.defaults.timeout });

            const checkbox = await screen.findByRole('checkbox', { name: 'Book' });
            const radioButton = await screen.findByRole('radio', { name: '$0 to 19.99' });
    
            // Initial state
            expect(radioButton).not.toBeChecked();
            expect(checkbox).not.toBeChecked();
    
            await act(async () => {
                fireEvent.click(checkbox);
                fireEvent.click(radioButton);
            });
    
            await waitFor(() => {
                expect(checkbox).toBeChecked();
                expect(radioButton).toBeChecked();
                expect(screen.queryByText(/Macbook/i)).not.toBeInTheDocument();
                expect(screen.getAllByAltText(/Save me an orange/i)).not.toHaveLength(0);
                expect(screen.getAllByAltText(/Delightful Nyonya Treats/i)).not.toHaveLength(0);

            }, { timeout: 15000 });
    
            const resetButton = await screen.findByRole('button', { name: 'RESET FILTERS' });
            await act(async () => {
                fireEvent.click(resetButton);
            });
            expect(window.location.reload).toHaveBeenCalled();
        }, 15000);
       
    });
       
    describe("View Pages", () => {
        it("should navigate to contact page after click the Contact Link", async () => {
            await renderHomePage();
    
            await waitFor(() => {
                // Wait for products to load
                const productHeading = screen.getByText('All Products');
                expect(productHeading).toBeInTheDocument();
                const initialProduct = screen.getByText(/MacBook/i);
                expect(initialProduct).toBeInTheDocument();
            }, { timeout: axios.defaults.timeout });
    

            const contactLink = await screen.findByText(/Contact/i);
            await act(async () => {
                fireEvent.click(contactLink);
            });
            const contactPage = await screen.findByTestId('contact-page');
            expect(contactPage).toBeInTheDocument();
        }, 15000);

        it("should navigate to policy page after click the Privacy Policy Link", async () => {
            await renderHomePage();
    
            await waitFor(() => {
                // Wait for products to load
                const productHeading = screen.getByText('All Products');
                expect(productHeading).toBeInTheDocument();
                const initialProduct = screen.getByText(/MacBook/i);
                expect(initialProduct).toBeInTheDocument();
            }, { timeout: axios.defaults.timeout });
    

            const policyLink = await screen.findByText(/Privacy Policy/i);
            await act(async () => {
                fireEvent.click(policyLink);
            });
            const policyPage = await screen.findByTestId('policy-page');
            expect(policyPage).toBeInTheDocument();
        }, 15000);

        it("should navigate to search result page after click the Search Button with a input", async () => {
            await renderHomePage();
    
            await waitFor(() => {
                // Wait for products to load
                const productHeading = screen.getByText('All Products');
                expect(productHeading).toBeInTheDocument();
                const initialProduct = screen.getByText(/MacBook/i);
                expect(initialProduct).toBeInTheDocument();
            }, { timeout: axios.defaults.timeout });
    
    
            const searchButton = await screen.findByRole('button', { name: 'Search' });
            const searchInput = await screen.findByPlaceholderText(/search/i);
    
            await act(async () => {
                fireEvent.change(searchInput, { target: { value: 'macbook' } });
                fireEvent.click(searchButton);
            });
            
            const searchPage = await screen.findByTestId('search-page');
            expect(searchPage).toBeInTheDocument();
        }, 15000);
    });

    describe("load more button", () => {    
        it("should load more products when the load more button is clicked", async () => {
            await renderHomePage();
    
            await waitFor(() => {
                // Wait for products to load
                const productHeading = screen.getByText('All Products');
                expect(productHeading).toBeInTheDocument();
                const initialProduct = screen.getByText(/MacBook/i);
                expect(initialProduct).toBeInTheDocument();
            }, { timeout: axios.defaults.timeout });

            const loadMoreButton = await screen.findByRole('button', { name: 'Loadmore' });

            await act(async () => {
                fireEvent.click(loadMoreButton);
            });

            await waitFor(() => {
                const expectedProducts = [
                    /Superstar Roll/i,
                    /Sapporo/i,
                    // /Jack Daniels/i,
                    // /Kubota/i,
                    // /Pahit Pink Gin/i,
                    // /Shirley/i,
                ]

                expectedProducts.forEach(product => {
                    expect(screen.getAllByText(product)).not.toHaveLength(0);
                });  
               
            }, { timeout: 15000 });
    

        }, 15000);
    });


});