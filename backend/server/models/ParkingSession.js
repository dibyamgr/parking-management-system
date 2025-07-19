const mongoose = require("mongoose");
const {
  differenceInHours,
  differenceInMinutes,
  parseISO,
} = require("date-fns"); // For duration calculation

const parkingSessionSchema = mongoose.Schema(
  {
    entryTime: {
      type: Date,
      required: true,
    },
    exitTime: {
      // Expected exit time for reservation, or actual exit time when session ends
      type: Date,
      required: true,
    },
    actualExitTime: {
      // When the vehicle actually left
      type: Date,
      default: null,
    },
    parkingSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParkingSlot",
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    user: {
      // User who booked/started the session
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["RESERVED", "ACTIVE", "COMPLETED", "CANCELLED"],
      default: "RESERVED", // RESERVED means booked but not yet entered
    },
    invoice: {
      // Link to the invoice generated for this session
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },
    durationHours: {
      // Calculated upon exit/completion
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Method to calculate duration (used when ending a session)
parkingSessionSchema.methods.calculateDuration = function () {
  const start = this.entryTime;
  const end = this.actualExitTime || this.exitTime; // Use actualExitTime if available, else expected exitTime

  if (start && end) {
    // Calculate duration in minutes, then convert to hours (ceil for billing to nearest hour/part)
    const minutes = differenceInMinutes(end, start);
    this.durationHours = Math.ceil(minutes / 60); // Bill for partial hours as full hours
  } else {
    this.durationHours = 0;
  }
  return this.durationHours;
};

const ParkingSession = mongoose.model("ParkingSession", parkingSessionSchema);
module.exports = ParkingSession;
