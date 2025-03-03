import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCog, FaSignOutAlt } from "react-icons/fa";
import styles from "../styles/App.module.css";
import { useTranslation } from "react-i18next";

const UserMenu = ({ username }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const API_URL = `${import.meta.env.VITE_BACKEND_URL}:${import.meta.env.VITE_BACKEND_PORT}`;

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLogout = () => {
    document.cookie = "token=; Max-Age=0; path=/";
    navigate("/login");
  };

  // Klick außerhalb des Menüs erkennt und Menü schließt
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className={styles.userMenu} ref={menuRef}>
      <button className={styles.userButton} onClick={toggleMenu}>
        <div className={styles.avatar}>{username ? username.charAt(0).toUpperCase() : "?"}</div>
      </button>
      {menuOpen && (
        <div className={styles.menuDropdown}>
          
          <ul>
            <li onClick={() => navigate("/settings")}>
              <FaCog /> {t("nav_settings")}
            </li>
            <li onClick={handleLogout}>
              <FaSignOutAlt /> {t("logout")}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
