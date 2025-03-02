//importing neccessary functions and libraries to be using in the controller functions
const bcrypt = require("bcryptjs"); //for hashing user's password
const token = require("../utils/jwt");

//async await signup function which checks if all the input fields are filled then hashes the password to save it in the database using a query
const SignUpController = async (req, res) => {
  // Überprüfung, ob Registrierungen erlaubt sind
  const [allowRegistrationResult] = await req.pool.query(
    `SELECT setting_value FROM \`settings\` WHERE setting_key = 'allowRegistration'`
  );
  
  const allowRegistration = allowRegistrationResult[0]?.setting_value === 'true';
  
  if (!allowRegistration) {
    return res
      .status(403)
      .send("Registrations are currently closed. Please try again later.");
  }

  // Deklaration von Variablen aus req.body
  const { username, email, password } = req.body;

  // Überprüfung auf gültige Eingaben
  if (!username || username === "" || !email || email === "" || !password || password === "") {
    return res.status(400).send("All Fields are Required");
  }

  try {
    // Überprüfung, ob ein Nutzer mit demselben Benutzernamen existiert
    const [checkUsername] = await req.pool.query(
      `SELECT COUNT(*) AS count FROM ${process.env.DB_TABLENAME} WHERE username = ?`,
      [username]
    );
    if (checkUsername[0].count > 0) {
      return res.status(400).send("User with the same username already exists");
    }

    // Überprüfung, ob ein Nutzer mit derselben E-Mail-Adresse existiert
    const [checkEmail] = await req.pool.query(
      `SELECT COUNT(*) AS count FROM ${process.env.DB_TABLENAME} WHERE email = ?`,
      [email]
    );
    if (checkEmail[0].count > 0) {
      return res.status(400).send("User with the same email already exists");
    }

    // Überprüfung der Nutzeranzahl, um festzustellen, ob der neue Nutzer ein Admin ist
    const [userCount] = await req.pool.query(
      `SELECT COUNT(*) AS count FROM ${process.env.DB_TABLENAME}`
    );
    const isAdmin = userCount[0].count === 0; // Admin, wenn keine Nutzer existieren

    // Passwort-Hashing
    const salt = await bcrypt.genSalt(10); // Salt-Runden definieren
    const hashedPassword = await bcrypt.hash(password, salt);

    // Einfügen des Nutzers in die Datenbank
    const [insertUser] = await req.pool.query(
      `INSERT INTO \`${process.env.DB_TABLENAME}\` (username, email, password, is_admin) VALUES (?, ?, ?, ?)`,
      [username, email, hashedPassword, isAdmin]
    );

    // Erfolgsantwort senden
    res.status(201).json({ id: insertUser.insertId, username, email, is_admin: isAdmin });
  } catch (error) {
    // Fehlerbehandlung
    console.error("Error during signup:", error);
    res.status(500).send("Internal Server Error");
  }
};


//async await login function which checks if all the input fields are filled then compares the hashed password saved in the database and sends a json web token if is successful
const LoginController = async (req, res) => {
  const { username, password } = req.body;

  // Überprüfung der Eingabefelder
  if (!username || username === "" || !password || password === "") {
    return res.status(400).send("All Fields are Required");
  }

  try {
    // Überprüfen, ob der Benutzer existiert
    const [checkUsername] = await req.pool.query(
      `SELECT COUNT(*) AS count FROM ${process.env.DB_TABLENAME} WHERE username = ?`,
      [username]
    );
    if (checkUsername[0].count === 0) {
      return res.status(400).send("User with this username doesn't exist");
    }

    // Benutzer abrufen
    const [checkUserpassword] = await req.pool.query(
      `SELECT * FROM ${process.env.DB_TABLENAME} WHERE username = ?`,
      [username]
    );
    const foundUser = checkUserpassword[0];

    // Überprüfen, ob das Passwort übereinstimmt
    const matchPassword = await bcrypt.compare(password, foundUser.password);

    if (!matchPassword) {
      return res.status(401).send("Incorrect Password");
    } else {
      // Token generieren und an den Client senden
      token(foundUser, res); // Hier das Token über das `token`-Modul senden
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Internal Server Error");
  }
};


const check = async (req, res) => {
  try {
    if (req.cookies.token) {
      // Hier könntest du dein Token validieren, z.B. mit JWT
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