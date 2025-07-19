const express = require("express");
const {
  getAllPaymentStatuses,
  getPaymentStatusById,
} = require("../controllers/paymentStatusController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const router = express.Router();

router.route("/admin").get(protect, authorize("ADMIN"), getAllPaymentStatuses);

router
  .route("/admin/:id")
  .get(protect, authorize("ADMIN"), getPaymentStatusById);

module.exports = router;
