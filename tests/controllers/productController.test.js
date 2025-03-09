import { expect, jest } from "@jest/globals";
import { deleteProductController } from "../../controllers/productController";
import productModel from "../../models/productModel";


jest.mock("../../models/productModel");

let req = {
    body: {}, params: {}
}

let res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
};

describe("deleteProductController", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("success delete", async () => {
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

    it("error delete", async () => {
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