import { useEffect, useState } from "react";
import styles from "../styles/App.module.css";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import placeholder from "../styles/images/card_placeholder.png";

function DeckDetailPage() {
  const { deckId } = useParams();
  const { t } = useTranslation();

  const [deck, setDeck] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [showAddCardsPopup, setShowAddCardsPopup] = useState(false);
  const [deckImage, setDeckImage] = useState("/default-placeholder.jpg");
  const [ownedCards, setOwnedCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deckCards, setDeckCards] = useState([]);
  const [availableCards, setAvailableCards] = useState([]);

  const useBackendPort = import.meta.env.VITE_USE_BACKEND_PORT === "true";
  const API_URL = useBackendPort
    ? `${import.meta.env.VITE_BACKEND_URL}:${import.meta.env.VITE_BACKEND_PORT}`
    : import.meta.env.VITE_BACKEND_URL;




  useEffect(() => {
    // Set the document title dynamically using translations
    document.title = t("deck_details") + " - " + t("inkwell");
    // Fetch deck details when the component mounts
    fetchDeckDetails();
  }, []);

  const fetchDeckDetails = async () => {
    try {
      // Send a GET request to fetch deck details based on the deck ID
      const response = await fetch(`${API_URL}/cards/decks/${deckId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch deck details");

      const data = await response.json();

       // Update state with deck details or fallback values if data is missing
      setDeck(data.deck || {});
      setDeckName(data.deck?.name || "");
      setDeckDescription(data.deck?.description || "");
      setDeckImage(data.deck?.image_path || placeholder);
      setDeckCards(data.deck?.cards || []);
    } catch (error) {

    }
  };

  

  const fetchOwnedCards = async () => {
    try {
      // Send a GET request to retrieve the user's card collection
      const response = await fetch(`${API_URL}/cards/collection`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch owned cards");

      const data = await response.json();

      // Transform the API response into the expected structure
      const transformedCards = data.cards.map((card) => ({
        user_collection_id: card.user_collection_id,
        full_name: card.full_name,
        thumbnail_url: card.thumbnail_url,
        is_foil: card.is_foild || 0,
      }));
      
      // Update state with the transformed card data
      setAvailableCards(transformedCards || []);
    } catch (error) {
    }
  };

  const updateDeckDetails = async () => {
    try {
      // Send a PUT request to update the deck details
      await fetch(`${API_URL}/cards/decks/${deckId}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: deckName,
          description: deckDescription,
        }),
      });

      // Show a success notification
      toast.success(t("deck_updated"));
      // Refresh the deck details after updating
      fetchDeckDetails();
    } catch (error) {
    }
  };

  const setDeckCoverImage = async (imagePath) => {
    try {
      // Send a PUT request to update the deck's cover image
      await fetch(`${API_URL}/cards/decks/${deckId}/set_image`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ image_path: imagePath }),
      });

      // Show a success notification
      toast.success(t("deck_image_updated"));
      // Refresh the deck details to reflect the updated image
      fetchDeckDetails();
    } catch (error) {
      
    }
  };

//handle editing State
  const handleEditToggle = () => {
    if (isEditing) {
      updateDeckDetails();
    }
    setIsEditing(!isEditing);
  };

  const handleCardSelection = (userCollectionId) => {
    setSelectedCards((prev) => {
      if (prev.includes(userCollectionId)) {
        // If the card is already selected, remove it from the selection
        return prev.filter((id) => id !== userCollectionId);
      }
       // Otherwise, add the card to the selection (ensuring unique values)
      return [...new Set([...prev, userCollectionId])];
    });
  };
  
  // Filter available cards to exclude those that are already in the deck
  // This ensures that only cards not present in the deck are selectable
  const filteredAvailableCards = availableCards.filter(
    (card) => !deckCards.some((deckCard) => deckCard.user_collection_id === card.user_collection_id)
  );
  

  const addCardsToDeck = async () => {
    try {
      // Send a POST request to add selected cards to the deck
      await fetch(`${API_URL}/cards/decks/${deckId}/add_card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user_collection_ids: selectedCards }),
      });

      // Show a success notification
      toast.success(t("cards_added"));

      // Clear the selected cards after adding them
      setSelectedCards([]);

      // Close the "Add Cards" popup
      setShowAddCardsPopup(false);

      // Refresh the deck details to reflect the new cards
      fetchDeckDetails();
    } catch (error) {
      
    }
  };

  const removeCardFromDeck = async (userCollectionId) => {
    try {
      // Send a DELETE request to remove a specific card from the deck
      const response = await fetch(`${API_URL}/cards/decks/${deckId}/remove_card`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user_collection_id: userCollectionId }),
      });

      if (!response.ok) throw new Error("Failed to remove card from deck");

      toast.success(t("card_removed"));
      // Refresh the deck details to reflect the removal
      fetchDeckDetails();
    } catch (error) {
      
    }
  };

  return (

    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <h1 className={styles.dashboardTitle}>{t("deck_details")}</h1>

          {deck === null ? (
            <p>{t("loading_message")}</p>
          ) : (
          <div>
            <div className={styles.deckInfoContainer}>
              <div className={styles.deckHeader}>
                <div className={styles.deckHeaderImg}>
                  <img src={deckImage} alt={`t("deck_cover_alt")`} className={styles.deckImage} />
                    {isEditing && (
                      <button className={`${styles.btn} ${styles["btn-danger"]}`} onClick={() => setDeckCoverImage("")}>
                        {t("reset_cover")}
                      </button>
                    )}
                </div>
                <div className={styles.deckHeadertext}>

                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={deckName}
                        onChange={(e) => setDeckName(e.target.value)}
                        className={`${styles.input} ${styles.deckname}`}
                      />
                      <textarea
                        value={deckDescription}
                        onChange={(e) => setDeckDescription(e.target.value)}
                        className={`${styles.textarea} ${styles.deckdesc}`}
                      />
                    </>
                  ) : (
                    <>
                      <h2 className={`${styles.deckname}`}>{deckName}</h2>
                      <p className={`${styles.deckdesc}`}>{deckDescription}</p>
                    </>
                  )}
                  {isEditing ? (
                    <button onClick={() => { setShowAddCardsPopup(true); fetchOwnedCards(); }} className={`${styles.btn} ${styles["btn-primary"]}`}>
                      {t("add_cards")}
                    </button>
                  ) : null }

                  <p className={`${styles.deckcartcount} ${isEditing ? styles.is_editing : ""}`}>
                    {t("card_count")}: {deckCards.length || 0}
                  </p>
                  <div className={styles.deckEdidit}>
                    <button onClick={handleEditToggle} className={`${styles.btn} ${styles["btn-primary"]}`}>
                      {isEditing ? t("finish_editing") : t("edit")}
                    </button>
                    
                  </div>
              

                </div>
              </div>
            </div>
            <div className={`${styles.cartContainer} ${styles.cartContainerDeck} ${isEditing ? styles.is_editing : ""}`}>
              <div className={styles.cardGrid}>
                {deckCards.length > 0 ? (
                  deckCards.map((card) => (
                    <div key={card.user_collection_id} className={`${styles.card} ${card.is_foil ? styles.foild : ""} ${card.is_foil ? styles.foild : ""} ` }>
                      <img src={card.thumbnail_url || placeholder} alt={card.name} className={styles.cardImage}/>
                      <p>{card.name} {card.is_foil ? "(Foil)" : ""}</p>
                      {isEditing && (
                        <>
                        <button  className={`${styles.btn} ${styles["btn-danger"]}`} onClick={() => removeCardFromDeck(card.user_collection_id)}>
                          X
                        </button>
                        <button className={`${styles.btn} ${styles["btn-primary"]}`} onClick={() => setDeckCoverImage(card.thumbnail_url)}>
                          {t("set_as_cover")}
                        </button>
                      </>
                      )}
                    </div>
                  ))
                ) : (
                  <p>{t("no_cards_in_deck")}</p>
                )}
              </div>
            </div>
            
            {showAddCardsPopup && (
              <div className={`${styles.popupOverlay} ${styles.deckbuildPopup}`} onClick={() => setShowAddCardsPopup(false)}>
                <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.popupHeader}>
                    <h2>{t("select_cards_to_add")}</h2>
                    <input
                      type="text"
                      placeholder={t("search_placeholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className={styles.popupBody}>
                    <div className={styles.cardGrid}>
                      {filteredAvailableCards.length > 0 ? (
                        filteredAvailableCards
                          .filter((card) =>
                            card.full_name.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((card) => (
                            <div
                              key={card.user_collection_id}
                              className={`${styles.card} ${card.is_foil ? styles.foild : ""} ${
                                selectedCards.includes(card.user_collection_id) ? styles.selected : ""
                              }`}
                              onClick={() => handleCardSelection(card.user_collection_id)}
                            >
                              <img src={card.thumbnail_url || placeholder} alt={card.full_name} className={styles.cardImage}/>
                              <p>{card.full_name}</p>
                            </div>
                          ))
                      ) : (
                        <p>{t("no_cards_available")}</p>
                      )}
                    </div>
                  </div>
                  <div className={styles.popupFooter}>
                    <button className={`${styles.btn} ${styles["btn-primary"]}`} onClick={addCardsToDeck}>{t("add_selected_cards")}</button>
                    <button className={`${styles.btn} ${styles["btn-danger"]}`} onClick={() => setShowAddCardsPopup(false)}>{t("cancel")}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
            
          )}

      </div>
    </div>   

    
  );
}

export default DeckDetailPage;

