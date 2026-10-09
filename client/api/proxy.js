const BACKEND = "https://mern-stack-food-ordering-web-app-4sg8.onrender.com";

// Keep browser requests on this deployment's origin. Forward authentication
// explicitly; never forward Origin, cookies, or arbitrary upstream URLs.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const path = Array.isArray(req.query?.path) ? req.query.path.join("/") : req.query?.path;
  if (typeof path !== "string" || !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(path)) {
    return res.status(400).json({ message: "Invalid API path." });
  }
  if (!["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"].includes(req.method)) {
    return res.status(405).json({ message: "Method not allowed." });
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  const headers = { Accept: "application/json" };
  if (typeof req.headers.authorization === "string") headers.Authorization = req.headers.authorization;
  const options = { method: req.method, headers, signal: AbortSignal.timeout(55000), redirect: "error" };
  if (!["GET", "DELETE"].includes(req.method) && req.body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  }
  try {
    const upstream = await fetch(`${BACKEND}/api/${path}`, options);
    if (upstream.headers.get("retry-after")) res.setHeader("Retry-After", upstream.headers.get("retry-after"));
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    return res.status(upstream.status).send(await upstream.text());
  } catch (error) {
    return res.status(error.name === "TimeoutError" ? 504 : 502).json({ message: "The food service is temporarily unavailable. Please retry shortly." });
  }
}
