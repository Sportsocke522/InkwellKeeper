import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "../styles/App.module.css";

const ScannerPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const scanProvider = import.meta.env.VITE_SCANN_PROVIDER;
  const OPENAI_API_KEY = import.meta.env.VITE_AI_API;

  // Popup- und Kamera-Zustände
  const [showPopup, setShowPopup] = useState(true);
  const [torchActive, setTorchActive] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [scannedCards, setScannedCards] = useState([]);

  // Referenzen für Video, Canvas und den Stream
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Interval-Referenz für den Scan-Loop
  const scanIntervalRef = useRef(null);
  // Für die Detektion signifikanter Bildänderungen im roten Bereich
  const lastImageAvgRef = useRef(null);

  // Einstellungen für den roten Rahmen (ganze Karte) als relative Werte
  const [cardBox, setCardBox] = useState({
    x: 0.10, 
    y: 0.20, 
    width: 0.80, 
    height: 0.55,
  });

  // Beim Mount: Seitentitel setzen und Scanprovider prüfen
  useEffect(() => {
    document.title = t("scanner_title") + " - " + t("inkwell");
    if (scanProvider === "none") {
      navigate("/");
    }
  }, [scanProvider, navigate, t]);

  

  // Starte die Kamera, sobald das Popup angezeigt wird
  useEffect(() => {
    if (showPopup) {
      startCamera();
    }
  }, [showPopup]);

  // Kamera starten und Stream einrichten
  const startCamera = async () => {
    try {
      console.log("🎥 Kamera wird gestartet...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      // Prüfe, ob der Torch (Blitz) unterstützt wird
      const track = stream.getVideoTracks()[0];
      if (track.getCapabilities()?.torch) {
        setTorchAvailable(true);
      }
      console.log("✅ Kamera erfolgreich gestartet!");
    } catch (error) {
      console.error("❌ Fehler beim Zugriff auf die Kamera:", error);
    }
  };

  useEffect(() => {
    if (!showPopup && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [showPopup]);

  // Umschalten der Taschenlampe
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

  // Wird beim Klick auf "Start" aufgerufen: Popup ausblenden und Bildanalyse starten
  const startScanning = () => {
    console.log("📸 Start-Button gedrückt!");
    setShowPopup(false);
    // Kurze Verzögerung, damit die UI aktualisiert wird
    setTimeout(() => {
      console.log("🎥 Starte Bildanalyse...");
      startImageDetection();
    }, 1000);
  };

  // Berechnet den durchschnittlichen Grauwert eines Bildbereichs aus den ImageData
  const computeAverageIntensity = (imageData) => {
    const { data } = imageData;
    let total = 0;
    for (let i = 0; i < data.length; i += 4) {
      // Einfacher Durchschnitt aus R, G und B
      const avg = (data[i] + data[i+1] + data[i+2]) / 3;
      total += avg;
    }
    return total / (data.length / 4);
  };

  // Startet den Loop, der in regelmäßigen Abständen das Kamerabild analysiert
  const startImageDetection = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    scanIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) {
        console.error("🚨 Video oder Canvas nicht verfügbar!");
        return;
      }
      const video = videoRef.current;
      // Prüfen, ob die Video-Metadaten (Dimensionen) bereits geladen sind
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn("Video-Dimensionen noch nicht verfügbar, überspringe diese Iteration.");
        return;
      }
      
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      // Canvas auf die Videogröße anpassen
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Videoframe zeichnen
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
      // Berechne den roten Bereich (gesamte Karte)
      const redX = cardBox.x * canvas.width;
      const redY = cardBox.y * canvas.height;
      const redWidth = cardBox.width * canvas.width;
      const redHeight = cardBox.height * canvas.height;
  
      let redImageData;
      try {
        redImageData = context.getImageData(redX, redY, redWidth, redHeight);
      } catch (e) {
        console.error("Fehler beim Auslesen des roten Bereichs:", e);
        return;
      }
      
      // Weiter mit Bildverarbeitung...
      const currentAvg = computeAverageIntensity(redImageData);
      const lastAvg = lastImageAvgRef.current;
      const threshold = 10; 
  
      if (lastAvg === null || Math.abs(currentAvg - lastAvg) > threshold) {
        lastImageAvgRef.current = currentAvg;
        // Blauer Bereich: Namenszone
        const blueX = (cardBox.x + cardBox.width * 0.015) * canvas.width;
        const blueY = (cardBox.y + cardBox.height * 0.51) * canvas.height;
        const blueWidth = cardBox.width * 0.70 * canvas.width;
        const blueHeight = cardBox.height * 0.15 * canvas.height;
  
        let blueImageData;
        try {
          blueImageData = context.getImageData(blueX, blueY, blueWidth, blueHeight);
        } catch (e) {
          console.error("Fehler beim Auslesen des blauen Bereichs:", e);
          return;
        }
        // Blauen Bereich als Bild exportieren
        const blueCanvas = document.createElement("canvas");
        blueCanvas.width = blueWidth;
        blueCanvas.height = blueHeight;
        const blueCtx = blueCanvas.getContext("2d");
        blueCtx.putImageData(blueImageData, 0, 0);
        const imageDataUrl = blueCanvas.toDataURL("image/png");
  
        sendToOpenAIVision(imageDataUrl);
      } else {
        console.log("Keine signifikante Änderung im roten Bereich festgestellt.");
      }
    }, 1000);
  };
  

  // Sendet den Bildausschnitt des blauen Bereichs an die OpenAI Vision API
  const sendToOpenAIVision = async (imageDataUrl) => {
    console.log("Sende Bild an OpenAI Vision API...");
    if (scanProvider !== "openai") {
      console.warn("Der aktuelle Provider wird nicht unterstützt:", scanProvider);
      return;
    }
    // Entferne den Data-URL-Prefix, falls erforderlich, um nur den Base64-String zu erhalten.
    const base64Image = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
    
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-2024-04-09",
          messages: [
            {
              role: "user",
              content: `Was ist der Name und der Namenszusatz dieser Lorcana-Karte? Bild: data:image/jpeg;base64,${base64Image}`
            }
          ],
          max_tokens: 50,
        }),
        
      });
      
      if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status}`);
      }
      const data = await response.json();
      // Hier musst du anpassen, wie die Antwort von OpenAI strukturiert ist.
      const extractedName = data.name + (data.additional ? " " + data.additional : "");
      console.log("Extrahierter Name:", extractedName);
      setScannedCards(prev => {
        if (!prev.includes(extractedName)) {
          return [...prev, extractedName];
        }
        return prev;
      });
    } catch (error) {
      console.error("Fehler beim Senden an die OpenAI Vision API:", error);
    }
  };
  

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        {showPopup ? (
          <div className={styles.popup}>
            <h2>📷 {t("scanner_popup_title")}</h2>
            <p>Richte die Karte so aus, dass sie in den Rahmen passt.</p>
            <div className={styles.cameraPreview} style={{ position: "relative" }}>
              <video ref={videoRef} autoPlay playsInline style={{ width: "100%" }}></video>
              {/* Roter Rahmen: Gesamte Karte */}
              <div
                className={styles.overlayBox}
                style={{
                  position: "absolute",
                  top: `${cardBox.y * 100}%`,
                  left: `${cardBox.x * 100}%`,
                  width: `${cardBox.width * 100}%`,
                  height: `${cardBox.height * 100}%`,
                  border: "2px solid red",
                }}
              ></div>
              {/* Blauer Rahmen: Namensbereich */}
              <div
                className={styles.overlayBox}
                style={{
                  position: "absolute",
                  top: `${(cardBox.y + cardBox.height * 0.51) * 100}%`,
                  left: `${(cardBox.x + cardBox.width * 0.015) * 100}%`,
                  width: `${cardBox.width * 0.70 * 100}%`,
                  height: `${cardBox.height * 0.15 * 100}%`,
                  border: "2px solid blue",
                }}
              ></div>
            </div>
            {/* Steuerung zur Anpassung des roten Rahmens */}
            <div className={styles.adjustmentControls}>
              {["x", "y", "width", "height"].map((key) => (
                <div key={key}>
                  <label>{key.toUpperCase()}:</label>
                  <button onClick={() => setCardBox(prev => ({ ...prev, [key]: Math.max(prev[key] - 0.01, 0) }))}>-</button>
                  {cardBox[key].toFixed(2)}
                  <button onClick={() => setCardBox(prev => ({ ...prev, [key]: prev[key] + 0.01 }))}>+</button>
                </div>
              ))}
            </div>
            <button onClick={startScanning}>Start</button>
          </div>
        ) : (
          <div className={styles.cameraContainer} style={{ position: "relative" }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              onLoadedMetadata={() => {
                console.log("Video-Metadaten geladen:", videoRef.current.videoWidth, videoRef.current.videoHeight);
              }}
              style={{ width: "100%" }}
            ></video>
            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
            {torchAvailable && (
              <button className={styles.flashButton} onClick={toggleTorch}>
                {torchActive ? "🔦 Blitz aus" : "💡 Blitz an"}
              </button>
            )}
          </div>
        )}

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
  );
};

export default ScannerPage;
