// const getStripe = require("../utils/stripePayment");

const stripe = require("stripe");
const stripeWebHookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const ParkingSession = require("../models/ParkingSession");
const Invoice = require("../models/Invoice");
const PaymentStatus = require("../models/PaymentStatus");
const Log = require("../models/Log");
const sendEmail = require("../utils/sendEmail");
const moment = require("moment");

const handleStripeWebhook = async (req, res) => {
  const payload = req.body;
  const signature = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      stripeWebHookSecret
    );
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return res.sendStatus(400);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      console.log(
        `Checkout session for invoice ${session.metadata.invoiceId} was completed!`
      );

      const { invoiceId } = session.metadata;

      try {
        // 1. Find and update the Invoice payment status
        const invoice = await Invoice.findById(invoiceId).populate(
          "parkingSession"
        );
        if (!invoice) {
          throw new Error("Invoice not found.");
        }

        const paymentStatus = await PaymentStatus.findById(
          invoice.paymentStatus
        );
        paymentStatus.status = "PAID";
        await paymentStatus.save();

        invoice.paymentStatus = paymentStatus._id;
        invoice.paymentDate = new Date();
        await invoice.save();

        // 2. Finalize the Parking Session status
        const parkingSession = await ParkingSession.findById(
          invoice.parkingSession
        );
        if (!parkingSession) {
          throw new Error("Parking session not found for this invoice.");
        }

        parkingSession.paymentStatus = "PAID";
        await parkingSession.save();

        // 3. Send the Confirmation/Invoice Email
        // This is the email you promised the user would receive
        const populatedSession = await ParkingSession.findById(
          parkingSession._id
        )
          .populate({
            path: "parkingSlot",
            select: "slotId pricePerHour parkingZone",
            populate: {
              path: "parkingZone",
              select: "name address location",
            },
          })
          .populate("vehicle", "licensePlate")
          .populate("user", "username email");

        await sendEmail({
          email: populatedSession.user.email,
          subject: "UniPark: Your Invoice and Booking Confirmation",
          html: `
            <h1>Your Booking is Confirmed!</h1>
            <p>Hello ${populatedSession.user.username},</p>
            <p>Your payment for the parking session has been successfully processed.</p>
            <h3>Booking Details:</h3>
            <ul>
              <li><strong>Parking At:</strong> ${
                populatedSession.parkingSlot.parkingZone.address
              }</li>
              <li><strong>Arriving on:</strong> ${moment(
                populatedSession.entryTime
              ).format("MMMM Do YYYY, h:mm a")}</li>
              <li><strong>Leaving on:</strong> ${moment(
                populatedSession.exitTime
              ).format("MMMM Do YYYY, h:mm a")}</li>
              <li><strong>Plate No:</strong> ${
                populatedSession.vehicle.licensePlate
              }</li>
              <li><strong>Total Amount:</strong> $${invoice.amount.toFixed(
                2
              )}</li>
            </ul>
            <p>You can view your full invoice by logging into your account.</p>
            <p>Thank you for using UniPark!</p>
          `,
        });

        // 4. Log the event
        await Log.create({
          action: `Stripe Payment Confirmed`,
          userId: populatedSession.user._id,
          details: {
            sessionId: populatedSession._id,
            invoiceId: invoice._id,
            amount: invoice.amount,
          },
        });
      } catch (error) {
        console.error(
          "Error processing checkout.session.completed webhook:",
          error
        );
      }

      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
};

module.exports = {
  handleStripeWebhook,
};
