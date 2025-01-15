//importing functions and libraries to create this home page which will push to login to get the token
import { useEffect, useRef } from "react"; //react functions
import styles from "../styles/Special.module.css"; //module css import
import { useNavigate } from "react-router-dom";
import { toast } from "sonner"; //import toast notification

//creating the functional component
function SpecialPage() {
  const navigate = useNavigate();
  const toastWarningMessage = useRef(false); //for toast notification rendering once

  useEffect(() => {
    document.title = "Login System - Special Page"; // Dynamically set the page title

    // Check if a token exists in localStorage
    const checkIfToken = localStorage.getItem("token");

    // If the token doesn't exist, show a toast notification and redirect
    if (!checkIfToken) {
      toast.warning("No 'Token' Found | Redirecting to Login");
      navigate("/login"); // Redirect to the login page
    }
  }, [navigate]); // Dependency array includes `navigate` to prevent re-renders

  //jsx code here
  return (
    <>
      <div className={styles.container}>
        <div id={styles.div}>
          <h1 id={styles.h1}>Special Page</h1>
          <hr />
          <p id={styles.p}>
            This is the special page which can only be accessed by a token.
          </p>
        </div>
      </div>
    </>
  );
}
//exporting the function component
export default SpecialPage;