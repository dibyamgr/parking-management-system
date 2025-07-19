const ParkingSession = require("../models/ParkingSession"); // Use ParkingSession
const ParkingSlot = require("../models/ParkingSlot");
const Vehicle = require("../models/Vehicle");
const Invoice = require("../models/Invoice");
const PaymentStatus = require("../models/PaymentStatus");
const Log = require("../models/Log");
const sendEmail = require("../utils/sendEmail");
const { format, isValid } = require("date-fns");

// Helper function (copied from ParkingSlotController to avoid circular dependency)
const isSlotAvailableForBooking = async (
  slotId,
  requestedStartTime,
  requestedEndTime
) => {
  const slot = await ParkingSlot.findOne({ slotId });
  if (!slot || slot.status === "OCCUPIED" || !slot.isAvailable) {
    return false;
  }
  const overlappingSessions = await ParkingSession.find({
    parkingSlot: slot?._id,
    status: { $in: ["RESERVED", "ACTIVE"] },
    $or: [
      {
        entryTime: { $lt: requestedEndTime },
        exitTime: { $gt: requestedStartTime },
      },
      {
        entryTime: { $lte: requestedStartTime },
        exitTime: { $gte: requestedEndTime },
      },
    ],
  });
  return overlappingSessions.length === 0;
};

// @desc    Start a parking session (reserve or go active directly)
// @route   POST /api/parking-sessions/start
// @access  Private
const startParkingSession = async (req, res) => {
  const { parkingSlotId, vehicleId, startTime, endTime } = req.body;

  if (!parkingSlotId || !vehicleId || !startTime || !endTime) {
    return res.status(400).json({
      message:
        "Parking slot ID, vehicle ID, start time, and end time are required.",
    });
  }

  const newEntryTime = new Date(startTime);
  const newExitTime = new Date(endTime);

  // Date Validations
  if (!isValid(newEntryTime) || !isValid(newExitTime)) {
    return res
      .status(400)
      .json({ message: "Invalid date or time format provided." });
  }
  if (newEntryTime >= newExitTime) {
    return res
      .status(400)
      .json({ message: "Start time must be before end time." });
  }
  if (newEntryTime < new Date(Date.now() - 60 * 1000)) {
    return res
      .status(400)
      .json({ message: "Cannot book for a time in the past." });
  }

  try {
    const slot = await ParkingSlot.findOne({ slotId: parkingSlotId }).populate(
      "parkingZone"
    );
    if (!slot) {
      return res.status(404).json({ message: "Parking Slot not found." });
    }
    const vehicle = await Vehicle.findOne({ licensePlate: vehicleId }).populate(
      "owner"
    );
    console.log(vehicle, "vehicle");
    if (!vehicle || vehicle.owner._id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Vehicle not found or not owned by current user." });
    }

    const isAvailable = await isSlotAvailableForBooking(
      parkingSlotId,
      newEntryTime,
      newExitTime
    );

    console.log(isAvailable, "isAvailable====");
    if (!isAvailable) {
      return res.status(400).json({
        message:
          "The selected parking slot is not available for the requested time.",
      });
    }

    const currentDateTime = new Date();
    let sessionStatus = "RESERVED";
    if (newEntryTime <= currentDateTime && newExitTime > currentDateTime) {
      sessionStatus = "ACTIVE";
    }

    const paymentStatus = await PaymentStatus.create({ status: "PENDING" });

    const session = await ParkingSession.create({
      entryTime: newEntryTime,
      exitTime: newExitTime,
      parkingSlot: slot?._id,
      vehicle: vehicle?._id,
      user: req.user._id,
      status: sessionStatus,
    });

    if (sessionStatus === "ACTIVE") {
      slot.status = "OCCUPIED";
      slot.occupiedByVehicle = vehicleId;
      slot.reservedBy = undefined;
    } else if (sessionStatus === "RESERVED") {
      slot.status = "RESERVED";
      slot.reservedBy = req.user._id;
      slot.occupiedByVehicle = undefined;
    }
    await slot.save();

    const estimatedDurationHours =
      (newExitTime.getTime() - newEntryTime.getTime()) / (1000 * 60 * 60);
    const estimatedAmount = estimatedDurationHours * slot.pricePerHour;

    const invoice = await Invoice.create({
      amount: estimatedAmount,
      user: req.user._id,
      parkingSession: session._id,
      issueDate: new Date(),
      paymentStatus: paymentStatus._id,
      description: `Parking session for ${vehicle.licensePlate} at slot ${slot.slotId} in ${slot.parkingZone.name}.`,
    });

    session.invoice = invoice._id;
    await session.save();

    const populatedSession = await ParkingSession.findById(session._id) // Use ParkingSession
      .populate({
        path: "parkingSlot",
        select: "slotId pricePerHour parkingZone",
        populate: {
          path: "parkingZone",
          select: "name address location",
        },
      })
      .populate("vehicle", "licensePlate")
      .populate("user", "username email")
      .populate({ path: "invoice", populate: { path: "paymentStatus" } });

    console.log(populatedSession, "populatedSession");
    await sendEmail({
      email: req.user.email,
      subject: `UniPark ${
        sessionStatus === "ACTIVE" ? "Parking Started" : "Booking Confirmation"
      } - Slot ${slot.slotId}`,
      html: `
                <h1>Your Parking ${
                  sessionStatus === "ACTIVE"
                    ? "Session has Started!"
                    : "Booking is Confirmed!"
                }</h1>
                <p>Hello ${req.user.name},</p>
                <p>Your parking spot has been successfully ${
                  sessionStatus === "ACTIVE" ? "occupied" : "reserved"
                }.</p>
                <p><strong>Session ID:</strong> ${populatedSession._id}</p>
                <p><strong>Parking Slot:</strong> ${
                  populatedSession.parkingSlot.slotId
                } in ${populatedSession.parkingSlot.parkingZone.name}</p>
                <p><strong>Vehicle:</strong> ${
                  populatedSession.vehicle.licensePlate
                }</p>
                <p><strong>Entry Time:</strong> ${format(
                  newEntryTime,
                  "PPPp"
                )}</p>
                <p><strong>Expected Exit Time:</strong> ${format(
                  newExitTime,
                  "PPPp"
                )}</p>
                <p><strong>Estimated Duration:</strong> ${estimatedDurationHours.toFixed(
                  1
                )} hours</p>
                <p><strong>Estimated Amount:</strong> $${estimatedAmount.toFixed(
                  2
                )}</p>
                <p>Please note: The final amount will be calculated upon exit based on actual duration.</p>
                <p>Thank you for using UniPark!</p>
            `,
    });

    await Log.create({
      action: `Parking Session ${sessionStatus}d`,
      userId: req.user._id,
      details: {
        sessionId: session._id,
        slotId: slot.slotId,
        vehicleId: vehicleId,
        status: sessionStatus,
      },
    });

    res.status(201).json({
      message: `Parking session ${sessionStatus.toLowerCase()} successfully!`,
      session: populatedSession,
    });
  } catch (error) {
    console.error("Error starting parking session:", error);
    res.status(500).json({
      message: "Server error starting parking session. " + error.message,
    });
  }
};

// @desc    End a parking session
// @route   POST /api/parking-sessions/:id/end
// @access  Private
const endParkingSession = async (req, res) => {
  const sessionId = req.params.id;
  const { actualExitTime: requestedExitTime } = req.body;
  const actualExitTime = requestedExitTime
    ? new Date(requestedExitTime)
    : new Date();

  if (!isValid(actualExitTime)) {
    return res
      .status(400)
      .json({ message: "Invalid actual exit time provided." });
  }

  try {
    const session = await ParkingSession.findById(sessionId) // Use ParkingSession
      .populate("parkingSlot")
      .populate("vehicle")
      .populate("user");

    if (!session) {
      return res.status(404).json({ message: "Parking session not found." });
    }
    if (
      req.user.role !== "ADMIN" &&
      session.user._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to end this session." });
    }
    if (session.status === "COMPLETED" || session.status === "CANCELLED") {
      return res
        .status(400)
        .json({ message: "Session already ended or cancelled." });
    }
    if (actualExitTime < session.entryTime) {
      return res
        .status(400)
        .json({ message: "Actual exit time cannot be before entry time." });
    }

    session.actualExitTime = actualExitTime;
    session.status = "COMPLETED";
    session.calculateDuration();

    const slot = await ParkingSlot.findById(session.parkingSlot._id);
    if (slot) {
      slot.status = "AVAILABLE";
      slot.reservedBy = undefined;
      slot.occupiedByVehicle = undefined;
      await slot.save();
    }

    const invoice = await Invoice.findById(session.invoice);
    if (invoice) {
      invoice.amount = session.durationHours * session.parkingSlot.pricePerHour;
      await invoice.save();
    }

    await session.save();

    await Log.create({
      action: "Parking Session Ended",
      userId: req.user._id,
      details: {
        sessionId: session._id,
        slotId: session.parkingSlot.slotId,
        durationHours: session.durationHours,
        finalAmount: invoice ? invoice.amount : "N/A",
      },
    });

    res.json({
      message: "Parking session ended successfully.",
      session: await session.populate({
        path: "invoice",
        populate: { path: "paymentStatus" },
      }),
    });
  } catch (error) {
    console.error("Error ending parking session:", error);
    res.status(500).json({
      message: "Server error ending parking session. " + error.message,
    });
  }
};

// @desc    Get parking sessions for the current authenticated user
// @route   GET /api/parking-sessions/my
// @access  Private
const getUserParkingSessions = async (req, res) => {
  try {
    const sessions = await ParkingSession.find({ user: req.user._id }) // Use ParkingSession
      .populate("parkingSlot")
      .populate("vehicle")
      .populate({ path: "invoice", populate: { path: "paymentStatus" } })
      .sort({ entryTime: -1 });
    res.json(sessions);
  } catch (error) {
    console.error("Error fetching user parking sessions:", error);
    res
      .status(500)
      .json({ message: "Server error fetching your parking sessions." });
  }
};

// @desc    Get a single parking session by ID
// @route   GET /api/parking-sessions/:id
// @access  Private
const getParkingSessionById = async (req, res) => {
  try {
    const session = await ParkingSession.findById(req.params.id) // Use ParkingSession
      .populate("parkingSlot")
      .populate("vehicle")
      .populate("user", "username email")
      .populate({ path: "invoice", populate: { path: "paymentStatus" } });

    if (!session) {
      return res.status(404).json({ message: "Parking session not found." });
    }
    if (
      req.user.role !== "ADMIN" &&
      session.user._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this session." });
    }
    res.json(session);
  } catch (error) {
    console.error("Error fetching parking session by ID:", error);
    res.status(500).json({ message: "Server error fetching session details." });
  }
};

// @desc    Get all parking sessions (Admin only)
// @route   GET /api/admin/parking-sessions/all
// @access  Private/Admin
const getAllParkingSessions = async (req, res) => {
  try {
    const sessions = await ParkingSession.find({}) // Use ParkingSession
      .populate({ path: "parkingSlot", populate: { path: "parkingZone" } })
      .populate("vehicle")
      .populate("user", "username email")
      .populate({ path: "invoice", populate: { path: "paymentStatus" } })
      .sort({ entryTime: -1 });
    res.json(sessions);
  } catch (error) {
    console.error("Error fetching all parking sessions (Admin):", error);
    res
      .status(500)
      .json({ message: "Server error fetching all parking sessions." });
  }
};

module.exports = {
  startParkingSession,
  endParkingSession,
  getUserParkingSessions,
  getParkingSessionById,
  getAllParkingSessions,
};
