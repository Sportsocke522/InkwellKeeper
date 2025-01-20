import { useEffect, useState } from "react";
import styles from "../styles/Catalog.module.css";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

function CatalogPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isReady, setIsReady] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cards, setCards] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedRarity, setSelectedRarity] = useState("");
  const [selectedSet, setSelectedSet] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCard, setSelectedCard] = useState(null); // Für das Popup
  const [ownedQuantity, setOwnedQuantity] = useState(0); // Für normale Karten
  const [foilQuantity, setFoilQuantity] = useState(0); // Für Foilkarten

  const [ownedCards, setOwnedCards] = useState({
    normal: new Set(),
    foil: new Set(),
  });

const incrementOwned = () => setOwnedQuantity((prev) => prev + 1);
const decrementOwned = () => setOwnedQuantity((prev) => Math.max(prev - 1, 0));
const incrementFoil = () => setFoilQuantity((prev) => prev + 1);
const decrementFoil = () => setFoilQuantity((prev) => Math.max(prev - 1, 0));


  const fetchCards = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        set_code: selectedSet || "",
        color: selectedColor || "",
        rarity: selectedRarity || "",
        search: debouncedSearchQuery || "",
      }).toString();

      const response = await fetch(`http://localhost:3000/cards/filtered?${queryParams}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch filtered cards");

      const data = await response.json();
      setCards(data.cards.length ? data.cards : []);
    } catch (error) {
      console.error("Error fetching cards:", error);
      setCards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOwnedCards = async () => {
    try {
      //console.log("Fetching owned cards...");
  
      const response = await fetch(`http://localhost:3000/cards/collection`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
  
      //console.log("Response status:", response.status);
  
      if (!response.ok) {
        throw new Error("Failed to fetch owned cards");
      }
  
      const data = await response.json();
      //console.log("Fetched data:", data);
  
      // Sicherstellen, dass Daten existieren und korrekt verarbeitet werden
      if (data.cards) {
        //console.log("Processing cards...");
  
        const ownedNormal = new Set();
        const ownedFoil = new Set();
  
        data.cards.forEach((card) => {
            //console.log("Processing card:", card);
  
            // Korrektur: Ändere card.card_id zu card.id
            const cardId = Number(card.id); // Konvertiere in Zahl für Konsistenz
            
            //console.log(`Processed card ID: ${cardId}, Is foil: ${card.is_foil}`);
          
            if (card.is_foil) {
              ownedFoil.add(cardId);
            } else {
              ownedNormal.add(cardId);
            }
        });
  
        //console.log("Owned normal cards:", Array.from(ownedNormal));
        //console.log("Owned foil cards:", Array.from(ownedFoil));
  
        // Zustand mit den neuen Sets aktualisieren
        setOwnedCards({
          normal: ownedNormal,
          foil: ownedFoil,
        });
  

 



        //console.log("State updated with owned cards.");
      } else {
        console.warn("No cards found in response.");
      }
    } catch (error) {
      console.error("Error fetching owned cards:", error);
    }
  };
  
  
  

  useEffect(() => {
    document.title = t("catalog_title");

    const fetchStatus = async () => {
      try {
        const [adminResponse, readyResponse] = await Promise.all([
          fetch("http://localhost:3000/settings/is_admin", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
          fetch("http://localhost:3000/settings/is_ready", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
        ]);

        if (!adminResponse.ok || !readyResponse.ok) {
          throw new Error("Failed to fetch status");
        }

        const adminData = await adminResponse.json();
        const readyData = await readyResponse.json();

        setIsAdmin(adminData.is_admin === 1);
        setIsReady(readyData.is_ready);
      } catch (error) {
        console.error("Error fetching status:", error);
      }
    };

    fetchStatus();
    fetchCards();
    fetchOwnedCards();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    fetchCards();
  }, [selectedColor, selectedRarity, selectedSet, debouncedSearchQuery]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedColor("");
    setSelectedRarity("");
    setSelectedSet("");
    fetchCards();
  };

  const closePopup = () => setSelectedCard(null);

  const openPopup = async (card) => {
    setSelectedCard(card);
  
    try {
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
      
      // Sicherstellen, dass Zahlen gespeichert werden
      setOwnedQuantity(Number(data.normal_quantity || 0));
      setFoilQuantity(Number(data.foil_quantity || 0));
    } catch (error) {
      console.error("Error fetching card quantity:", error);
      setOwnedQuantity(0);
      setFoilQuantity(0);
    }
  };
  
  
  
  
  const saveCardQuantity = async (cardId, normalQuantity, foilQuantity) => {
    try {
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
  
      if (!response.ok) {
        throw new Error("Failed to save card quantity");
      }
  
      // Warte kurz, um sicherzustellen, dass die Datenbank aktualisiert ist
      setTimeout(() => {
        fetchOwnedCards();
      }, 500);
    } catch (error) {
      console.error("Error saving card quantity:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  
  
  
  
  
  const updateOwnedQuantity = (change) => {
    const newQuantity = Math.max(Number(ownedQuantity) + change, 0);
    setOwnedQuantity(newQuantity);
    saveCardQuantity(selectedCard.id, newQuantity, foilQuantity);
  };
  
  const updateFoilQuantity = (change) => {
    const newQuantity = Math.max(Number(foilQuantity) + change, 0);
    setFoilQuantity(newQuantity);
    saveCardQuantity(selectedCard.id, ownedQuantity, newQuantity);
  };
  
  

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{t("catalog_title")}</h1>
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
          <button onClick={resetFilters} className={styles.resetButton}>
            {t("reset_filters")}
          </button>
        </div>
      </div>
      <div className={styles.cardGrid}>
        {isLoading ? (
            <p>{t("loading_message")}</p>
        ) : cards.length > 0 ? (
            cards.map((card) => {
            //console.log("Checking card:", card.id, Number(card.id));
            //console.log("Normal set contains:", ownedCards?.normal?.has(Number(card.id)));
            //console.log("Foil set contains:", ownedCards?.foil?.has(Number(card.id)));

            return (
                <div
                key={card.id}
                className={`${styles.card} 
                    ${ownedCards?.normal?.has(Number(card.id)) ? styles.owned : ""} 
                    ${ownedCards?.foil?.has(Number(card.id)) ? styles.foilOwned : ""}`}
                onClick={() => openPopup(card)}
                >
                <img
                    src={card.images.thumbnail || "/path/to/default-image.jpg"}
                    alt={card.name}
                    className={styles.cardThumbnail}
                />
                <p className={styles.cardName}>{card.name}</p>
                <p className={styles.cardFullName}>{card.fullName}</p>
                </div>
            );
            })
        ) : (
            <p>{t("no_cards_found")}</p>
        )}
        </div>

      {selectedCard && (
        <div className={styles.popupOverlay} onClick={closePopup}>
          <div
            className={styles.popup}
            onClick={(e) => e.stopPropagation()} // Popup selbst nicht schließen
          >
            <img
              src={selectedCard.images.full || "/path/to/default-image.jpg"}
              alt={selectedCard.name}
              className={styles.popupImage}
            />
            <h2 className={styles.popupName}>{selectedCard.name}</h2>
            <p className={styles.popupFullName}>{selectedCard.fullName}</p>
            <div className={styles.popupButtons}>
            
            <div className={styles.quantityControl}>
                <label>{t("own_quantity")}</label>
                <div className={styles.quantityWrapper}>
                    <button onClick={() => updateOwnedQuantity(-1)} className={styles.quantityButton}>-</button>
                    <input type="text" value={ownedQuantity} readOnly className={styles.quantityInput} />
                    <button onClick={() => updateOwnedQuantity(1)} className={styles.quantityButton}>+</button>
                </div>
            </div>

            <div className={styles.quantityControl}>
                <label>{t("foil_quantity")}</label>
                <div className={styles.quantityWrapper}>
                    <button onClick={() => updateFoilQuantity(-1)} className={styles.quantityButton}>-</button>
                    <input type="text" value={foilQuantity} readOnly className={styles.quantityInput} />
                    <button onClick={() => updateFoilQuantity(1)} className={styles.quantityButton}>+</button>
                </div>
            </div>

            </div>
            <button className={styles.popupCloseButton} onClick={closePopup}>
              {t("close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CatalogPage;
