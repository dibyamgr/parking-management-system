const express = require("express");
const { getAllLogs, getLogById } = require("../controllers/logController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const router = express.Router();

router.route("/").get(protect, authorize("ADMIN"), getAllLogs);

router.route("/:id").get(protect, authorize("ADMIN"), getLogById);

module.exports = router;
