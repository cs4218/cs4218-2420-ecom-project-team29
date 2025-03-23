import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";

import fs from "fs";
import slugify from "slugify";
import braintree from "braintree";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

//payment gateway
var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

export const createProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;
    //validation
    switch (true) {
      case !name:
        return res.status(500).send({ error: "Name is Required" });
      case !description:
        return res.status(500).send({ error: "Description is Required" });
      case !price:
        return res.status(500).send({ error: "Price is Required" });
      case price < 0:
        return res
          .status(500)
          .send({ error: "Price should be greater than 0" });
      case !category:
        return res.status(500).send({ error: "Category is Required" });
      case !quantity:
        return res.status(500).send({ error: "Quantity is Required" });
      case quantity < 0:
        return res
          .status(500)
          .send({ error: "Quantity should be greater than 0" });
      case photo && photo.size > 1000000:
        return res
          .status(500)
          .send({ error: "Photo size should be at most 1MB" });
    }

    // check if product slug already exists
    const productSlugExist = await productModel.findOne({ slug: slugify(name) });
    if (productSlugExist) {
      return res.status(500).send({
        success: false,
        error: "Product with a similar name exists",
      });
    }

    // check if product name already exists
    const productNameExist = await productModel.findOne({ name });
    if (productNameExist) {
      return res.status(500).send({
        success: false,
        error: "Product with a similar name exists",
      });
    }

    const products = new productModel({ ...req.fields, slug: slugify(name) });
    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }
    await products.save();
    res.status(201).send({
      success: true,
      message: "Product created successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in creating product",
    });
  }
};

//get all products
export const getProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate("category")
      .select("-photo")
      .limit(12)
      .sort({ createdAt: -1 });
    if (!products.length) {
      return res.status(200).send({
        success: true,
        countTotal: 0,
        message: "No products found",
        products: [],
      });
    }
    res.status(200).send({
      success: true,
      countTotal: products.length,
      message: "All products fetched",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting products",
      error,
    });
  }
};
// get single product
export const getSingleProductController = async (req, res) => {
  try {
    const product = await productModel
      .findOne({ slug: req.params.slug })
      .select("-photo")
      .populate("category");
    res.status(200).send({
      success: true,
      message: "Single product fetched",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting single product",
      error,
    });
  }
};

// get all product details with array of product's id

export const getProductDetailsController = async (req, res) => {
  const idsString = req.query.ids;
  console.log(idsString);

  if (!idsString) {
    return res.status(400).send({
      success: false,
      message: "Ids are required",
    });
  }

  const ids = idsString.split(",");

  if (!ids.every((id) => mongoose.Types.ObjectId.isValid(id))) {
    return res.status(400).send({
      success: false,
      message: "Invalid product Id(s) provided",
    });
  }

  try {
    // Find all products that exist
    const foundProducts = await productModel.find({ _id: { $in: ids } });
    console.log(foundProducts);

    // Create a map of found products by ID for easy lookup
    const productMap = {};
    foundProducts.forEach((product) => {
      productMap[product._id.toString()] = product;
    });

    // Create the final products array with empty objects for missing IDs
    const products = ids.map((id) => {
      return productMap[id] || { _id: id };
    });

    res.status(200).send({
      success: true,
      message: "Product details fetched successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting product details",
      error,
    });
  }
};

// get photo
export const productPhotoController = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid).select("photo");
    if (product.photo.data) {
      res.set("Content-type", product.photo.contentType);
      return res.status(200).send(product.photo.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting photo",
      error,
    });
  }
};

//delete controller
export const deleteProductController = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.params.pid).select("-photo");
    res.status(200).send({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting product",
      error,
    });
  }
};

//update product
export const updateProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;
    //alidation
    switch (true) {
      case !name:
        return res.status(500).send({ error: "Name is Required" });
      case !description:
        return res.status(500).send({ error: "Description is Required" });
      case !price:
        return res.status(500).send({ error: "Price is Required" });
      case price < 0:
        return res
          .status(500)
          .send({ error: "Price should be greater than 0" });
      case !category:
        return res.status(500).send({ error: "Category is Required" });
      case !quantity:
        return res.status(500).send({ error: "Quantity is Required" });
      case quantity < 0:
        return res
          .status(500)
          .send({ error: "Quantity should be greater than 0" });
      case photo && photo.size > 1000000:
        return res
          .status(500)
          .send({ error: "Photo size should be at most 1MB" });
    }

    // check if product slug already exists
    const productSlugExist = await productModel.findOne({ slug: slugify(name), _id: { $ne: req.params.pid } });
    if (productSlugExist) {
      return res.status(500).send({
        success: false,
        error: "Product with a similar name exists",
      });
    }

    // check if product name already exists
    const productNameExist = await productModel.findOne({ name, _id: { $ne: req.params.pid } });
    if (productNameExist) {
      return res.status(500).send({
        success: false,
        error: "Product with a similar name exists",
      });
    }

    const products = await productModel.findByIdAndUpdate(
      req.params.pid,
      { ...req.fields, slug: slugify(name) },
      { new: true }
    );
    if (products.photo && photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }
    await products.save();
    res.status(201).send({
      success: true,
      message: "Product updated successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in updating product",
    });
  }
};

// filters
export const productFiltersController = async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {};
    if (checked.length > 0) args.category = checked;
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
    const products = await productModel.find(args);
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error while filtering products",
      error,
    });
  }
};

// product count
export const productCountController = async (req, res) => {
  try {
    const total = await productModel.find({}).estimatedDocumentCount();
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      message: "Error in product count",
      error,
      success: false,
    });
  }
};

// product list base on page
export const productListController = async (req, res) => {
  try {
    const perPage = 6;
    const page = req.params.page ? req.params.page : 1;
    const products = await productModel
      .find({})
      .select("-photo")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error in per page ctrl",
      error,
    });
  }
};

// search product
export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;
    const resutls = await productModel
      .find({
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
        ],
      })
      .select("-photo");
    res.json(resutls);
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error in search product API",
      error,
    });
  }
};

// similar products
export const realtedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;
    const products = await productModel
      .find({
        category: cid,
        _id: { $ne: pid },
      })
      .select("-photo")
      .limit(3)
      .populate("category");
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error while getting related products",
      error,
    });
  }
};

// get prdocyst by catgory
export const productCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    const products = await productModel.find({ category }).populate("category");
    res.status(200).send({
      success: true,
      category,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      error,
      message: "Error while getting products",
    });
  }
};

//payment gateway api
//token
export const braintreeTokenController = async (req, res) => {
  try {
    gateway.clientToken.generate({}, function (err, response) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send(response);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

//payment
export const brainTreePaymentController = async (req, res) => {
  try {
    const { nonce, cart } = req.body;

    // Validate inputs
    if (!nonce || !cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Invalid payment information",
      });
    }

    console.log(cart);
    let total = 0;
    // add total
    cart.map((item) => {
      total = total + item.price;
    });
    console.log(total);

    // Convert callback to Promise for cleaner async/await
    const processTransaction = () => {
      return new Promise((resolve, reject) => {
        gateway.transaction.sale(
          {
            amount: total,
            paymentMethodNonce: nonce,
            options: {
              submitForSettlement: true,
            },
          },
          function (error, result) {
            if (error) reject(error);
            else resolve(result);
          }
        );
      });
    };

    const result = await processTransaction();

    if (result.success) {
      const order = await new orderModel({
        products: cart,
        payment: result,
        buyer: req.user._id,
      }).save();

      return res.json({ ok: true });
    } else {
      return res.status(400).json({
        ok: false,
        message: "Payment failed",
        result,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
