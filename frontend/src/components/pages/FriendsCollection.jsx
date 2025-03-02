import { useEffect, useState } from "react";
import styles from "../styles/App.module.css";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import placeholder from "../styles/images/card_placeholder.png";

function FriendsCollection() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [cards, setCards] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedRarity, setSelectedRarity] = useState("");
  const [selectedSet, setSelectedSet] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("ASC");
  const [isLoading, setIsLoading] = useState(true);
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState("all");

  const [selectedCard, setSelectedCard] = useState(null); 
  const [ownedQuantity, setOwnedQuantity] = useState(0); 
  const [foilQuantity, setFoilQuantity] = useState(0); 

  useEffect(() => {
    // Set the document title dynamically using translations
    document.title = t("friends_collection_title") + " - " + t("inkwell");

    fetchUserList(); // Fetch the list of friends
    fetchCards(); // Fetch the collection of selected friends

    // Re-fetch data when filters or sorting options change
  }, [selectedUser, selectedColor, selectedRarity, selectedSet, debouncedSearchQuery, sortBy, sortOrder]);

  useEffect(() => {
    // Debounce search query to reduce API calls while typing
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchUserList = async () => {
    try {
      // Send a GET request to retrieve the list of friends
      const response = await fetch("http://localhost:3000/cards/users/friends", {
        method: "GET",
        credentials: "include",
      });
  
      if (!response.ok) throw new Error("Failed to fetch user list");
  
      const data = await response.json();

      // Update the user list or set an empty array if none exist
      setUserList(data.users || []);
    } catch (error) {
      
    }
  };
  

  const fetchCards = async () => {
    // Set loading state before fetching data
    setIsLoading(true);
    try {
      // Construct query parameters based on selected filters and user selection
      const queryParams = new URLSearchParams({
        set_code: selectedSet || "",
        color: selectedColor || "",
        rarity: selectedRarity || "",
        search: debouncedSearchQuery || "",
        sort_by: sortBy,
        sort_order: sortOrder,
        friend_id: selectedUser !== "all" ? selectedUser : "",
      }).toString();
  
      // Fetch filtered cards from the API
      const response = await fetch(`http://localhost:3000/cards/collection/friends/filtered?${queryParams}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
  
      if (!response.ok) {
        const errorResponse = await response.json();
        
        throw new Error("Failed to fetch filtered cards");
      }
  
      const data = await response.json();
      
      // Update state with fetched cards or fallback to an empty array
      setCards(data.cards || []);
    } catch (error) {
      // Handle errors (e.g., API request failure)
      setCards([]);
    } finally {
      // End loading state
      setIsLoading(false);
    }
  };
  

  const handleSortChange = (e) => {
    // Extract sorting field and order from the selected option
    const [field, order] = e.target.value.split("-");
    setSortBy(field);
    setSortOrder(order);
  };

  // Reset all filters to default values
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedColor("");
    setSelectedRarity("");
    setSelectedSet("");
    setSelectedUser("all");
    fetchCards();
  };

  // Close the popup by clearing the selected card
  const closePopup = () => setSelectedCard(null);

  const openPopup = async (card) => {
    // Set the selected card to display in the popup
    setSelectedCard(card);

    try {
      // Fetch the quantity of the selected card from the user's collection
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

      // Ensure the retrieved quantities are numbers and update state
      setOwnedQuantity(Number(data.normal_quantity || 0));
      setFoilQuantity(Number(data.foil_quantity || 0));
    } catch (error) {
      // Handle errors by resetting quantities to 0
      setOwnedQuantity(0);
      setFoilQuantity(0);
    }
  };

  return (

    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <h1 className={styles.dashboardTitle}>{t("friends_collection_title")}</h1>


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
            <select
              className={styles.filterSelect}
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="all">{t("all_users")}</option>
              {userList.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
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

            <div  className={`${styles.cardGrid} ${styles.FriendsCardGrid}`}>
              {cards.map((card) => (
                  <div
                  key={card.id}
                  className={`${styles.card} ${card.is_foil ? styles.foild : ""}`}
                  onClick={() => openPopup(card)}
                  >
                    <div className={`${styles.friendTag} `} >
                      <span>{card.owner}</span>
                    </div>
                    <img src={card.thumbnail_url || placeholder} alt={card.full_name} className={styles.cardImage} />
                    <p>{card.full_name}</p>
                  </div>
              ))}
            </div>

          </div>

        

      </div>
    </div>



  );
}

export default FriendsCollection;
