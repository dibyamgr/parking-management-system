const ParkingSlot = require("../models/ParkingSlot");
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
      location: { 
        type: "Point",
        coordinates: [longitude, latitude],
      },
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
      if (latitude !== undefined && longitude !== undefined) {
        zone.location = {
          type: "Point",
          coordinates: [longitude, latitude],
      };
      }
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

// A simple helper function to calculate distance using the Haversine formula
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // in meters
  return distance;
}

const getNearbyParkingZones = async (req, res) => {
  const { lat, lng, radius } = req.query;
  console.log("Received nearby parking zones request:", lat, lng, radius);

  if (!lat || !lng || !radius) {
    return res
      .status(400)
      .json({ message: "Latitude, longitude, and radius are required." });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const searchRadius = parseFloat(radius);

  if (isNaN(latitude) || isNaN(longitude) || isNaN(searchRadius)) {
    return res
      .status(400)
      .json({ message: "Invalid latitude, longitude, or radius." });
  }

  try {
    // Fetch ALL parking zones from the database
    const allZones = await ParkingZone.find({});
    console.log(allZones, "allZones===");

    // Manually filter the zones based on distance
    const nearbyZones = allZones.filter((zone) => {
      if (zone.location) {
        const distance = getDistance(
          latitude,
          longitude,
          zone.location.latitude,
          zone.location.longitude
        );
        console.log(distance, "distance===");
        return distance <= searchRadius;
      }
      return false;
    });

    // Find available slots for each nearby zone
    const zonesWithSlots = await Promise.all(
      nearbyZones.map(async (zone) => {
        const availableSlots = await ParkingSlot.find({
          parkingZone: zone._id,
          status: "AVAILABLE",
        }).lean();

        return {
          ...zone.toObject(),
          slots: availableSlots,
        };
      })
    );

    if (zonesWithSlots.length === 0) {
      return res
        .status(404)
        .json({ message: "No nearby parking zones found." });
    }

    res.status(200).json(zonesWithSlots);
  } catch (error) {
    console.error("Geospatial query error:", error);
    res.status(500).json({ message: "Server error during location search." });
  }
};

module.exports = {
  getParkingZones,
  getParkingZoneById,
  createParkingZone,
  updateParkingZone,
  deleteParkingZone,
  getNearbyParkingZones,
};
