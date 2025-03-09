import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "../styles/App.module.css";
import placeholder from "../styles/images/card_placeholder.png";

function ScannResult() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Gescannte Kartennamen aus ScannerPage (als Array)
  const scannedCards = location.state?.scannedCards || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Der aktuell angezeigte (und editierbare) Name
  const [searchQuery, setSearchQuery] = useState(scannedCards[0] || "");

  // Kandidat aus der Suche (erster Treffer aus dem Backend)
  const [candidateCard, setCandidateCard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Eingestellte Menge und Option (normal, foil oder discard)
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState("normal");

  // Endergebnis (Liste der hinzugefügten Karten)
  const [finalResults, setFinalResults] = useState([]);

  // Backend-URL konfigurieren (ähnlich wie in der Katalogseite)
  const useBackendPort = import.meta.env.VITE_USE_BACKEND_PORT === "true";
  const API_URL = useBackendPort
    ? `${import.meta.env.VITE_BACKEND_URL}:${import.meta.env.VITE_BACKEND_PORT}`
    : import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    document.title = t("scann_result_title") + " - " + t("inkwell");
  }, [t]);

  // Suche nach dem Kandidaten basierend auf dem aktuellen Suchbegriff
  useEffect(() => {
    if (!searchQuery) return;
    setIsLoading(true);
    const fetchCandidateCard = async () => {
      try {
        // Wir nutzen hier den Filter-Endpoint wie in der Katalogseite
        const queryParams = new URLSearchParams({
          search: searchQuery,
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
  }, [searchQuery, API_URL]);

  // Funktion zum Hinzufügen der Karte in die Sammlung (wie in der Katalogseite)
  const addCardToCollection = async (cardId, normalQuantity, foilQuantity) => {
    try {
      const response = await fetch(`${API_URL}/cards/collection/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          card_id: cardId,
          normal_quantity: normalQuantity,
          foil_quantity: foilQuantity,
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

  // Handler, wenn der Nutzer die aktuelle Karte bestätigt
  const handleConfirm = async () => {
    // Falls nicht "discard" und ein Kandidat gefunden wurde, wird hinzugefügt
    if (selectedOption !== "discard" && candidateCard) {
      try {
        const normalQuantity = selectedOption === "normal" ? quantity : 0;
        const foilQuantity = selectedOption === "foil" ? quantity : 0;
        await addCardToCollection(candidateCard.id, normalQuantity, foilQuantity);
        setFinalResults((prev) => [
          ...prev,
          { card: candidateCard, quantity, option: selectedOption },
        ]);
      } catch (error) {
        alert(t("error_adding_card"));
        return;
      }
    }
    // Nächste Karte laden oder Abschluss anzeigen
    if (currentIndex + 1 < scannedCards.length) {
      setCurrentIndex(currentIndex + 1);
      setSearchQuery(scannedCards[currentIndex + 1]);
      setQuantity(1);
      setSelectedOption("normal");
      setCandidateCard(null); // reset, damit die Suche neu getriggert wird
    } else {
      const addedCount =
        finalResults.length + (selectedOption !== "discard" && candidateCard ? 1 : 0);
      alert(`${addedCount} ${t("cards_added")} ${t("to_your_collection")}`);
      navigate("/mycollection", {
        state: {
          finalResults: [
            ...finalResults,
            ...(selectedOption !== "discard" && candidateCard
              ? [{ card: candidateCard, quantity, option: selectedOption }]
              : []),
          ],
        },
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <h1>{t("scann_result_title")}</h1>
        <div className={styles.scannResultCard}>
          {/* Textfeld zum Anpassen des Kartennamens */}
          <label>{t("extracted_card_name")}</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {/* Anzeige des Kartenbilds */}
          <div className={styles.cardImageWrapper}>
            {isLoading ? (
              <p>{t("loading_card")}</p>
            ) : candidateCard ? (
              <img
                src={candidateCard.images?.full || placeholder}
                alt={candidateCard.name}
                className={styles.cardImage}
              />
            ) : (
              <img
                src={placeholder}
                alt={t("no_card_found")}
                className={styles.cardImage}
              />
            )}
          </div>
          {/* Auswahl, Menge und Optionen */}
          <div className={styles.options}>
            <div>
              <label>{t("quantity")}:</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className={styles.quantityInput}
              />
            </div>
            <div>
              <button
                onClick={() => setSelectedOption("normal")}
                className={selectedOption === "normal" ? styles.selected : ""}
              >
                {t("normal")}
              </button>
              <button
                onClick={() => setSelectedOption("foil")}
                className={selectedOption === "foil" ? styles.selected : ""}
              >
                {t("foil")}
              </button>
              <button
                onClick={() => setSelectedOption("discard")}
                className={selectedOption === "discard" ? styles.selected : ""}
              >
                {t("discard")}
              </button>
            </div>
          </div>
          <button onClick={handleConfirm} className={styles.confirmButton}>
            {t("confirm")}
          </button>
        </div>
        <div>
          <p>
            {t("card_progress", {
              current: currentIndex + 1,
              total: scannedCards.length,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ScannResult;
