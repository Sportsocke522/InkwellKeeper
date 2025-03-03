import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { FaHome, FaBookOpen, FaLayerGroup, FaUsers, FaBook } from "react-icons/fa";
import styles from "../styles/App.module.css";
import { Link } from "react-router-dom";


import { Navigate, Outlet } from "react-router-dom";

// Check if the user is authenticated by looking for a token in cookies
const isAuthenticated = () => {
  return document.cookie.split("; ").some((cookie) => cookie.startsWith("token="));
};

// Define a protected route component
const ProtectedRoute = () => {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
};


function SpecialPage() {
  // Hook for programmatic navigation within the app
  const navigate = useNavigate();
  // Tracks whether the system is ready
  const [isReady, setIsReady] = useState(null);
  // Tracks if the user has admin privileges
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeeFriends, setIsSeeFriends] = useState(false);
  const toastWarningMessage = useRef(false);

  // Hook for handling translations in the app
  const { t } = useTranslation();


  const useBackendPort = import.meta.env.VITE_USE_BACKEND_PORT === "true";
  const API_URL = useBackendPort
    ? `${import.meta.env.VITE_BACKEND_URL}:${import.meta.env.VITE_BACKEND_PORT}`
    : import.meta.env.VITE_BACKEND_URL;




  useEffect(() => {
    // Set the document title dynamically using translations
    document.title = t("dashboard") + " - " + t("inkwell");

    // Fetch multiple settings from the API
    const fetchSettings = async () => {
      try {
        // Fetch admin status, system readiness, and friends collection visibility in parallel
        const [adminRes, readyRes, seeFriendsRes] = await Promise.all([
          fetch(`${API_URL}/settings/is_admin`, { credentials: "include" }),
          fetch(`${API_URL}/settings/is_ready`, { credentials: "include" }),
          fetch(`${API_URL}/settings/get_seeFriends`, { credentials: "include" })
        ]);

        if (!adminRes.ok || !readyRes.ok || !seeFriendsRes.ok) throw new Error("API Fehler");

        // Parse responses after ensuring all requests succeeded
        const [adminData, readyData, seeFriendsData] = await Promise.all([
          adminRes.json(),
          readyRes.json(),
          seeFriendsRes.json()
        ]);

        // Update state based on API responses
        setIsAdmin(adminData.is_admin === 1);
        setIsReady(readyData.is_ready);
        setIsSeeFriends(seeFriendsData.seeFriendsCollection);
        
      } catch (error) {
        
      }
    };

    // Call the function to fetch settings on component mount
    fetchSettings();
  }, [navigate]);



  //loging out 
  const handleLogout = () => {
    document.cookie = "token=; Max-Age=0; path=/";
    toast.success(t("logout_success"));
    navigate("/login");
  };

  // Navigate to the setup wizard page
  const goToSetupWizard = () => {
    navigate("/Setupwizard");
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <h1 className={styles.dashboardTitle}>{t("dashboard")}</h1>

        {/* Stats Container */}
        <div className={styles.statsContainer}>
          {/* Hier können später Statistiken eingefügt werden */}
        </div>

        {/* Grid mit Links */}
        <div className={styles.grid}>
          <Link href="/MyCollection" className={styles.gridItem}>
            <FaBookOpen className={styles.icon} />
            <span>{t("my_collection")}</span>
          </Link>
          
          <Link href="/decks" className={styles.gridItem}>
            <FaLayerGroup className={styles.icon} />
            <span>{t("decks")}</span>
          </Link>

          {isSeeFriends && (
            <Link href="/FriendsCollection" className={styles.gridItem}>
              <FaUsers className={styles.icon} />
              <span>{t("friends_collection")}</span>
            </Link>
          )}

          <Link href="/catalog" className={styles.gridItem}>
            <FaBook className={styles.icon} />
            <span>{t("catalog")}</span>
          </Link>
        </div>
      </div>

      {/* Display a popup if the system is not ready but the user is an admin */}
      {!isReady && isAdmin && (
        <div className={styles.popupOverlay}>
          <div className={styles.popup}>
            <h2>{t("setup_required")}</h2>
            <p>{t("setup_description")}</p>
            <button onClick={goToSetupWizard} className={`${styles.btn} ${styles["btn-primary"]}`}>
              {t("go_to_setup_wizard")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpecialPage;
