const mongoose = require("mongoose");

const parkingSlotSchema = mongoose.Schema(
  {
    slotId: {
      type: String,
      required: true,
      unique: true,
    },
    parkingZone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParkingZone",
      required: true,
    },
    slotType: {
      type: String,
      enum: ["COMPACT", "REGULAR", "LARGE"],
      required: true,
    },
    pricePerHour: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"],
      default: "AVAILABLE",
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    occupiedByVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ParkingSlot = mongoose.model("ParkingSlot", parkingSlotSchema);
module.exports = ParkingSlot;
