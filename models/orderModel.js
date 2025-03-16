import mongoose from "mongoose";

const productInOrderSchema = new mongoose.Schema({
  _id: { type: mongoose.ObjectId, required: true }, 
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
}, { _id: false }); // Prevent Mongoose from adding a new _id

const orderSchema = new mongoose.Schema(
  {
    products: {
      type: [productInOrderSchema], 
      validate: {
        validator: function (products) {
          return products && products.length >= 1;
        },
        message: "At least one product is required.",
      },
    },
    payment: {
      type: Object,
      required: [true, "Payment is required."],
    },
    buyer: {
      type: mongoose.ObjectId,
      ref: "users",
      required: [true, "Buyer userId is required"],
    },
    status: {
      type: String,
      default: "Not Processed",
      enum: ["Not Processed", "Processing", "Shipped", "Delivered", "Cancelled"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);