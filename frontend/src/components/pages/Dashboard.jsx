import { useEffect, useState, useRef } from "react";
import styles from "../styles/Special.module.css";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

function SpecialPage() {
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const toastWarningMessage = useRef(false);

  const { t } = useTranslation();

  useEffect(() => {
    document.title = t("inkwell_dashboard"); // Dynamically set the page title
  
    // Fetch `is_admin` status from the backend
    const fatch_isAdmin = async () => {
      try {
        const response = await fetch("http://localhost:3000/settings/is_admin", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        console.log("Daten erhalten:", data);
        setIsAdmin(data.is_admin === 1);
        console.log("isAdmin erhalten (aus Antwort):", data.is_admin === 1);
      } catch (error) {
        console.error("Error fetching is_admin status:", error);
      }
    };
  
    fatch_isAdmin();

    // Fetch `is_ready` status from the backend
    const fatch_isReady = async () => {
      try {
        const response = await fetch("http://localhost:3000/settings/is_ready", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        console.log("Daten erhalten:", data);
        setIsReady(data.is_ready);
        console.log("isready erhalten (aus Antwort):", data.is_ready);
      } catch (error) {
        console.error("Error fetching is_ready status:", error);
      }
    };
  
    fatch_isReady();
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
      <div id={styles.div}>
        <h1 id={styles.h1}>{t("dashboard")}</h1>
        <hr />
        <p id={styles.p}>
          {t("welcome_message")}
        </p>
        <h1>{t("test_string")}</h1>
        <button
          id={styles.logoutButton}
          onClick={handleLogout}
          className={styles.button}
        >
          {t("logout")}
        </button>
        {!isReady && isAdmin && (
          <button
            id={styles.setupButton}
            onClick={goToSetupWizard}
            className={styles.button}
          >
            {t("go_to_setup_wizard")}
          </button>
        )}
      </div>
    </div>
  );
}

export default SpecialPage;
