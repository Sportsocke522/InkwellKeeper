import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaBook, FaBookOpen, FaUsers, FaLayerGroup   } from "react-icons/fa";
import { BiScan } from "react-icons/bi";
import { FaGithub, FaExclamationTriangle } from "react-icons/fa";
import styles from "../styles/App.module.css";
import { useTranslation } from "react-i18next";
import VERSION from "../../version";


const GITHUB_REPO = "Sportsocke522/InkwellKeeper"; 
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;


const NavigationMenu  = ({ closeMenu }) => {
  const location = useLocation();
  const [isSeeFriends, setIsSeeFriends] = useState(false);
  const { t } = useTranslation();

  const [latestVersion, setLatestVersion] = useState(null);
  
  const useBackendPort = import.meta.env.VITE_USE_BACKEND_PORT === "true";
  const API_URL = useBackendPort
    ? `${import.meta.env.VITE_BACKEND_URL}:${import.meta.env.VITE_BACKEND_PORT}`
    : import.meta.env.VITE_BACKEND_URL;




  useEffect(() => {
    const fetchSeeFriendsStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/settings/get_seeFriends`, {
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

    const checkLatestVersion = async () => {
      try {
        const response = await fetch(GITHUB_API_URL);
        if (!response.ok) {
          throw new Error("Failed to fetch latest version");
        }
        const data = await response.json();
        setLatestVersion(data.tag_name.replace(/^v/, "")); // Entfernt das "v" vorne, falls vorhanden
      } catch (error) {
        console.error("Error fetching latest version:", error);
      }
    };

    fetchSeeFriendsStatus();

    checkLatestVersion();
  }, []);

  return (
    <div>
    <nav className={styles.nav}>
      <ul className={styles.menuList}>
        <li className={location.pathname === "/" ? styles.active : ""}>
          <Link to="/" onClick={closeMenu}>
            <FaHome /> {t("nav_home")}
          </Link>
        </li>
        <li className={location.pathname === "/MyCollection" ? styles.active : ""}>
          <Link to="/MyCollection" onClick={closeMenu}>
            <FaBookOpen /> {t("nav_my_collection")}
          </Link>
        </li>
        <li className={location.pathname === "/decks" ? styles.active : ""}>
          <Link to="/decks" onClick={closeMenu}>
            <FaLayerGroup /> {t("nav_decks")}
          </Link>
        </li>
        {isSeeFriends && (
          <li className={location.pathname === "/FriendsCollection" ? styles.active : ""}>
            <Link to="/FriendsCollection" onClick={closeMenu}>
              <FaUsers /> {t("nav_friends")}
            </Link>
          </li>
        )}
        <li className={location.pathname === "/catalog" ? styles.active : ""}>
          <Link to="/catalog" onClick={closeMenu}>
            <FaBook /> {t("nav_catalog")}
          </Link>
        </li>
        <li className={location.pathname === "/scanner" ? styles.active : ""}>
          <Link to="/scanner" onClick={closeMenu}>
            <BiScan   /> {t("nav_scanner")}
          </Link>
        </li>
      </ul>
    </nav>
    
    <div className={styles.versionInfo}>
      v{VERSION}

        {latestVersion && latestVersion !== VERSION && (
          <p>
            <FaExclamationTriangle style={{ marginRight: "5px" }} /> 
            <strong>{t("update_available")}: </strong> v{latestVersion} <br />
            <a href={`https://github.com/${GITHUB_REPO}/releases/latest`} target="_blank" rel="noopener noreferrer">
              <FaGithub style={{ marginRight: "5px" }} />
              {t("update_now")}
            </a>
          </p>
        )}

    </div>

    </div>
  );
};

export default NavigationMenu;
