const express = require("express");
const {
  getParkingSlots,
  getParkingSlotById,
  createParkingSlot,
  updateParkingSlot,
  deleteParkingSlot,
  searchParkingSlots,
} = require("../controllers/parkingSlotController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const router = express.Router();

router.get("/search", searchParkingSlots);

router
  .route("/")
  .get(getParkingSlots)
  .post(protect, authorize("ADMIN"), createParkingSlot);

router
  .route("/:id")
  .get(getParkingSlotById)
  .put(protect, authorize("ADMIN"), updateParkingSlot)
  .delete(protect, authorize("ADMIN"), deleteParkingSlot);

module.exports = router;
