const express = require("express");
const {
  startParkingSession,
  endParkingSession,
  getUserParkingSessions,
  getParkingSessionById,
  getAllParkingSessions,
} = require("../controllers/parkingSessionController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/start", protect, startParkingSession);
router.post("/:id/end", protect, endParkingSession);

router.get("/my", protect, getUserParkingSessions);
router.get("/:id", protect, getParkingSessionById);

router.get("/admin/all", protect, authorize("ADMIN"), getAllParkingSessions);

module.exports = router;
