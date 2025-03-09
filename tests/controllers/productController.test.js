import { expect, jest } from "@jest/globals";
import { getProductController, getSingleProductController } from '../../controllers/productController';
import productModel from '../../models/productModel';

// Mock productModel functions
jest.mock('../../models/productModel');

describe('getProductController Tests', () => {
    let req, res, mockCategories, mockProducts;

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();

        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };

        mockCategories = Array.from({ length: 2 }, (_, index) => ({
            _id: `${index + 1}`, 
            name: `Category ${index + 1}`,
            slug: `category-${index + 1}`,
        }));

        mockProducts = Array.from({ length: 13 }, (_, index) => ({
            _id: `${index + 1}`, 
            name: `Product ${index + 1}`,
            slug: `product-${index + 1}`,
            description: `Description for product ${index + 1}`,
            price: 100 + index, 
            category: mockCategories[index % 2],
            quantity: 10 + index,
            photo: "some-photo",
            shipping: index % 2 === 0, 
            createdAt: new Date(2025, 2, 20, 10, 25, 0 - index),
            updatedAt: new Date(2025, 2, 20, 10, 25, 0 - index),
        }));
    });

    describe('Try Branch Tests', () => {
        it("should verify correct query chain parameters", async () => {
            const expectedProducts = mockProducts
                .slice(0, 12)
                .map(({ photo, ...rest }) => rest);

            productModel.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue(expectedProducts),
            });
            
            await getProductController(req, res);

            expect(productModel.find).toHaveBeenCalledWith({});
            expect(productModel.find().populate).toHaveBeenCalledWith("category");
            expect(productModel.find().select).toHaveBeenCalledWith("-photo");
            expect(productModel.find().limit).toHaveBeenCalledWith(12);
            expect(productModel.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
        });


        it("should return products when products are found and no errors occur", async () => {
            const expectedProducts = mockProducts
                .slice(0, 12)
                .map(({ photo, ...rest }) => rest);
            
            productModel.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue(expectedProducts),
            });

            await getProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                counTotal: 12,
                message: "All products fetched",
                products: expectedProducts,
            });
        });


        it("should return an empty array and appropriate message when no product exist and no errors occur", async () => {
            productModel.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([]),
            });

            await getProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                counTotal: 0,
                message: "No products found",
                products: [],
            });
        });
    });

    describe('Catch Branch Tests', () => {
        it('should return an error when an error occurs during product retrieval', async () => {
            const errorMessage = "Database error";
            const error = new Error(errorMessage);

            productModel.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn().mockRejectedValue(error)
            });

            await getProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Erorr in getting products",
                error: error,
            });
        });     
    });
});

describe('getSingleProductController Tests', () => {
    let req, res, mockCategories, mockProducts;

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();

        req = {
            params: {
                slug: 'product-1'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };

        mockCategories = Array.from({ length: 2 }, (_, index) => ({
            _id: `${index + 1}`, 
            name: `Category ${index + 1}`,
            slug: `category-${index + 1}`,
        }));

        mockProducts = Array.from({ length: 13 }, (_, index) => ({
            _id: `${index + 1}`, 
            name: `Product ${index + 1}`,
            slug: `product-${index + 1}`,
            description: `Description for product ${index + 1}`,
            price: 100 + index, 
            category: mockCategories[index % 2],
            quantity: 10 + index,
            photo: "some-photo",
            shipping: index % 2 === 0, 
            createdAt: new Date(2025, 2, 20, 10, 25, 0 - index),
            updatedAt: new Date(2025, 2, 20, 10, 25, 0 - index),
        }));
    });

    describe('Try Branch Tests', () => {
        it("should verify correct query chain parameters", async () => {
            const { photo, ...expectedProduct } = mockProducts[0];

            productModel.findOne = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                populate: jest.fn().mockResolvedValue(expectedProduct),
            });

            await getSingleProductController(req, res);

            expect(productModel.findOne).toHaveBeenCalledWith({ slug: 'product-1' });
            expect(productModel.findOne().select).toHaveBeenCalledWith("-photo");
            expect(productModel.findOne().populate).toHaveBeenCalledWith("category");
        });

        it("should return product when product is found and no errors occur", async () => {
            const { photo, ...expectedProduct } = mockProducts[0];


            productModel.findOne = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                populate: jest.fn().mockResolvedValue(expectedProduct),
            });

            await getSingleProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Single product fetched",
                product: expectedProduct,
            });
        });

        it("should return null when product is not found and no errors occur", async () => {
            productModel.findOne = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                populate: jest.fn().mockResolvedValue(null),
            });

            await getSingleProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Single product fetched",
                product: null,
            });
        });
    });

    describe('Catch Branch Tests', () => {
        it('should return an error when an error occurs during product retrieval', async () => {
            const errorMessage = "Database error";
            const error = new Error(errorMessage);

            productModel.findOne = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                populate: jest.fn().mockRejectedValue(error)
            });

            await getSingleProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Error while getting single product",
                error: error,
            });
        });
    });
});