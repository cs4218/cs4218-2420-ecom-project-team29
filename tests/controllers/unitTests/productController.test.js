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
 } from "../../../controllers/productController";
import productModel from "../../../models/productModel";
import categoryModel from "../../../models/categoryModel";
import fs from "fs";

jest.mock("../../models/productModel");
jest.mock("../../models/categoryModel");
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

describe('productCountController Tests', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();

        req = {};  
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };
    });

    it('should return total product count successfully', async () => {
        const mockTotal = 10;
        productModel.find = jest.fn().mockReturnValue({
            estimatedDocumentCount: jest.fn().mockResolvedValue(mockTotal)
        });

        await productCountController(req, res);

        expect(productModel.find).toHaveBeenCalledWith({});
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            total: mockTotal
        });
    });

    it('should return zero when no products exist', async () => {
        productModel.find = jest.fn().mockReturnValue({
            estimatedDocumentCount: jest.fn().mockResolvedValue(0)
        });

        await productCountController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            total: 0
        });
    });
    

  
    it('should handle database errors', async () => {
        const error = new Error('Database error');
        productModel.find = jest.fn().mockReturnValue({
            estimatedDocumentCount: jest.fn().mockRejectedValue(error)
        });

        await productCountController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
            message: "Error in product count",
            error: error,
            success: false
        });
    });    
});

describe('productListController Tests', () => {
    let req, res, mockProducts, mockCategories;

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();

        req = {
            params: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
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

    
    it('should return first page (default) when no page parameter provided', async () => {
        productModel.find = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            sort: jest.fn().mockResolvedValue(mockProducts.slice(0, 6))
        });

        await productListController(req, res);

        expect(productModel.find).toHaveBeenCalledWith({});
        expect(productModel.find().select).toHaveBeenCalledWith('-photo');
        expect(productModel.find().skip).toHaveBeenCalledWith(0);
        expect(productModel.find().limit).toHaveBeenCalledWith(6);
        expect(productModel.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            products: mockProducts.slice(0, 6)
        });
    });

    it('should return correct page when page parameter is provided', async () => {
        req.params.page = '2';
        const mockFind = {
            select: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            sort: jest.fn().mockResolvedValue(mockProducts.slice(6, 10))
        };
        productModel.find = jest.fn().mockReturnValue(mockFind);

        await productListController(req, res);

        expect(mockFind.skip).toHaveBeenCalledWith(6); 
        expect(mockFind.limit).toHaveBeenCalledWith(6);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            products: mockProducts.slice(6, 10)
        });
    });

    it('should handle database errors', async () => {
        const error = new Error('Database error');

        productModel.find = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            sort: jest.fn().mockRejectedValue(error)
        });

        await productListController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error in per page ctrl",
            error: error
        });
    });

    it('should handle invalid page parameter', async () => {
        req.params.page = 'invalid'; 

        await productListController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error in per page ctrl",
            error: expect.any(Error)
        });
    });
    
});


describe('searchProductController Tests', () => {
    let req, res, mockCategories, mockProducts;

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();

        req = {
            params: {
                keyword: ''
            }
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };

        // Mock categories
        mockCategories = Array.from({ length: 2 }, (_, index) => ({
            _id: `${index + 1}`,
            name: index === 0 ? 'Drinks' : 'Snacks',
            slug: index === 0 ? 'drinks' : 'snacks',
        }));

        // Mock products with drinks and snacks
        mockProducts = [
            {
                _id: '1',
                name: 'Cold Pressed Green Juice',
                slug: 'cold-pressed-green-juice',
                description: 'Healthy plant-based beverage with fresh vegetables',
                price: 5,
                category: mockCategories[0],
                quantity: 15,
                photo: "some-photo",
                shipping: true,
                createdAt: new Date(2025, 2, 20, 10, 25, 0),
                updatedAt: new Date(2025, 2, 20, 10, 25, 0)
            },
            {
                _id: '2',
                name: 'Saltine Crackers',
                slug: 'saltine-crackers',
                description: 'Classic crispy crackers perfect for snacking',
                price: 4,
                category: mockCategories[1],
                quantity: 20,
                photo: "some-photo",
                shipping: false,
                createdAt: new Date(2025, 2, 20, 10, 24, 0),
                updatedAt: new Date(2025, 2, 20, 10, 24, 0)
            },
            {
                _id: '3',
                name: 'Bone Broth Soup',
                slug: 'bone-broth-soup',
                description: 'Nutritious sipping bone broth for healthy snacking',
                price: 7,
                category: mockCategories[0],
                quantity: 12,
                photo: "some-photo",
                shipping: true,
                createdAt: new Date(2025, 2, 20, 10, 23, 0),
                updatedAt: new Date(2025, 2, 20, 10, 23, 0)
            }
        ];
    });

    it('should find products by name', async () => {
        req.params = { keyword: 'Crackers' };
        const expectedProducts = [mockProducts[1]];
   
        productModel.find = jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(expectedProducts),
        });

        await searchProductController(req, res);

        expect(productModel.find).toHaveBeenCalledWith({
            $or: [
                { name: { $regex: 'Crackers', $options: "i" } },
                { description: { $regex: 'Crackers', $options: "i" } }
            ]
        });
        expect(productModel.find().select).toHaveBeenCalledWith('-photo');
        expect(res.json).toHaveBeenCalledWith(expectedProducts);
    });

    it('should find products by description', async () => {
        req.params = { keyword: 'healthy' };
        const expectedProducts = [mockProducts[0], mockProducts[2]];

        productModel.find = jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(expectedProducts),
        });

        await searchProductController(req, res);

        expect(productModel.find).toHaveBeenCalledWith({
            $or: [
                { name: { $regex: 'healthy', $options: "i" } },
                { description: { $regex: 'healthy', $options: "i" } }
            ]
        });
        expect(productModel.find().select).toHaveBeenCalledWith('-photo');
        expect(res.json).toHaveBeenCalledWith(expectedProducts);
    });

    it('should return empty array for no matches', async () => {
        req.params = { keyword: 'chocolate' };

        productModel.find = jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue([]),
        });

        await searchProductController(req, res);

        expect(productModel.find).toHaveBeenCalledWith({
            $or: [
                { name: { $regex: 'chocolate', $options: "i" } },
                { description: { $regex: 'chocolate', $options: "i" } }
            ]
        });
        expect(productModel.find().select).toHaveBeenCalledWith('-photo');
        expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should handle database errors', async () => {
        req.params = { keyword: 'test' };
        const databaseError = new Error('Database connection failed');

        
        productModel.find = jest.fn().mockReturnValue({
            select: jest.fn().mockRejectedValue(databaseError),
        });
        

        await searchProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error in search product API",
            error: databaseError
        });
    });
});


describe('relatedProductController Tests', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();

        req = {
            params: {
                pid: '1', 
                cid: '2'  
            }
        };
        res = {
            send: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
    });
    
    it("should return related products successfully", async () => {
        const expectedProducts = [
          {
            _id: "2",
            name: "Saltine Crackers",
            slug: "saltine-crackers",
            description: "Classic crispy crackers perfect for snacking",
            price: 4,
            category: { _id: "2", name: "Snacks", slug: "snacks" },
            quantity: 20,
            photo: "some-photo",
            shipping: false,
            createdAt: new Date(2025, 2, 20, 10, 24, 0),
            updatedAt: new Date(2025, 2, 20, 10, 24, 0),
          },
          {
            _id: "3",
            name: "Bone Broth Soup",
            slug: "bone-broth-soup",
            description: "Nutritious sipping bone broth for healthy snacking",
            price: 7,
            category: { _id: "2", name: "Snacks", slug: "snacks" },
            quantity: 12,
            photo: "some-photo",
            shipping: true,
            createdAt: new Date(2025, 2, 20, 10, 23, 0),
            updatedAt: new Date(2025, 2, 20, 10, 23, 0),
          },
        ];
    
        const mockPopulate = jest.fn().mockResolvedValue(expectedProducts);
        const mockLimit = jest.fn().mockReturnValue({ populate: mockPopulate });
        const mockSelect = jest.fn().mockReturnValue({ limit: mockLimit });
        productModel.find = jest.fn().mockReturnValue({ select: mockSelect });
    
        await realtedProductController(req, res);
    
        expect(productModel.find).toHaveBeenCalledWith({
          category: req.params.cid,
          _id: { $ne: req.params.pid },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          products: expectedProducts,
        });
    
        await realtedProductController(req, res);
    
        expect(productModel.find).toHaveBeenCalledWith({
          category: req.params.cid,
          _id: { $ne: req.params.pid },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          products: expectedProducts,
        });
    });

    it("should handle errors while fetching related products", async () => {
        const databaseError = new Error("Database connection failed");
    
        const mockPopulate = jest.fn().mockRejectedValue(databaseError);
        const mockLimit = jest.fn().mockReturnValue({ populate: mockPopulate });
        const mockSelect = jest.fn().mockReturnValue({ limit: mockLimit });
        productModel.find = jest.fn().mockReturnValue({ select: mockSelect });
    
        await realtedProductController(req, res);
    
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Error while getting related products",
          error: databaseError,
        });
    });

    
});

describe('productCategoryController Tests', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            params: {
                slug: 'some-category-slug' 
            }
        };
        res = {
            send: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
    });

    it('should return products by category successfully', async () => {
        const mockCategory = { _id: '1', name: 'Snacks', slug: 'some-category-slug' };
        const expectedProducts = [
            {
                _id: '2',
                name: 'Saltine Crackers',
                slug: 'saltine-crackers',
                description: 'Classic crispy crackers perfect for snacking',
                price: 3.99,
                category: mockCategory,
                quantity: 20,
                photo: "some-photo",
                shipping: false,
                createdAt: new Date(2025, 2, 20, 10, 24, 0),
                updatedAt: new Date(2025, 2, 20, 10, 24, 0)
            },
            {
                _id: '3',
                name: 'Bone Broth Soup',
                slug: 'bone-broth-soup',
                description: 'Nutritious sipping bone broth for healthy snacking',
                price: 6.99,
                category: mockCategory,
                quantity: 12,
                photo: "some-photo",
                shipping: true,
                createdAt: new Date(2025, 2, 20, 10, 23, 0),
                updatedAt: new Date(2025, 2, 20, 10, 23, 0)
            }
        ];

        categoryModel.findOne = jest.fn().mockResolvedValue(mockCategory);
        productModel.find = jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(expectedProducts)
        });

        await productCategoryController(req, res);

        expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: req.params.slug });
        expect(productModel.find).toHaveBeenCalledWith({ category: mockCategory });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            category: mockCategory,
            products: expectedProducts,
        });
    });

    it('should handle errors while fetching products by category', async () => {
        const databaseError = new Error('Database connection failed');

        categoryModel.findOne.mockRejectedValue(databaseError);

        await productCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            error: databaseError,
            message: "Error while getting products",
        });
    });
});


