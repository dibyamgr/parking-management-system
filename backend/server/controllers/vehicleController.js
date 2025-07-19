const Vehicle = require("../models/Vehicle");
const ParkingSession = require("../models/ParkingSession");
const Log = require("../models/Log");

const getVehicles = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== "ADMIN") {
      query.owner = req.user._id;
    }
    const vehicles = await Vehicle.find(query).populate(
      "owner",
      "username email"
    );
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Server error fetching vehicles." });
  }
};

const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate(
      "owner",
      "username email"
    );
    if (vehicle) {
      if (
        req.user.role === "ADMIN" ||
        vehicle.owner._id.toString() === req.user._id.toString()
      ) {
        res.json(vehicle);
      } else {
        res
          .status(403)
          .json({ message: "Not authorized to view this vehicle." });
      }
    } else {
      res.status(404).json({ message: "Vehicle not found." });
    }
  } catch (error) {
    console.error("Error fetching vehicle by ID:", error);
    res.status(500).json({ message: "Server error fetching vehicle details." });
  }
};

const createVehicle = async (req, res) => {
  const { licensePlate, vehicleType } = req.body;
  if (!licensePlate || !vehicleType) {
    return res
      .status(400)
      .json({ message: "Please include license plate and vehicle type." });
  }
  if (!["CAR", "BIKE", "SUV", "TRUCK"].includes(vehicleType.toUpperCase())) {
    return res.status(400).json({
      message: "Invalid vehicle type. Must be CAR, BIKE, SUV, or TRUCK.",
    });
  }
  const vehicleExists = await Vehicle.findOne({
    licensePlate: licensePlate.toUpperCase(),
  });
  if (vehicleExists) {
    return res.status(400).json({
      message: "Vehicle with this license plate is already registered.",
    });
  }
  try {
    const vehicle = await Vehicle.create({
      licensePlate: licensePlate.toUpperCase(),
      vehicleType: vehicleType.toUpperCase(),
      owner: req.user._id,
    });
    await Log.create({
      action: "Vehicle Added",
      userId: req.user._id,
      details: {
        vehicleId: vehicle._id,
        licensePlate: vehicle.licensePlate,
        vehicleType: vehicle.vehicleType,
      },
    });
    res.status(201).json(vehicle);
  } catch (error) {
    console.error("Error creating vehicle:", error);
    res.status(500).json({ message: "Server error creating vehicle." });
  }
};

const updateVehicle = async (req, res) => {
  const { licensePlate, vehicleType } = req.body;
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (vehicle) {
      if (
        req.user.role === "ADMIN" ||
        vehicle.owner.toString() === req.user._id.toString()
      ) {
        if (licensePlate) {
          const plateExists = await Vehicle.findOne({
            licensePlate: licensePlate.toUpperCase(),
            _id: { $ne: vehicle._id },
          });
          if (plateExists) {
            return res.status(400).json({
              message:
                "Another vehicle with this license plate already exists.",
            });
          }
          vehicle.licensePlate = licensePlate.toUpperCase();
        }
        if (vehicleType) {
          if (
            !["CAR", "BIKE", "SUV", "TRUCK"].includes(vehicleType.toUpperCase())
          ) {
            return res.status(400).json({ message: "Invalid vehicle type." });
          }
          vehicle.vehicleType = vehicleType.toUpperCase();
        }
        const updatedVehicle = await vehicle.save();
        await Log.create({
          action: "Vehicle Updated",
          userId: req.user._id,
          details: {
            vehicleId: updatedVehicle._id,
            newLicensePlate: updatedVehicle.licensePlate,
            updatedFields: Object.keys(req.body),
          },
        });
        res.json(updatedVehicle);
      } else {
        res
          .status(403)
          .json({ message: "Not authorized to update this vehicle." });
      }
    } else {
      res.status(404).json({ message: "Vehicle not found." });
    }
  } catch (error) {
    console.error("Error updating vehicle:", error);
    res.status(500).json({ message: "Server error updating vehicle." });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (vehicle) {
      if (
        req.user.role === "ADMIN" ||
        vehicle.owner.toString() === req.user._id.toString()
      ) {
        const activeSessions = await ParkingSession.countDocuments({
          // Use ParkingSession
          vehicle: vehicle._id,
          status: { $in: ["RESERVED", "ACTIVE"] },
        });
        if (activeSessions > 0) {
          return res.status(400).json({
            message:
              "Cannot delete vehicle with active or reserved parking sessions.",
          });
        }
        await vehicle.deleteOne();
        await Log.create({
          action: "Vehicle Deleted",
          userId: req.user._id,
          details: {
            deletedVehicleId: vehicle._id,
            licensePlate: vehicle.licensePlate,
          },
        });
        res.json({ message: "Vehicle removed successfully." });
      } else {
        res
          .status(403)
          .json({ message: "Not authorized to delete this vehicle." });
      }
    } else {
      res.status(404).json({ message: "Vehicle not found." });
    }
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({ message: "Server error deleting vehicle." });
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
