const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const morgan = require("morgan");
const colors = require("colors");
const fileupload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");

const errorHandler = require("./middleware/error");

const connectDB = require("./config/db");

// Load env vars
dotenv.config({ path: "./config/config.env" });

// Connect to DB
connectDB();

// Route files
const bootcamps = require("./routes/bootcamps");
const courses = require("./routes/courses");
const auth = require("./routes/auth");
const users = require("./routes/users");
const reviews = require("./routes/reviews");

const app = express();

// Body parser - need this to get the value of req.body. Otherwise req.body would be undefined
app.use(express.json());

// Cookie parsing middleware
app.use(cookieParser());

// Sanitize data to prevent NoSQL injection attacks. For e.g., in the login request, if someone were to use this as the body: {"email": {"$gt": ""}, password: 123456}, the would be allowed to log in since it would return the first user with that password. In order to prevent the passing of queries into the request, we use the sanitize middleware.
app.use(mongoSanitize());

// Set security headers to prevent various security vulnerabilities.
app.use(helmet({ contentSecurityPolicy: false }));

// XSS attack prevention
// Let's say I login as publisher. While creating a bootcamp, add a script tag to the name (eg. My Bootcamp<script>alert(1)</script>). When this is rendered on the screen on the client side, unnecessary JS code might get executed.
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  // 10 mins
  windowMs: 10 * 60 * 1000,
  // Max # of requests in the time window above
  max: 100,
});
app.use(limiter);

// Prevent http param pollution
// For instance, URL?param=1&param=2 would populate req.query.param as an array = [1,2]
app.use(hpp());

// Enable CORS
// Without setting access-control-allow-origin to *, only same origin requests (https://domain/...) are allowed to call the API. When this header is set, we can allow other origins to access the API. CORS is a policy that is set on the server side but enforced on the client side. If the client respects this policy and the header is set on the server api response, we will receive a CORS error. But this is up to the client whether to respect this or not.
// Informative stackoverflow article about CORS: https://stackoverflow.com/questions/36250615/cors-with-postman
app.use(cors());

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
// File uploading middleware
app.use(fileupload());

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Mount routers
app.use("/api/v1/bootcamps", bootcamps);
app.use("/api/v1/courses", courses);
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);
app.use("/api/v1/reviews", reviews);

// Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () =>
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);

  //Close server and exit process
  server.close(() => process.exit(1));
});
