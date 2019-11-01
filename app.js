const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const AWS = require("aws-sdk");
const fs = require("fs");
require("dotenv").config();
const airtable = require("airtable");

const {
  PORT,
  SENDGRID_API,
  AIRTABLE_VIEW_LINK,
  AIRTABLE_API_KEY,
  AIRTABLE_BASE_ID,
  AWS_ACCESS_KEY,
  AWS_SECRET_ACCESS_KEY,
  AWS_BUCKET_NAME,
  AWS_BUCKET_URL,
} = process.env;

const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
});

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

const filesFolder = path.join(__dirname, "files");
if (!fs.existsSync(filesFolder)) {
  fs.mkdirSync(filesFolder);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "files"),
  filename: (req, file, cb) => {
    const dateTime = new Date().toISOString().replace(/:/gi, "-");
    cb(null, `${dateTime} ${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => cb(null, true);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(multer({ storage, fileFilter }).single("file"));

app.post("/", async (req, res, next) => {
  try {
    const { filename } = req.file;
    const { name, surname, email, phone, postalCode, details, submitterType } = req.body;

    base("Complaints").create(
      [
        {
          fields: {
            Name: name,
            Surname: surname,
            Attachment: AWS_BUCKET_URL + filename,
            Complaint: details,
            Email: email,
            Phone: phone,
            PostalCode: postalCode,
            SubmitterType: submitterType,
          },
        },
      ],
      (err, records) => {
        if (err) {
          console.error(err);
          throw new Error("File is not uploaded!");
        }

        transporter
          .sendMail({
            to: email,
            from: "no-reply@neb-one.gc.ca",
            subject: "Your submission received!",
            html: `<p>Your submission received on ${new Date().toLocaleDateString()}!</p>`,
          })
          .then(() => {
            const fileName = filename;
            const filePath = path.join(__dirname, "files", fileName);

            // Read content from the file
            const fileContent = fs.readFileSync(filePath);

            // Setting up S3 upload parameters
            const params = {
              Bucket: AWS_BUCKET_NAME,
              Key: fileName, // File name you want to save as in S3
              Body: fileContent,
            };

            // Uploading files to the bucket
            s3.upload(params, (err, data) => {
              if (err) {
                throw err;
              }
              console.log(`File uploaded successfully. ${data.Location}`);

              fs.unlink(filePath, err => {
                if (err) {
                  console.log(err);
                } else {
                  console.log(`successfully deleted ${filePath}`);
                  res.send(
                    `<h1>Complaint successfully received.</h1><p><a href="${AIRTABLE_VIEW_LINK}" target="_blank">Please proceed to see the results</a></p>`,
                  );
                }
              });
            });
          })
          .catch(err => {
            console.log(err);
            throw new Error("Mail is not sent!");
          });
      },
    );
  } catch (error) {
    res.send("Please enter all fields, including the file");
  }
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
