// Importing functional components, functions, and libraries
import "./components/styles/App.module.css";
import LoginPage from "./components/pages/Login";
import SignupPage from "./components/pages/Register";
import SpecialPage from "./components/pages/Dashboard";
import Setupwizard from "./components/pages/Setupwizard";
import Page from "./components/pages/Page";
import { Toaster } from "sonner";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import i18n from "./i18n";
import { useEffect } from "react"; // For loading language
//import LanguageSelector from "./components/LanguageSelector"; // Optional: Dropdown for manual selection

// Main app function
function App() {
  // Fetch and set the language from the server when the app starts
  useEffect(() => {
    const fetchLanguage = async () => {
      try {
        const response = await fetch("http://localhost:3000/settings/get_language", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          i18n.changeLanguage(data.language); // Set the language in i18n
        } else {
          console.error("Failed to fetch language");
        }
      } catch (error) {
        console.error("Error fetching language:", error);
      }
    };

    fetchLanguage();
  }, []); // Run only on the first render

  return (
    <>
      {/* Toast notifications */}
      <Toaster duration={2000} position="top-center" richColors closeButton />

      {/* Optional: Language selector for testing or manual language changes */}
      

      {/* Router setup */}
      <Router>
        <Routes>
          <Route path="/" element={<SpecialPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/Login" element={<LoginPage />} />
          <Route path="/Setupwizard" element={<Setupwizard />} />
          <Route path="*" element={<Page />} />
        </Routes>
      </Router>
    </>
  );
}

// Exporting this component
export default App;
