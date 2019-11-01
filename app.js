const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const AWS = require("aws-sdk");
const twilio = require("twilio");
require("dotenv").config();

const { PORT, SENDGRID_API, AIRTABLE_API } = process.env;

const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "files"),
  filename: (req, file, cb) => {
    const dateTime = new Date().toISOString().replace(/:/gi, "-");
    cb(null, `${dateTime} ${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => cb(null, true);

// app.use((req, res, next) => {
//   console.log(req._parsedUrl.path);
//   next();
// });

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(multer({ storage, fileFilter }).single("file"));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.post("/", async (req, res, next) => {
  req.body.filename = req.file.filename;
  console.log(req.body);
  res.send("OK!");
});

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const { message, data } = error;
  return res.status(status).json({ message, data });
});

app.listen(PORT);

console.log(`Server is listening on port ${PORT}...`);
