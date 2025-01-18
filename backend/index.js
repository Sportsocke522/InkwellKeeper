//importing express library
const express = require("express");
const app = express();

//importing database function
const DBConn = require("./config/DBConn");

//importing dotenv library
require("dotenv").config();
const port = process.env.PORT || 5000;

const cookieParser = require("cookie-parser");

//importing auth router here
const router_auth = require("./routes/AuthRoutes");

//importing settings router here
const router_settings = require("./routes/SettingsRoutes");

//importing cors library
const cors = require("cors");

//importing the bodyparser library for accepting json data
const bodyParser = require("body-parser");

//using cors for avoiding cross origin resource sharing error while sending req to server

//app.use(cors());
//app.options('*', cors(corsOptions)); // OPTIONS-Anfragen für CORS erlauben
//app.use(cors(corsOptions));
const corsOptions = {
  origin: 'http://localhost:5173', // Erlaube nur diese Origin
  credentials: true, // Cookies und andere credentials erlauben
  allowedHeaders: ["Content-Type", "Authorization"], // Erlaube den Authorization-Header
};
app.use(cors(corsOptions));

app.use(cookieParser());

//middlewares for accepting incoming json and parsing data
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

//creating a IIFE async await function for starting the database connection function as soon as possible and passing it down to the routes and starting the server after it

let pool; // initialize the database connection pool

(async () => {
  //calling the database connection function while declaring it in the pool variable
  pool = await DBConn();

  // pass the pool to the routes
  app.use((req, res, next) => {
    req.pool = pool;
    next();
  });

  //declaring  auth router here
  app.use("/auth", router_auth);
  app.use("/settings", router_settings);

  //making the app run on specified port
  app.listen(port, () => {
    console.log(`server running on http://localhost:${port}`);
  });
})();