
import { useEffect, useState } from "react"; 
import axios from "axios"; 
import { toast } from "sonner";
import styles from "../styles/App.module.css"; 
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import logo from "../styles/images/logo.png";


function LoginPage() {
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const { t } = useTranslation();

  const API_URL = `${import.meta.env.VITE_BACKEND_URL}:${import.meta.env.VITE_BACKEND_PORT}`;

  useEffect(() => {
     // Set the document title dynamically using translations
    document.title = t("login") + " - " + t("inkwell"); 

    
  });

  // Handles user login when the form is submitted
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Check if username or password fields are empty
      if (!username || username === "" || !password || password === "") {
        toast.warning(t("fields_required"));
        return; 
      }

      // Send login request to the backend
      const res = await axios.post(
        `${API_URL}/auth/auth/login`,
        {
          username: username,
          password: password,
        },
        {
          withCredentials: true, 
        }
      );

      
      if (res.status === 200) {
        console.log("Login successful, token is stored in cookie");
        toast.success(t("login_successful_redirecting"));
        setUsername(""); 
        setPassword(""); 

        console.log("Redirecting to dashboard");
        navigate("/"); 
      }
    } catch (error) {
      console.error("Error Logging User: ", error);
      toast.error(t("error_logging_user"));
    }
  };

  
  return (
    <>
      <div className={styles.container_login}>
        <div className={styles.container_login_inner}>
          <div className={styles.userSettingsWrapper}>
            <div className={styles.settingsblock}>
              
              <div className={styles.loginlogoheader}>
                <img src={logo} alt={`${t("inkwell")} ${t("logo")}`} />
                <h1>{t("inkwell")}</h1>
              </div>
              <h2 id={styles.loginnHeandline}>{t("login")}</h2>
              <form onSubmit={handleLogin}>
                {/* for Username */}
                <div className={styles.logininputblock}>
                  <label>{t("username_label")}</label>
                  <input
                    type="text"
                    name="username"
                    placeholder={t("username_placeholder")}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>

                {/* for Password */}
                <div className={styles.logininputblock}>
                  <label>{t("password_label")}</label>
                  <input
                    type="password"
                    name="password"
                    placeholder={t("password_placeholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>

                {/* sign up */}
                <div className={styles.LoginContainerControlls}>
                  <a>
                    <Link to="/signup">{t("signup_prompt")}</Link>
                  </a>
                </div>
                {/* login */}
                <div className={styles.LoginContainerControlls}>
                  <button
                    className={`${styles.btn} ${styles["btn-primary"]}`}
                    id={styles.button}
                    type="submit"
                  >
                    {t("login")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>




      
    </>
  );
}

//exporting the created login function to be used as a route in the app.jsx file
export default LoginPage;
