import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import NavigationMenu from "./NavigationMenu";
import UserMenu from "./UserMenu";
import styles from "../styles/App.module.css";
import { FaBars, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import logo from "../styles/images/logo.png";

const Header = () => {
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1100);
  const menuRef = useRef(null);
  const { t } = useTranslation();

  const useBackendPort = import.meta.env.VITE_USE_BACKEND_PORT === "true";
  const API_URL = useBackendPort
    ? `${import.meta.env.VITE_BACKEND_URL}:${import.meta.env.VITE_BACKEND_PORT}`
    : import.meta.env.VITE_BACKEND_URL;



  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const response = await fetch(`${API_URL}/settings/get_username`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUsername(data.username);
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    };

    fetchUsername();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1100);
      if (window.innerWidth > 1100) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

 

  return (
    <>
      <header className={styles.header}>
        <div className={styles.topBar}>
          <div className={styles.rightSection}>
            {isMobile && (
              <button className={styles.burgerMenu} onClick={toggleMenu}>
                {menuOpen ? <FaTimes /> : <FaBars />}
              </button>
            )}
          </div>
          <div className={styles.middelSection}>
            <Link to="/" className={styles.logo}>
                <img src={logo} alt={`${t("inkwell")} ${t("logo")}`} />
            </Link>
          </div>
          <div className={styles.rightSection}>
            <UserMenu username={username} />
          </div>
        </div>
      </header>
      <div
        ref={menuRef}
        className={`${styles.sideSection} ${menuOpen ? styles.active : ""}`}
      >
        <NavigationMenu closeMenu={() => setMenuOpen(false)} />

      </div>
    </>
  );
};

export default Header;
