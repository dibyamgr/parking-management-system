const express = require("express");
const {
  getParkingZones,
  createParkingZone,
  getParkingZoneById,
  updateParkingZone,
  deleteParkingZone,
} = require("../controllers/parkingZoneController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

router
  .route("/")
  .get(getParkingZones)
  .post(protect, authorize("ADMIN"), createParkingZone);

router
  .route("/:id")
  .get(getParkingZoneById)
  .put(protect, authorize("ADMIN"), updateParkingZone)
  .delete(protect, authorize("ADMIN"), deleteParkingZone);

module.exports = router;
