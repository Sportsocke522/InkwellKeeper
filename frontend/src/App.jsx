//importing functional components, functions and libraries
import "./components/styles/App.module.css";
import LoginPage from "./components/pages/Login";
import SignupPage from "./components/pages/Register";
import SpecialPage from "./components/pages/Dashboard";
import Page from "./components/pages/Page";
import { Toaster } from "sonner";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

//main app function which is also a functional component that will be pased to main.jsx
function App() {
  return (
    <>
      {/* more on this component on sonner website */}
      <Toaster duration={2000} position="top-center" richColors closeButton />
      {/* router here */}
      <Router>
        <Routes>
          <Route path="/" element={<SpecialPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/Login" element={<LoginPage />} />
          <Route path="*" element={<Page />} />
        </Routes>
      </Router>
    </>
  );
}

//exporting this
export default App;