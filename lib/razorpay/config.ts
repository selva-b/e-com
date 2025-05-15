// Razorpay configuration
export const RAZORPAY_CONFIG = {
  KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  SECRET_KEY: process.env.RAZORPAY_SECRET_KEY,
};

// Check if Razorpay environment variables are set
if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET_KEY) {
  console.error('Razorpay environment variables are not set. Please check your .env.local file.');
}
