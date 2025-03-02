import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaBook, FaBookOpen, FaUsers, FaLayerGroup } from "react-icons/fa";
import styles from "../styles/App.module.css";
import { useTranslation } from "react-i18next";
import VERSION from "../../version";


const NavigationMenu = () => {
  const location = useLocation();
  const [isSeeFriends, setIsSeeFriends] = useState(false);
  const { t } = useTranslation();

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
        //console.error("Error fetching seeFriendsCollection status:", error);
      }
    };

    fetchSeeFriendsStatus();
  }, []);

  return (
    <div>
    <nav className={styles.nav}>
      <ul className={styles.menuList}>
        <li className={location.pathname === "/" ? styles.active : ""}>
          <Link to="/">
            <FaHome /> {t("nav_home")}
          </Link>
        </li>
        <li className={location.pathname === "/MyCollection" ? styles.active : ""}>
          <Link to="/MyCollection">
            <FaBookOpen /> {t("nav_my_collection")}
          </Link>
        </li>
        <li className={location.pathname === "/decks" ? styles.active : ""}>
          <Link to="/decks">
            <FaLayerGroup /> {t("nav_decks")}
          </Link>
        </li>
        {isSeeFriends && (
          <li className={location.pathname === "/FriendsCollection" ? styles.active : ""}>
            <Link to="/FriendsCollection">
              <FaUsers /> {t("nav_friends")}
            </Link>
          </li>
        )}
        <li className={location.pathname === "/catalog" ? styles.active : ""}>
          <Link to="/catalog">
            <FaBook /> {t("nav_catalog")}
          </Link>
        </li>
      </ul>
    </nav>
    
    <div className={styles.versionInfo}>
      v{VERSION}
    </div>

    </div>
  );
};

export default NavigationMenu;
