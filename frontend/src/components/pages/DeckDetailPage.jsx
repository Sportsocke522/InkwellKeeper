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
      setDeckImage(data.deck?.image_path || placeholder);
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

      const transformedCards = data.cards.map((card) => ({
        user_collection_id: card.user_collection_id,
        full_name: card.full_name,
        thumbnail_url: card.thumbnail_url,
        is_foil: card.is_foild || 0,
      }));
      

      setAvailableCards(transformedCards || []);
      console.log("Transfromd: ");
      console.log(transformedCards);
    } catch (error) {
      console.error("Error fetching owned cards:", error);
    }
  };

  const updateDeckDetails = async () => {
    try {
      await fetch(`http://localhost:3000/cards/decks/${deckId}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: deckName,
          description: deckDescription,
        }),
      });

      toast.success(t("deck_updated"));
      fetchDeckDetails();
    } catch (error) {
      console.error("Error updating deck:", error);
    }
  };

  const setDeckCoverImage = async (imagePath) => {
    try {
      await fetch(`http://localhost:3000/cards/decks/${deckId}/set_image`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ image_path: imagePath }),
      });

      toast.success(t("deck_image_updated"));
      fetchDeckDetails();
    } catch (error) {
      console.error("Error updating deck image:", error);
    }
  };


  const handleEditToggle = () => {
    if (isEditing) {
      updateDeckDetails();
    }
    setIsEditing(!isEditing);
  };

  const handleCardSelection = (userCollectionId) => {
    setSelectedCards((prev) => {
      if (prev.includes(userCollectionId)) {
        return prev.filter((id) => id !== userCollectionId);
      }
      return [...new Set([...prev, userCollectionId])];
    });
  };
  

  const filteredAvailableCards = availableCards.filter(
    (card) => !deckCards.some((deckCard) => deckCard.user_collection_id === card.user_collection_id)
  );
  

  const addCardsToDeck = async () => {
    try {
      await fetch(`http://localhost:3000/cards/decks/${deckId}/add_card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user_collection_ids: selectedCards }),
      });

      toast.success(t("cards_added"));

      setSelectedCards([]);

      
      setShowAddCardsPopup(false);
      fetchDeckDetails();
    } catch (error) {
      console.error("Error adding cards to deck:", error);
    }
  };

  const removeCardFromDeck = async (userCollectionId) => {
    try {
      const response = await fetch(`http://localhost:3000/cards/decks/${deckId}/remove_card`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user_collection_id: userCollectionId }),
      });

      if (!response.ok) throw new Error("Failed to remove card from deck");

      toast.success(t("card_removed"));
      fetchDeckDetails();
    } catch (error) {
      console.error("Error removing card from deck:", error);
    }
  };

  return (

    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <h1 className={styles.dashboardTitle}>{t("deck_details_title")}</h1>

          {deck === null ? (
            <p>{t("loading_message")}</p>
          ) : (
          <div>
            <div className={styles.deckInfoContainer}>
              <div className={styles.deckHeader}>
                <div className={styles.deckHeaderImg}>
                  <img src={deckImage} alt="Deck Cover" className={styles.deckImage} />
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
//ok
