import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaBook, FaBookOpen, FaUsers, FaLayerGroup } from "react-icons/fa";
import styles from "../styles/App.module.css";

const NavigationMenu = () => {
  const location = useLocation();
  const [isSeeFriends, setIsSeeFriends] = useState(false);

  useEffect(() => {
    const fetchSeeFriendsStatus = async () => {
      try {
        const response = await fetch("http://localhost:3000/settings/get_seeFriends", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch seeFriendsCollection status");
        }

        const data = await response.json();
        setIsSeeFriends(data.seeFriendsCollection); // Setzt den Status basierend auf der API-Antwort
      } catch (error) {
        console.error("Error fetching seeFriendsCollection status:", error);
      }
    };

    fetchSeeFriendsStatus();
  }, []);

  return (
    <nav className={styles.nav}>
      <ul className={styles.menuList}>
        <li className={location.pathname === "/" ? styles.active : ""}>
          <Link to="/">
            <FaHome /> Home
          </Link>
        </li>
        <li className={location.pathname === "/MyCollection" ? styles.active : ""}>
          <Link to="/MyCollection">
            <FaBookOpen /> Meine Sammlung
          </Link>
        </li>
        <li className={location.pathname === "/decks" ? styles.active : ""}>
          <Link to="/decks">
            <FaLayerGroup /> Decks
          </Link>
        </li>
        {isSeeFriends && (
          <li className={location.pathname === "/FriendsCollection" ? styles.active : ""}>
            <Link to="/FriendsCollection">
              <FaUsers /> Freunde
            </Link>
          </li>
        )}
        <li className={location.pathname === "/catalog" ? styles.active : ""}>
          <Link to="/catalog">
            <FaBook /> Katalog
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default NavigationMenu;
