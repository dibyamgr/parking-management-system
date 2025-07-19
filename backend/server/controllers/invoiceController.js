const Invoice = require("../models/Invoice");
const PaymentStatus = require("../models/PaymentStatus");
const Log = require("../models/Log");
const sendEmail = require("../utils/sendEmail");
const { format } = require("date-fns");

const getUserInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id })
      .populate("user", "name email")
      .populate({
        path: "parkingSession",
        populate: { path: "parkingSlot vehicle" },
      })
      .populate("paymentStatus")
      .sort({ issueDate: -1 });
    res.json(invoices);
  } catch (error) {
    console.error("Error fetching user invoices:", error);
    res.status(500).json({ message: "Server error fetching your invoices." });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("user", "name email")
      .populate({
        path: "parkingSession",
        populate: { path: "parkingSlot vehicle" },
      })
      .populate("paymentStatus");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }
    if (
      req.user.role !== "ADMIN" &&
      invoice.user._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this invoice." });
    }
    res.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice by ID:", error);
    res.status(500).json({ message: "Server error fetching invoice details." });
  }
};

const payInvoice = async (req, res) => {
  const invoiceId = req.params.id;
  try {
    const invoice = await Invoice.findById(invoiceId)
      .populate("paymentStatus")
      .populate("user")
      .populate({
        path: "parkingSession",
        populate: { path: "parkingSlot vehicle" },
      });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }
    if (
      req.user.role !== "ADMIN" &&
      invoice.user._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to pay this invoice." });
    }
    if (invoice.paymentStatus.status === "PAID") {
      return res
        .status(400)
        .json({ message: "Invoice is already marked as PAID." });
    }

    const paymentStatus = await PaymentStatus.findById(
      invoice.paymentStatus._id
    );
    paymentStatus.status = "PAID";
    paymentStatus.date = new Date();
    await paymentStatus.save();

    invoice.paymentStatus = paymentStatus._id;
    await invoice.save();

    await Log.create({
      action: "Invoice Paid",
      userId: req.user._id,
      details: {
        invoiceId: invoice._id,
        amount: invoice.amount,
        status: "PAID",
      },
    });

    await sendEmail({
      email: invoice.user.email,
      subject: `UniPark Payment Confirmation - Invoice ${invoice._id}`,
      html: `
                <h1>Payment Confirmed!</h1>
                <p>Hello ${invoice.user.name},</p>
                <p>Your payment for Invoice <strong>${
                  invoice._id
                }</strong> has been successfully processed.</p>
                <p><strong>Amount Paid:</strong> $${invoice.amount.toFixed(
                  2
                )}</p>
                <p><strong>Payment Date:</strong> ${format(
                  paymentStatus.date,
                  "PPPp"
                )}</p>
                <p>Thank you for using UniPark!</p>
            `,
    });

    res.json({
      message: "Invoice paid successfully.",
      invoice: await invoice.populate("paymentStatus"),
    });
  } catch (error) {
    console.error("Error paying invoice:", error);
    res
      .status(500)
      .json({ message: "Server error processing payment: " + error.message });
  }
};

const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({})
      .populate("user", "name email")
      .populate({
        path: "parkingSession",
        populate: { path: "parkingSlot vehicle" },
      })
      .populate("paymentStatus")
      .sort({ issueDate: -1 });
    res.json(invoices);
  } catch (error) {
    console.error("Error fetching all invoices (Admin):", error);
    res.status(500).json({ message: "Server error fetching all invoices." });
  }
};

module.exports = {
  getUserInvoices,
  getInvoiceById,
  payInvoice,
  getAllInvoices,
};
