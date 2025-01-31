import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { FaHome, FaBookOpen, FaLayerGroup, FaUsers, FaBook } from "react-icons/fa";
import styles from "../styles/App.module.css";

function SpecialPage() {
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeeFriends, setIsSeeFriends] = useState(false);
  const toastWarningMessage = useRef(false);

  const { t } = useTranslation();

  useEffect(() => {
    document.title = t("inkwell_dashboard");

    const fetchSettings = async () => {
      try {
        const [adminRes, readyRes, seeFriendsRes] = await Promise.all([
          fetch("http://localhost:3000/settings/is_admin", { credentials: "include" }),
          fetch("http://localhost:3000/settings/is_ready", { credentials: "include" }),
          fetch("http://localhost:3000/settings/get_seeFriends", { credentials: "include" })
        ]);

        if (!adminRes.ok || !readyRes.ok || !seeFriendsRes.ok) throw new Error("API Fehler");

        const [adminData, readyData, seeFriendsData] = await Promise.all([
          adminRes.json(),
          readyRes.json(),
          seeFriendsRes.json()
        ]);

        setIsAdmin(adminData.is_admin === 1);
        setIsReady(readyData.is_ready);
        setIsSeeFriends(seeFriendsData.seeFriendsCollection);

        console.log("isAdmin erhalten:", adminData.is_admin);
        console.log("isReady erhalten:", readyData.is_ready);
        console.log("seeFriends erhalten:", seeFriendsData.seeFriendsCollection);
        
      } catch (error) {
        console.error("Fehler beim Abrufen der Einstellungen:", error);
      }
    };

    fetchSettings();
  }, [navigate]);

  const handleLogout = () => {
    document.cookie = "token=; Max-Age=0; path=/";
    toast.success(t("logout_success"));
    navigate("/login");
  };

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
          
          <div className={styles.gridItem}>
            <FaBookOpen className={styles.icon} />
            <span>{t("my_collection")}</span>
          </div>
          <div className={styles.gridItem}>
            <FaLayerGroup className={styles.icon} />
            <span>{t("decks")}</span>
          </div>
          {isSeeFriends && (
            <div className={styles.gridItem}>
              <FaUsers className={styles.icon} />
              <span>{t("friends_collection")}</span>
            </div>
          )}
          <div className={styles.gridItem}>
            <FaBook className={styles.icon} />
            <span>{t("catalog")}</span>
          </div>
        </div>
      </div>

      {/* Popup wird angezeigt, wenn !isReady && isAdmin */}
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
