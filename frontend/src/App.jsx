// Importing functional components, functions, and libraries
import "./components/styles/App.module.css";
import LoginPage from "./components/pages/Login";
import SignupPage from "./components/pages/Register";
import Dashboard from "./components/pages/Dashboard";
import Setupwizard from "./components/pages/Setupwizard";
import Catalog from "./components/pages/Catalog";
import Page from "./components/pages/Page";
import DeckListPage from "./components/pages/DeckListPage";
import DeckDetailPage from "./components/pages/DeckDetailPage";
import MyCollectionPage from "./components/pages/MyCollectionPage";
import FriendsCollection from "./components/pages/FriendsCollection";
import Settings from "./components/pages/Settings";
import Header from "./components/component/Header";
import ProtectedRoute from "./components/component/ProtectedRoute"; 
import { Toaster } from "sonner";
import { Routes, Route, useLocation } from "react-router-dom";
import i18n from "./i18n";
import { useEffect } from "react"; // For loading language
//import { useLocation } from "react-router-dom";
//import LanguageSelector from "./components/LanguageSelector"; // Optional: Dropdown for manual selection

// Main app function
function App() {
  // Fetch and set the language from the server when the app starts

  const hiddenHeaderRoutes = ["/login", "/signup"];

  const location = useLocation();

  const API_URL = `${import.meta.env.VITE_BACKEND_URL}:${import.meta.env.VITE_BACKEND_PORT}`;


  useEffect(() => {
    const fetchLanguage = async () => {
      try {
        const response = await fetch(`${API_URL}/settings/get_language`, {
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
     
        

      {!hiddenHeaderRoutes.includes(location.pathname) && <Header />}

        <Routes>

          

        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Geschützte Routen */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/setupwizard" element={<Setupwizard />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/decks" element={<DeckListPage />} />
          <Route path="/decks/:deckId" element={<DeckDetailPage />} />
          <Route path="/mycollection" element={<MyCollectionPage />} />
          <Route path="/friendscollection" element={<FriendsCollection />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
          
        </Routes>
      
    </>
  );
}

// Exporting this component
export default App;
