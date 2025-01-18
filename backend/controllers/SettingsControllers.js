//importing neccessary functions and libraries to be using in the controller functions
const bcrypt = require("bcryptjs"); //for hashing user's password startWizzward
const token = require("../utils/jwt");

const is_ready = async (req, res) => {
  try {
    // Aktuellen Benutzer ermitteln
    const user = req.user; // Auth-Middleware erforderlich
    console.log("Aktueller Benutzer is Ready:", user);

    const userId = req.user?.id;

    // Überprüfen, ob userId existiert
    if (!userId) {
      return res.status(400).json({ message: "Benutzer-ID fehlt" });
    }

    await req.pool.query("USE ??", [process.env.DB_DATABASE]);
    // Abrufen des `is_ready`-Status
    const [settingsResult] = await req.pool.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'is_ready' LIMIT 1"
    );

    if (settingsResult.length === 0) {
      return res.status(404).json({ message: "Settings not found" });
    }

    return res.status(200).json({
      is_ready: settingsResult[0].setting_value === "true", // Prüfe explizit den Wert
    });

  } catch (error) {
    console.error("Fehler in der startWizzward-Funktion:", error); // Logge den genauen Fehler
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const is_admin = async (req, res) => {
  try {
    // Aktuellen Benutzer ermitteln
    const user = req.user; // Auth-Middleware erforderlich
    console.log("Aktueller Benutzer is Admin:", user);

    const userId = req.user?.id;

    // Überprüfen, ob userId existiert
    if (!userId) {
      return res.status(400).json({ message: "Benutzer-ID fehlt" });
    }

    await req.pool.query("USE ??", [process.env.DB_DATABASE]);
    // Überprüfen, ob der Benutzer Admin ist
    const [userResult] = await req.pool.query(
      "SELECT `is_admin` FROM `users` WHERE `id` = ?",
      [userId]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const isAdmin = userResult[0].is_admin;


    //}

    return res.status(200).json({
      //is_ready: settingsResult[0].is_ready,
      is_admin: isAdmin,
    });
  } catch (error) {
    console.error("Fehler in der is_admin-Funktion:", error); // Logge den genauen Fehler
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const is_new_reg = async (req, res) => {
  try {
    // Aktuellen Benutzer ermitteln
    const user = req.user; // Auth-Middleware erforderlich
    console.log("Aktueller Benutzer is new reg:", user);

    const userId = req.user?.id;

    // Überprüfen, ob userId existiert
    if (!userId) {
      return res.status(400).json({ message: "Benutzer-ID fehlt" });
    }

    await req.pool.query("USE ??", [process.env.DB_DATABASE]);
    // Abrufen des `Allow Registration`-Status
    const [settingsResult] = await req.pool.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'allowRegistration' LIMIT 1;"
    );

    if (settingsResult.length === 0) {
      return res.status(404).json({ message: "Settings not found" });
    }
    console.log("settings Value: ", settingsResult[0].setting_value);
    return res.status(200).json({
      is_new_reg: settingsResult[0].setting_value === "true", // Passe den Key an
    });

  } catch (error) {
    console.error("Fehler in der startWizzward-Funktion:", error); // Logge den genauen Fehler
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const set_new_reg = async (req, res) => {
  try {
    const { allowRegistration } = req.body;
    if (typeof allowRegistration !== "boolean") {
      return res.status(400).json({ message: "Invalid input" });
    }

    await req.pool.query("USE ??", [process.env.DB_DATABASE]);

    await req.pool.query(
      "UPDATE settings SET setting_value = ? WHERE setting_key = 'allowRegistration'",
      [allowRegistration ? "true" : "false"]
    );

    return res.status(200).json({ message: "Registration setting updated" });
  } catch (error) {
    console.error("Error updating registration setting:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const get_language = async (req, res) => {
  try {
    await req.pool.query("USE ??", [process.env.DB_DATABASE]);
    const [result] = await req.pool.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'language' LIMIT 1"
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Language setting not found" });
    }

    return res.status(200).json({ language: result[0].setting_value });
  } catch (error) {
    console.error("Error fetching language:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const set_language = async (req, res) => {
  try {
    const { language } = req.body;

    if (!language) {
      return res.status(400).json({ message: "Language is required" });
    }

    await req.pool.query("USE ??", [process.env.DB_DATABASE]);
    await req.pool.query(
      "UPDATE settings SET setting_value = ? WHERE setting_key = 'language'",
      [language]
    );

    return res.status(200).json({ message: "Language updated successfully" });
  } catch (error) {
    console.error("Error updating language:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const set_setup_wizard = async (req, res) => {
  try {
    // Aktuellen Benutzer ermitteln
    const user = req.user; // Auth-Middleware erforderlich
    console.log("Aktueller Benutzer setup wizzard:", user);

    const userId = req.user?.id;

    // Überprüfen, ob userId existiert
    if (!userId) {
      return res.status(400).json({ message: "Benutzer-ID fehlt" });
    }

    await req.pool.query("USE ??", [process.env.DB_DATABASE]);

    // Update den `is_ready`-Status auf true
    const [updateResult] = await req.pool.query(
      "UPDATE settings SET setting_value = 'true' WHERE setting_key = 'is_ready'"
    );

    // Überprüfen, ob das Update erfolgreich war
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: "Fehler beim Setzen des is_ready-Status" });
    }

    return res.status(200).json({
      message: "Setup erfolgreich abgeschlossen!",
    });

  } catch (error) {
    console.error("Fehler in der set_setup_wizard-Funktion:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};




module.exports = { is_ready, is_admin, is_new_reg, set_new_reg, set_setup_wizard, get_language, set_language };