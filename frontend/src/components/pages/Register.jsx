//importing necessary libraries for signup function
import { useState, useEffect } from "react"; //use state for state variables
import axios from "axios"; //axios for communication with backend
import { toast } from "sonner"; //sonner for toast notification
//import styles from "../styles/Signup.module.css"; //module css import
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

//creation of the sign-up component function
function SignupPage() {
  //state variables declaration using useState
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const { t } = useTranslation();

  useEffect(() => {
    document.title = t("signup_page_title"); // Dynamically sets the page title
  });

  //axios post function which will first check for valid input, send a post request, and then use sonner to render a toast notification
  const handleSignup = async (e) => {
    e.preventDefault(); //disables the reload on submission
    try {
      //check if user has filled all required fields
      if (
        !username ||
        username === "" ||
        !email ||
        email === "" ||
        !password ||
        password === ""
      ) {
        //incase all fields are not filled warn the user
        toast.warning(t("fields_required"));
        return; //return if the case matches
      }

      //if user has filled all necessary fields send axios post request
      const res = await axios.post("http://localhost:3000/auth/auth/signup", {
        username: username,
        email: email,
        password: password,
      });

      //on successful account creation
      if (res.status === 201) {
        setUsername(""); //empty the field after successful signup
        setEmail(""); //empty the field after successful signup
        setPassword(""); //empty the field after successful signup
        //notify the client that the user has been created
        toast.success(t("signup_successful_redirecting"));
      }

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      //in case of error
      console.error("Error Creating User: ", error);
      toast.error(t("error_creating_user"));
    }
  };

  //bootstrap components
  return (
    <>
      <div className={"card"} id={styles.card}>
        <div className={"card-body"}>
          <h2 id={styles.h2}>{t("signup")}</h2>
          <hr />
          <form onSubmit={handleSignup}>
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

            {/* for Email */}
            <div>
              <label>{t("email_label")}</label>
              <input
                type="email"
                name="email"
                placeholder={t("email_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            {/* login */}
            <a>
              <Link to="/login">{t("login_prompt")}</Link>
            </a>

            {/* signup */}
            <button className={"btn btn-success"} type="submit">
              {t("signup")}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

//exporting the created signup function to be used as a route in the app.jsx file
export default SignupPage;
