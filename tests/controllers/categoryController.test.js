import { expect, jest } from "@jest/globals";
import { deleteCategoryCOntroller, updateCategoryController } from "../../controllers/categoryController";
import categoryModel from "../../models/categoryModel";


jest.mock("../../models/categoryModel");

let req = {
    body: {}, params: {}
}

let res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
    json: jest.fn()
};

const mockCategories = [
    { name: "category1", slug: "category1" },
    { name: "category2", slug: "category2" },
    { name: "category3", slug: "category3" },
    { name: "category4", slug: "category4" },
];

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