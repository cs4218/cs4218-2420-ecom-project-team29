import { expect, jest } from "@jest/globals";
import { deleteCategoryCOntroller, updateCategoryController, createCategoryController } from "../../controllers/categoryController";
import categoryModel from "../../models/categoryModel";


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

    it("success create w 201", async () => {
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

    it("success create existing category w 200", async () => {
        req.body = { name: "category1" };
        categoryModel.findOne = jest.fn().mockResolvedValue(true); // existing category
        await createCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Category Already Exisits",
        });
    })

    it("error when missing name", async () => {
        req.body = {};
        await createCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
            message: "Name is required",
        });
    })

    it("error when save fails", async () => {
        req.body = { name: "category1" };
        categoryModel.findOne = jest.fn().mockResolvedValue(false); // no existing category
        categoryModel.prototype.save = jest.fn().mockRejectedValue(new Error("Internal Server Error"));
        await createCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error in Category",
            error: new Error("Internal Server Error"),
        });
    })

    it("error when find fails", async () => {
        req.body = { name: "category1" };
        categoryModel.findOne = jest.fn().mockRejectedValue(new Error("Internal Server Error"));
        await createCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error in Category",
            error: new Error("Internal Server Error"),
        });
    })

});

describe("updateCategoryController", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("success update", async () => {
        req.body = { name: "category1" };
        req.params.id = "1";
        categoryModel.findByIdAndUpdate = jest.fn().mockResolvedValue(true);
        await updateCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Category Updated Successfully",
            category: true,
        });
    });

    it("error update", async () => {
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

    it("success delete", async () => {
        req.params.id = "1";
        categoryModel.findByIdAndDelete = jest.fn().mockResolvedValue(true);
        await deleteCategoryCOntroller(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Category Deleted Successfully",
        });
    });

    it("error delete", async () => {
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