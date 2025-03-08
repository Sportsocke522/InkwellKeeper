import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import Tesseract from "tesseract.js";
import styles from "../styles/App.module.css";
import { useTranslation } from "react-i18next";

const ScannerPage = () => {
  const webcamRef = useRef(null);
  const [detectedText, setDetectedText] = useState("Scanne...");
  const { t } = useTranslation();
  const [isOpenCVReady, setIsOpenCVReady] = useState(false);
  const [boundingBox, setBoundingBox] = useState(null); // Roter Rahmen
  const [roiBox, setRoiBox] = useState(null); // Grüner Rahmen

  // OpenCV laden
  const loadOpenCV = async () => {
    if (window.cv && window.cv.getBuildInformation) {
      console.log("OpenCV ist bereits vollständig geladen!");
      setIsOpenCVReady(true);
      return;
    }

    return new Promise((resolve, reject) => {
      let script = document.createElement("script");
      script.src = window.location.origin + "/opencv.js";
      script.async = true;

      script.onload = () => {
        console.log("OpenCV.js wurde geladen, warte auf Initialisierung...");
        
        let checkCount = 0;
        let checkOpenCV = setInterval(() => {
          if (window.cv && window.cv.getBuildInformation) {
            clearInterval(checkOpenCV);
            console.log("OpenCV wurde erfolgreich initialisiert!");
            setIsOpenCVReady(true);
            resolve();
          } else {
            checkCount++;
            console.log(`Prüfe OpenCV-Initialisierung... Versuch ${checkCount}`);
            if (checkCount > 10) {
              clearInterval(checkOpenCV);
              console.error("OpenCV konnte nicht vollständig geladen werden.");
              reject();
            }
          }
        }, 500);
      };

      script.onerror = () => {
        console.error("Fehler beim Laden von OpenCV.js");
        reject();
      };

      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    loadOpenCV();
  }, []);

  useEffect(() => {
    if (isOpenCVReady) {
      console.log("Starte automatisches Scannen...");
      const interval = setInterval(scanImage, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpenCVReady]);

  const preprocessImage = (imageSrc, setBoundingBox, setRoiBox) => {
    return new Promise((resolve) => {
      let img = new Image();
      img.src = imageSrc;
  
      img.onload = () => {
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");
  
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
  
        let src = window.cv.imread(canvas);
        let gray = new window.cv.Mat();
        let blurred = new window.cv.Mat();
        let thresh = new window.cv.Mat();
        let contours = new window.cv.MatVector();
        let hierarchy = new window.cv.Mat();
  
        // **1. Graustufen & Weichzeichnen**
        window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY);
        window.cv.GaussianBlur(gray, blurred, new window.cv.Size(5, 5), 0);
  
        // **2. Verbesserte Kantenerkennung**
        window.cv.Canny(blurred, thresh, 50, 150);
  
        // **3. Konturen finden**
        window.cv.findContours(thresh, contours, hierarchy, window.cv.RETR_EXTERNAL, window.cv.CHAIN_APPROX_SIMPLE);
  
        let maxArea = 0;
        let bestContour = null;
  
        for (let i = 0; i < contours.size(); i++) {
          let contour = contours.get(i);
          let area = window.cv.contourArea(contour);
  
          if (area > maxArea) {
            maxArea = area;
            bestContour = contour;
          }
        }
  
        if (bestContour) {
          let boundingRect = window.cv.boundingRect(bestContour);
  
          // **📌 Roter Rahmen um die erkannte Karte**
          setBoundingBox({
            x: boundingRect.x,
            y: boundingRect.y,
            width: boundingRect.width,
            height: boundingRect.height
          });
  
          // **📌 Verbesserte Skalierung für den Kartennamen**
          let scaleFactor = boundingRect.width / 63.0; // Basierend auf Kartenbreite 63mm
          let extraPadding = 5; // Größerer Bereich für OCR
  
          let roiX = Math.max(boundingRect.x + Math.round(scaleFactor * 3) - extraPadding, 0);
          let roiY = Math.max(boundingRect.y + Math.round(scaleFactor * 46) - extraPadding, 0);
          let roiWidth = Math.min(Math.round(scaleFactor * 40) + 2 * extraPadding, src.cols - roiX);
          let roiHeight = Math.min(Math.round(scaleFactor * 10) + 2 * extraPadding, src.rows - roiY);
  
          // **🐞 Debugging: Prüfe ROI-Koordinaten**
          console.log(`ROI Position: x=${roiX}, y=${roiY}, width=${roiWidth}, height=${roiHeight}`);
  
          // **4. Sicherstellen, dass die ROI-Werte gültig sind**
          if (
            roiX < 0 || roiY < 0 || 
            roiX + roiWidth > src.cols || 
            roiY + roiHeight > src.rows
          ) {
            console.warn("⚠️ ROI außerhalb der Bildgrenzen! Korrigiere Werte.");
            resolve(null);
            return;
          }
  
          setRoiBox({ x: roiX, y: roiY, width: roiWidth, height: roiHeight });
  
          // **5. ROI für OCR ausschneiden**
          let roi = src.roi(new window.cv.Rect(roiX, roiY, roiWidth, roiHeight));
  
          // Falls nicht kontinuierlich → Kopieren
          if (!roi.isContinuous()) {
            let temp = new window.cv.Mat();
            roi.copyTo(temp);
            roi = temp;
          }
  
          // **6. Farbraum korrekt umwandeln (Fix für `cvtColor` Fehler)**
          let roiGray = new window.cv.Mat();
          if (roi.channels() === 3) {
              window.cv.cvtColor(roi, roiGray, window.cv.COLOR_RGB2GRAY);
          } else if (roi.channels() === 4) {
              window.cv.cvtColor(roi, roiGray, window.cv.COLOR_RGBA2GRAY);
          } else {
              roiGray = roi.clone(); // Falls schon Graustufen, einfach klonen
          }
  
          // **7. In RGBA umwandeln**
          let rgba = new window.cv.Mat();
          window.cv.cvtColor(roiGray, rgba, window.cv.COLOR_GRAY2RGBA);
          roiGray.delete();
  
          // **8. Debug: Bild in die Konsole ausgeben**
          let outputCanvas = document.createElement("canvas");
          outputCanvas.width = roiWidth;
          outputCanvas.height = roiHeight;
          let outputCtx = outputCanvas.getContext("2d");
  
          try {
            let bytes = rgba.data;
            let imageData = new ImageData(
              new Uint8ClampedArray(bytes.buffer, bytes.byteOffset, roiWidth * roiHeight * 4),
              roiWidth,
              roiHeight
            );
  
            outputCtx.putImageData(imageData, 0, 0);
            console.log("📸 OCR-Input-Bild:", outputCanvas.toDataURL());
            resolve(outputCanvas.toDataURL());
          } catch (error) {
            console.error("❌ Fehler beim Erstellen von ImageData:", error);
            resolve(null);
          }
  
          // **9. Speicher freigeben**
          src.delete();
          gray.delete();
          blurred.delete();
          thresh.delete();
          contours.delete();
          hierarchy.delete();
          roi.delete();
          rgba.delete();
        } else {
          resolve(null);
        }
      };
    });
  };
  
  
  

  

  const scanImage = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const processedImage = await preprocessImage(imageSrc, setBoundingBox, setRoiBox);
  
        if (!processedImage) {
          console.warn("⚠️ Kein gültiges Bild zum Scannen.");
          return;
        }
  
        const { data: { text } } = await Tesseract.recognize(processedImage, "eng", {
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -",
          psm: 6,
          logger: (m) => console.log(m),
        });
  
        setDetectedText(text.trim());
      }
    }
  };
  

  return (
    <div className={styles.container}>
      <h1 className={styles.dashboardTitle}>{t("scanner_title") || "Karten Scanner"}</h1>

      <div className={styles.webcamContainer} style={{ position: "relative" }}>
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/png"
          videoConstraints={{ facingMode: "environment" }}
          className={styles.webcam}
        />

        {/* 🔴 Roter Rahmen → Ganze erkannte Karte */}
        {boundingBox && (
          <div
            style={{
              position: "absolute",
              top: `${boundingBox.y}px`,
              left: `${boundingBox.x}px`,
              width: `${boundingBox.width}px`,
              height: `${boundingBox.height}px`,
              border: "2px solid red",
              pointerEvents: "none",
            }}
          />
        )}

        {/* 🟢 Grüner Rahmen → Bereich für den Kartennamen */}
        {roiBox && (
          <div
            style={{
              position: "absolute",
              top: `${roiBox.y}px`,
              left: `${roiBox.x}px`,
              width: `${roiBox.width}px`,
              height: `${roiBox.height}px`,
              border: "2px solid green",
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      <div className={styles.detectedTextBox}>
        <h2>Erkannter Text:</h2>
        <p>{detectedText}</p>
      </div>
    </div>
  );
};

export default ScannerPage;
