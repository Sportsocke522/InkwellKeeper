import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "../styles/App.module.css";

import { MdFlashlightOff, MdFlashlightOn } from "react-icons/md";

const ScannerPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const scanProvider = import.meta.env.VITE_SCANN_PROVIDER;
  const OPENAI_API_KEY = import.meta.env.VITE_AI_API;

  // Popup and camera states
  const [showPopup, setShowPopup] = useState(true);
  const [torchActive, setTorchActive] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [scannedCards, setScannedCards] = useState([]);
  const [wizardStep, setWizardStep] = useState(1);
  
  // State for scan animation (CSS class)
  const [scanAnimation, setScanAnimation] = useState(false);

  // Refs for video, canvas and stream
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Interval refs
  const scanIntervalRef = useRef(null);
  const processingTimeoutRef = useRef(null);
  const lastImageAvgRef = useRef(null);

  // Red frame settings as relative values
  const [cardBox, setCardBox] = useState({
    x: 0.10, 
    y: 0.20, 
    width: 0.80, 
    height: 0.55,
  });

  // Sensitivity threshold
  const SENSITIVITY_THRESHOLD = 50;

  // On mount: set title, check provider
  useEffect(() => {
    document.title = t("scanner_title") + " - " + t("inkwell");
    if (scanProvider === "none") {
      navigate("/");
    }
  }, [scanProvider, navigate, t]);

  // Start camera once popup is shown
  useEffect(() => {
    if (showPopup) {
      startCamera();
    }
  }, [showPopup]);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      const track = stream.getVideoTracks()[0];
      if (track.getCapabilities()?.torch) {
        setTorchAvailable(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  // If popup is closed, ensure the scanning video is still assigned the stream
  useEffect(() => {
    if (!showPopup && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [showPopup]);

  // Toggle torch
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

  // Called when user clicks "Start" on the popup
  const startScanning = () => {
    setShowPopup(false);
    setTimeout(() => {
      console.log("Begin image analysis...");
      startImageDetection();
    }, 1000);
  };

  // Compute average intensity
  const computeAverageIntensity = (imageData) => {
    const { data } = imageData;
    let total = 0;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i+1] + data[i+2]) / 3;
      total += avg;
    }
    return total / (data.length / 4);
  };

  // Trigger scanning animation
  const triggerScanAnimation = () => {
    setScanAnimation(true);
    setTimeout(() => {
      setScanAnimation(false);
    }, 2000);
  };

  // Extract card name from API text
  const processExtractedName = (text) => {
    if (!text) return null;
    const matches = text.match(/"([^"]+)"/g);
    if (matches && matches.length >= 2) {
      const cardName = matches[0].replace(/"/g, '');
      const cardSub = matches[1].replace(/"/g, '');
      return `${cardName} - ${cardSub}`;
    }
    return null;
  };

  // Main scan loop
  const startImageDetection = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    scanIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) {
        console.error("Video or Canvas not available! Stopping scan loop.");
        clearInterval(scanIntervalRef.current);
        return;
      }
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn("Video dimensions not ready, skipping iteration.");
        return;
      }
      
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
      // Red frame area
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
      
      const currentAvg = computeAverageIntensity(redImageData);
      const lastAvg = lastImageAvgRef.current;
  
      if (lastAvg === null || Math.abs(currentAvg - lastAvg) > SENSITIVITY_THRESHOLD) {
        lastImageAvgRef.current = currentAvg;
        if (!processingTimeoutRef.current) {
          processingTimeoutRef.current = setTimeout(() => {

            // Blue area
            const blueX = (cardBox.x + cardBox.width * 0.015) * canvas.width;
            const blueY = (cardBox.y + cardBox.height * 0.51) * canvas.height;
            const blueWidth = cardBox.width * 0.70 * canvas.width;
            const blueHeight = cardBox.height * 0.15 * canvas.height;
  
            const extendedBlueX = Math.max(blueX - 5, 0);
            const extendedBlueY = Math.max(blueY - 5, 0);
            const extendedBlueWidth = Math.min(blueWidth + 10, canvas.width - extendedBlueX);
            const extendedBlueHeight = Math.min(blueHeight + 10, canvas.height - extendedBlueY);
  
            let blueImageData;
            try {
              blueImageData = context.getImageData(extendedBlueX, extendedBlueY, extendedBlueWidth, extendedBlueHeight);
            } catch (e) {
              console.error("Error reading extended blue area:", e);
              processingTimeoutRef.current = null;
              return;
            }
            const blueCanvas = document.createElement("canvas");
            blueCanvas.width = extendedBlueWidth;
            blueCanvas.height = extendedBlueHeight;
            const blueCtx = blueCanvas.getContext("2d");
            blueCtx.putImageData(blueImageData, 0, 0);
            const imageDataUrl = blueCanvas.toDataURL("image/png");
  
            triggerScanAnimation();
            sendToOpenAIVision(imageDataUrl);
            processingTimeoutRef.current = null;
          }, 500);
        }
      } else {
        console.log("No significant change in red area detected.");
      }
    }, 1000);
  };
  
  // Send the blue area to OpenAI
  const sendToOpenAIVision = async (imageDataUrl) => {
    console.log("Sending image to OpenAI Vision API");
    if (scanProvider !== "openai") {
      console.warn("Provider not supported:", scanProvider);
      return;
    }
    const base64Image = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const fullImageUrl = `data:image/jpeg;base64,${base64Image}`;
    const model = "gpt-4o-mini";
    const payload = {
      model: model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Was ist der Name und der Namenszusatz dieser Lorcana-Karte?" },
            { type: "image_url", image_url: { url: fullImageUrl } }
          ]
        }
      ],
      max_tokens: 50,
    };
    
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status}`);
      }
      const data = await response.json();
      console.log("API Response:", data);
      const rawExtractedName = data.choices?.[0]?.message?.content;
      const simplifiedName = processExtractedName(rawExtractedName);
      console.log("Extracted Name (simplified):", simplifiedName);
      if (simplifiedName) {
        setScannedCards(prev => {
          if (!prev.includes(simplifiedName)) {
            return [...prev, simplifiedName];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Error sending to OpenAI Vision API:", error);
    }
  };
  
  // Finish scanning and navigate to result page
  const finishScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    navigate("/scannresult", { state: { scannedCards } });
  };

  useEffect(() => {
    if (wizardStep === 2 && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [wizardStep]);
  
  
  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        {showPopup ? (
          <div className={styles.popupOverlay}>
            <div className={styles.popup}>
            
              {(() => {
                switch (wizardStep) {
                  case 1:
                    return (
                      <>
                        <h2>{t("scanner_instructions_title")}</h2>
                        <p>{t("scanner_instructions_text")}</p>
                        
                        <button
                          className={`${styles.btn} ${styles["btn-primary"]}`}
                          onClick={() => setWizardStep(2)}
                        >
                          {t("scanner_next")}
                        </button>
                      </>
                    );
                    case 2:
                      return (
                        <>
                          <h2>{t("scanner_settings_title")}</h2>
                          <p>{t("scanner_settings_text")}</p>
                          <div className={styles.cameraPreview} style={{ position: "relative" }}>
                            <video ref={videoRef} autoPlay playsInline style={{ width: "100%" }}></video>
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
                          <div className={styles.adjustmentControls}>
                            {["x", "y", "width", "height"].map((key) => {
                              const labelTranslationKey = `scanner_label_${key}`; 
                              return (
                                <div key={key} className={styles.boxControllWrapper}>
                                  <label>{t(labelTranslationKey)}</label>
                                  <div className={styles.boxControllInner}>
                                    <button
                                      className={styles.quantityButton}
                                      onClick={() =>
                                        setCardBox((prev) => ({ ...prev, [key]: Math.max(prev[key] - 0.01, 0) }))
                                      }
                                    >
                                      -
                                    </button>
                                    {cardBox[key].toFixed(2)}
                                    <button
                                      className={styles.quantityButton}
                                      onClick={() =>
                                        setCardBox((prev) => ({ ...prev, [key]: prev[key] + 0.01 }))
                                      }
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <button onClick={startScanning} className={`${styles.btn} ${styles["btn-primary"]}`}>
                          {t("scanner_start")}
                        </button>
                        </>
                      );
                  }
                })()}
            </div>
          </div>

          
        ) : (
          <>
            <div
              className={`${styles.cameraContainer} ${
                scanAnimation ? styles.scanned : ""
              }`}
              style={{ position: "relative" }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  onLoadedMetadata={() => {
                    console.log(
                      "Video metadata loaded:",
                      videoRef.current.videoWidth,
                      videoRef.current.videoHeight
                    );
                  }}
                  style={{ width: "100%" }}
                ></video>
                <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
                {torchAvailable && (
                  <button className={`${styles.btn} ${styles.flashButton} ${styles["btn-primary"]}`}  onClick={toggleTorch}>
                    {torchActive ? <MdFlashlightOff /> : <MdFlashlightOn />}
                  </button>
                )}
                <button onClick={finishScanning} className={`${styles.btn} ${styles["btn-primary"]}`}>
                  {t("scanner_finish")}
                </button>
                {scanAnimation && (
                  <div
                    className={styles.ocrloader}
                    style={{
                      position: "absolute",
                      top: `${cardBox.y * 100}%`,
                      left: `${cardBox.x * 100}%`,
                      width: `${cardBox.width * 100}%`,
                      height: `${cardBox.height * 100}%`,
                    }}
                  >
                    <p>Scanning</p>
                    <em></em>
                    <span></span>
                  </div>
                )}
                
            </div>
          

            <div className={styles.scannedCards}>
              <h2>{t("scanned_cards")}</h2>
              <ul>
                {scannedCards.map((card, index) => (
                  <li key={index}>{card}</li>
                ))}
              </ul>
            </div>
          </>
          
        )}

        
      </div>
    </div>
  );
};

export default ScannerPage;
