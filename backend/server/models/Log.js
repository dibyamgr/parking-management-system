const mongoose = require("mongoose");

const logSchema = mongoose.Schema({
  action: {
    // e.g., 'User Registered', 'Parking Slot Created', 'Invoice Paid'
    type: String,
    required: true,
  },
  userId: {
    // User who performed the action
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  details: {
    type: Object,
  },
});

const Log = mongoose.model("Log", logSchema);
module.exports = Log;
