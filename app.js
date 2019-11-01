const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const AWS = require("aws-sdk");
const twilio = require("twilio");
require("dotenv").config();
const airtable = require("airtable");

const { PORT, SENDGRID_API, AIRTABLE_VIEW_LINK, AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: SENDGRID_API,
    },
  }),
);

airtable.configure({ apiKey: AIRTABLE_API_KEY });
const base = airtable.base(AIRTABLE_BASE_ID);

const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "files"),
  filename: (req, file, cb) => {
    const dateTime = new Date().toISOString().replace(/:/gi, "-");
    cb(null, `${dateTime} ${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => cb(null, true);

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
  const { filename } = req.file;
  const { name, surname, email, phone, postalCode, details, submitterType } = req.body;

  base("Complaints").create(
    [
      {
        fields: {
          Name: name,
          Surname: surname,
          Attachment: filename,
          Complaint: details,
          Email: email,
          Phone: phone,
          PostalCode: postalCode,
          SubmitterType: submitterType,
        },
      },
    ],
    (err, records) => {
      if (err) console.error(err);
    },
  );

  transporter.sendMail({
    to: email,
    from: "no-reply@neb-one.gc.ca",
    subject: "Your submission received!",
    html: `<p>Your submission received on ${new Date().toLocaleDateString()}!</p>`,
  });

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
