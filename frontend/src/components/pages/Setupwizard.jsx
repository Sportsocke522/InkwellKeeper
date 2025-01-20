import { useEffect, useState } from "react";
import styles from "../styles/SetupWizard.module.css";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { availableLanguages } from "../../i18n";
import i18n from "../../i18n"; // Import von i18n
import { useTranslation } from "react-i18next";

function SetupWizard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isReady, setIsReady] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isNewRegEnabled, setIsNewRegEnabled] = useState(null); // Status für neue Registrierungen
  const [selectedLanguage, setSelectedLanguage] = useState("en"); // Standardmäßig Englisch
  const [selectedGame, setSelectedGame] = useState("Lorcana");
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    document.title = t("setup_wizard_title");

    const fetchInitialStatus = async () => {
      try {
        const [adminResponse, readyResponse, languageResponse] = await Promise.all([
          fetch("http://localhost:3000/settings/is_admin", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
          fetch("http://localhost:3000/settings/is_ready", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
          fetch("http://localhost:3000/settings/get_language", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
        ]);

        if (!adminResponse.ok || !readyResponse.ok) {
          throw new Error("Failed to fetch status");
        }

        const adminData = await adminResponse.json();
        const readyData = await readyResponse.json();
        const languageData = languageResponse.ok ? await languageResponse.json() : { language: "en" };

        setIsAdmin(adminData.is_admin === 1);
        setIsReady(readyData.is_ready === 1);

        // Sprache setzen
        const language = languageData.language || "en";
        setSelectedLanguage(language);
        i18n.changeLanguage(language);

        // Redirect if conditions are not met
        if (readyData.is_ready || adminData.is_admin !== 1) {
          toast.error(t("setup_unauthorized"));
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching status:", error);
        toast.error(t("setup_verification_failed"));
        navigate("/");
      }
    };

    fetchInitialStatus();
  }, [navigate]);

  const fetchNewRegStatus = async () => {
    try {
      const response = await fetch("http://localhost:3000/settings/is_new_reg", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch new registration status");
      }
  
      const data = await response.json();
      setIsNewRegEnabled(data.is_new_reg); // Setze direkt den Boolean-Wert
  
      console.log("isreg erhalten (aus Antwort):", data.is_new_reg);
    } catch (error) {
      console.error("Error fetching new registration status:", error);
      toast.error(t("fetch_new_reg_failed"));
    }
  };

  const savegeneralServerSettings = async () => {
    try {
      setIsLoading(true);

      await i18n.changeLanguage(selectedLanguage); // Sprache im i18n-Modul ändern
  
      const languageResponse = await fetch("http://localhost:3000/settings/set_language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ language: selectedLanguage }),
      });

      // Spiel speichern und Tabellen erstellen
      const gameResponse = await fetch("http://localhost:3000/settings/set_game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ game: selectedGame }),
      });
  
      if (!languageResponse.ok || !gameResponse.ok) {
        throw new Error("Failed to save settings");
      }
  
      toast.success(t("language_saved_successfully"));//String Anpassen
      setCurrentPage(2); // Gehe zur nächsten Seite
    } catch (error) {
      console.error("Error saving language:", error);
      toast.error(t("language_save_failed"));
    } finally {
      setIsLoading(false); // Ladezustand deaktivieren
    }
  };

  useEffect(() => {
    if (currentPage === 1) {
      fetchNewRegStatus();
    }
  }, [currentPage]);

  const finalizeSetup = async () => {
    try {
      const response = await fetch("http://localhost:3000/settings/set_setup_wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_ready: true }), // Nur is_ready senden
      });
  
      if (!response.ok) throw new Error("Failed to finalize setup");
  
      toast.success(t("setup_completed_successfully"));
      navigate("/"); // Weiterleitung zur gewünschten Seite
    } catch (error) {
      console.error("Error finalizing setup:", error);
      toast.error(t("setup_completion_failed"));
    }
  };
  

  const toggleNewRegStatus = () => {
    setIsNewRegEnabled((prev) => !prev); // Toggle the current status
  };

  const renderPageContent = () => {

    if (isLoading) {
      return (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>{t("loading_wait")}</p>
        </div>
      );
    }


    switch (currentPage) {
      case 0:
        return (
          <div>
            <h2>{t("welcome_to_setup")}</h2>
            <p>{t("configure_server")}</p>
            <button onClick={() => setCurrentPage(1)}>{t("next")}</button>
          </div>
        );
  
      case 1:
        return (
          <div>
            <h2>{t("general_server_settings")}</h2>
            <p>{t("select_language")}</p>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {availableLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
              <p>{t("select_game")}</p>
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
              >
                <option value="Lorcana">Lorcana</option>
                {/* Weitere Spiele hier hinzufügen */}
              </select>

            <button onClick={() => setCurrentPage(0)}>{t("back")}</button>
            <button onClick={savegeneralServerSettings}>{t("next")}</button>
          </div>
        );
  
      case 2:
        return (
          <div>
            <h2>{t("user_control")}</h2>
            <p>{t("enable_disable_registrations")}</p>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={isNewRegEnabled ?? false}
                onChange={async (e) => {
                  const newValue = e.target.checked;
                  setIsNewRegEnabled(newValue);
                  try {
                    const response = await fetch(
                      "http://localhost:3000/settings/set_new_reg",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ allowRegistration: newValue }),
                      }
                    );
                    if (!response.ok) {
                      throw new Error("Failed to update registration setting");
                    }
                    toast.success(
                      `${t("registrations_enabled")} ${newValue ? t("enabled") : t("disabled")}.`
                    );
                  } catch (error) {
                    console.error("Error updating registration status:", error);
                    toast.error(t("update_registration_failed"));
                    setIsNewRegEnabled(!newValue);
                  }
                }}
              />
              <span className={styles.slider}></span>
            </label>
            <button onClick={() => setCurrentPage(1)}>{t("back")}</button>
            <button onClick={() => setCurrentPage(3)}>{t("next")}</button>
          </div>
        );
  
      case 3:
        return (
          <div>
            <h2>{t("setup_complete")}</h2>
            <p>{t("everything_ready")}</p>
            <button onClick={() => setCurrentPage(2)}>{t("back")}</button>
            <button onClick={finalizeSetup}>{t("finish")}</button>
          </div>
        );
  
      default:
        return null;
    }
  };
  

  return (
    <div className={styles.container}>
      {isReady === false && isAdmin ? (
        renderPageContent()
      ) : (
        <p>{t("loading_wait")}</p>
      )}
    </div>
  );
}

export default SetupWizard;
