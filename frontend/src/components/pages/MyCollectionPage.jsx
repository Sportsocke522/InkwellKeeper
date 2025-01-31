import { useEffect, useState } from "react";
import styles from "../styles/App.module.css";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

function MyCollectionPage() {
  const { t } = useTranslation();

  const [collectionStats, setCollectionStats] = useState({
    totalCards: 0,
    uniqueCards: 0,
    totalDatabaseCards: 0,
  });

  const [setStatistics, setSetStatistics] = useState([]);
  const [showSetStats, setShowSetStats] = useState(false);
  const [cards, setCards] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedSet, setSelectedSet] = useState("");
  const [selectedRarity, setSelectedRarity] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [ownedQuantity, setOwnedQuantity] = useState(0);
  const [foilQuantity, setFoilQuantity] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [decks, setDecks] = useState([]);
  const [sortOrder, setSortOrder] = useState("ASC");
  const [sortBy, setSortBy] = useState("id");



  useEffect(() => {
    fetchCollectionStats();
    fetchOwnedCards();
  }, [sortBy, sortOrder]);

  // Verzögerung der Suchanfrage, um unnötige API-Aufrufe zu vermeiden
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Automatische Filter-Updates
  useEffect(() => {
    console.log("Fetching cards with filters:", {
        searchQuery: debouncedSearchQuery,
        color: selectedColor,
        rarity: selectedRarity,
        set: selectedSet,
      });
    fetchOwnedCards();
  }, [debouncedSearchQuery, selectedColor, selectedRarity, selectedSet, sortBy, sortOrder]);

  const fetchCollectionStats = async () => {
    try {
      const response = await fetch("http://localhost:3000/cards/collection/stats", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch collection stats");

      const data = await response.json();
      setCollectionStats(data);
      setSetStatistics(data.sets || []);
    } catch (error) {
      console.error("Error fetching collection stats:", error);
    }
  };
  const handleSortChange = (e) => {
    const [field, order] = e.target.value.split("-");
    setSortBy(field);
    setSortOrder(order);
  };
  const fetchOwnedCards = async () => {
    try {
      const queryParams = new URLSearchParams({
        search: debouncedSearchQuery || "",
        set_code: selectedSet || "",
        rarity: selectedRarity || "",
        color: selectedColor || "",
        sort_by: sortBy,
        sort_order: sortOrder,
      }).toString();

      const response = await fetch(`http://localhost:3000/cards/collection?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch owned cards");

      const data = await response.json();
      const uniqueCards = data.cards.reduce((acc, card) => {
        if (!acc.some((c) => c.id === card.id)) {
          acc.push(card);
        }
        return acc;
      }, []);

      setCards(uniqueCards);
    } catch (error) {
      console.error("Error fetching owned cards:", error);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      fetchOwnedCards();  // Aktualisierte Werte erneut abrufen
    }
    setIsEditing(!isEditing);
  };


  const saveCardQuantity = async (cardId, normalQuantity, foilQuantity, setLocalQuantity, oldQuantity) => {
    try {
        console.log("Sending data to API:", { card_id: cardId, normal_quantity: normalQuantity, foil_quantity: foilQuantity });
        setIsLoading(true);

        const response = await fetch(`http://localhost:3000/cards/collection/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                card_id: cardId,
                normal_quantity: normalQuantity,
                foil_quantity: foilQuantity,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            switch (result.code) {
                case "CARD_IN_DECK":
                    toast.error(t("error_card_in_deck"));  // Übersetzung des Fehlers
                    break;
                case "USER_ID_MISSING":
                    toast.error(t("error_user_id_missing"));
                    break;
                case "CARD_ID_MISSING":
                    toast.error(t("error_card_id_missing"));
                    break;
                default:
                    toast.error(t("error_generic"));
            }
            throw new Error(result.code);
        }

        toast.success(t("success_update"));
        fetchOwnedCards();
    } catch (error) {
        console.error("Error saving card quantity:", error.message);
        //toast.error(t("error_generic"));
        setLocalQuantity(oldQuantity); // Setze den Wert auf den alten Zustand zurück
    } finally {
        setIsLoading(false);
    }
};

// Normale Karten aktualisieren
const updateOwnedQuantity = async (change) => {
    const oldQuantity = ownedQuantity; // Speichere den aktuellen Wert
    const newQuantity = Math.max(Number(ownedQuantity) + change, 0);

    setOwnedQuantity(newQuantity);  // UI sofort aktualisieren

    await saveCardQuantity(selectedCard.id, newQuantity, foilQuantity, setOwnedQuantity, oldQuantity);
};

// Foil-Karten aktualisieren
const updateFoilQuantity = async (change) => {
    const oldQuantity = foilQuantity; // Speichere den aktuellen Wert
    const newQuantity = Math.max(Number(foilQuantity) + change, 0);

    setFoilQuantity(newQuantity);  // UI sofort aktualisieren

    await saveCardQuantity(selectedCard.id, ownedQuantity, newQuantity, setFoilQuantity, oldQuantity);
};

const fetchDecksForCard = async (cardId) => {
    try {
        const response = await fetch(`http://localhost:3000/cards/collection/decks/${cardId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error("Failed to fetch decks");
        }

        const data = await response.json();
        console.log("data: ". data);
        setDecks(data.decks || []);
    } catch (error) {
        console.error("Error fetching decks for card:", error);
        setDecks([]);
    }
};


  
  
  
  
  

  const openPopup = async (card) => {
    console.log("Popup opened for card:", card);
    setSelectedCard({
      ...card,
      showFoil: false,  // Standardmäßig Foil deaktiviert
    });
 
    try {
        await fetchDecksForCard(card.id);
        const response = await fetch(`http://localhost:3000/cards/collection/quantity/${card.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
 
      if (!response.ok) {
        throw new Error("Failed to fetch card quantity");
      }
 
      const data = await response.json();
      setOwnedQuantity(Number(data.normal_quantity || 0));
      setFoilQuantity(Number(data.foil_quantity || 0));
    } catch (error) {
      console.error("Error fetching card quantity:", error);
      setOwnedQuantity(0);
      setFoilQuantity(0);
    }
 };
 
  const closePopup = () => setSelectedCard(null);

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <h1 className={styles.dashboardTitle}>{t("my_collection_title")}</h1>

        <div className={styles.statsContainer}>
          <p>{t("total_cards")}: {collectionStats.totalCards}</p>
          <p>{t("unique_cards")}: {collectionStats.uniqueCards}</p>
          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{
                width: `${(collectionStats.uniqueCards / collectionStats.totalDatabaseCards) * 100}%`,
              }}
            ></div>
          </div>
          <p>{t("completion_percentage")}: {Math.round((collectionStats.uniqueCards / collectionStats.totalDatabaseCards) * 100)}%</p>
          <br></br>

          <div className={styles.setStatsContainer}>
            <button 
              onClick={() => setShowSetStats(!showSetStats)} 
              className={styles.toggleButton}
            >
              {t(showSetStats ? "hide_set_stats" : "show_set_stats")}
              <span className={styles.arrow}>{showSetStats ? "▲" : "▼"}</span>
            </button>
            {showSetStats && setStatistics.length > 0 && (
              <div className={styles.setStats}>
                {setStatistics.map((set) => (
                  <div key={set.set_code} className={`${styles.setStat} container_set_${set.set_code}`}>
                    <h3>{t(`set_${set.set_code}`)}</h3>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progress}
                        style={{ width: `${(set.owned / set.total) * 100}%` }}
                      ></div>
                    </div>
                    <p>{set.owned} {t("of")} {set.total}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


        <div className={styles.searchFilterContainer}>
          <input
            type="text"
            placeholder={t("search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <div className={styles.filterContainer}>
            <select
              className={styles.filterSelect}
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
            >
              <option value="">{t("select_color")}</option>
              <option value="Amber">{t("color_amber")}</option>
              <option value="Amethyst">{t("color_amethyst")}</option>
              <option value="Emerald">{t("color_emerald")}</option>
              <option value="Ruby">{t("color_ruby")}</option>
              <option value="Sapphire">{t("color_sapphire")}</option>
              <option value="Steel">{t("color_steel")}</option>
            </select>
            <select
              className={styles.filterSelect}
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
            >
              <option value="">{t("select_rarity")}</option>
              <option value="Common">{t("rarity_common")}</option>
              <option value="Uncommon">{t("rarity_uncommon")}</option>
              <option value="Rare">{t("rarity_rare")}</option>
              <option value="Super Rare">{t("rarity_super_rare")}</option>
              <option value="Legendary">{t("rarity_legendary")}</option>
              <option value="Enchanted">{t("rarity_enchanted")}</option>
              <option value="Special">{t("rarity_special")}</option>
            </select>
            <select
              className={styles.filterSelect}
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
            >
              <option value="">{t("select_set")}</option>
              <option value="1">{t("set_1")}</option>
              <option value="2">{t("set_2")}</option>
              <option value="3">{t("set_3")}</option>
              <option value="4">{t("set_4")}</option>
              <option value="5">{t("set_5")}</option>
              <option value="6">{t("set_6")}</option>
              <option value="7">{t("set_7")}</option>
            </select>
          </div>
        </div>

        <div className={styles.cartContainer}>

          <div className={styles.sortContainer}>
            <label>{t("sort_by")}:</label>
            <select value={`${sortBy}-${sortOrder}`} onChange={handleSortChange} className={styles.sortSelect}>
              <option value="id-ASC">{t("sort_id_asc")}</option>
              <option value="id-DESC">{t("sort_id_desc")}</option>
              <option value="cost-ASC">{t("sort_cost_asc")}</option>
              <option value="cost-DESC">{t("sort_cost_desc")}</option>
            </select>
          </div>

          <div className={styles.cardGrid}>
            {cards.map((card) => (
                <div
                key={card.id}
                className={`${styles.card} ${card.is_foil ? styles.foild : ""}`}
                onClick={() => openPopup(card)}
                >
                <img src={card.thumbnail_url} alt={card.full_name} className={styles.cardImage} />
                <p>{card.full_name}</p>
                </div>
            ))}
          </div>

        </div>
      
        {selectedCard && (
          <div className={styles.popupOverlay} onClick={closePopup}>
              <div className={`${styles.popup} ${styles["cart_popup"]}`}  onClick={(e) => e.stopPropagation()}>
              <h2>{selectedCard.full_name}</h2>

                {selectedCard.is_foild && (
                    <div className={styles.foilToggle}>
                      <label className={styles.switch}>
                          <input
                          type="checkbox"
                          checked={selectedCard?.showFoil || false}
                          onChange={() => {
                              setSelectedCard((prev) => {
                              console.log("Toggle showFoil:", !prev.showFoil);
                              return { ...prev, showFoil: !prev.showFoil };
                              });
                          }}
                          />
                          <span className={styles.slider}></span>
                      </label>
                      <p>{selectedCard.showFoil ? t("foil_on") : t("foil_off")}</p>
                    </div>
                )}

              <div className={styles.cardImageWrapper}>
                  <img src={selectedCard.full_url} alt={selectedCard.full_name} className={styles.cardImage} />
                  {selectedCard.showFoil && selectedCard.foil_mask_url ? (
                  <img
                      src={selectedCard.foil_mask_url}
                      alt="Foil Effect"
                      className={styles.foilOverlay}
                  />
                  ) : null}
              </div>

              <p>{selectedCard.story}</p>


             
                  
              {decks.length > 0 && (
                  <div className={styles.deckListContainer}>
                      <div className={styles.deckListHeadline}>
                        Decks:
                      </div>
                      <div className={styles.deckList}>
                          {decks.map((deck) => (
                              <div key={deck.id}>
                                  <a href={`/decks/${deck.deck_id}`} className={styles.deckLink}>
                                      {deck.deck_name}
                                  </a>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
            

              <div className={styles.quantityContainer} >
                <div className={styles.quantityControl}>
                    <label>{t("own_quantity")}</label>
                    <div className={styles.quantityWrapper}>
                    {isEditing && (
                      <button onClick={() => updateOwnedQuantity(-1)} className={styles.quantityButton}>-</button>
                    )}
                    <input type="text" value={ownedQuantity} readOnly className={styles.quantityInput} />
                    {isEditing && (
                      <button onClick={() => updateOwnedQuantity(1)} className={styles.quantityButton}>+</button>
                    )}
                    </div>
                </div>

                <div className={styles.quantityControl}>
                    <label>{t("foil_quantity")}</label>
                    <div className={styles.quantityWrapper}>
                    {isEditing && (
                      <button onClick={() => updateFoilQuantity(-1)} className={styles.quantityButton}>-</button>
                    )}
                    <input type="text" value={foilQuantity} readOnly className={styles.quantityInput} />
                    {isEditing && (
                      <button onClick={() => updateFoilQuantity(1)} className={styles.quantityButton}>+</button>
                    )}
                    </div>
                </div>
              </div>

              <div className={styles.popupControl}>
                <button onClick={handleEditToggle}>
                    {isEditing ? t("finish_editing") : t("edit")}
                </button>
                <button onClick={closePopup}>{t("close")}</button>
              </div>
            </div>
          </div>
        )}
      
      </div>
    </div>

      

      

      
    
);

}

export default MyCollectionPage;
