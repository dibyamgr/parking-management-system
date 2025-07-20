const getStripe = require("../utils/stripePayment");

const FE_DOMAIN = "http://localhost:3000";

const createCheckoutSession = async ({ invoiceId, amount, description }) => {
  const stripe = getStripe();

  try {
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: "Parking Session Payment",
              description: description,
            },
            unit_amount: Math.round(amount * 100), // cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        invoiceId: invoiceId,
      },
      success_url: `http://localhost:3000/payment-success/${invoiceId}`,
      cancel_url: `${FE_DOMAIN}/my-bookings`,
    });

    return stripeSession.url;
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    throw new Error("Failed to create Stripe payment session.");
  }
};

module.exports = {
  createCheckoutSession,
};
