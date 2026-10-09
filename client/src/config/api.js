const DEFAULT_API_URL = "https://mern-stack-food-ordering-web-app-4sg8.onrender.com";
const configuredUrl = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).trim().replace(/\/+$/, "");

// Migrate the retired Render URL even when an old Vercel environment value remains.
export const API_URL = import.meta.env.PROD ? "" : configuredUrl === "https://mern-stack-food-ordering-web-app-2.onrender.com"
  ? DEFAULT_API_URL
  : configuredUrl;
export const API_BASE = `${API_URL}/api`;
