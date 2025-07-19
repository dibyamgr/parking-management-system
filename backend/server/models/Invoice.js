const mongoose = require("mongoose");

const invoiceSchema = mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    parkingSession: {
      // Link to the specific parking session
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParkingSession",
      required: true,
      unique: true, // One invoice per session
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      // Optional: For future payment reminders
      type: Date,
    },
    paymentStatus: {
      // Reference to the PaymentStatus document
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentStatus",
      required: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);
module.exports = Invoice;
