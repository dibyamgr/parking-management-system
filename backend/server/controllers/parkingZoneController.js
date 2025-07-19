const ParkingZone = require("../models/ParkingZone");

const getParkingZones = async (req, res) => {
  try {
    const zones = await ParkingZone.find({});
    res.json(zones);
  } catch (error) {
    console.error("Error fetching parking zones:", error);
    res.status(500).json({ message: "Server error fetching parking zones." });
  }
};

const getParkingZoneById = async (req, res) => {
  try {
    const zone = await ParkingZone.findOne({ zoneId: req.params.id });

    if (zone) {
      res.json(zone);
    } else {
      res.status(404).json({ message: "Parking Zone not found." });
    }
  } catch (error) {
    console.error("Error fetching parking zone by ID:", error);
    res
      .status(500)
      .json({ message: "Server error fetching parking zone details." });
  }
};

const createParkingZone = async (req, res) => {
  const { zoneId, name, address, latitude, longitude, description } = req.body;
  if (
    !zoneId ||
    !name ||
    !address ||
    latitude === undefined ||
    longitude === undefined
  ) {
    return res.status(400).json({
      message:
        "Please include zone ID, name, address, latitude, and longitude.",
    });
  }

  if (isNaN(latitude) || isNaN(longitude)) {
    return res
      .status(400)
      .json({ message: "Latitude and longitude must be valid numbers." });
  }

  const zoneExists = await ParkingZone.findOne({ zoneId });
  if (zoneExists) {
    return res
      .status(400)
      .json({ message: "Parking Zone with this ID already exists." });
  }

  try {
    const parkingZone = await ParkingZone.create({
      zoneId,
      name,
      address,
      location: { latitude, longitude },
      description,
    });
    // await Log.create({
    //   action: "Parking Zone Created",
    //   userId: req.user._id,
    //   details: {
    //     zoneId: parkingZone.zoneId,
    //     name: parkingZone.name,
    //     address: parkingZone.address,
    //   },
    // });
    res.status(201).json(parkingZone);
  } catch (error) {
    console.error("Error creating parking zone:", error);
    res
      .status(500)
      .json({ message: "Server error during parking zone creation." });
  }
};

const updateParkingZone = async (req, res) => {
  const { name, address, latitude, longitude, description } = req.body;

  try {
    const zone = await ParkingZone.findOne({ zoneId: req.params.id });
    if (zone) {
      zone.name = name || zone.name;
      zone.address = address || zone.address;
      if (latitude !== undefined) zone.location.latitude = latitude;
      if (longitude !== undefined) zone.location.longitude = longitude;
      zone.description = description || zone.description;
      const updatedZone = await zone.save();
      //   await Log.create({
      //     action: "Parking Zone Updated",
      //     userId: req.user._id,
      //     details: {
      //       zoneId: updatedZone.zoneId,
      //       name: updatedZone.name,
      //       updatedFields: Object.keys(req.body),
      //     },
      //   });
      res.json(updatedZone);
    } else {
      res.status(404).json({ message: "Parking Zone not found." });
    }
  } catch (error) {
    console.error("Error updating parking zone:", error);
    res.status(500).json({ message: "Server error updating parking zone." });
  }
};

const deleteParkingZone = async (req, res) => {
  try {
    const zone = await ParkingZone.findOne({ zoneId: req.params.id });

    if (zone) {
      await zone.deleteOne();
      //   await Log.create({
      //     action: "Parking Zone Deleted",
      //     userId: req.user._id,
      //     details: { deletedZoneId: zone._id, zoneName: zone.name },
      //   });
      res.json({ message: "Parking Zone removed successfully." });
    } else {
      res.status(404).json({ message: "Parking Zone not found." });
    }
  } catch (error) {
    console.error("Error deleting parking zone:", error);
    res.status(500).json({ message: "Server error deleting parking zone." });
  }
};

module.exports = {
  getParkingZones,
  getParkingZoneById,
  createParkingZone,
  updateParkingZone,
  deleteParkingZone,
};
