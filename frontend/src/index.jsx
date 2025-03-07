//importing functions, component functions
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom'; // Router importieren



//DOM manipulation
ReactDOM.createRoot(document.getElementById('root')).render(
  
  //<React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  //</React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then((registration) => {
        console.log("Service Worker registriert mit Scope:", registration.scope);
      })
      .catch((error) => {
        console.log("Service Worker Registrierung fehlgeschlagen:", error);
      });
  });
}