const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const HTTPErrors = require("http-errors");
const HTTPStatuses = require("statuses");
const morgan = require("morgan");

const classRoutes = require("./routes/classroomRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const fileRoutes = require("./routes/fileRoutes");
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

dotenv.config({ path: "./config.env" });

app.use(cors());
const DB = process.env.DB;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
  })
  .then(() => console.log("DB connection successful!"));

app.get("/", (req, res) => {
  res.send("Hello from the server side!");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/class", classRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/file", fileRoutes);

app.all("*", (req, res, next) => {
  return next(HTTPErrors(404, `Can't find ${req.originalUrl} on this server!`));
});

app.use(function (err, req, res, next) {
  let messageToSend;

  if (err instanceof HTTPErrors.HttpError) {
    // handle http err
    messageToSend = { message: err.message };

    if (process.env.NODE_ENV === "development") messageToSend.stack = err.stack;

    messageToSend.status = err.statusCode;
  } else {
    messageToSend = { message: err.message };

    if (process.env.NODE_ENV === "development") {
      messageToSend.stack = err.stack;
    }

    messageToSend.status = 400;
  }

  if (process.env.NODE_ENV === "production" && !messageToSend) {
    messageToSend = { message: "Something went very wrong", status: 500 };
  }

  if (messageToSend) {
    let statusCode = parseInt(messageToSend.status, 10);
    let statusName = HTTPStatuses[statusCode];

    res.status(statusCode);
    let responseObject = {
      error: statusName,
      code: statusCode,
      message: messageToSend.message,
    };

    if (messageToSend.stack) {
      responseObject.stack = messageToSend.stack;
    }

    res.send(responseObject);
    return;
  }
});

const port = process.env.PORT;

module.exports = app.listen(port, () => {
  console.log(`Sever is listening on port ${port}`);
});
