import { describe, expect, jest } from "@jest/globals";
import { 
    deleteProductController, 
    createProductController, 
    updateProductController, 
    getProductController, 
    getSingleProductController,
    productPhotoController,
    productFiltersController,
    productCountController,
    productListController,
    searchProductController,
    realtedProductController,
    productCategoryController,
 } from "../../controllers/productController";
import productModel from "../../models/productModel";
import fs from "fs";

jest.mock("../../models/productModel");
jest.mock("fs");

let req = {
    body: {}, params: {}, fields: {}, files: {},
}

let res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
};

const mockProduct = {
    name: "Product 1",
    description: "Product 1 description",
    price: 100,
    category: "1",
    quantity: 100,
    shipping: true,
    photo: {
        data: Buffer.from("data"),
        contentType: "image/png",
    }
}

describe("createProductController", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();

        req.fields = {
            name: "Product 1",
            description: "Product 1 description",
            price: 100,
            category: "1",
            quantity: 100,
            shipping: true,
        };
        req.files = {
            photo: {
                size: 32,
                path: '/folder/photo.png',
                name: 'photo.png',
                type: 'image/png',
            },
        }
        fs.readFileSync = jest.fn().mockReturnValue(Buffer.from("data"));
    });

    it("success creating product", async () => {
        productModel.prototype.save = jest.fn().mockResolvedValue(mockProduct);
        await createProductController(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it("create product error with missing name", async () => {
        req.fields.name = null

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Name is Required",
        });
    });

    it("create product error with missing description", async () => {
        req.fields.description = null

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Description is Required",
        });
    });

    it("create product error with missing price", async () => {
        req.fields.price = null

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Price is Required",
        });
    });

    it("create product error with invalid price", async () => {
        req.fields.price = -1

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Price should be greater than 0",
        });
    });

    it("create product error with missing category", async () => {
        req.fields.category = null

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Category is Required",
        });
    });

    it("create product error with missing quantity", async () => {
        req.fields.quantity = null

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Quantity is Required",
        });
    });

    it("create product error with invalid quantity", async () => {
        req.fields.quantity = -1

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Quantity should be greater than 0",
        });
    });

    it("create product error with photo size", async () => {
        req.files.photo.size = 1000001;

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Photo is required and should be less then 1mb",
        });
    });

    it("create product with missing photo wont crash", async () => {
        req.files.photo = null;

        productModel.prototype.save = jest.fn().mockResolvedValue(mockProduct);

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });


    it("create product with missing shipping wont crash", async () => {
        req.fields.shipping = null;

        productModel.prototype.save = jest.fn().mockResolvedValue(mockProduct);

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    it("create product with api error", async () => {
        productModel.prototype.save = jest.fn().mockRejectedValue(new Error("Internal Server Error"));

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error in creating product",
            error: new Error("Internal Server Error"),
        });
    });

});

describe("deleteProductController", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
    });

    it("success deleting product", async () => {
        req.params.pid = "1";

        productModel.findByIdAndDelete = jest.fn().mockReturnValue({
            findByIdAndDelete: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue({}),
        });

        await deleteProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Product deleted successfully",
        });
    });

    it("deleting product error with api error", async () => {
        req.params.id = "1";

        productModel.findByIdAndDelete = jest.fn().mockReturnValue({
            findByIdAndDelete: jest.fn().mockRejectedValue(new Error("Internal Server Error")),
            select: jest.fn().mockRejectedValue(new Error("Internal Server Error")),
        });

        await deleteProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error while deleting product",
            error: new Error("Internal Server Error"),
        });
    });

});

describe("updateProductController", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();

        req.fields = {
            name: "Product 1",
            description: "Product 1 description",
            price: 100,
            category: "1",
            quantity: 100,
            shipping: true,
        };
        req.files = {
            photo: {
                size: 32,
                path: '/folder/photo.png',
                name: 'photo.png',
                type: 'image/png',
            },
        }
        req.params.pid = "1";

        fs.readFileSync = jest.fn().mockReturnValue(Buffer.from("data"));

        productModel.findByIdAndUpdate = jest.fn().mockReturnValue({
            findByIdAndUpdate: jest.fn().mockResolvedValue(mockProduct),
            save: jest.fn().mockResolvedValue(mockProduct),
        });
        productModel.prototype.save = jest.fn().mockResolvedValue(mockProduct);
    });

    it("Success updating product", async () => {

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    it("update product error with missing name", async () => {
        req.fields.name = null;

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Name is Required",
        });
    });

    it("update product error with missing description", async () => {
        req.fields.description = null;

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Description is Required",
        });
    });

    it("update product error with missing price", async () => {
        req.fields.price = null;

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Price is Required",
        });
    });

    it("update product error with invalid price", async () => {
        req.fields.price = -1;

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Price should be greater than 0",
        });
    });

    it("update product error with missing category", async () => {
        req.fields.category = null;

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Category is Required",
        });
    });

    it("update product error with missing quantity", async () => {
        req.fields.quantity = null

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Quantity is Required",
        });
    });

    it("update product error with invalid quantity", async () => {
        req.fields.quantity = -1

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Quantity should be greater than 0",
        });
    });

    it("update product error with photo size", async () => {
        req.files.photo.size = 1000001;

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Photo is required and should be less then 1mb",
        });
    });

    it("update product with missing photo wont crash", async () => {
        req.files.photo = null;

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });


    it("update product with missing shipping wont crash", async () => {
        req.fields.shipping = null;

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    it("update product with api error", async () => {
        req.params.pid = "1";

        productModel.findByIdAndUpdate = jest.fn().mockReturnValue({
            findByIdAndUpdate: jest.fn().mockRejectedValue(new Error("Internal Server Error")),
            save: jest.fn().mockRejectedValue(new Error("Internal Server Error")),
        });
        productModel.prototype.save = jest.fn().mockRejectedValue(new Error("Internal Server Error"));

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error in updating product",
            error: new Error("Internal Server Error"),
        });
    });

});


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
                countTotal: 12,
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
                countTotal: 0,
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
                message: "Error in getting products",
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


describe('productPhotoController Tests', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();

        req = {
            params: {
                pid: '1'
            }
        };
        
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
        };
    });

    describe('Try Branch Tests', () => {
        it('should return photo when photo exists', async () => {
            const mockPhoto = {
                data: Buffer.from('mock-photo-data'),
                contentType: 'image/jpeg'
            };

            productModel.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({
                    photo: mockPhoto
                })
            });

            await productPhotoController(req, res);

            expect(productModel.findById).toHaveBeenCalledWith('1');
            expect(productModel.findById().select).toHaveBeenCalledWith('photo');
         
            expect(res.set).toHaveBeenCalledWith('Content-type', mockPhoto.contentType);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(mockPhoto.data);
        });

        
    });

    describe('Catch Branch Tests', () => {
        it('should handle database errors', async () => {
            const error = new Error('Database error');
            
            productModel.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockRejectedValue(error)
            });

            await productPhotoController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Error while getting photo",
                error: error
            });
        });

        it('should handle missing pid parameter', async () => {
            req.params = {}; 

            await productPhotoController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Error while getting photo",
                error: expect.any(Error)
            });
        });

        it('should handle invalid pid format', async () => {
            req.params = { pid: '' };  

            await productPhotoController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Error while getting photo",
                error: expect.any(Error)
            });
        });
    });
});


describe('productFiltersController Tests', () => {
    let req, res, mockProducts, mockCategories;

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();

        req = {
            body: {
                checked: [],
                radio: []
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
        it('should return all products when no filters applied', async () => {
            req.body = { checked: [], radio: [] };
            productModel.find = jest.fn().mockResolvedValue(mockProducts);

            await productFiltersController(req, res);

            expect(productModel.find).toHaveBeenCalledWith({});
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                products: mockProducts
            });
        });

        it('should filter by selected categories', async () => {
            req.body = { 
                checked: ['drinks', 'snacks'],
                radio: []
            };
            const filteredProducts = mockProducts.slice(0, 2);
            productModel.find = jest.fn().mockResolvedValue(filteredProducts);

            await productFiltersController(req, res);

            expect(productModel.find).toHaveBeenCalledWith({
                category: ['drinks', 'snacks']
            });
        });

        it('should filter by selected price range', async () => {
            req.body = {
                checked: [],
                radio: [0, 19]
            };
            const filteredProducts = mockProducts.slice(0, 3);
            productModel.find = jest.fn().mockResolvedValue(filteredProducts);

            await productFiltersController(req, res);

            expect(productModel.find).toHaveBeenCalledWith({
                price: { $gte: 0, $lte: 19 }
            });
        });

        it('should apply both category and price filters when both are provided', async () => {
            req.body = {
                checked: ['drinks'],
                radio: [20, 39]
            };
            const filteredProducts = [mockProducts[0]];

            productModel.find = jest.fn().mockResolvedValue(filteredProducts);

            await productFiltersController(req, res);

            expect(productModel.find).toHaveBeenCalledWith({
                category: ['drinks'],
                price: { $gte: 20, $lte: 39 }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                products: filteredProducts
            });
        });
    });

    describe('Catch Branch Tests', () => {
        it('should handle database errors', async () => {
            const error = new Error('Database error');
            productModel.find = jest.fn().mockRejectedValue(error);

            await productFiltersController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Error while filtering products",
                error: error
            });
        });

        it('should handle missing request body parameters', async () => {
            req.body = {};  

            await productFiltersController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Error while filtering products",
                error: expect.any(Error)
            });
        });
    });
});