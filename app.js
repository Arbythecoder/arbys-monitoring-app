// Import the necessary modules
const express = require("express");
const client = require("prom-client");

// Create an Express app
const app = express();
const port = 4000;

// Create a registry to collect metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Create a custom metric to measure HTTP request durations
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status"],
});

// Register the custom metric
register.registerMetric(httpRequestDuration);

// Middleware to start timing each request
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer(); // Start the timer
  res.on("finish", () => {
    end({
      method: req.method,
      route: req.route ? req.route.path : "unknown",
      status: res.statusCode,
    }); // Stop the timer and record the labels
  });
  next(); // Proceed to the next middleware or route handler
});

// Define the main route
app.get("/", (req, res) => {
  res.send("Hello, Arby!");
});

// Define the metrics route
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType); // Set the response content type
  res.end(await register.metrics()); // Send the metrics to the client
});

// Start the server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
