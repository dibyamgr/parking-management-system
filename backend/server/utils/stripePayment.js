const Stripe = require("stripe");

let stripeInstance;

function getStripe() {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment variables.");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log("✅ Stripe instance created");
  }
  return stripeInstance;
}

module.exports = getStripe;
