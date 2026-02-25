const Stripe = require("stripe");

let stripeInstance = null;

function getStripe() {
  if (stripeInstance) return stripeInstance;
  const secret = process.env.STRIPE_SECRET_KEY || "";
  if (!secret) return null;
  stripeInstance = new Stripe(secret);
  return stripeInstance;
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

module.exports = {
  getStripe,
  getSiteUrl,
};
