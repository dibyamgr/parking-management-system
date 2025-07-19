const express = require("express");
const {
  getUserInvoices,
  getInvoiceById,
  payInvoice,
  getAllInvoices,
} = require("../controllers/invoiceController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const router = express.Router();

router.get("/my", protect, getUserInvoices);
router.get("/:id", protect, getInvoiceById);
router.post("/:id/pay", protect, payInvoice);

router.get("/admin/all", protect, authorize("ADMIN"), getAllInvoices);

module.exports = router;
