const allowedOrigins = new Set([
  "https://mern-stack-food-ordering-web-app.vercel.app",
  "https://mern-stack-food-ordering-web-9eturccao.vercel.app",
  "https://mern-stack-food-ordering-web-4wcmiaxxw.vercel.app",
  ...[
    process.env.FRONTEND_URL_LOCAL,
    process.env.FRONTEND_URL_ALT,
    process.env.FRONTEND_URL_VERCEL,
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGINS,
  ].filter(Boolean).flatMap(value => value.split(",")),
].map(value => value.trim().replace(/\/+$/, "")));

function isAllowedOrigin(origin) {
  return !origin || allowedOrigins.has(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin);
}

module.exports = {
  origin(origin, callback) {
    callback(isAllowedOrigin(origin) ? null : new Error("CORS: Origin not allowed"), isAllowedOrigin(origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  maxAge: 7200,
};
