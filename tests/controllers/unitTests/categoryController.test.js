import { expect, jest } from "@jest/globals";
import { deleteCategoryCOntroller, updateCategoryController, createCategoryController } from "../../../controllers/categoryController";
import categoryModel from "../../../models/categoryModel";


jest.mock("../../models/categoryModel");

let req = {
    body: {}, params: {}
}

let res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
};

const mockCategories = [
    { name: "category1", slug: "category1" },
    { name: "category2", slug: "category2" },
    { name: "category3", slug: "category3" }
];

describe("createCategoryController", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("Success creating category with status 201", async () => {
        req.body = { name: "category1" };
        categoryModel.findOne = jest.fn().mockResolvedValue(false); // no existing category
        categoryModel.prototype.save = jest.fn().mockResolvedValue(true);
        await createCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "New category created",
            category: true,
        });
    })

    it("Success creating existing category with status 200", async () => {
        req.body = { name: "category1" };
        categoryModel.findOne = jest.fn().mockResolvedValue(true); // existing category
        await createCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Category already exists",
        });
    })

    it("Error when missing name with status 401", async () => {
        req.body = {};
        await createCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
            message: "Name is required",
        });
    })

    it("Error when save method fails with status 500", async () => {
        req.body = { name: "category1" };
        categoryModel.findOne = jest.fn().mockResolvedValue(false); // no existing category
        categoryModel.prototype.save = jest.fn().mockRejectedValue(new Error("Internal Server Error"));
        await createCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error in category",
            error: new Error("Internal Server Error"),
        });
    })

    it("Error when find method fails with status 500", async () => {
        req.body = { name: "category1" };
        categoryModel.findOne = jest.fn().mockRejectedValue(new Error("Internal Server Error"));
        await createCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error in category",
            error: new Error("Internal Server Error"),
        });
    })

});

describe("updateCategoryController", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("Success updating category with status 200", async () => {
        req.body = { name: "category1" };
        req.params.id = "1";
        categoryModel.findByIdAndUpdate = jest.fn().mockResolvedValue(true);
        await updateCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Category updated successfully",
            category: true,
        });
    });

    it("Error updating category with status 500", async () => {
        req.body = { name: "category1" };
        req.params.id = "1";
        categoryModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error("Internal Server Error"));
        await updateCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error while updating category",
            error: new Error("Internal Server Error"),
        });
    });

});

describe("deleteCategoryController", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("Success deleting category with status 200", async () => {
        req.params.id = "1";
        categoryModel.findByIdAndDelete = jest.fn().mockResolvedValue(true);
        await deleteCategoryCOntroller(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Category deleted successfully",
        });
    });

    it("Error deleting category with status 500", async () => {
        req.params.id = "1";
        categoryModel.findByIdAndDelete = jest.fn().mockRejectedValue(new Error("Internal Server Error"));
        await deleteCategoryCOntroller(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error while deleting category",
            error: new Error("Internal Server Error"),
        });
    });

});