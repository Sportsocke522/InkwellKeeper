import { useEffect, useState } from "react";
import styles from "../styles/App.module.css";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

//Placeholder Img 
import placeholder from "../styles/images/card_placeholder.png";

function CatalogPage() {
  // Initialize hooks for navigation and translations
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Define state variables for app status and user permissions
  const [isReady, setIsReady] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // State for card-related data and filters
  const [cards, setCards] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedRarity, setSelectedRarity] = useState("");
  const [selectedSet, setSelectedSet] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("ASC");
  const [isLoading, setIsLoading] = useState(true);
  const [friendsCards, setFriendsCards] = useState([]);

  // State for selected card details
  const [selectedCard, setSelectedCard] = useState(null); 
  const [ownedQuantity, setOwnedQuantity] = useState(0); 
  const [foilQuantity, setFoilQuantity] = useState(0); 

  // State for tracking owned cards as sets (normal and foil)
  const [ownedCards, setOwnedCards] = useState({
    normal: new Set(),
    foil: new Set(),
  });

  // Functions to modify the quantity of owned normal cards
  const incrementOwned = () => setOwnedQuantity((prev) => prev + 1);
  const decrementOwned = () => setOwnedQuantity((prev) => Math.max(prev - 1, 0));

  // Functions to modify the quantity of owned foil cards
  const incrementFoil = () => setFoilQuantity((prev) => prev + 1);
  const decrementFoil = () => setFoilQuantity((prev) => Math.max(prev - 1, 0));


  const useBackendPort = import.meta.env.VITE_USE_BACKEND_PORT === "true";
  const API_URL = useBackendPort
    ? `${import.meta.env.VITE_BACKEND_URL}:${import.meta.env.VITE_BACKEND_PORT}`
    : import.meta.env.VITE_BACKEND_URL;




  


  /* 
    Fetch filtered cards from the API based on selected filters
  */
  const fetchCards = async () => {

    // Set loading state before fetching data
    setIsLoading(true);
    try {
      // Construct query parameters based on filters and search inpu
      const queryParams = new URLSearchParams({
        set_code: selectedSet || "",
        color: selectedColor || "",
        rarity: selectedRarity || "",
        search: debouncedSearchQuery || "",
        sort_by: sortBy,
        sort_order: sortOrder,
      }).toString();

      console.log(API_URL);

      // Fetch data from the API with the constructed query parameters
      const response = await fetch(`${API_URL}/cards/filtered?${queryParams}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch filtered cards"); // Handle HTTP errors

      const data = await response.json();

      // Remove duplicate cards based on their ID
      const uniqueCards = data.cards.reduce((acc, card) => {
        if (!acc.find((c) => c.id === card.id)) {
          acc.push(card);
        }
        return acc;
      }, []);

      // Update state with the fetched cards or set an empty array if none exist
      setCards(uniqueCards.length ? uniqueCards : []);

    } catch (error) {
      // Handle API errors by setting an empty card list
      setCards([]);
    } finally {
      // End loading state
      setIsLoading(false);
    }
  };


  /*
    Fetch the user's owned cards from the API
  */
  const fetchOwnedCards = async () => {
    try {
      // Send a GET request to retrieve owned cards
      const response = await fetch(`${API_URL}/cards/collection`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch owned cards"); // Handle HTTP errors
      }
  
      const data = await response.json(); // Parse response data
  
      
      if (data.cards) { // Ensure valid card data exists
  
        const ownedNormal = new Set();
        const ownedFoil = new Set();
  
        // Iterate through the fetched cards and categorize them
        data.cards.forEach((card) => {
          
          const cardId = Number(card.id); // Konvertiere in Zahl für Konsistenz
            
          if (card.is_foil) {
            ownedFoil.add(cardId); // Add foil card to foil set
          } else {
            ownedNormal.add(cardId); // Add normal card to normal set
          }
        });
  
        // Update state with the categorized owned cards
        setOwnedCards({
          normal: ownedNormal,
          foil: ownedFoil,
        });
  

      } else {
        
      }
    } catch (error) {
      
    }
  };
  
  /*
    Fetch the collection of friends' owned cards from the API
  */
  const fetchFriendsCards = async () => {
    try {
      // Send a GET request to retrieve friends' card collections
      const response = await fetch(`${API_URL}/cards/collection/friends`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch friends' cards"); // Handle HTTP errors


      const data = await response.json();

      // Update state with friends' cards or set an empty array if none exist
      if (!data.cards || data.cards.length === 0) {
          
      } else {
            
      }

      setFriendsCards(data.cards || []);
    } catch (error) {
        
    }
  };




  useEffect(() => {
    // Set the document title using translations
    document.title = t("catalog_title") + " - " + t("inkwell");

    /*
      Fetch user status (admin rights and system readiness)
    */
    const fetchStatus = async () => {
      try {
        // Fetch both admin status and system readiness in parallel
        const [adminResponse, readyResponse] = await Promise.all([
          fetch(`${API_URL}/settings/is_admin`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
          fetch(`${API_URL}/settings/is_ready`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
        ]);

        if (!adminResponse.ok || !readyResponse.ok) {
          throw new Error("Failed to fetch status"); // Handle HTTP errors
        }

        // Parse responses
        const adminData = await adminResponse.json();
        const readyData = await readyResponse.json();

        // Update state based on the responses
        setIsAdmin(adminData.is_admin === 1);
        setIsReady(readyData.is_ready);

      } catch (error) {
          
      }
    };

    // Call functions to fetch initial data
    fetchStatus();
    fetchCards();
    fetchOwnedCards();

    /**
     * Check if the user has enabled the "see friends' collection" setting
     */
    const checkSeeFriends = async () => {
      const response = await fetch(`${API_URL}/settings/get_seeFriends`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      if (data.seeFriendsCollection === "true") {
        fetchFriendsCards(); // Fetch friends' card collections if enabled
      }
    };

    checkSeeFriends();
  }, []); // Runs only once when the component mounts


  useEffect(() => {
    // Debounce the search query to reduce the number of API calls
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // Waits 500ms before updating the debounced query

    return () => clearTimeout(handler);
  }, [searchQuery]); // Runs whenever searchQuery changes

  useEffect(() => {
    fetchCards(); // Fetch updated card list when filters or sorting options change
  }, [selectedColor, selectedRarity, selectedSet, debouncedSearchQuery,  sortBy, sortOrder]); // Runs when any dependency changes


  const handleSortChange = (e) => {
    // Runs when any dependency changes
    const [field, order] = e.target.value.split("-");
    setSortBy(field); // Update sorting field
    setSortOrder(order); // Update sorting order
  };


  const resetFilters = () => {
    // Reset all filters and fetch all cards again
    setSearchQuery("");
    setSelectedColor("");
    setSelectedRarity("");
    setSelectedSet("");
    fetchCards();
  };

  const closePopup = () => setSelectedCard(null);
  // Closes the card details popup by resetting the selected card

  const openPopup = async (card) => {
    setSelectedCard(card); // Sets the selected card to display in the popup
  
    try {
      // Fetch the quantity of the selected card from the user's collection
      const response = await fetch(`${API_URL}/cards/collection/quantity/${card.id}`, {
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
      
      // Ensure the retrieved quantities are numbers and update state
      setOwnedQuantity(Number(data.normal_quantity || 0));
      setFoilQuantity(Number(data.foil_quantity || 0));
    } catch (error) {
      // Handle errors by resetting quantities to 0
      setOwnedQuantity(0);
      setFoilQuantity(0);
    }
  };
  
  
  const saveCardQuantity = async (cardId, normalQuantity, foilQuantity, setLocalQuantity, oldQuantity) => {
    try {
      setIsLoading(true); // Set loading state while saving data

      // Send a request to update the owned card quantities
      const response = await fetch(`${API_URL}/cards/collection/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          card_id: cardId,
          normal_quantity: normalQuantity, // The new quantity of normal cards
          foil_quantity: foilQuantity, // The new quantity of foil cards
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific API error responses with user feedback
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
      fetchOwnedCards(); // Refresh the owned cards list after successful update

    } catch (error) {
      // If an error occurs, revert the local UI state to the previous value
        setLocalQuantity(oldQuantity); 
    } finally {
        setIsLoading(false);
    }
  };

  // Update the quantity of normal cards
  const updateOwnedQuantity = async (change) => {
    const oldQuantity = ownedQuantity; // Store the current value before updating
    const newQuantity = Math.max(Number(ownedQuantity) + change, 0); // Ensure quantity doesn't go below zero

    setOwnedQuantity(newQuantity);  // Update UI immediately

    // Save the new quantity to the backend
    await saveCardQuantity(selectedCard.id, newQuantity, foilQuantity, setOwnedQuantity, oldQuantity);
  };

  // Update the quantity of foil cards
  const updateFoilQuantity = async (change) => {
    const oldQuantity = foilQuantity; // Store the current value before updating
    const newQuantity = Math.max(Number(foilQuantity) + change, 0); // Ensure quantity doesn't go below zero

    setFoilQuantity(newQuantity);  // Update UI immediately

    // Save the new quantity to the backend
    await saveCardQuantity(selectedCard.id, ownedQuantity, newQuantity, setFoilQuantity, oldQuantity);
  };


  
  

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <h1 className={styles.dashboardTitle}>{t("catalog_title")}</h1>

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

            {isLoading ? (
                <p>{t("loading_message")}</p>
            ) : cards.length > 0 ? (
                cards.map((card) => {

                return (
                  <div
                      key={card.id}
                      className={`${styles.card} ${styles.cardCatalog} 
                          ${ownedCards?.normal?.has(Number(card.id)) ? styles.owned : ""} 
                          ${ownedCards?.foil?.has(Number(card.id)) ? styles.foild : ""}`}
                      onClick={() => openPopup(card)}
                  >
                      {friendsCards.filter(friendCard => friendCard.card_id === card.id).length > 0 && (
                          <div className={`${styles.friendTag} ${'friendTag'}`}   >
                            {friendsCards.filter(friendCard => friendCard.card_id === card.id).slice(0, 2).map((friendCard, index) => (
                              <span key={index}>{friendCard.username}</span>
                            ))}
                            {friendsCards.filter(friendCard => friendCard.card_id === card.id).length > 2 && (
                              <span>+{friendsCards.filter(friendCard => friendCard.card_id === card.id).length - 2}</span>
                            )}
                          </div>
                        )}
                      <img
                          src={card.images.thumbnail || placeholder}
                          alt={card.name}
                          className={styles.cardImage}
                      />
                      
                      <p className={styles.cardFullName}>{card.fullName}</p>
                  </div>
              
                );
                })
            ) : (
                <p>{t("no_cards_found")}</p>
            )}

              {selectedCard && (
                <div className={styles.popupOverlay} onClick={closePopup}>
                  <div
                    className={`${styles.popup} ${styles["cart_popup"]}`}
                    onClick={(e) => e.stopPropagation()} 
                  >
                    <img
                      src={selectedCard.images.full || placeholder}
                      alt={selectedCard.name}
                      className={styles.cardImage}
                    />
                    <h2 className={styles.popupName}>{selectedCard.name}</h2>
                    <p className={styles.popupFullName}>{selectedCard.fullName}</p>
                    <div className={styles.popupButtons}>
                    

                    <div className={styles.quantityContainer} >
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





                    </div>
                    <button onClick={closePopup}>{t("close")}</button>
                  </div>
                </div>
              )}

            </div>



        </div>

        
      </div>
    </div>











  );
}

export default CatalogPage;
