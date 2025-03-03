
import { useState, useEffect } from "react"; 
import axios from "axios"; 
import { toast } from "sonner"; 
import styles from "../styles/App.module.css"; 
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import logo from "../styles/images/logo.png";


function SignupPage() {
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const { t } = useTranslation();

  const useBackendPort = import.meta.env.VITE_USE_BACKEND_PORT === "true";
  const API_URL = useBackendPort
    ? `${import.meta.env.VITE_BACKEND_URL}:${import.meta.env.VITE_BACKEND_PORT}`
    : import.meta.env.VITE_BACKEND_URL;




  useEffect(() => {
    // Set the document title dynamically using translations
    document.title = t("signup") + " - " + t("inkwell"); 

  });

  // Handles user signup when the form is submitted
  const handleSignup = async (e) => {

    // Prevents the default form submission behavior
    e.preventDefault(); 
    try {
      // Check if username, email, or password fields are empty
      if (
        !username ||
        username === "" ||
        !email ||
        email === "" ||
        !password ||
        password === ""
      ) {
        
        toast.warning(t("fields_required"));
        return; 
      }

       // Send signup request to the backend
      const res = await axios.post(`${API_URL}/auth/auth/signup`, {
        username: username,
        email: email,
        password: password,
      });

      
      if (res.status === 201) {
        setUsername(""); 
        setEmail(""); 
        setPassword(""); 
        
        toast.success(t("signup_successful_redirecting"));
      }

      // Redirect to the login page after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      
      
      toast.error(t("error_creating_user"));
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

              <h2 id={styles.loginnHeandline}>{t("signup")}</h2>
              
              <form onSubmit={handleSignup}>
                {/* Username */}
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

                {/* Email */}
                <div className={styles.logininputblock}>
                  <label>{t("email_label")}</label>
                  <input
                    type="email"
                    name="email"
                    placeholder={t("email_placeholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>

                {/* Password */}
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

                {/* Login Link */}
                <div className={styles.LoginContainerControlls}>
                  <a>
                    <Link to="/login">{t("login_prompt")}</Link>
                  </a>
                </div>

                {/* Submit Button */}
                <div className={styles.LoginContainerControlls}>
                  <button
                    className={`${styles.btn} ${styles["btn-primary"]}`}
                    type="submit"
                  >
                    {t("signup")}
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

//exporting the created signup function to be used as a route in the app.jsx file
export default SignupPage;
