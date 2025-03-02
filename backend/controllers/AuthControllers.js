//importing neccessary functions and libraries to be using in the controller functions
const bcrypt = require("bcryptjs"); //for hashing user's password
const token = require("../utils/jwt");

//async await signup function which checks if all the input fields are filled then hashes the password to save it in the database using a query
const SignUpController = async (req, res) => {
  // Check if registrations are allowed
  const [allowRegistrationResult] = await req.pool.query(
    `SELECT setting_value FROM \`settings\` WHERE setting_key = 'allowRegistration'`
  );
  
  const allowRegistration = allowRegistrationResult[0]?.setting_value === 'true';
  
  if (!allowRegistration) {
    return res
      .status(403)
      .send("Registrations are currently closed. Please try again later.");
  }

  // Declare variables from req.body
  const { username, email, password } = req.body;

  // Validate input data
  if (!username || username === "" || !email || email === "" || !password || password === "") {
    return res.status(400).send("All Fields are Required");
  }

  try {
    // Check if a user with the same username already exists
    const [checkUsername] = await req.pool.query(
      `SELECT COUNT(*) AS count FROM ${process.env.DB_TABLENAME} WHERE username = ?`,
      [username]
    );
    if (checkUsername[0].count > 0) {
      return res.status(400).send("User with the same username already exists");
    }

    // Check if a user with the same email address already exists
    const [checkEmail] = await req.pool.query(
      `SELECT COUNT(*) AS count FROM ${process.env.DB_TABLENAME} WHERE email = ?`,
      [email]
    );
    if (checkEmail[0].count > 0) {
      return res.status(400).send("User with the same email already exists");
    }

    // Check the number of users to determine if the new user should be an admin
    const [userCount] = await req.pool.query(
      `SELECT COUNT(*) AS count FROM ${process.env.DB_TABLENAME}`
    );
    const isAdmin = userCount[0].count === 0; // Set user as admin if no other users exist

    // Passwort-Hashing
    const salt = await bcrypt.genSalt(10); // Define salt rounds
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert the user into the database
    const [insertUser] = await req.pool.query(
      `INSERT INTO \`${process.env.DB_TABLENAME}\` (username, email, password, is_admin) VALUES (?, ?, ?, ?)`,
      [username, email, hashedPassword, isAdmin]
    );

    // Send success response
    res.status(201).json({ id: insertUser.insertId, username, email, is_admin: isAdmin });
  } catch (error) {
    // Error handling
    console.error("Error during signup:", error);
    res.status(500).send("Internal Server Error");
  }
};


//async await login function which checks if all the input fields are filled then compares the hashed password saved in the database and sends a json web token if is successful
const LoginController = async (req, res) => {
  const { username, password } = req.body;

  // Validate input fields
  if (!username || username === "" || !password || password === "") {
    return res.status(400).send("All Fields are Required");
  }

  try {
    // Check if the user exists
    const [checkUsername] = await req.pool.query(
      `SELECT COUNT(*) AS count FROM ${process.env.DB_TABLENAME} WHERE username = ?`,
      [username]
    );
    if (checkUsername[0].count === 0) {
      return res.status(400).send("User with this username doesn't exist");
    }

    // Retrieve user data
    const [checkUserpassword] = await req.pool.query(
      `SELECT * FROM ${process.env.DB_TABLENAME} WHERE username = ?`,
      [username]
    );
    const foundUser = checkUserpassword[0];

    // Verify if the password matches
    const matchPassword = await bcrypt.compare(password, foundUser.password);

    if (!matchPassword) {
      return res.status(401).send("Incorrect Password");
    } else {
      // Generate and send a token to the client
      token(foundUser, res); // Send the token using the `token` module
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Internal Server Error");
  }
};


const check = async (req, res) => {
  try {
    if (req.cookies.token) {
      
      res.sendStatus(200);
    } else {
      res.sendStatus(401);
    }
  } catch (error) {
      
      return res.status(500).json({ message: "Interner Serverfehler" });
  }
};

//exporting the controller function
module.exports = { SignUpController, LoginController, check };