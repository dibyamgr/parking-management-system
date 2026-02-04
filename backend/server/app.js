// backend/server/app.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const parkingZonesRoutes = require("./routes/parkingZoneRoutes");
const parkingSlotRoutes = require("./routes/parkingSlotRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const parkingSessionRoutes = require("./routes/parkingSessionRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const logRoutes = require('./routes/logRoutes');
const paymentStatusRoutes = require("./routes/paymentStatusRoutes");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/parking-zones", parkingZonesRoutes);
app.use("/api/parking-slots", parkingSlotRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/parking-sessions", parkingSessionRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use('/api/logs', logRoutes);
app.use("/api/payment-statuses", paymentStatusRoutes);

module.exports = app;