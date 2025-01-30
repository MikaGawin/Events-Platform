const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const ENV = process.env.NODE_ENV || "development";
require("dotenv").config({
  path: `${__dirname}/../../../.env.${ENV}`,
});

const { postUser, checkUser } = require("./controllers/user-controllers");
const {
  invalidEndpoint,
  internalServerError,
} = require("./errorHandling/error-handlers");

const app = express();

//jwt functions

const SECRET_KEY = process.env.SECRET_KEY;

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      forename: user.forename,
      surname: user.surname,
      email: user.email,
      gmail: user.gmail,
      avatar_url: user.avatar_url,
      staff: user.staff,
    },
    SECRET_KEY,
    { expiresIn: "1h" }
  );
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorisation;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .send({ message: "Access denied. No token provided." });
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).send({ msg: "Invalid or expired token." });
  }
};

app.use(cors());
app.use(express.json());

//routes

app.get("/", (req, res, next) => {
  res.send("The app is working!").catch(next);
});

app.route("/register").post(postUser);
app.route("/login").post(async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await checkUser(email, password);
    const token = generateToken(user);
    res.status(200).send({ token, user });
  } catch (err) {
    next(err);
  }
});

app.all("*", invalidEndpoint);

app.use(internalServerError);

module.exports = app;
