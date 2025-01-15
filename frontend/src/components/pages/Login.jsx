//importing necessary libraries for login function
import { useEffect, useState } from "react"; //use state for state variables
import axios from "axios"; //axios for communication with backend
import { toast } from "sonner"; //sonner for toast notification
import styles from "../styles/Login.module.css"; //module css import
import { Link, useNavigate } from "react-router-dom";

//creation of the login component function
function LoginPage() {
  //declaring state varibles using use state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Login System - LogIn Page"; //dinamically changes the tittle
  });

  //login function with axios
  const handleLogin = async (e) => {
    e.preventDefault(); // disables the reload on submission
  
    try {
      // Check if user has filled all required fields
      if (!username || username === "" || !password || password === "") {
        // Warn the user if all fields are not filled
        toast.warning("All Fields are Required");
        return; // return if the case matches
      }
  
      // If user has filled all necessary fields, send axios post request
      const res = await axios.post("http://localhost:3000/auth/auth/login", {
        username: username,
        password: password
      });
  
      // On successful login
      if (res.status === 200) {
        setUsername(""); // Empty the field after successful login
        setPassword(""); // Empty the field after successful login
        toast.success("Login Successful, Redirecting...");
  
        // Token will be sent from the server as a response called 'token'
        const token = res.data.token;
        localStorage.setItem("token", token); // Save the token in local storage
  
        // Immediately redirect the user to the root route
        navigate("/");
      }
    } catch (error) {
      // In case of error
      console.error("Error Logging User: ", error);
      toast.error("Error Logging User");
    }
  };
  

  //bootstrap components
  return (
    <>
      <div className={"card"} id={styles.card}>
        <div className={"card-body"}>
          <h2 id={styles.h2}>LogIn</h2>
          <hr />
          <form onSubmit={handleLogin}>
            {/* for Username */}
            <div>
              <label>Username : </label>
              <input
                type="text"
                name="username"
                placeholder={"Enter Username"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* for Password */}
            <div>
              <label>Password : </label>
              <input
                type="password"
                name="password"
                placeholder={"Enter Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* submit and switch to signup buttons */}

            {/* sign up */}
            <a>
              <Link to="/signup">Don&apos;t have an account? SignUp</Link>
            </a>

            {/* login */}
            <button
              className={"btn btn-success"}
              id={styles.button}
              type="submit"
            >
              LogIn
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

//exporting the created login function to be used as a route in the app.jsx file
export default LoginPage;