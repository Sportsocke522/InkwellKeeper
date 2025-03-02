import { useEffect, useState } from "react";
import styles from "../styles/App.module.css";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { availableLanguages } from "../../i18n";
import i18n from "../../i18n"; 
import { useTranslation } from "react-i18next";

import { FaGlobe, FaGithub } from "react-icons/fa";

function SetupWizard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isReady, setIsReady] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isNewRegEnabled, setIsNewRegEnabled] = useState(null); 
  const [selectedLanguage, setSelectedLanguage] = useState("en"); 
  const [selectedGame, setSelectedGame] = useState("Lorcana");
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeFriends, setIsSeeFriends] = useState(null);

  

  // Fetches initial system status when the setup wizard is loaded.
  // Checks if the user is an admin and whether the system is already set up.
  // If the system is ready or the user lacks admin rights, redirects to the home page.
  useEffect(() => {
    document.title = t("setup_wizard_title") + " - " + t("inkwell");

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

        
        const language = languageData.language || "en";
        setSelectedLanguage(language);
        i18n.changeLanguage(language);

        
        if (readyData.is_ready || adminData.is_admin !== 1) {
          toast.error(t("setup_unauthorized"));
          navigate("/");
        }
      } catch (error) {
        
        toast.error(t("setup_verification_failed"));
        navigate("/");
      }
    };

    fetchInitialStatus();
  }, [navigate]);


  // Fetches the status of the new user registration setting from the backend.
  // Updates the state based on the API response and handles errors.
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
      setIsNewRegEnabled(data.is_new_reg); 

    } catch (error) {
      
      toast.error(t("fetch_new_reg_failed"));
    }
  };

  
  // Fetches the status of the "See Friends' Collection" setting from the backend.
  // Updates the state based on the API response and handles errors.
  const fetchSeeFriendsStatus = async () => {
    try {
      const response = await fetch("http://localhost:3000/settings/get_seeFriends", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch new see Friends status");
      }
  
      const data = await response.json();
      setIsSeeFriends(data.seeFriendsCollection); 
  
    } catch (error) {
      
      toast.error(t("fetch_new_reg_failed"));
    }
  };



  // Saves general server settings, including language and game selection.
  // Updates the language in the UI and sends the settings to the backend.
  const savegeneralServerSettings = async () => {
    try {
      setIsLoading(true);

      await i18n.changeLanguage(selectedLanguage); 
  
      const languageResponse = await fetch("http://localhost:3000/settings/set_language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ language: selectedLanguage }),
      });

      
      const gameResponse = await fetch("http://localhost:3000/settings/set_game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ game: selectedGame }),
      });
  
      if (!languageResponse.ok || !gameResponse.ok) {
        throw new Error("Failed to save settings");
      }
  
      toast.success(t("language_saved_successfully"));
      setCurrentPage(2); 
    } catch (error) {
      toast.error(t("language_save_failed"));
    } finally {
      setIsLoading(false); 
    }
  };



  // Fetches specific settings when the user is on page 1 of the setup process.
  // Retrieves the status of new user registration and the visibility of friends' collections.
  useEffect(() => {
    if (currentPage === 1) {
      fetchNewRegStatus();
      fetchSeeFriendsStatus();
    }
  }, [currentPage]);


  // Finalizes the setup process by marking the setup wizard as completed.
  // Sends a request to update the system status and navigates to the home page.
  const finalizeSetup = async () => {
    try {
      const response = await fetch("http://localhost:3000/settings/set_setup_wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_ready: true }), 
      });
  
      if (!response.ok) throw new Error("Failed to finalize setup");
  
      toast.success(t("setup_completed_successfully"));
      navigate("/"); 
    } catch (error) {
      
      toast.error(t("setup_completion_failed"));
    }
  };
  

  const toggleNewRegStatus = () => {
    setIsNewRegEnabled((prev) => !prev); // Toggle the current status
  };

  const renderPageContent = () => {
    return(
    <div className={styles.wizardOverlay}>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>{t("loading_wait")}</p>
            </div>
          ) : (
            (() => {
              switch (currentPage) {
                case 0:
                  return (
                    <div>
                      <h2>{t("welcome_to_setup")}</h2>
                      <p>{t("configure_server")}</p>
                      <button className={`${styles.btn} ${styles["btn-primary"]}`} onClick={() => setCurrentPage(1)}>
                        {t("next")}
                      </button>
                    </div>
                  );

                case 1:
                  return (
                    <div>
                      <h2>{t("general_server_settings")}</h2>
                      <p>{t("select_language")}</p>
                      <select
                        className={styles.dropdown}
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
                        className={styles.dropdown}
                        value={selectedGame}
                        onChange={(e) => setSelectedGame(e.target.value)}
                      >
                        <option value="Lorcana">Lorcana</option>
                      </select>

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

                      <button className={`${styles.btn} ${styles["btn-danger"]}`} onClick={() => setCurrentPage(0)}>
                        {t("back")}
                      </button>
                      <button className={`${styles.btn} ${styles["btn-primary"]}`} onClick={savegeneralServerSettings}>
                        {t("next")}
                      </button>
                    </div>
                  );

                case 2:
                  return (
                    <div>
                      <h2>{t("user_control")}</h2>

                      <div className={styles.settingsblock}>
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
                                if (!response.ok) throw new Error("Failed to update registration setting");

                                toast.success(
                                  `${t("registrations_enabled")} ${newValue ? t("enabled") : t("disabled")}.`
                                );
                              } catch (error) {
                                //console.error("Error updating registration status:", error);
                                toast.error(t("update_registration_failed"));
                                setIsNewRegEnabled(!newValue);
                              }
                            }}
                          />
                          <span className={styles.slider}></span>
                        </label>
                        <p className={styles.settingDescription}>{t("enable_disable_registrations_desc")}</p>
                      </div>

                      <div className={styles.settingsblock}>
                      <p>{t("enable_disable_see_friends")}</p>
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            checked={isSeeFriends ?? false}
                            onChange={async (e) => {
                              const newValue = e.target.checked;
                              setIsSeeFriends(newValue);
                              try {
                                const response = await fetch(
                                  "http://localhost:3000/settings/set_seeFriends",
                                  {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    credentials: "include",
                                    body: JSON.stringify({ seeFriendsCollection: newValue }),
                                  }
                                );
                                if (!response.ok) throw new Error("Failed to update see Friends setting");

                                toast.success(
                                  `${t("see_friends_enabled")} ${newValue ? t("enabled") : t("disabled")}.`
                                );
                              } catch (error) {
                                //console.error("Error updating see friends status:", error);
                                toast.error(t("update_see_friends_failed"));
                                setIsSeeFriends(!newValue);
                              }
                            }}
                          />
                          <span className={styles.slider}></span>
                        </label>
                        <p className={styles.settingDescription}>{t("enable_disable_see_friends_desc")}</p>
                      </div>

                      <br></br>
                      <button className={`${styles.btn} ${styles["btn-danger"]}`} onClick={() => setCurrentPage(1)}>
                        {t("back")}
                      </button>
                      <button className={`${styles.btn} ${styles["btn-primary"]}`} onClick={() => setCurrentPage(3)}>
                        {t("next")}
                      </button>
                    </div>
                  );

                case 3:
                  return (
                    <div>
                      <h2>{t("setup_complete")}</h2>
                      <p>{t("everything_ready")}</p>
                      <button className={`${styles.btn} ${styles["btn-danger"]}`} onClick={() => setCurrentPage(2)}>
                        {t("back")}
                      </button>
                      <button className={`${styles.btn} ${styles["btn-primary"]}`} onClick={finalizeSetup}>
                        {t("finish")}
                      </button>
                    </div>
                  );

                default:
                  return null;
              }
            })()
          )}
        </div>
      </div>
    </div>
    )
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
