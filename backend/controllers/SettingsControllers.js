//importing neccessary functions and libraries to be using in the controller functions
const bcrypt = require("bcryptjs"); //for hashing user's password startWizzward
const token = require("../utils/jwt");

const debugging = false; 

const fs = require('fs');
const path = require('path');

const is_ready = async (req, res) => {
  try {
    
    const user = req.user; 

    if(debugging){
      console.log("Current user is Ready:", user);
    }

    const userId = req.user?.id;

    
    if (!userId) {
      return res.status(400).json({ message: "Benutzer-ID fehlt" });
    }

    await req.pool.query("USE ??", [process.env.DB_DATABASE]);
    
    const [settingsResult] = await req.pool.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'is_ready' LIMIT 1"
    );

    if (settingsResult.length === 0) {
      return res.status(404).json({ message: "Settings not found" });
    }

    return res.status(200).json({
      is_ready: settingsResult[0].setting_value === "true", 
    });

  } catch (error) {
    console.error("Error in the startWizzward function:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const is_admin = async (req, res) => {
  try {
    
    const user = req.user; 
    if(debugging){
      console.log("Current user is Admin:", user);
    }

    const userId = req.user?.id;

    
    if (!userId) {
      return res.status(400).json({ message: "Benutzer-ID fehlt" });
    }

    await req.pool.query("USE ??", [process.env.DB_DATABASE]);
    
    const [userResult] = await req.pool.query(
      "SELECT `is_admin` FROM `users` WHERE `id` = ?",
      [userId]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const isAdmin = userResult[0].is_admin;


  

    return res.status(200).json({
      
      is_admin: isAdmin,
    });
  } catch (error) {
    console.error("Error in the is_admin function:", error);

    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const is_new_reg = async (req, res) => {
  try {
    
    const user = req.user; 

    if(debugging){
      console.log("Current user is (new reg):", user);
    }

    const userId = req.user?.id;

    
    if (!userId) {
      return res.status(400).json({ message: "Benutzer-ID fehlt" });
    }

    await req.pool.query("USE ??", [process.env.DB_DATABASE]);
    
    const [settingsResult] = await req.pool.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'allowRegistration' LIMIT 1;"
    );

    if (settingsResult.length === 0) {
      return res.status(404).json({ message: "Settings not found" });
    }

    if(debugging){
      console.log("settings Value: ", settingsResult[0].setting_value);
    }

    return res.status(200).json({
      is_new_reg: settingsResult[0].setting_value === "true", 
    });

  } catch (error) {
    console.error("Error in the startWizzward function:", error);

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
          name VARCHAR(255),
          full_name VARCHAR(255),
          story TEXT,
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

      
      await req.pool.query(`
        CREATE TABLE IF NOT EXISTS user_collections (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT,
          card_id INT,
          is_foil BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (card_id) REFERENCES cards(id)
        );
      `);

     
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

      if(debugging){
        console.log("Downloading current JSON files...");
      }

      await downloadCardData(req, { status: () => ({ json: () => {} }) });

      if(debugging){
        console.log("JSON files downloaded successfully.");
      }



      
      const dirPath = path.join(__dirname, '../games/lorcana');
      const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.json'));
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
        const language = data.metadata.language;
      
        for (const card of data.cards) {
          
          const [existingCard] = await req.pool.query(
            "SELECT id FROM cards WHERE id = ? LIMIT 1",
            [card.id]
          );
      
          if (existingCard.length === 0) {
            await req.pool.query(`
              INSERT INTO cards (id, set_code, number, name, full_name, type, color, cost, strength, willpower, rarity, story, inkwell)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              card.id, card.setCode, card.number, card.name, card.fullName, card.type, card.color,
              card.cost, card.strength, card.willpower, card.rarity, card.story, card.inkwell
            ]);
          }
      
          
          const [existingTranslation] = await req.pool.query(
            "SELECT id FROM card_translations WHERE card_id = ? AND language = ? LIMIT 1",
            [card.id, language]
          );
          
          if (existingTranslation.length === 0) {
            await req.pool.query(`
              INSERT INTO card_translations (card_id, language, name, full_name, story, flavor_text, full_text)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              card.id, language, card.name, card.fullName, card.story, card.flavorText || '', card.fullText || ''
            ]);
          } else {
            
            await req.pool.query(`
              UPDATE card_translations 
              SET name = ?, full_name = ?, story = ?, flavor_text = ?, full_text = ?
              WHERE card_id = ? AND language = ?
            `, [
              card.name, card.fullName, card.story, card.flavorText || '', card.fullText || '', card.id, language
            ]);
          }
      
          
          const { full, thumbnail, foilMask } = card.images || {};
          const [existingImage] = await req.pool.query(
            "SELECT id FROM card_images WHERE card_id = ? AND language = ? LIMIT 1",
            [card.id, language]
          );
      
          if (existingImage.length === 0 && (full || thumbnail || foilMask)) {
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



const axios = require("axios");


const DATA_DIR = path.join(__dirname, "../games/lorcana");


const JSON_SOURCES = {
  en: "https://lorcanajson.org/files/current/en/allCards.json",
  fr: "https://lorcanajson.org/files/current/fr/allCards.json",
  de: "https://lorcanajson.org/files/current/de/allCards.json"
};


const downloadCardData = async (req, res) => {
  try {
    
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    
    for (const [lang, url] of Object.entries(JSON_SOURCES)) {
      const filePath = path.join(DATA_DIR, `allCards_${lang}.json`);
      const response = await axios.get(url, { responseType: "arraybuffer" });

      fs.writeFileSync(filePath, response.data);
      if(debugging){
        console.log(`JSON file (${lang}) successfully saved:`, filePath);
      }

    }

    return res.status(200).json({ message: "Kartendaten erfolgreich aktualisiert." });
  } catch (error) {
    console.error("Error downloading card data:", error);

    return res.status(500).json({ message: "Fehler beim Herunterladen der Kartendaten." });
  }
};




const set_setup_wizard = async (req, res) => {
  try {
    
    const user = req.user; 

    if(debugging){
      console.log("Current user (setup wizard):", user);
    }


    const userId = req.user?.id;

    
    if (!userId) {
      return res.status(400).json({ message: "Benutzer-ID fehlt" });
    }

    await req.pool.query("USE ??", [process.env.DB_DATABASE]);

    
    const [updateResult] = await req.pool.query(
      "UPDATE settings SET setting_value = 'true' WHERE setting_key = 'is_ready'"
    );

    
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: "Fehler beim Setzen des is_ready-Status" });
    }

    return res.status(200).json({
      message: "Setup erfolgreich abgeschlossen!",
    });

  } catch (error) {
    console.error("Error in the set_setup_wizard function:", error);

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
    console.error("Error fetching username:", error);

    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const set_username = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { username } = req.body;

    if (!userId || !username) {
      if(debugging){
       console.log("Missing data:", { userId, username });
      }

      return res.status(400).json({ message: "Benutzer-ID oder Benutzername fehlt" });
    }

    await req.pool.query("USE ??", [process.env.DB_DATABASE]);

    
    const [existingUser] = await req.pool.query(
      "SELECT id FROM users WHERE username = ? AND id != ?",
      [username, userId]
    );

    if (existingUser.length > 0) {
      if(debugging){
        console.log("Username already exists:", username);
      }

      return res.status(400).json({ message: "Benutzername bereits vergeben" });
    }

    const [updateResult] = await req.pool.query(
      "UPDATE users SET username = ? WHERE id = ?",
      [username, userId]
    );

    if (updateResult.affectedRows === 0) {
      if(debugging){
        console.log("No record updated");
      }

      return res.status(404).json({ message: "Benutzer nicht gefunden oder keine Änderungen" });
    }

    if(debugging){
      console.log("Username successfully updated:", username);
    }

    return res.status(200).json({ message: "Benutzername erfolgreich aktualisiert" });
  } catch (error) {
    console.error("Error updating username:", error);

    return res.status(500).json({ message: "Internal Server Error" });
  }
};



const set_password = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ message: "Benutzer-ID oder Passwort fehlt" });
    }

    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await req.pool.query("USE ??", [process.env.DB_DATABASE]);

    await req.pool.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, userId]
    );

    return res.status(200).json({ message: "Passwort erfolgreich aktualisiert" });
  } catch (error) {
    console.error("Error updating password:", error);

    return res.status(500).json({ message: "Internal Server Error" });
  }
};



module.exports = { is_ready, is_admin, is_new_reg, set_new_reg, set_setup_wizard,
                   get_language, set_language, get_game, set_game, get_seeFriends, 
                   set_seeFriends, get_username, set_username, set_password, downloadCardData };