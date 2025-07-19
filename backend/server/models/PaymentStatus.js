const mongoose = require("mongoose");

const paymentStatusSchema = mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    date: {
      // Date when the status was last updated (e.g., payment date)
      type: Date,
      default: null,
    },
    transactionId: {
      // Optional: ID from payment gateway
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const PaymentStatus = mongoose.model("PaymentStatus", paymentStatusSchema);
module.exports = PaymentStatus;
