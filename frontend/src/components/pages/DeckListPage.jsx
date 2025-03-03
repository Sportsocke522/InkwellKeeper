import { useEffect, useState, useRef } from "react";
import styles from "../styles/App.module.css";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";


import placeholder from "../styles/images/card_placeholder.png";

function DeckListPage() {
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [decks, setDecks] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [deckDescription, setDeckDescription] = useState("");

  const API_URL = `${import.meta.env.VITE_BACKEND_URL}:${import.meta.env.VITE_BACKEND_PORT}`;
  


  const { t } = useTranslation();

  useEffect(() => {
    // Set the document title dynamically using translations
    document.title = t("deck_list") + " - " + t("inkwell");

    // Fetch user admin status from the API
    const fetchUserStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/settings/is_admin`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch admin status");
        }

        const data = await response.json();
        // Update state based on admin status
        setIsAdmin(data.is_admin === 1);
      } catch (error) {
        
      }
    };
    // Fetch user admin status when the component mounts
    fetchUserStatus();
    // Fetch the list of decks when the component mounts
    fetchDecks();
  }, []);



  // Fetch the list of decks from the API
  const fetchDecks = async () => {
    try {
      const response = await fetch(`${API_URL}/cards/decks`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch decks");
      }
  
      const data = await response.json();
      
      setDecks(data.decks || []);  // Ensure that state is always an array
    } catch (error) {
      
      setDecks([]);  // Fallback to an empty array in case of an error
    }
  };
  

  // Create a new deck
  const createDeck = async () => {
    try {
      const response = await fetch(`${API_URL}/cards/decks/create`, {
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

      // Show success notification
      toast.success(t("deck_created"));
      // Close the deck creation popup
      setShowPopup(false);
      // Refresh the deck list to include the newly created deck
      fetchDecks();
    } catch (error) {
      // Show error notification
      toast.error(t("deck_creation_failed"));
    }
  };

  return (
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <h1 className={styles.dashboardTitle}>{t("deck_list")}</h1>

          <div className={styles.cartContainer}>

            <div className={`${styles.cardGrid} ${styles.deckContainer}`}>

              {Array.isArray(decks) && decks.length > 0 ? (
                decks.map((deck) => (
                  <div
                    key={deck.id}
                    className={`${styles.card} ${styles.deck}`}
                    onClick={() => navigate(`/decks/${deck.id}`)}
                  >

                    <div className={styles.cardImageWrapper}>
                      <img
                        src={deck.thumbnail && deck.thumbnail.trim() !== "" ? deck.thumbnail : placeholder}
                        alt={deck.name}
                        className={styles.cardImage}
                      />
                    </div>


                    <h2>{deck.name}</h2>
                  </div>
                ))
              ) : (
                <>
                  {/*
                    <p>{t("no_decks_found")}</p>
                  */}
                </>
              )}

              <div className={`${styles.card} ${styles.addDeck}`} onClick={() => setShowPopup(true)}>
                <h2>
                  {t("create_new_deck")}
                </h2>
              </div>

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

                    <button className="btn-primary" onClick={createDeck}>{t("create")}</button>
                    <button className="btn-danger" onClick={() => setShowPopup(false)}>{t("cancel")}</button>
                  </div>
                </div>
              )}


          </div>
        </div>
      </div>

















   
 
      

      

      
    
  );
}

export default DeckListPage;
