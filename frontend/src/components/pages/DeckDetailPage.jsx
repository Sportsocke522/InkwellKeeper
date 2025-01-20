import { useEffect, useState } from "react";
import styles from "../styles/DeckDetail.module.css";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";


function DeckDetailPage() {
    const { deckId } = useParams();
    const { t } = useTranslation();
  
    const [deck, setDeck] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [deckName, setDeckName] = useState("");
    const [deckDescription, setDeckDescription] = useState("");
    const [showAddCardsPopup, setShowAddCardsPopup] = useState(false);
    const [ownedCards, setOwnedCards] = useState([]);
    const [selectedCards, setSelectedCards] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [deckCards, setDeckCards] = useState([]); // Karten, die bereits im Deck sind
    const [availableCards, setAvailableCards] = useState([]); // Karten, die hinzugefügt werden können

  
    useEffect(() => {
      document.title = t("deck_details");
      fetchDeckDetails();
    }, []);
  
    const fetchDeckDetails = async () => {
        try {
          console.log("Fetching deck details...");
    
          const response = await fetch(`http://localhost:3000/cards/decks/${deckId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
    
          console.log("Response status:", response.status);
    
          if (!response.ok) throw new Error("Failed to fetch deck details");
    
          const data = await response.json();
          console.log("Deck data received:", data);
    
          setDeck(data.deck || {});
          setDeckName(data.deck?.name || "");
          setDeckDescription(data.deck?.description || "");
          setDeckCards(data.deck?.cards || []);
        } catch (error) {
          console.error("Error fetching deck details:", error);
        }
    };
    
      
    
      
  
    const fetchOwnedCards = async () => {
        try {
            const response = await fetch(`http://localhost:3000/cards/collection`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
    
            if (!response.ok) throw new Error("Failed to fetch owned cards");
    
            const data = await response.json();
            console.log("Owned cards data received:", data);
    
            if (!data.cards || data.cards.length === 0) {
                console.warn("No cards found in the collection.");
            }
    
            const transformedCards = data.cards.map(card => ({
                user_collection_id: card.user_collection_id,  // Verwenden der eindeutigen ID
                card_id: card.id, // Ursprüngliche Karten-ID für spätere Verwendungszwecke
                full_name: card.full_name,
                thumbnail_url: card.thumbnail_url,
                is_foil: card.is_foil || 0,
            }));
    
            console.log("Transformed available cards:", transformedCards);
    
            setAvailableCards(transformedCards || []);
        } catch (error) {
            console.error("Error fetching owned cards:", error);
        }
    };
    
      
      
  
    const handleCardSelection = (userCollectionId) => {
        setSelectedCards((prev) =>
            prev.includes(userCollectionId) ? prev.filter((id) => id !== userCollectionId) : [...prev, userCollectionId]
        );
    };
    
      
      
      
  
    const addCardsToDeck = async () => {
        try {
            await fetch(`http://localhost:3000/cards/decks/${deckId}/add_card`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ user_collection_ids: selectedCards }),
            });
    
            toast.success(t("cards_added"));
            setShowAddCardsPopup(false);
            fetchDeckDetails();
        } catch (error) {
            console.error("Error adding cards to deck:", error);
        }
    };
    
      
    
      
  
    return (
      <div className={styles.container}>
        <h1>{t("deck_details_title")}</h1>
  
        {deck === null ? (
    <p>{t("loading_message")}</p>
) : (
    <div>
      <div>
          <h2>{deckName}</h2>
          <p>{deckDescription}</p>
          <p>{t("card_count")}: {deckCards.length || 0}</p>
          <button onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? t("finish_editing") : t("edit")}
          </button>
      </div>

      {isEditing && (
          <button onClick={() => { setShowAddCardsPopup(true); fetchOwnedCards(); }}>
            {t("add_cards")}
          </button>
      )}

      <div className={styles.cardGrid}>
        {deckCards.length > 0 ? (
          deckCards.map((card) => (
            <div key={card.user_collection_id} className={`${styles.card} ${card.is_foil ? styles.foil : ""}`}>
              <img src={card.thumbnail_url || "/placeholder.jpg"} alt={card.name} />
              <p>{card.name} {card.is_foil ? "(Foil)" : ""}</p>
            </div>
          ))
        ) : (
          <p>{t("no_cards_in_deck")}</p>
        )}
      </div>
    </div>
)}

  
  {showAddCardsPopup && (
  <div className={styles.popupOverlay} onClick={() => setShowAddCardsPopup(false)}>
    <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
      <h2>{t("select_cards_to_add")}</h2>
      <input
        type="text"
        placeholder={t("search_placeholder")}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div className={styles.cardGrid}>
        {availableCards.length > 0 ? (
            availableCards
            .filter((card) =>
                card.full_name && card.full_name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((card) => (
                <div
                key={card.user_collection_id} // Jetzt wird die eindeutige user_collection_id verwendet
                className={`${styles.card} ${card.is_foil ? styles.foil : ""} 
                    ${selectedCards.includes(card.user_collection_id) ? styles.selected : ""}`}
                onClick={() => handleCardSelection(card.user_collection_id)}
                >
                <img
                    src={card.thumbnail_url || "/placeholder.jpg"}
                    alt={card.full_name || "Unknown"}
                />
                <p>{card.full_name || "No Name"} {card.is_foil ? "(Foil)" : ""}</p>
                </div>
            ))
        ) : (
            <p>{t("no_cards_available")}</p>
        )}
        </div>

      <button onClick={addCardsToDeck}>{t("add_selected_cards")}</button>
      <button onClick={() => setShowAddCardsPopup(false)}>{t("cancel")}</button>
    </div>
  </div>
)}

      </div>
    );
  }
  
 
  

export default DeckDetailPage;
