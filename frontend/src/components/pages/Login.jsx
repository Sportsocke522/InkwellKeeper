//importing necessary libraries for login function
import { useEffect, useState } from "react"; //use state for state variables
import axios from "axios"; //axios for communication with backend
import { toast } from "sonner"; //sonner for toast notification
//import styles from "../styles/Login.module.css"; //module css import
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

//creation of the login component function
function LoginPage() {
  //declaring state varibles using use state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const { t } = useTranslation();

  useEffect(() => {
    document.title = t("login_page_title"); // Dynamically sets the page title
  });

  //login function with axios
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevents form reload

    try {
      // Check if all fields are filled
      if (!username || username === "" || !password || password === "") {
        toast.warning(t("fields_required"));
        return; // Exit function if a field is missing
      }

      // Send login request to backend endpoint with credentials
      const res = await axios.post(
        "http://localhost:3000/auth/auth/login",
        {
          username: username,
          password: password,
        },
        {
          withCredentials: true, // Sends cookies with requests
        }
      );

      // On successful login
      if (res.status === 200) {
        console.log("Login successful, token is stored in cookie");
        toast.success(t("login_successful_redirecting"));
        setUsername(""); // Reset username
        setPassword(""); // Reset password

        console.log("Redirecting to dashboard");
        navigate("/"); // Redirect to the homepage
      }
    } catch (error) {
      console.error("Error Logging User: ", error);
      toast.error(t("error_logging_user"));
    }
  };

  //bootstrap components
  return (
    <>
      <div className={"card"} id={styles.card}>
        <div className={"card-body"}>
          <h2 id={styles.h2}>{t("login")}</h2>
          <hr />
          <form onSubmit={handleLogin}>
            {/* for Username */}
            <div>
              <label>{t("username_label")}</label>
              <input
                type="text"
                name="username"
                placeholder={t("username_placeholder")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* for Password */}
            <div>
              <label>{t("password_label")}</label>
              <input
                type="password"
                name="password"
                placeholder={t("password_placeholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* sign up */}
            <a>
              <Link to="/signup">{t("signup_prompt")}</Link>
            </a>

            {/* login */}
            <button
              className={"btn btn-success"}
              id={styles.button}
              type="submit"
            >
              {t("login")}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

//exporting the created login function to be used as a route in the app.jsx file
export default LoginPage;
