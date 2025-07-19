const PaymentStatus = require("../models/PaymentStatus");

const getAllPaymentStatuses = async (req, res) => {
  try {
    const statuses = await PaymentStatus.find({});
    res.json(statuses);
  } catch (error) {
    console.error("Error fetching all payment statuses:", error);
    res
      .status(500)
      .json({ message: "Server error fetching payment statuses." });
  }
};

const getPaymentStatusById = async (req, res) => {
  try {
    const status = await PaymentStatus.findById(req.params.id);
    if (status) {
      res.json(status);
    } else {
      res.status(404).json({ message: "Payment Status not found." });
    }
  } catch (error) {
    console.error("Error fetching payment status by ID:", error);
    res
      .status(500)
      .json({ message: "Server error fetching payment status details." });
  }
};

module.exports = {
  getAllPaymentStatuses,
  getPaymentStatusById,
};
