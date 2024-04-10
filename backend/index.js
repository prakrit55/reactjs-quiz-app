const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors"); // For handling cross-origin requests

const client = require("prom-client")
const register = new client.Registry();

// const collectDefaultMetrics = client.collectDefaultMetrics;
// // Probe every 5th second.
// collectDefaultMetrics({register});

const newCounter = new client.Counter({
  name: "requests_per_second",
  help: "total no. rpc",
  labelNames: ["requests_times_get", "requests_times_error"],
});

register.registerMetric(newCounter)

const histo = new client.Histogram ({
  name: 'histogaram_for_rpc',
  help: 'histogram, to score rpc',
  labelNames: ["histogaram_for_get_requests", "histogaram_for_post_questions"],
  buckets: [1, 2, 3, 4, 5, 6, 9, 11],
})

register.registerMetric(histo)


// const helmet = require('helmet'); // Import helmet
// const csrf = require('csurf'); // Import csurf
// const cookieParser = require('cookie-parser'); // Import cookie-parser for CSRF token handling

const app = express();
const port = 3000;
require("dotenv").config();

// Middleware
app.use(cors()); // Use this to allow cross-origin requests
app.use(express.json()); // For parsing application/json
// app.use(helmet()); // Use helmet to set secure HTTP headers
// app.use(cookieParser()); // Use cookie-parser middleware

// // CSRF protection
// const csrfProtection = csrf({ cookie: true });
// app.use(csrfProtection);

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

async function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds));
}
// Function to sleep for a specified amount of time in millisecond

// MongoDB connection string
const dbUri = process.env.MONGO_URI;

mongoose
  .connect(dbUri)
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error("Could not connect to MongoDB...", err));

// Define a schema for the quiz questions
const questionSchema = new mongoose.Schema(
  {
    question: String,
    options: [String],
    answer: Number, // Assuming this is the index of the correct option in the options array
  },
  { collection: "questions" },
);

// Create a model from the schema
const Question = mongoose.model("Question", questionSchema);

// Routes
// GET all questions
app.get("/api/questions", async (req, res) => {
  try {

    const start = new Date().getSeconds(); // Minimum sleep time (in milliseconds)
    const min = 1000;
    const max = 9000; // Maximum sleep time (in milliseconds)
    const randomSleepTime = await getRandomInt(min, max);


    const questions = await Question.find();
    res.json(questions);
    newCounter.labels({requests_times_get: res.statusCode}).inc();
    await sleep(randomSleepTime)

    const endTime = new Date().getSeconds();
    
    // console.log(questions);

    console.log(endTime-start, randomSleepTime, endTime, start)


    histo.labels({histogaram_for_get_requests: res.statusCode}).observe(endTime-start)
  } catch (err) {
    console.error("Error fetching questions:", err.message);
    newCounter.labels({requests_times_error: res.statusCode}).inc();
    res.status(500).json({ message: err.message });
  }
});
// POST a new question
// // Modified route to include csrfProtection as middleware
// app.post("/api/questions", csrfProtection, async (req, res) => { // Protect this route with CSRF - Line modified


app.post("/api/questions", async (req, res) => {
  const start = new Date().getSeconds();
  // const min = 5000;
  // const max = 9000; // Maximum sleep time (in milliseconds)
  // const randomSleepTime = await getRandomInt(min, max);
  const question = new Question({
    question: req.body.question,
    options: req.body.options,
    answer: req.body.answer,
  });
  // await sleep(randomSleepTime)

  const endTime = new Date().getSeconds();
  console.log(endTime-start)

  try {
    const newQuestion = await question.save();
    res.status(201).json(newQuestion);
    histo.labels({histogaram_for_post_questions: res.statusCode}).observe(endTime-start)
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


app.get('/metrics', (req, res) => {
  res.setHeader('Content-Type', register.contentType)
  register.metrics().then(data => res.status(200).send(data))
})

// Additional routes for updating and deleting questions can be added here
// Start the server
app.listen(port, "0.0.0.0", () => {
  console.log(`Quiz API listening at http://0.0.0.0:${port}`);
});
