import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "../styles/App.module.css";
import placeholder from "../styles/images/card_placeholder.png";

// Group duplicate cards by name (normalize by trimming, lowercasing and collapsing spaces)
const groupCards = (cards) => {
  const groups = {};
  cards.forEach((card) => {
    const key = card.replace(/\s+/g, " ").trim().toLowerCase();
    if (groups[key]) {
      groups[key].count += 1;
    } else {
      groups[key] = { name: card, count: 1 };
    }
  });
  return Object.values(groups);
};

function ScannResult() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // TEST_MODE: Use default test data if true
  const TEST_MODE = false;
  const defaultScannedCards = [
    "sir hiss - geifernde Giftschlange",
    "SIR HISS -  GEIFERNDE GIFTSCHLANGE",
    "Korkuma - Freundlicher Seefahrer",
    "Arielle - Auf menschlichen Beinen",
    "KOKOMORA - BEDROHLICHER SEEFAHRER",
    "SIR HISS -  GEIFERNDE GIFTSCHLANGE"
  ];

  // Get raw scanned cards from location.state or default test data
  const rawScannedCards = TEST_MODE ? defaultScannedCards : (location.state?.scannedCards || []);
  const [groupedCards, setGroupedCards] = useState(() => groupCards(rawScannedCards));

  // Current index for processing grouped cards
  const [currentIndex, setCurrentIndex] = useState(0);
  const scannedCount = groupedCards[currentIndex]?.count || 0;

  // Editable card name – initially from grouped card
  const [cardName, setCardName] = useState(groupedCards[0]?.name || "");
  
  // Additional quantities: these represent the extra copies to add.
  // For "normal", initial value is the scanned count; for "foil" it starts at 0.
  const [additionalNormal, setAdditionalNormal] = useState(scannedCount);
  const [additionalFoil, setAdditionalFoil] = useState(0);

  // Option: "normal" or "discard" (foil is controlled via additionalFoil)
  const [selectedOption, setSelectedOption] = useState("normal");
  // Final results array
  const [finalResults, setFinalResults] = useState([]);

  // Candidate card from backend search (optional) and loading state
  const [candidateCard, setCandidateCard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Existing quantities from backend collection
  const [existingNormal, setExistingNormal] = useState(0);
  const [existingFoil, setExistingFoil] = useState(0);

  // State to control finish popup
  const [showFinishPopup, setShowFinishPopup] = useState(false);

  // Configure Backend URL (like in CatalogPage)
  const useBackendPort = import.meta.env.VITE_USE_BACKEND_PORT === "true";
  const API_URL = useBackendPort
    ? `${import.meta.env.VITE_BACKEND_URL}:${import.meta.env.VITE_BACKEND_PORT}`
    : import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    document.title = t("scann_result_title") + " - " + t("inkwell");
  }, [t]);

  // When cardName changes, fetch candidate card from API
  useEffect(() => {
    if (!cardName) return;
    setIsLoading(true);
    const fetchCandidateCard = async () => {
      try {
        const queryParams = new URLSearchParams({
          search: cardName,
          sort_by: "id",
          sort_order: "ASC",
        }).toString();
        const response = await fetch(`${API_URL}/cards/filtered?${queryParams}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch card");
        const data = await response.json();
        if (data.cards && data.cards.length > 0) {
          setCandidateCard(data.cards[0]);
        } else {
          setCandidateCard(null);
        }
      } catch (error) {
        console.error("Error fetching candidate card:", error);
        setCandidateCard(null);
      } finally {
        setIsLoading(false);
      }
    };
    const timer = setTimeout(fetchCandidateCard, 500);
    return () => clearTimeout(timer);
  }, [cardName, API_URL]);

  // When candidateCard changes, fetch existing quantities from backend
  useEffect(() => {
    if (candidateCard) {
      const fetchExistingQuantities = async () => {
        try {
          const response = await fetch(`${API_URL}/cards/collection/quantity/${candidateCard.id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            const currNormal = Number(data.normal_quantity) || 0;
            const currFoil = Number(data.foil_quantity) || 0;
            setExistingNormal(currNormal);
            setExistingFoil(currFoil);
            // The additional quantity for "normal" is the scanned count (not total) 
            // and foil starts at 0.
            setAdditionalNormal(scannedCount);
            setAdditionalFoil(0);
          } else {
            setExistingNormal(0);
            setExistingFoil(0);
            setAdditionalNormal(scannedCount);
            setAdditionalFoil(0);
          }
        } catch (error) {
          console.error("Error fetching existing quantities:", error);
          setExistingNormal(0);
          setExistingFoil(0);
          setAdditionalNormal(scannedCount);
          setAdditionalFoil(0);
        }
      };
      fetchExistingQuantities();
    }
  }, [candidateCard, API_URL, scannedCount]);

  // Function to add card to collection by sending new totals (existing + additional)
  const addCardToCollection = async (cardId, normalQty, foilQty) => {
    try {
      const response = await fetch(`${API_URL}/cards/collection/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          card_id: cardId,
          normal_quantity: normalQty,
          foil_quantity: foilQty,
        }),
      });
      if (!response.ok) throw new Error("Failed to add card");
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error adding card to collection:", error);
      throw error;
    }
  };

  // Handler for Confirm: add card and move to next card.
  // New totals werden als (existing + additional) berechnet.
  const handleConfirm = async () => {
    if (selectedOption !== "discard" && candidateCard) {
      try {
        const newNormal = existingNormal + additionalNormal;
        const newFoil = existingFoil + additionalFoil;
        await addCardToCollection(candidateCard.id, newNormal, newFoil);
        setFinalResults(prev => [
          ...prev,
          { card: candidateCard, normal: newNormal, foil: newFoil }
        ]);
      } catch (error) {
        alert(t("error_adding_card"));
        return;
      }
    }
    moveToNextCard();
  };

  // Handler for Discard: skip the current card
  const handleDiscard = () => {
    setSelectedOption("discard");
    moveToNextCard();
  };

  // Function to move to the next card group.
  // If no more cards, show finish popup instead of alert.
  const moveToNextCard = () => {
    if (currentIndex + 1 < groupedCards.length) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      const nextCard = groupedCards[nextIndex];
      setCardName(nextCard.name);
      // Reset additional counters: for "normal" set to scanned count of new card, for "foil" to 0.
      setAdditionalNormal(nextCard.count);
      setAdditionalFoil(0);
      setSelectedOption("normal");
      setCandidateCard(null);
    } else {
      // Show finish popup statt eines Alerts
      setShowFinishPopup(true);
    }
  };

  const totalAdditional = additionalNormal + additionalFoil;

  
  const warnings = [];
  if (!candidateCard) {
    warnings.push(t("warning_no_card_found"));
  }
  if (totalAdditional === 0) {
    warnings.push(t("warning_zero_quantity"));
  }
  if (totalAdditional > scannedCount) {
    warnings.push(t("warning_exceeds_count", { max: scannedCount }));
  }

  const confirmDisabled = !candidateCard || totalAdditional === 0;

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        {/* Progress indicator */}
        <h1 className={styles.dashboardTitle}>{t("scann_result_title")}</h1>
        <p className={styles.cards_remaining}>
          {t("cards_remaining", { remaining: groupedCards.length - currentIndex, total: groupedCards.length })}
        </p>
        <div className={styles.scannResultCard}>
          {/* Editable text field for card name */}
          <div className={styles.searchFilterContainer}>
            <label>{t("extracted_card_name")}</label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          {/* Display card image */}
          <div className={styles.cardImageWrapper}>
            <img
              src={candidateCard?.images?.full || placeholder}
              alt={candidateCard?.name || t("no_card_found")}
              className={styles.cardImage}
            />
            {/* Warning message below the image if no valid card was found */}
            {!candidateCard && (
              <p className={styles.warningText_noCard}>{t("warning_no_card_found")}</p>
            )}
          </div>
          
          
          
          {/* Quantity controls for additional copies */}
          <div className={styles.scan_quantity_options}>
            <div>
              <label>{t("normal_quantity")}:</label>
              <button onClick={() => setAdditionalNormal(n => Math.max(n - 1, 0))} className={styles.quantityButton}>-</button>
              <span>{additionalNormal}</span>
              <button onClick={() => setAdditionalNormal(n => n + 1)} className={styles.quantityButton}>+</button>
            </div>
            <div>
              <label>{t("foil_quantity")}:</label>
              <button onClick={() => setAdditionalFoil(f => Math.max(f - 1, 0))} className={styles.quantityButton}>-</button>
              <span>{additionalFoil}</span>
              <button onClick={() => setAdditionalFoil(f => f + 1)} className={styles.quantityButton}>+</button>
            </div>
          </div>
          {/* Display warning messages */}
          {(warnings.length > 0 && candidateCard) && (
            <div className={styles.warningMessages_scanQuantity}>
              {warnings.map((warn, idx) => (
                <p key={idx} className={styles.warningText}>{warn}</p>
              ))}
            </div>
          )}
          {/* Confirm and Discard Buttons */}
          <div className={styles.buttonRow}>
            <button
              onClick={handleConfirm}
              className={`${styles.btn} ${styles["btn-primary"]}`}
              disabled={confirmDisabled}
            >
              {t("confirm")}
            </button>
            <button
              onClick={handleDiscard}
              className={`${styles.btn} ${styles["btn-danger"]}`}
            >
              {t("discard")}
            </button>
          </div>
        </div>
        
      </div>

      {/* Finish Popup */}
      {showFinishPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popup}>
            <h2>{t("finish_popup_title")}</h2>
            <p>
              {groupedCards.length > 0 
                ? t("finish_popup_message", { count: finalResults.length })
                : t("no_cards_scanned")}
            </p>
            <button
              className={`${styles.btn} ${styles["btn-primary"]}`}
              onClick={() => navigate("/mycollection", { state: { finalResults } })}
            >
              {t("go_to_my_collection")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScannResult;
