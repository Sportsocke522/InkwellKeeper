import { useEffect, useState } from "react";
//import styles from "../styles/Settings.module.css";
import { toast } from "sonner";
import { availableLanguages } from "../../i18n";
import i18n from "../../i18n"; // Import von i18n
import { useTranslation } from "react-i18next";

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

  const handleSaveUsername = async () => {
    try {
      const response = await fetch("http://localhost:3000/settings/set_username", {
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
      console.error("Error updating username:", error);
    }
  };

  const handleSavePassword = async () => {
    try {
      const response = await fetch("http://localhost:3000/settings/set_password", {
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
      console.error("Error updating password:", error);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [adminRes, languageRes, regRes, friendsRes, userRes] = await Promise.all([
          fetch("http://localhost:3000/settings/is_admin", { credentials: "include" }),
          fetch("http://localhost:3000/settings/get_language", { credentials: "include" }),
          fetch("http://localhost:3000/settings/is_new_reg", { credentials: "include" }),
          fetch("http://localhost:3000/settings/get_seeFriends", { credentials: "include" }),
          fetch("http://localhost:3000/settings/get_username", { credentials: "include" })
        ]);

        if (!adminRes.ok || !languageRes.ok || !regRes.ok || !friendsRes.ok || !userRes.ok) throw new Error("Failed to fetch settings");

        setIsAdmin((await adminRes.json()).is_admin === 1);
        setSelectedLanguage((await languageRes.json()).language || "en");
        setIsNewRegEnabled((await regRes.json()).is_new_reg);
        setIsSeeFriends((await friendsRes.json()).seeFriendsCollection);
        setUsername((await userRes.json()).username);
        i18n.changeLanguage(selectedLanguage);
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error(t("fetch_settings_failed"));
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className={styles.container}>
      <h2>{t("user_settings")}</h2>
      <div className={styles.userSettings}>
        <h3>{t("change_username")}</h3>
        <input
          type="text"
          value={username}
          placeholder={t("enter_new_username")}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button onClick={handleSaveUsername}>{t("save_username")}</button>
        <h3>{t("change_password")}</h3>
        <input
          type="password"
          value={password}
          placeholder={t("enter_new_password")}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleSavePassword}>{t("save_password")}</button>
      </div>

      <h3>{t("admin_settings")}</h3>
      {isAdmin && (
        <>
          <p>{t("enable_disable_registrations")}</p>
          <label className={styles.switch}>
            <input type="checkbox" checked={isNewRegEnabled} onChange={(e) => {
              setIsNewRegEnabled(e.target.checked);
            }} />
            <span className={styles.slider}></span>
          </label>
          <p>{t("enable_disable_see_friends")}</p>
          <label className={styles.switch}>
            <input type="checkbox" checked={isSeeFriends} onChange={(e) => {
              setIsSeeFriends(e.target.checked);
            }} />
            <span className={styles.slider}></span>
          </label>
          <p>{t("select_language")}</p>
          <select value={selectedLanguage} onChange={(e) => {
            setSelectedLanguage(e.target.value);
          }}>
            {availableLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
          <p>{t("select_game")}</p>
          <select value={selectedGame} onChange={(e) => {
            setSelectedGame(e.target.value);
          }}>
            <option value="Lorcana">Lorcana</option>
          </select>
          <button>{t("update_card_catalog")}</button>
        </>
      )}
    </div>
  );
}

export default Settings;
