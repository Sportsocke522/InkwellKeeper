import { useEffect, useState, useRef } from "react";
import styles from "../styles/DeckList.module.css";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

function DeckListPage() {
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [decks, setDecks] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  


  const { t } = useTranslation();

  useEffect(() => {
    document.title = t("deck_list");

    // Benutzerstatus abrufen
    const fetchUserStatus = async () => {
      try {
        const response = await fetch("http://localhost:3000/settings/is_admin", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch admin status");
        }

        const data = await response.json();
        setIsAdmin(data.is_admin === 1);
      } catch (error) {
        console.error("Error fetching user status:", error);
      }
    };

    fetchUserStatus();
    fetchDecks();
  }, []);

  // Decks abrufen
  const fetchDecks = async () => {
    try {
      const response = await fetch("http://localhost:3000/cards/decks", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch decks");
      }
  
      const data = await response.json();
      console.log("Received decks:", data);  // Debugging
      setDecks(data.decks || []);  // Sicherstellen, dass ein Array gesetzt wird
    } catch (error) {
      console.error("Error fetching decks:", error);
      setDecks([]);  // Fallback auf leeres Array bei Fehlern
    }
  };
  

  // Deck erstellen
  const createDeck = async () => {
    try {
      const response = await fetch("http://localhost:3000/cards/decks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: deckName,
          description: deckDescription,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create deck");
      }

      toast.success(t("deck_created"));
      setShowPopup(false);
      fetchDecks();
    } catch (error) {
      console.error("Error creating deck:", error);
      toast.error(t("deck_creation_failed"));
    }
  };

  return (
    <div className={styles.container}>
      <h1>{t("deck_list_title")}</h1>
      <button className={styles.newDeckButton} onClick={() => setShowPopup(true)}>
        {t("create_new_deck")}
      </button>

      <div className={styles.deckGrid}>
        {Array.isArray(decks) && decks.length > 0 ? (
          decks.map((deck) => (
            <div
              key={deck.id}
              className={styles.deckCard}
              onClick={() => navigate(`/decks/${deck.id}`)}

              
            >
              <img src={deck.coverImage || "/placeholder.jpg"} alt={deck.name} />
              <h2>{deck.name}</h2>
            </div>
          ))
        ) : (
          <p>{t("no_decks_found")}</p>
        )}
      </div>

      {showPopup && (
        <div className={styles.popupOverlay} onClick={() => setShowPopup(false)}>
          <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
            <h2>{t("create_new_deck")}</h2>
            <input
              type="text"
              placeholder={t("deck_name")}
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
            />
            <textarea
              placeholder={t("deck_description")}
              value={deckDescription}
              onChange={(e) => setDeckDescription(e.target.value)}
            />
            <button onClick={createDeck}>{t("create")}</button>
            <button onClick={() => setShowPopup(false)}>{t("cancel")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeckListPage;
