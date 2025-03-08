import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Tesseract from "tesseract.js"; // OCR für Texterkennung
import styles from "../styles/App.module.css";

const ScannerPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const scanProvider = import.meta.env.VITE_SCANN_PROVIDER;
  const [showPopup, setShowPopup] = useState(true);
  const [torchActive, setTorchActive] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [sensitivity, setSensitivity] = useState(15); // Erhöhte Sensitivität für weniger Trigger
  const [scannedCards, setScannedCards] = useState([]);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const previousImageDataRef = useRef(null);
  const lastRequestTimeRef = useRef(0); // Letzte API-Anfrage-Zeitpunkt

  const OPENAI_API_KEY = import.meta.env.VITE_AI_API;

  useEffect(() => {
    document.title = t("scanner_title") + " - " + t("inkwell");

    if (scanProvider === "none") {
      navigate("/");
    }
  }, [scanProvider, navigate, t]);

  useEffect(() => {
    if (!showPopup) {
      startCamera();
    }
  }, [showPopup]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      if (track.getCapabilities()?.torch) {
        setTorchAvailable(true);
      }

      startImageDetection();
    } catch (error) {
      console.error("Fehler beim Zugriff auf die Kamera:", error);
    }
  };

  const toggleTorch = () => {
    if (!streamRef.current) return;

    const track = streamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities();

    if (capabilities.torch) {
      const constraints = { advanced: [{ torch: !torchActive }] };
      track.applyConstraints(constraints);
      setTorchActive(!torchActive);
    }
  };

  const startImageDetection = () => {
    setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      if (!previousImageDataRef.current) {
        previousImageDataRef.current = imageData;
        return;
      }

      const difference = calculateImageDifference(previousImageDataRef.current.data, imageData.data);

      const now = Date.now();
      if (difference > sensitivity && now - lastRequestTimeRef.current > 5000) {
        console.log("⚡ Bild hat sich signifikant verändert! Jetzt OCR-Analyse starten.");
        setScanning(true);
        setTimeout(() => setScanning(false), 300);
        previousImageDataRef.current = imageData;
        lastRequestTimeRef.current = now; // Aktualisiere die letzte Anfrage-Zeit
        extractTextWithOCR(canvas);
      } else {
        console.log("🛑 Anfrage blockiert - Mindestwartezeit noch nicht erreicht oder kein signifikanter Unterschied");
      }
    }, 1000); // Überprüfung nur alle 1000ms für weniger Last
  };

  const calculateImageDifference = (prevData, currData) => {
    let diff = 0;
    for (let i = 0; i < prevData.length; i += 4) {
      diff += Math.abs(prevData[i] - currData[i]); 
      diff += Math.abs(prevData[i + 1] - currData[i + 1]); 
      diff += Math.abs(prevData[i + 2] - currData[i + 2]); 
    }
    return diff / (prevData.length / 4);
  };

  const extractTextWithOCR = async (canvas) => {
    Tesseract.recognize(
      canvas, 
      "eng",
      { logger: (m) => console.log(m) }
    ).then(({ data: { text } }) => {
      const cleanedText = text.replace(/\n/g, " ").trim(); // Zeilenumbrüche entfernen
      console.log("📜 OCR-Ergebnis:", cleanedText);

      if (cleanedText.length > 5) { // Nur sinnvolle Ergebnisse an OpenAI senden
        sendToOpenAI(cleanedText);
      } else {
        console.log("🚫 OCR-Ergebnis zu kurz, wird verworfen.");
      }
    }).catch((error) => {
      console.error("Fehler bei der OCR-Erkennung:", error);
    });
  };

  const sendToOpenAI = async (cardText) => {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo",
          messages: [
            { role: "system", content: "Du bist ein Assistent, der Lorcana-Kartennamen analysiert." },
            { role: "user", content: `Extrahiere den Namen und den Namenszusatz aus diesem Lorcana-Kartentext: ${cardText}` },
          ],
          max_tokens: 50,
        }),
      });

      const data = await response.json();
      console.log("🔍 OpenAI Antwort:", data);

      if (data.choices && data.choices.length > 0) {
        const cardName = data.choices[0].message.content.trim();
        setScannedCards((prev) => [...prev, cardName]);
      }
    } catch (error) {
      console.error("Fehler beim OpenAI-Request:", error);
    }
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>

          <h1>{t("scanner_title")}</h1>

          {showPopup && (
            <div className={styles.popup}>
              <h2>📷 {t("scanner_popup_title")}</h2>
              <p>{t("scanner_popup_text")}</p>
              <button onClick={() => setShowPopup(false)}>{t("scanner_popup_ok")}</button>
            </div>
          )}

          {!showPopup && (
            <div className={`${styles.cameraContainer} ${scanning ? styles.scanningEffect : ""}`}>
              <video ref={videoRef} autoPlay playsInline></video>

              {torchAvailable && (
                <button className={styles.flashButton} onClick={toggleTorch}>
                  {torchActive ? "🔦 Blitz aus" : "💡 Blitz an"}
                </button>
              )}
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

          <div className={styles.scannedCards}>
            <h2>📋 Erkannte Karten:</h2>
            <ul>
              {scannedCards.map((card, index) => (
                <li key={index}>{card}</li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </>
  );
};

export default ScannerPage;
