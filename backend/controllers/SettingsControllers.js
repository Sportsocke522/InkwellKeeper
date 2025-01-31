//importing neccessary functions and libraries to be using in the controller functions
const bcrypt = require("bcryptjs"); //for hashing user's password startWizzward
const token = require("../utils/jwt");

const fs = require('fs');
const path = require('path');

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


const get_game = async (req, res) => {
  try {
    await req.pool.query("USE ??", [process.env.DB_DATABASE]);
    const [result] = await req.pool.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'game' LIMIT 1"
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Game setting not found" });
    }

    return res.status(200).json({ game: result[0].setting_value });
  } catch (error) {
    console.error("Error fetching game:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const set_game = async (req, res) => {
  try {
    const { game } = req.body;
    if (!game) {
      return res.status(400).json({ message: "Game is required" });
    }

    await req.pool.query("USE ??", [process.env.DB_DATABASE]);
    await req.pool.query(
      "UPDATE settings SET setting_value = ? WHERE setting_key = 'game'",
      [game]
    );

    if (game === "Lorcana") {
      // Tabellen erstellen
      await req.pool.query(`
        CREATE TABLE IF NOT EXISTS cards (
          id INT PRIMARY KEY,
          set_code VARCHAR(50),
          number INT,
          name VARCHAR(255),
          full_name VARCHAR(255),
          type VARCHAR(50),
          color VARCHAR(50),
          cost INT,
          strength INT,
          willpower INT,
          rarity VARCHAR(50),
          story VARCHAR(255),
          inkwell BOOLEAN
        );
      `);

      await req.pool.query(`
        CREATE TABLE IF NOT EXISTS card_translations (
          id INT PRIMARY KEY AUTO_INCREMENT,
          card_id INT,
          language VARCHAR(10),
          flavor_text TEXT,
          full_text TEXT,
          FOREIGN KEY (card_id) REFERENCES cards(id)
        );
      `);

      await req.pool.query(`
        CREATE TABLE IF NOT EXISTS card_images (
          id INT PRIMARY KEY AUTO_INCREMENT,
          card_id INT,
          language VARCHAR(10),
          full_url TEXT,
          thumbnail_url TEXT,
          foil_mask_url TEXT,
          FOREIGN KEY (card_id) REFERENCES cards(id)
        );
      `);

      // Benutzer-Sammlungstabelle aktualisieren
      await req.pool.query(`
        CREATE TABLE IF NOT EXISTS user_collections (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT,
          card_id INT,
          is_foil BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (card_id) REFERENCES cards(id)
        );
      `);

      // Deck-Tabelle erstellen
      await req.pool.query(`
        CREATE TABLE IF NOT EXISTS decks (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT,
          name VARCHAR(255),
          description TEXT,
          image_path VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Deck-Karten-Tabelle erstellen
      await req.pool.query(`
        CREATE TABLE IF NOT EXISTS deck_cards (
          id INT PRIMARY KEY AUTO_INCREMENT,
          deck_id INT,
          card_id INT,
          user_collection_id INT,
          FOREIGN KEY (deck_id) REFERENCES decks(id),
          FOREIGN KEY (card_id) REFERENCES cards(id),
          FOREIGN KEY (user_collection_id) REFERENCES user_collections(id)
        );
      `);

      // JSON-Dateien einlesen und importieren
      const dirPath = path.join(__dirname, '../games/lorcana');
      const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.json'));

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const language = data.metadata.language;
        for (const card of data.cards) {
          await req.pool.query(`
            INSERT IGNORE INTO cards (id, set_code, number, name, full_name, type, color, cost, strength, willpower, rarity, story, inkwell)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            card.id, card.setCode, card.number, card.name, card.fullName, card.type, card.color,
            card.cost, card.strength, card.willpower, card.rarity, card.story, card.inkwell
          ]);

          await req.pool.query(`
            INSERT INTO card_translations (card_id, language, flavor_text, full_text)
            VALUES (?, ?, ?, ?)
          `, [
            card.id, language, card.flavorText || '', card.fullText || ''
          ]);

          const { full, thumbnail, foilMask } = card.images || {};
          if (full || thumbnail || foilMask) {
            await req.pool.query(`
              INSERT INTO card_images (card_id, language, full_url, thumbnail_url, foil_mask_url)
              VALUES (?, ?, ?, ?, ?)
            `, [
              card.id, language, full || '', thumbnail || '', foilMask || ''
            ]);
          }
        }
      }
    }

    return res.status(200).json({ message: "Game updated and tables populated successfully" });
  } catch (error) {
    console.error("Error updating Game:", error);
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


const get_seeFriends = async (req, res) => {
  try {
    await req.pool.query("USE ??", [process.env.DB_DATABASE]);
    const [result] = await req.pool.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'seeFriendsCollection' LIMIT 1"
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "See Friends setting not found" });
    }

    return res.status(200).json({ seeFriendsCollection: result[0].setting_value });
  } catch (error) {
    console.error("Error fetching see friends:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const set_seeFriends = async (req, res) => {
  try {
    const { seeFriendsCollection } = req.body;
    if (typeof seeFriendsCollection !== "boolean") {
      return res.status(400).json({ message: "Invalid input" });
    }

    await req.pool.query("USE ??", [process.env.DB_DATABASE]);

    await req.pool.query(
      "UPDATE settings SET setting_value = ? WHERE setting_key = 'seeFriendsCollection'",
      [seeFriendsCollection ? "true" : "false"]
    );

    return res.status(200).json({ message: "See Friends setting updated" });
  } catch (error) {
    console.error("Error updating See Friends setting:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};




// Benutzernamen abrufen
const get_username = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ message: "Benutzer-ID fehlt" });
    }

    await req.pool.query("USE ??", [process.env.DB_DATABASE]);

    const [result] = await req.pool.query(
      "SELECT username FROM users WHERE id = ?",
      [userId]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Benutzer nicht gefunden" });
    }

    return res.status(200).json({ username: result[0].username });
  } catch (error) {
    console.error("Fehler beim Abrufen des Benutzernamens:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Benutzernamen aktualisieren
const set_username = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { username } = req.body;

    if (!userId || !username) {
      console.log("Fehlende Daten:", { userId, username });
      return res.status(400).json({ message: "Benutzer-ID oder Benutzername fehlt" });
    }

    await req.pool.query("USE ??", [process.env.DB_DATABASE]);

    // Überprüfen, ob der Benutzername bereits existiert
    const [existingUser] = await req.pool.query(
      "SELECT id FROM users WHERE username = ? AND id != ?",
      [username, userId]
    );

    if (existingUser.length > 0) {
      console.log("Benutzername existiert bereits:", username);
      return res.status(400).json({ message: "Benutzername bereits vergeben" });
    }

    const [updateResult] = await req.pool.query(
      "UPDATE users SET username = ? WHERE id = ?",
      [username, userId]
    );

    if (updateResult.affectedRows === 0) {
      console.log("Kein Datensatz aktualisiert");
      return res.status(404).json({ message: "Benutzer nicht gefunden oder keine Änderungen" });
    }

    console.log("Benutzername erfolgreich aktualisiert:", username);
    return res.status(200).json({ message: "Benutzername erfolgreich aktualisiert" });
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Benutzernamens:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


// Passwort aktualisieren
const set_password = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ message: "Benutzer-ID oder Passwort fehlt" });
    }

    // Passwort-Hashing mit bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await req.pool.query("USE ??", [process.env.DB_DATABASE]);

    await req.pool.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, userId]
    );

    return res.status(200).json({ message: "Passwort erfolgreich aktualisiert" });
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Passworts:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



module.exports = { is_ready, is_admin, is_new_reg, set_new_reg, set_setup_wizard,
                   get_language, set_language, get_game, set_game, get_seeFriends, 
                   set_seeFriends, get_username, set_username, set_password };