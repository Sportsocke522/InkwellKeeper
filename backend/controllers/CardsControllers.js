//importing neccessary functions and libraries to be using in the controller functions
const bcrypt = require("bcryptjs"); //for hashing user's password startWizzward
const token = require("../utils/jwt");


const debugging = false; 

const get_all_cards = async (req, res) => {
    try {
      
      await req.pool.query("USE ??", [process.env.DB_DATABASE]);
  
      
      const [languageResult] = await req.pool.query(
        "SELECT setting_value FROM settings WHERE setting_key = 'language' LIMIT 1"
      );
      const language = languageResult[0]?.setting_value || 'en'; 
  
      
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
  
     
      if (cards.length === 0) {
        return res.status(404).json({ message: "No cards found for the selected language" });
      }
  
      
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

      if(debugging){
        console.error("Error in the get_all_cards function:", error);
      }
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };

  const get_filtered_cards = async (req, res) => {
    try {
        const { set_code, color, rarity, search, sort_by = 'id', sort_order = 'ASC' } = req.query;
        if(debugging) {
          console.log("Filter parameters:", { set_code, color, rarity, search, sort_by, sort_order });
        }


        await req.pool.query("USE ??", [process.env.DB_DATABASE]);

        const [languageResult] = await req.pool.query(
            "SELECT setting_value FROM settings WHERE setting_key = 'language' LIMIT 1"
        );
        const language = languageResult[0]?.setting_value || 'en';

       
        const validSortFields = {
            id: 'c.id',
            cost: 'c.cost'
        };

        
        const validSortOrders = ['ASC', 'DESC'];

       
        const sortField = validSortFields[sort_by] || 'c.id';
        const sortOrder = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'ASC';

        const query = `
            SELECT 
                c.id, 
                c.set_code, 
                c.number, 
                COALESCE(ct.name, c.name) AS name,
                COALESCE(ct.full_name, c.full_name) AS full_name,
                c.type, 
                c.color, 
                c.cost, 
                c.strength, 
                c.willpower, 
                c.rarity, 
                COALESCE(ct.story, c.story) AS story,
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
                AND (? = '' 
                    OR c.name LIKE ? 
                    OR c.full_name LIKE ? 
                    OR c.story LIKE ?
                    OR ct.name LIKE ?
                    OR ct.full_name LIKE ?
                    OR ct.story LIKE ?
                    OR ct.full_text LIKE ?)
            ORDER BY 
                ${sortField} ${sortOrder};
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
            `%${search || ''}%`,
            `%${search || ''}%`,
            `%${search || ''}%`,
            `%${search || ''}%`,
        ];

        if(debugging) {
          console.log("SQL parameters:", params);
        }


        const [results] = await req.pool.query(query, params);

        if (results.length === 0) {
            return res.status(200).json({ cards: [] }); 
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
            return res.status(400).json({ code: "USER_ID_MISSING" });
        }

        const { card_id, normal_quantity, foil_quantity } = req.body;
        if (!card_id) {
            return res.status(400).json({ code: "CARD_ID_MISSING" });
        }

        await req.pool.query("USE ??", [process.env.DB_DATABASE]);

         
        const [existingNormal] = await req.pool.query(
            `SELECT id FROM user_collections WHERE user_id = ? AND card_id = ? AND is_foil = 0`,
            [user_id, card_id]
        );

        const [existingFoil] = await req.pool.query(
            `SELECT id FROM user_collections WHERE user_id = ? AND card_id = ? AND is_foil = 1`,
            [user_id, card_id]
        );

        
        if (normal_quantity > existingNormal.length) {
           
            const cardsToAdd = normal_quantity - existingNormal.length;
            for (let i = 0; i < cardsToAdd; i++) {
                await req.pool.query(
                    `INSERT INTO user_collections (user_id, card_id, is_foil) VALUES (?, ?, 0)`,
                    [user_id, card_id]
                );
            }
        } else if (normal_quantity < existingNormal.length) {
            
            const [usedInDeck] = await req.pool.query(
                `SELECT user_collection_id FROM deck_cards 
                 WHERE user_collection_id IN (
                   SELECT id FROM user_collections WHERE user_id = ? AND card_id = ? AND is_foil = 0
                 )`,
                [user_id, card_id]
            );

            const cardsToRemove = existingNormal.length - normal_quantity;
            const deletableCards = existingNormal
                .map(card => card.id)
                .filter(id => !usedInDeck.some(used => used.user_collection_id === id));

            if (deletableCards.length < cardsToRemove) {
                return res.status(400).json({ code: "CARD_IN_DECK" });
            }

            for (let i = 0; i < cardsToRemove; i++) {
                await req.pool.query(
                    `DELETE FROM user_collections WHERE id = ?`,
                    [deletableCards[i]]
                );
            }
        }

         
        if (foil_quantity > existingFoil.length) {
            
            const cardsToAdd = foil_quantity - existingFoil.length;
            for (let i = 0; i < cardsToAdd; i++) {
                await req.pool.query(
                    `INSERT INTO user_collections (user_id, card_id, is_foil) VALUES (?, ?, 1)`,
                    [user_id, card_id]
                );
            }
        } else if (foil_quantity < existingFoil.length) {
            
            const [usedInDeck] = await req.pool.query(
                `SELECT user_collection_id FROM deck_cards 
                 WHERE user_collection_id IN (
                   SELECT id FROM user_collections WHERE user_id = ? AND card_id = ? AND is_foil = 1
                 )`,
                [user_id, card_id]
            );

            const cardsToRemove = existingFoil.length - foil_quantity;
            const deletableCards = existingFoil
                .map(card => card.id)
                .filter(id => !usedInDeck.some(used => used.user_collection_id === id));

            if (deletableCards.length < cardsToRemove) {
                return res.status(400).json({ code: "CARD_IN_DECK" });
            }

            for (let i = 0; i < cardsToRemove; i++) {
                await req.pool.query(
                    `DELETE FROM user_collections WHERE id = ?`,
                    [deletableCards[i]]
                );
            }
        }

        return res.status(200).json({ code: "SUCCESS" });
    } catch (error) {
      console.error("Error in add_card_to_collection:", error);
      return res.status(500).json({ code: "SERVER_ERROR" });
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

        const [decks] = await req.pool.query(`
            SELECT 
                d.id, 
                d.name, 
                d.description, 
                d.image_path AS thumbnail
            FROM decks d 
            WHERE d.user_id = ?`, 
        [user_id]);

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

        
        const [deck] = await req.pool.query(
            "SELECT * FROM decks WHERE id = ? AND user_id = ?",
            [deck_id, user_id]
        );

        if (deck.length === 0) {
            return res.status(404).json({ message: "Deck not found" });
        }

        
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
      const { user_collection_ids } = req.body;
      const user_id = req.user.id;

      if (!Array.isArray(user_collection_ids)) {
          return res.status(400).json({ message: "Invalid user_collection_ids format" });
      }

      await req.pool.query("USE ??", [process.env.DB_DATABASE]);

      for (const user_collection_id of user_collection_ids) {
          const [existingCard] = await req.pool.query(
              `SELECT 1 FROM deck_cards WHERE deck_id = ? AND user_collection_id = ?`,
              [deck_id, user_collection_id]
          );

          if (existingCard.length === 0) {
              await req.pool.query(
                  `INSERT INTO deck_cards (deck_id, user_collection_id) VALUES (?, ?)`,
                  [deck_id, user_collection_id]
              );
          }
      }

      return res.status(200).json({ message: "Cards added to deck" });
  } catch (error) {
      console.error("Error adding cards to deck:", error);
      return res.status(500).json({ message: "Internal Server Error" });
  }
};



  
  
  
  
const remove_card_from_deck = async (req, res) => {
  try {
    const { deck_id } = req.params;
    const { user_collection_id } = req.body;
    const user_id = req.user.id;

    await req.pool.query("USE ??", [process.env.DB_DATABASE]);

    const [deck] = await req.pool.query(
      "SELECT id FROM decks WHERE id = ? AND user_id = ?",
      [deck_id, user_id]
    );

    if (deck.length === 0) {
      return res.status(403).json({ message: "Unauthorized to modify this deck" });
    }

    if(debugging) {
      console.log("Löschen Deck: ", deck_id);
      console.log("Löschen collect: ", user_collection_id);
    }

    await req.pool.query(
      "DELETE FROM deck_cards WHERE deck_id = ? AND user_collection_id = ?",
      [deck_id, user_collection_id]
    );

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

  const update_deck_image = async (req, res) => {
    try {
        const { deck_id } = req.params;
        const { image_path } = req.body;
        const user_id = req.user.id;

        await req.pool.query("USE ??", [process.env.DB_DATABASE]);

        const [result] = await req.pool.query(
            "UPDATE decks SET image_path = ? WHERE id = ? AND user_id = ?",
            [image_path, deck_id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Deck not found or unauthorized" });
        }

        return res.status(200).json({ message: "Deck image updated successfully" });
    } catch (error) {
        console.error("Error updating deck image:", error);
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
  



  const get_collection_stats = async (req, res) => {
    try {
      const user_id = req.user.id;
  
      await req.pool.query("USE ??", [process.env.DB_DATABASE]);
  
      const [[totalCards]] = await req.pool.query(
        `SELECT COUNT(*) AS count FROM user_collections WHERE user_id = ?`, 
        [user_id]
      );
  
      const [[uniqueCards]] = await req.pool.query(
        `SELECT COUNT(DISTINCT card_id) AS count FROM user_collections WHERE user_id = ?`, 
        [user_id]
      );
  
      const [[totalDatabaseCards]] = await req.pool.query(
        `SELECT COUNT(*) AS count FROM cards`
      );
  
      const [setStats] = await req.pool.query(`
        SELECT c.set_code, COUNT(DISTINCT uc.card_id) AS owned, COUNT(*) AS total
        FROM cards c
        LEFT JOIN user_collections uc ON c.id = uc.card_id AND uc.user_id = ?
        GROUP BY c.set_code
      `, [user_id]);
  
      res.status(200).json({
        totalCards: totalCards.count,
        uniqueCards: uniqueCards.count,
        totalDatabaseCards: totalDatabaseCards.count,
        sets: setStats
      });
  
    } catch (error) {
      console.error("Error fetching collection stats:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
  

  const get_filtered_user_collection = async (req, res) => {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return res.status(400).json({ message: "Benutzer-ID fehlt" });
        }

        const { search, set_code, rarity, color, sort_by = "id", sort_order = "ASC" } = req.query;

        
        const validSortFields = ["id", "cost"];
        const validSortOrders = ["ASC", "DESC"];

        const orderByField = validSortFields.includes(sort_by) ? sort_by : "id";
        const orderDirection = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : "ASC";

        await req.pool.query("USE ??", [process.env.DB_DATABASE]);

        
        const [languageResult] = await req.pool.query(
            "SELECT setting_value FROM settings WHERE setting_key = 'language' LIMIT 1"
        );
        let language = languageResult[0]?.setting_value || 'en'; 

        
        const [languageExists] = await req.pool.query(
            "SELECT COUNT(*) AS count FROM card_images WHERE language = ?",
            [language]
        );

        if (languageExists[0].count === 0) {
            language = 'en';  
        }

        const query = `
            SELECT 
                uc.id AS user_collection_id,  
                c.id, 
                c.set_code, 
                c.number, 
                c.full_name AS full_name, 
                c.type, 
                c.color, 
                c.rarity, 
                c.story, 
                c.cost, 
                uc.is_foil AS is_foild,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 
                        FROM user_collections uc2 
                        WHERE uc2.card_id = c.id 
                        AND uc2.user_id = ? 
                        AND uc2.is_foil = 1
                    ) THEN 1 ELSE 0 
                END AS is_foil,
                (SELECT COUNT(*) FROM user_collections WHERE card_id = c.id AND user_id = ? AND is_foil = 0) AS normal_quantity,
                (SELECT COUNT(*) FROM user_collections WHERE card_id = c.id AND user_id = ? AND is_foil = 1) AS foil_quantity,
                (SELECT ci.thumbnail_url 
                    FROM card_images ci 
                    WHERE ci.card_id = c.id 
                    AND ci.language = ? 
                    LIMIT 1) AS thumbnail_url,
                (SELECT ci.full_url 
                    FROM card_images ci 
                    WHERE ci.card_id = c.id 
                    AND ci.language = ? 
                    LIMIT 1) AS full_url,
                (SELECT ci.foil_mask_url 
                    FROM card_images ci 
                    WHERE ci.card_id = c.id 
                    AND ci.language = ? 
                    AND ci.foil_mask_url IS NOT NULL 
                    AND ci.foil_mask_url != '' 
                    LIMIT 1) AS foil_mask_url
            FROM user_collections uc
            JOIN cards c ON uc.card_id = c.id
            WHERE uc.user_id = ?
            AND (? = '' OR c.name LIKE ? OR c.full_name LIKE ?)
            AND (? = '' OR c.set_code = ?)
            AND (? = '' OR c.rarity = ?)
            AND (? = '' OR c.color = ?)
            GROUP BY c.id, uc.id
            ORDER BY ${orderByField} ${orderDirection}
        `;

        const params = [
            user_id,
            user_id,  
            user_id,  
            language, language, language,  
            user_id,
            search || '', `%${search || ''}%`, `%${search || ''}%`,
            set_code || '', set_code || '',
            rarity || '', rarity || '',
            color || '', color || ''
        ];

        const [results] = await req.pool.query(query, params);

        if (results.length === 0) {
            return res.status(200).json({ cards: [] });
        }

        return res.status(200).json({ cards: results });
    } catch (error) {
        console.error("Fehler beim Filtern der Sammlung:", error);
        return res.status(500).json({ message: "Interner Serverfehler" });
    }
};




  const get_decks_for_card = async (req, res) => {
    try {
        const { card_id } = req.params;
        const user_id = req.user?.id;

        if (!user_id) {
            return res.status(400).json({ message: "Benutzer-ID fehlt" });
        }

        if (!card_id) {
            return res.status(400).json({ message: "Card ID fehlt" });
        }

        await req.pool.query("USE ??", [process.env.DB_DATABASE]);

        const [decks] = await req.pool.query(`
            SELECT DISTINCT d.id AS deck_id, d.name AS deck_name 
            FROM decks d
            JOIN deck_cards dc ON d.id = dc.deck_id
            JOIN user_collections uc ON dc.user_collection_id = uc.id
            WHERE uc.user_id = ? AND uc.card_id = ?
        `, [user_id, card_id]);

        return res.status(200).json({ decks });
    } catch (error) {
        console.error("Error in get_decks_for_card:", error);

        return res.status(500).json({ message: "Interner Serverfehler" });
    }
};

const get_friends_card_owners = async (req, res) => {
  try {
      const user_id = req.user?.id;
      if (!user_id) {
          return res.status(400).json({ message: "Benutzer-ID fehlt" });
      }

      await req.pool.query("USE ??", [process.env.DB_DATABASE]);

      
      const [setting] = await req.pool.query(
          "SELECT setting_value FROM settings WHERE setting_key = 'seeFriendsCollection' LIMIT 1"
      );

      if (!setting[0] || setting[0].setting_value !== "true") {
          return res.status(403).json({ message: "Freundeslistenansicht nicht aktiviert" });
      }

      const [friendsCards] = await req.pool.query(`
          SELECT c.id AS card_id, u.username 
          FROM user_collections uc
          JOIN users u ON uc.user_id = u.id
          JOIN cards c ON uc.card_id = c.id
          WHERE uc.user_id != ? 
          GROUP BY c.id, u.username
      `, [user_id]);

      return res.status(200).json({ cards: friendsCards });
  } catch (error) {
    console.error("Error in get_friends_card_owners:", error);
    return res.status(500).json({ message: "Interner Serverfehler" });
  }
};

const get_filtered_friends_collection = async (req, res) => {
  try {
    if(debugging) {
       console.log("Request received:", req.query);
    }

    const user_id = req.user?.id;
    if (!user_id) {
      console.warn("Error: User ID is missing.");
      return res.status(400).json({ message: "Benutzer-ID fehlt" });
    }

    const { friend_id, search, set_code, rarity, color, sort_by = "id", sort_order = "ASC" } = req.query;
    if(debugging) {
      console.log("Filter parameters:", { friend_id, search, set_code, rarity, color, sort_by, sort_order });
    }

    await req.pool.query("USE ??", [process.env.DB_DATABASE]);

    
    const [languageResult] = await req.pool.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'language' LIMIT 1"
    );
    let language = languageResult[0]?.setting_value || 'en'; 

    
    const [languageExists] = await req.pool.query(
      "SELECT COUNT(*) AS count FROM card_images WHERE language = ?",
      [language]
    );

    if (languageExists[0].count === 0) {
      language = 'en';  
    }

    
    const validSortFields = ["id", "cost"];
    const validSortOrders = ["ASC", "DESC"];

    const orderByField = validSortFields.includes(sort_by) ? sort_by : "id";
    const orderDirection = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : "ASC";

    const query = `
      SELECT 
          uc.id AS user_collection_id,
          c.id, 
          c.set_code, 
          c.number, 
          c.full_name AS full_name, 
          c.type, 
          c.color, 
          c.rarity, 
          c.story, 
          c.cost, 
          u.username AS owner, 
          CASE 
              WHEN uc.is_foil = 1 THEN 1 ELSE 0 
          END AS is_foil,
          (SELECT COUNT(*) FROM user_collections WHERE card_id = c.id AND user_id = uc.user_id AND is_foil = 0) AS normal_quantity,
          (SELECT COUNT(*) FROM user_collections WHERE card_id = c.id AND user_id = uc.user_id AND is_foil = 1) AS foil_quantity,
          (SELECT ci.thumbnail_url FROM card_images ci WHERE ci.card_id = c.id AND ci.language = ? LIMIT 1) AS thumbnail_url,
          (SELECT ci.full_url FROM card_images ci WHERE ci.card_id = c.id AND ci.language = ? LIMIT 1) AS full_url,
          (SELECT ci.foil_mask_url FROM card_images ci WHERE ci.card_id = c.id AND ci.language = ? AND ci.foil_mask_url IS NOT NULL AND ci.foil_mask_url != '' LIMIT 1) AS foil_mask_url
      FROM user_collections uc
      JOIN cards c ON uc.card_id = c.id
      JOIN users u ON uc.user_id = u.id
      WHERE uc.user_id != ?
      AND (? = '' OR uc.user_id = ?)
      AND (? = '' OR c.name LIKE ? OR c.full_name LIKE ?)
      AND (? = '' OR c.set_code = ?)
      AND (? = '' OR c.rarity = ?)
      AND (? = '' OR c.color = ?)
      GROUP BY c.id, uc.id
      ORDER BY ${orderByField} ${orderDirection}
    `;

    const params = [
      language, language, language,   
      user_id,
      friend_id || '', friend_id || '',
      search || '', `%${search || ''}%`, `%${search || ''}%`,
      set_code || '', set_code || '',
      rarity || '', rarity || '',
      color || '', color || ''
    ];

    if(debugging) {
      console.log("SQL Query:", query);
      console.log("Query Parameters:", params);
    }

    const [results] = await req.pool.query(query, params);

    if(debugging) {
      console.log("Query Results:", results);
    }

    if (results.length === 0) {
      return res.status(200).json({ cards: [] });
    }

    return res.status(200).json({ cards: results });
  } catch (error) {
    console.error("Error filtering the friends collection:", error);
    return res.status(500).json({ message: "Interner Serverfehler" });
  }
};




const get_all_users_except_current = async (req, res) => {
  try {
    if(debugging) {
       console.log("Request received for user list excluding current user.");
    }

    const user_id = req.user?.id;
    if (!user_id) {
      console.warn("Error: User ID is missing.");
      return res.status(400).json({ message: "Benutzer-ID fehlt" });
    }

    if(debugging) {
      console.log(`Current user: ${user_id}`);
    }

    await req.pool.query("USE ??", [process.env.DB_DATABASE]);
    if(debugging) {
      console.log(`Database switched to: ${process.env.DB_DATABASE}`);
    }

    const query = `
      SELECT id, username
      FROM users
      WHERE id != ?
      ORDER BY username ASC
    `;

    if(debugging) {
      console.log("Executing SQL query:", query);
    }
    const [users] = await req.pool.query(query, [user_id]);

    if(debugging) {
      console.log(`Query successful. Number of users found: ${users.length}`);
    }

    if (users.length === 0) {
      console.warn("Warning: No users found.");
      return res.status(404).json({ message: "Keine Benutzer gefunden" });
    }

    if(debugging) {
      console.log("User list successfully retrieved:", users);
    }

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error retrieving user list:", error);
    return res.status(500).json({ message: "Interner Serverfehler", error: error.message });
  }
};



  

  module.exports = { get_all_cards, get_filtered_cards, add_card_to_collection, get_card_quantity, get_owned_cards,
                     create_deck, get_user_decks, get_deck_details, add_card_to_deck, remove_card_from_deck, update_deck, 
                     get_user_collection, update_deck_image, get_collection_stats, get_filtered_user_collection, 
                     get_decks_for_card, get_friends_card_owners, get_filtered_friends_collection,
                     get_all_users_except_current };