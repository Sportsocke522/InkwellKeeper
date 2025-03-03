import { useEffect, useState } from "react";
import styles from "../styles/App.module.css";
import { toast } from "sonner";
import { availableLanguages } from "../../i18n";
import i18n from "../../i18n"; 
import { useTranslation } from "react-i18next";
import { FaGlobe, FaGithub } from "react-icons/fa";

function Settings() {
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [selectedGame, setSelectedGame] = useState("Lorcana");
  const [isNewRegEnabled, setIsNewRegEnabled] = useState(null);
  const [isSeeFriends, setIsSeeFriends] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const API_URL = `${import.meta.env.VITE_BACKEND_URL}:${import.meta.env.VITE_BACKEND_PORT}`;

  // Updates the user's username in the backend.
// Sends a POST request with the new username and handles success or error feedback.
  const handleSaveUsername = async () => {
    try {
      const response = await fetch(`${API_URL}/settings/set_username`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success(t("user_settings_updated"));
      } else {
        toast.error(result.message || t("update_failed"));
      }
    } catch (error) {
      toast.error(t("update_failed"));
    }
  };

  // Updates the user's password in the backend.
  // Sends a POST request with the new password and handles success or error feedback.
  const handleSavePassword = async () => {
    try {
      const response = await fetch(`${API_URL}/settings/set_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success(t("password_updated"));
      } else {
        toast.error(result.message || t("update_failed"));
      }
    } catch (error) {
      toast.error(t("update_failed"));
    }
  };

  // Handles the language change by updating the state, UI, and backend.
  // Sends the new language setting to the server and updates the translation system.
  const handleLanguageChange = async (e) => {
    const newLanguage = e.target.value;
  
    setSelectedLanguage(newLanguage); 
    i18n.changeLanguage(newLanguage); 
  
    try {
      const response = await fetch(`${API_URL}/settings/set_language`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ language: newLanguage }),
      });
  
      if (response.ok) {
        toast.success(t("language_updated"));
      } else {
        toast.error(t("update_failed"));
      }
    } catch (error) {
      toast.error(t("update_failed"));
    }
  };
  
  // Updates the game data in the database by first fetching the current game setting
  // and then sending it back to the server to ensure the database is up to date.
  const handleUpdateDatebase = async () => {
    try {
      const gameResponse = await fetch(`${API_URL}/settings/get_game`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
  
      if (!gameResponse.ok) {
        const errorData = await gameResponse.json();
        toast.error(t("fetch_game_failed"));
        return;
      }
  
      const gameData = await gameResponse.json();
      const currentGame = gameData.game;
  
      if (!currentGame) {
        toast.error(t("no_game_found"));
        return;
      }
  
      const updateResponse = await fetch(`${API_URL}/settings/set_game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ game: currentGame }),
      });
  
      const updateData = await updateResponse.json();
  
      if (updateResponse.ok) {
        toast.success(t("database_update_success"));
      } else {
        toast.error(t("database_update_failed"));
      }
    } catch (error) {
     
      toast.error(t("error_generic"));
    }
  };


  // Fetches and sets user settings when the settings page is loaded.
  // Retrieves multiple settings in parallel, updates the state, and applies the language preference.
  useEffect(() => {
    document.title = t("settings_headline") + " - " + t("inkwell");

    const fetchSettings = async () => {
        try {
            const [adminRes, languageRes, regRes, friendsRes, userRes] = await Promise.all([
                fetch(`${API_URL}/settings/is_admin`, { credentials: "include" }),
                fetch(`${API_URL}/settings/get_language`, { credentials: "include" }),
                fetch(`${API_URL}/settings/is_new_reg`, { credentials: "include" }),
                fetch(`${API_URL}/settings/get_seeFriends`, { credentials: "include" }),
                fetch(`${API_URL}/settings/get_username`, { credentials: "include" })
            ]);

            if (!adminRes.ok || !languageRes.ok || !regRes.ok || !friendsRes.ok || !userRes.ok) {
                throw new Error("Failed to fetch settings");
            }

            setIsAdmin((await adminRes.json()).is_admin === 1);
            setIsNewRegEnabled((await regRes.json()).is_new_reg);
            setIsSeeFriends((await friendsRes.json()).seeFriendsCollection);
            setUsername((await userRes.json()).username);

            
            const langData = await languageRes.json();
            const newLanguage = langData.language || "en";
            setSelectedLanguage(newLanguage);
            i18n.changeLanguage(newLanguage); 
        } catch (error) {
            toast.error(t("fetch_settings_failed"));
        }
    };

    fetchSettings();
}, []);


  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <h2 className={styles.dashboardTitle}>{t("settings_headline")}</h2>
        <div className={styles.userSettingsWrapper}>
          <h2 >{t("user_settings")}</h2>
            <div className={styles.settingsblock}>
              <h3>{t("change_username")}</h3>
              <input
                type="text"
                value={username}
                placeholder={t("enter_new_username")}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.searchInput}
              />
              <button onClick={handleSaveUsername} className={`${styles.btn} ${styles["btn-primary"]}`}>{t("save_username")}</button>
            </div>

            <div className={styles.settingsblock}>
              <h3>{t("change_password")}</h3>
              <input
                type="password"
                value={password}
                placeholder={t("enter_new_password")}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.searchInput}
              />
              <button onClick={handleSavePassword} className={`${styles.btn} ${styles["btn-primary"]}`}>{t("save_password")}</button>
            </div>
        </div>
        {isAdmin && (
          <>
            <div className={styles.AdminSettingsWrapper}>
              <h2>{t("admin_settings")}</h2>

              <div className={styles.settingsblock}>
                <h3>{t("enable_disable_registrations")}</h3>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={isNewRegEnabled ?? false}
                    onChange={(e) => setIsNewRegEnabled(e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
                <p className={styles.settingDescription}>{t("enable_disable_registrations_desc")}</p>
              </div>

              <div className={styles.settingsblock}>
                <h3>{t("enable_disable_see_friends")}</h3>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={isSeeFriends ?? false}
                    onChange={(e) => setIsSeeFriends(e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
                <p className={styles.settingDescription}>{t("enable_disable_see_friends_desc")}</p>
              </div>

              <div className={styles.settingsblock}>
                <h3>{t("select_language")}</h3>
                <select
                  className={styles.filterSelect}
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e)}
                >
                  {availableLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.settingsblock}>
                <h3>{t("select_game")}</h3>
                <select
                  className={styles.filterSelect}
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                >
                  <option value="Lorcana">{t("game_lorcana")}</option>
                </select>
                <button onClick={handleUpdateDatebase} className={`${styles.btn} ${styles["btn-primary"]}`}>{t("update_card_catalog")}</button>

                <p className={styles.dataSourceInfo}>
                  {t("lorcana_data_thanks")}{" "}
                  <a href={t("lorcana_json_url")} target="_blank" rel="noopener noreferrer">
                    <FaGlobe /> {t("lorcana_json")}
                  </a>{" "}
                  - {t("check_out_his_content")}{" "}
                  <a href={t("lorcana_github_url")} target="_blank" rel="noopener noreferrer">
                    <FaGithub /> {t("github")}
                  </a>!
                </p>

              </div>

            </div>
          </>
        )}
      </div>

      
    </div>
  );
}

export default Settings;
