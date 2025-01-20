//importing neccessary functions and libraries to be using in the controller functions
const bcrypt = require("bcryptjs"); //for hashing user's password startWizzward
const token = require("../utils/jwt");

const get_all_cards = async (req, res) => {
    try {
      // Datenbank auswählen
      await req.pool.query("USE ??", [process.env.DB_DATABASE]);
  
      // Aktuelle Sprache aus den Settings laden
      const [languageResult] = await req.pool.query(
        "SELECT setting_value FROM settings WHERE setting_key = 'language' LIMIT 1"
      );
      const language = languageResult[0]?.setting_value || 'en'; // Standard auf Englisch setzen
  
      // Karteninformationen abrufen, mit Fallback auf Englisch
      const [cards] = await req.pool.query(`
        SELECT 
          c.id,
          c.set_code,
          c.number,
          c.name AS default_name,
          c.type,
          c.color,
          c.cost,
          c.strength,
          c.willpower,
          c.rarity,
          c.story,
          c.inkwell,
          COALESCE(ct.language, 'en') AS language,
          COALESCE(ct.flavor_text, '') AS flavor_text,
          COALESCE(ct.full_text, '') AS full_text,
          COALESCE(ci.full_url, '') AS image_full,
          COALESCE(ci.thumbnail_url, '') AS image_thumbnail,
          COALESCE(ci.foil_mask_url, '') AS image_foil_mask
        FROM 
          cards c
        LEFT JOIN 
          card_translations ct 
          ON c.id = ct.card_id AND (ct.language = ? OR ct.language = 'en')
        LEFT JOIN 
          card_images ci 
          ON c.id = ci.card_id AND (ci.language = ? OR ci.language = 'en')
        WHERE 
          ct.language IS NULL OR ct.language = ? OR ct.language = 'en'
        ORDER BY 
          c.set_code, c.number
      `, [language, language, language]);
  
      // Falls keine Karten gefunden wurden
      if (cards.length === 0) {
        return res.status(404).json({ message: "No cards found for the selected language" });
      }
  
      // Karten-Daten strukturieren
      return res.status(200).json({
        language,
        cards: cards.map(card => ({
          id: card.id,
          setCode: card.set_code,
          number: card.number,
          name: card.default_name,
          type: card.type,
          color: card.color,
          cost: card.cost,
          strength: card.strength,
          willpower: card.willpower,
          rarity: card.rarity,
          story: card.story,
          inkwell: card.inkwell,
          flavorText: card.flavor_text,
          fullText: card.full_text,
          images: {
            full: card.image_full,
            thumbnail: card.image_thumbnail,
            foilMask: card.image_foil_mask,
          },
        })),
      });
    } catch (error) {
      console.error("Fehler in der Funktion get_all_cards:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };

  const get_filtered_cards = async (req, res) => {
    try {
      const { set_code, color, rarity, search } = req.query;
      console.log("Filterparameter:", { set_code, color, rarity, search });
  
      await req.pool.query("USE ??", [process.env.DB_DATABASE]);
  
      const [languageResult] = await req.pool.query(
        "SELECT setting_value FROM settings WHERE setting_key = 'language' LIMIT 1"
      );
      const language = languageResult[0]?.setting_value || 'en';
  
      const query = `
        SELECT 
          c.id, 
          c.set_code, 
          c.number, 
          c.name, 
          c.full_name, 
          c.type, 
          c.color, 
          c.cost, 
          c.strength, 
          c.willpower, 
          c.rarity, 
          c.story, 
          c.inkwell,
          COALESCE(ct.language, 'en') AS language,
          COALESCE(ct.flavor_text, '') AS flavor_text,
          COALESCE(ct.full_text, '') AS full_text,
          COALESCE(ci.full_url, '') AS image_full,
          COALESCE(ci.thumbnail_url, '') AS image_thumbnail,
          COALESCE(ci.foil_mask_url, '') AS image_foil_mask
        FROM 
          cards c
        LEFT JOIN 
          card_translations ct 
          ON c.id = ct.card_id AND (ct.language = ? OR ct.language = 'en')
        LEFT JOIN 
          card_images ci 
          ON c.id = ci.card_id AND (ci.language = ? OR ci.language = 'en')
        WHERE 
          (? = '' OR c.set_code = ?)
          AND (? = '' OR c.color = ?)
          AND (? = '' OR c.rarity = ?)
          AND (? = '' OR c.name LIKE ? OR c.full_name LIKE ? OR ct.full_text LIKE ?)
        ORDER BY 
          c.set_code, c.number;
      `;
  
      const params = [
        language,
        language,
        set_code || '',
        set_code || '',
        color || '',
        color || '',
        rarity || '',
        rarity || '',
        search || '',
        `%${search || ''}%`,
        `%${search || ''}%`,
        `%${search || ''}%`,
      ];
  
      console.log("SQL-Parameter:", params);
  
      const [results] = await req.pool.query(query, params);
  
      if (results.length === 0) {
        return res.status(200).json({ cards: [] }); // Leere Liste zurückgeben
      }
  
      return res.status(200).json({
        language,
        cards: results.map(card => ({
          id: card.id,
          setCode: card.set_code,
          number: card.number,
          name: card.name,
          fullName: card.full_name,
          type: card.type,
          color: card.color,
          cost: card.cost,
          strength: card.strength,
          willpower: card.willpower,
          rarity: card.rarity,
          story: card.story,
          inkwell: card.inkwell,
          flavorText: card.flavor_text,
          fullText: card.full_text,
          images: {
            full: card.image_full,
            thumbnail: card.image_thumbnail,
            foilMask: card.image_foil_mask,
          },
        })),
      });
    } catch (error) {
      console.error("Error in get_filtered_cards:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
  
  const add_card_to_collection = async (req, res) => {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return res.status(400).json({ message: "Benutzer-ID fehlt" });
        }

        const { card_id, normal_quantity, foil_quantity } = req.body;
        if (!card_id) {
            return res.status(400).json({ message: "Card ID is required" });
        }

        await req.pool.query("USE ??", [process.env.DB_DATABASE]);

        // Entferne bestehende Karten-Einträge des Nutzers, um sie neu hinzuzufügen
        await req.pool.query(
            `DELETE FROM user_collections WHERE user_id = ? AND card_id = ?`,
            [user_id, card_id]
        );

        // Normale Karten hinzufügen
        for (let i = 0; i < (normal_quantity || 0); i++) {
            await req.pool.query(
                `INSERT INTO user_collections (user_id, card_id, is_foil)
                 VALUES (?, ?, 0)`,
                [user_id, card_id]
            );
        }

        // Foil-Karten hinzufügen
        for (let i = 0; i < (foil_quantity || 0); i++) {
            await req.pool.query(
                `INSERT INTO user_collections (user_id, card_id, is_foil)
                 VALUES (?, ?, 1)`,
                [user_id, card_id]
            );
        }

        return res.status(200).json({ message: "Karten erfolgreich zur Sammlung hinzugefügt" });
    } catch (error) {
        console.error("Fehler in add_card_to_collection:", error);
        return res.status(500).json({ message: "Interner Serverfehler", error: error.message });
    }
};




  
  
const get_card_quantity = async (req, res) => {
    try {
        const { card_id } = req.params;
        const user_id = req.user.id;

        if (!card_id) {
            return res.status(400).json({ message: "Card ID is required" });
        }

        await req.pool.query("USE ??", [process.env.DB_DATABASE]);

        // Anzahl der normalen und Foil-Karten zählen
        const [results] = await req.pool.query(`
            SELECT 
                SUM(CASE WHEN is_foil = 0 THEN 1 ELSE 0 END) AS normal_quantity,
                SUM(CASE WHEN is_foil = 1 THEN 1 ELSE 0 END) AS foil_quantity
            FROM user_collections
            WHERE user_id = ? AND card_id = ?
        `, [user_id, card_id]);

        return res.status(200).json(results[0] || { normal_quantity: 0, foil_quantity: 0 });
    } catch (error) {
        console.error("Error in get_card_quantity:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

  
  
const get_owned_cards = async (req, res) => {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return res.status(400).json({ message: "Benutzer-ID fehlt" });
        }

        await req.pool.query("USE ??", [process.env.DB_DATABASE]);

        const [ownedCards] = await req.pool.query(`
            SELECT DISTINCT card_id 
            FROM user_collections 
            WHERE user_id = ?
        `, [user_id]);

        const ownedCardIds = ownedCards.map(card => card.card_id);

        return res.status(200).json({ ownedCardIds });
    } catch (error) {
        console.error("Fehler in get_owned_cards:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

  
  const create_deck = async (req, res) => {
    try {
      const { name, description } = req.body;
      const user_id = req.user.id;
  
      if (!name) {
        return res.status(400).json({ message: "Deck name is required" });
      }
  
      await req.pool.query("USE ??", [process.env.DB_DATABASE]);
      const [result] = await req.pool.query(
        "INSERT INTO decks (user_id, name, description) VALUES (?, ?, ?)",
        [user_id, name, description || ""]
      );
  
      return res.status(201).json({ message: "Deck created successfully", deckId: result.insertId });
    } catch (error) {
      console.error("Error creating deck:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
  
  const get_user_decks = async (req, res) => {
    try {
      const user_id = req.user.id;
      await req.pool.query("USE ??", [process.env.DB_DATABASE]);
  
      const [decks] = await req.pool.query(
        `SELECT d.id, d.name, d.description, 
        (SELECT ci.thumbnail_url FROM deck_cards dc 
         LEFT JOIN card_images ci ON dc.card_id = ci.card_id 
         WHERE dc.deck_id = d.id LIMIT 1) AS thumbnail 
         FROM decks d WHERE user_id = ?`,
        [user_id]
      );
  
      return res.status(200).json({ decks });

    } catch (error) {
      console.error("Error fetching decks:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
  
  const get_deck_details = async (req, res) => {
    try {
        const { deck_id } = req.params;
        const user_id = req.user.id;

        await req.pool.query("USE ??", [process.env.DB_DATABASE]);

        // Deck-Daten abrufen
        const [deck] = await req.pool.query(
            "SELECT * FROM decks WHERE id = ? AND user_id = ?",
            [deck_id, user_id]
        );

        if (deck.length === 0) {
            return res.status(404).json({ message: "Deck not found" });
        }

        // Karten des Decks abrufen
        const [cards] = await req.pool.query(`
            SELECT 
                dc.id AS deck_card_id,
                uc.id AS user_collection_id,
                uc.card_id,
                uc.is_foil,
                c.full_name AS name, 
                (SELECT ci.thumbnail_url 
                 FROM card_images ci 
                 WHERE ci.card_id = c.id 
                 LIMIT 1) AS thumbnail_url
            FROM deck_cards dc
            JOIN user_collections uc ON dc.user_collection_id = uc.id
            JOIN cards c ON uc.card_id = c.id
            WHERE dc.deck_id = ?
            ORDER BY c.full_name
        `, [deck_id]);

        return res.status(200).json({ deck: { ...deck[0], cards } });
    } catch (error) {
        console.error("Error fetching deck details:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};









const add_card_to_deck = async (req, res) => {
    try {
        const { deck_id } = req.params;
        const { user_collection_ids } = req.body;  // Benutzerkartensammlung-ID erwartet
        const user_id = req.user.id;

        if (!Array.isArray(user_collection_ids)) {
            return res.status(400).json({ message: "Invalid user_collection_ids format" });
        }

        await req.pool.query("USE ??", [process.env.DB_DATABASE]);

        for (const user_collection_id of user_collection_ids) {
            await req.pool.query(
                `INSERT INTO deck_cards (deck_id, user_collection_id)
                 VALUES (?, ?)`,
                [deck_id, user_collection_id]
            );
        }

        return res.status(200).json({ message: "Cards added to deck" });
    } catch (error) {
        console.error("Error adding cards to deck:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


  
  
  
  
const remove_card_from_deck = async (req, res) => {
    try {
        const { deck_id, user_collection_id } = req.params;
        const user_id = req.user.id;

        if (!deck_id || !user_collection_id) {
            return res.status(400).json({ message: "Deck ID and User Collection ID are required" });
        }

        await req.pool.query("USE ??", [process.env.DB_DATABASE]);

        // Überprüfen, ob das Deck dem aktuellen Benutzer gehört
        const [deck] = await req.pool.query(
            "SELECT id FROM decks WHERE id = ? AND user_id = ?",
            [deck_id, user_id]
        );

        if (deck.length === 0) {
            return res.status(403).json({ message: "Unauthorized to modify this deck" });
        }

        // Karte aus dem Deck entfernen
        const [result] = await req.pool.query(
            "DELETE FROM deck_cards WHERE deck_id = ? AND user_collection_id = ?",
            [deck_id, user_collection_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Card not found in deck" });
        }

        return res.status(200).json({ message: "Card removed from deck successfully" });
    } catch (error) {
        console.error("Error in remove_card_from_deck:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


  
  const update_deck = async (req, res) => {
    try {
      const { deck_id } = req.params;
      const { name, description } = req.body;
      const user_id = req.user.id;
  
      await req.pool.query("USE ??", [process.env.DB_DATABASE]);
  
      const [result] = await req.pool.query(
        "UPDATE decks SET name = ?, description = ? WHERE id = ? AND user_id = ?",
        [name, description, deck_id, user_id]
      );
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Deck not found or unauthorized" });
      }
  
      return res.status(200).json({ message: "Deck updated successfully" });
    } catch (error) {
      console.error("Error updating deck:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
  
  const get_user_collection = async (req, res) => {
    try {
      const user_id = req.user.id;
  
      await req.pool.query("USE ??", [process.env.DB_DATABASE]);
  
      const [collection] = await req.pool.query(`
          SELECT 
              uc.id AS user_collection_id,
              uc.card_id AS id,
              c.full_name, 
              (SELECT ci.thumbnail_url 
               FROM card_images ci 
               WHERE ci.card_id = c.id 
               LIMIT 1) AS thumbnail_url,
              uc.is_foil
          FROM user_collections uc
          JOIN cards c ON uc.card_id = c.id
          WHERE uc.user_id = ?
      `, [user_id]);
  
      if (collection.length === 0) {
        return res.status(200).json({ cards: [] });
      }
  
      return res.status(200).json({ cards: collection });
    } catch (error) {
      console.error("Error fetching user collection:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
  




  
  

  module.exports = { get_all_cards, get_filtered_cards, add_card_to_collection, get_card_quantity, get_owned_cards, create_deck, get_user_decks, get_deck_details, add_card_to_deck, remove_card_from_deck, update_deck, get_user_collection };