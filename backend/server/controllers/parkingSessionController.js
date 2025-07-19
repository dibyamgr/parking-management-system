const ParkingSession = require("../models/ParkingSession"); // Use ParkingSession
const ParkingSlot = require("../models/ParkingSlot");
const Vehicle = require("../models/Vehicle");
const Invoice = require("../models/Invoice");
const PaymentStatus = require("../models/PaymentStatus");
const Log = require("../models/Log");
const sendEmail = require("../utils/sendEmail");
const moment = require("moment"); // Use moment library
const stripeController = require("./stripeController");

// Helper function (copied from ParkingSlotController to avoid circular dependency)
const isSlotAvailableForBooking = async (
  slotId,
  requestedStartTime,
  requestedEndTime
) => {
  const slot = await ParkingSlot.findOne({ slotId });
  console.log(slot, "slot in isSlotAvailableForBooking");
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
  console.log(
    overlappingSessions,
    "overlappingSessions in isSlotAvailableForBooking"
  );
  return overlappingSessions.length === 0;
};

// @desc    Start a parking session (reserve or go active directly)
// @route   POST /api/parking-sessions/start
// @access  Private
const startParkingSession = async (req, res) => {
  const { parkingSlotId, vehicleId, startTime, endTime } = req.body;

  if (!parkingSlotId || !vehicleId || !startTime || !endTime) {
    return res.status(400).json({
      message:
        "Parking slot ID, vehicle ID, start time, and end time are required.",
    });
  }

  console.log(startTime, endTime, "startTime and endTime from request body");
  const newEntryTime = moment.utc(startTime);
  const newExitTime = moment.utc(endTime);

  // Date Validations using moment
  if (!newEntryTime.isValid() || !newExitTime.isValid()) {
    return res
      .status(400)
      .json({ message: "Invalid date or time format provided." });
  }
  if (newEntryTime.isSameOrAfter(newExitTime)) {
    return res
      .status(400)
      .json({ message: "Start time must be before end time." });
  }

  console.log(
    newEntryTime,
    newExitTime,
    moment().subtract(1, "minute"),
    "Current time minus 1 minute",
    newEntryTime.isBefore(moment.utc().subtract(1, "minute"))
  );

  // TODO: Fix time issue
  // if (newEntryTime.isBefore(moment.utc().subtract(1, "minute"))) {
  //   return res
  //     .status(400)
  //     .json({ message: "Cannot book for a time in the past." });
  // }

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
      newEntryTime.toDate(), // Convert moment objects to Date objects for Mongoose
      newExitTime.toDate()
    );

    console.log(isAvailable, "isAvailable====");
    if (!isAvailable) {
      return res.status(400).json({
        message:
          "The selected parking slot is not available for the requested time.",
      });
    }

    const currentDateTime = moment();
    let sessionStatus = "RESERVED";
    if (
      newEntryTime.isSameOrBefore(currentDateTime) &&
      newExitTime.isAfter(currentDateTime)
    ) {
      sessionStatus = "ACTIVE";
    }

    const paymentStatus = await PaymentStatus.create({ status: "PENDING" });

    const session = await ParkingSession.create({
      entryTime: newEntryTime.toDate(), // Store as Date object
      exitTime: newExitTime.toDate(), // Store as Date object
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

    // Use moment.duration for robust calculation
    const estimatedDurationHours = moment
      .duration(newExitTime.diff(newEntryTime))
      .asHours();
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
        <p><strong>Entry Time:</strong> ${moment(newEntryTime).format(
          "MMMM Do YYYY, h:mm a"
        )}</p>
        <p><strong>Expected Exit Time:</strong> ${moment(newExitTime).format(
          "MMMM Do YYYY, h:mm a"
        )}</p>
        <p><strong>Estimated Duration:</strong> ${estimatedDurationHours.toFixed(
          1
        )} hours</p>
        <p><strong>Estimated Amount:</strong> $${estimatedAmount.toFixed(2)}</p>
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

// @desc    End a parking session
// @route   POST /api/parking-sessions/:id/end
// @access  Private
const endParkingSession = async (req, res) => {
  const sessionId = req.params.id;
  const { actualExitTime: requestedExitTime } = req.body;
  const actualExitTime = requestedExitTime
    ? moment(requestedExitTime)
    : moment();

  // Use moment to validate date
  if (!actualExitTime.isValid()) {
    return res
      .status(400)
      .json({ message: "Invalid actual exit time provided." });
  }

  try {
    const session = await ParkingSession.findById(sessionId) // Use ParkingSession
      .populate({ path: "parkingSlot", populate: { path: "parkingZone" } })
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
    // Use moment to compare dates
    if (actualExitTime.isBefore(session.entryTime)) {
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
      // Use moment to recalculate duration and final amount
      const finalDurationHours = moment
        .duration(actualExitTime.diff(moment(session.entryTime)))
        .asHours();
      invoice.amount = finalDurationHours * session.parkingSlot.pricePerHour;
      await invoice.save();
    }

    await session.save();

    const paymentUrl = await stripeController.createCheckoutSession({
      invoiceId: invoice._id.toString(),
      amount: invoice.amount,
      description: `Parking at ${session.parkingSlot.parkingZone.address} for slot ${session.parkingSlot.slotId}`,
    });

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
      message: "Parking session ended successfully.Redirecting to payment.",
      session: await session.populate({
        path: "invoice",
        populate: { path: "paymentStatus" },
      }),
      paymentUrl: paymentUrl,
    });
  } catch (error) {
    console.error("Error ending parking session:", error);
    res.status(500).json({
      message: "Server error ending parking session. " + error.message,
    });
  }
};

// @desc    Get parking sessions for the current authenticated user
// @route   GET /api/parking-sessions/my
// @access  Private
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

// @desc    Get a single parking session by ID
// @route   GET /api/parking-sessions/:id
// @access  Private
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

// @desc    Get all parking sessions (Admin only)
// @route   GET /api/admin/parking-sessions/all
// @access  Private/Admin
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
