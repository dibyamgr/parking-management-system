const mongoose = require("mongoose");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const parkingZonesRoutes = require("./routes/parkingZoneRoutes");
const parkingSlotRoutes = require("./routes/parkingSlotRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const parkingSessionRoutes = require("./routes/parkingSessionRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const paymentStatusRoutes = require("./routes/paymentStatusRoutes");

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/parking-zones", parkingZonesRoutes);
app.use("/api/parking-slots", parkingSlotRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/parking-sessions", parkingSessionRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/admin/payment-statuses", paymentStatusRoutes);

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚗 Parking server running on port ${PORT}`);
});
