import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    products: {
      type: [
        {
          type: mongoose.ObjectId,
          ref: "Products",
        },
      ],
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
