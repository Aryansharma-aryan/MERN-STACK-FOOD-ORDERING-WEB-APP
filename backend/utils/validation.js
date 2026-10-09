function invalid(message) { throw Object.assign(new Error(message), { status: 400 }); }
function text(value, name, min, max) {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) invalid(`${name} must contain ${min}–${max} characters.`);
  return value.trim();
}
function credentials(body, signup = false) {
  const email = text(body?.email, "Email", 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid("Enter a valid email address.");
  const password = body?.password;
  if (typeof password !== "string" || password.length < (signup ? 6 : 1) || Buffer.byteLength(password, "utf8") > 72) invalid("Password must be 6–72 bytes for signup and at most 72 bytes for login.");
  return { email, password, ...(signup ? { name: text(body?.name, "Name", 1, 100) } : {}) };
}
function foodInput(body) {
  const name = text(body?.name, "Food name", 1, 120);
  const description = text(body?.description, "Description", 1, 2000);
  const image = text(body?.image, "Image URL", 1, 2000);
  try { if (!["https:", "http:"].includes(new URL(image).protocol)) invalid("Use an HTTP or HTTPS image URL."); } catch { invalid("Enter a valid image URL."); }
  if (!["number", "string"].includes(typeof body?.price) || String(body.price).trim() === "") invalid("Enter a price.");
  const price = Number(body.price);
  if (!Number.isFinite(price) || price <= 0 || price > 100000) invalid("Price must be between 0.01 and 100000 INR.");
  return { name, description, image, price: Math.round(price * 100) / 100 };
}
module.exports = { credentials, foodInput, text, invalid };
