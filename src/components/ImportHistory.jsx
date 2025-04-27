/* Import logic */
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./ImportHistory.module.css";
import { useImport } from "@/context/ImportContext";

export default function ImportHistory({ userId }) {
   
   const {
      processStatus,
      processProgress,
      processPhase,
      statsData,
      error,
      isUIReady,
      startImport,
      resetImportState
   } = useImport();

   const [files, setFiles] = useState([]);
   const [isDragging, setIsDragging] = useState(false);
   const [uploadStatus, setUploadStatus] = useState("idle");
   const [uploadError, setUploadError] = useState(null);
   const [minMinutesThreshold, setMinMinutesThreshold] = useState("");
   const [settingsConfirmed, setSettingsConfirmed] = useState(false);

   // Reset component stat when import process is reset
   useEffect( () => {
      if( processStatus === "idle" && uploadStatus !== "idle" ){
         setUploadStatus("idle");
         setFiles([]);
         setUploadError(null);
         setSettingsConfirmed(false);
      }
   }, [processStatus, uploadStatus]);

   // Fetch user's current min_minutes_threshold setting
   useEffect(() => {
      if (userId) {
         fetchUserSettings();
      }
   }, [userId]);

   const fetchUserSettings = async () => {
      try {
         const response = await fetch(`http://localhost:3000/settings/${userId}`);
         
         if (response.ok) {
            const data = await response.json();
            if (data.settings && data.settings.min_minutes_threshold !== undefined) {
               setMinMinutesThreshold(data.settings.min_minutes_threshold);
            }
         }
      } catch (error) {
         console.error("Error fetching user settings:", error);
      }
   };

   const handleDragOver = (e) => {
      e.preventDefault();
      setIsDragging(true);
   };

   const handleDragLeave = () => {
      setIsDragging(false);
   };

   const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);

      // Only allow file drops if we're not currently processing
      if( processStatus !== "processing" ){
         const droppedFiles = Array.from(e.dataTransfer.files);
         const jsonFiles = droppedFiles.filter(file => file.name.endsWith(".json"));
         setFiles(prevFiles => [...prevFiles, ...jsonFiles]);
      }
   };

   const handleFileSelect = (e) => {
      // Only allow file selection if we're not currently processing
      if( processStatus !== "processing" ){
         const selectedFiles = Array.from(e.target.files);
         const jsonFiles = selectedFiles.filter(file => file.name.endsWith(".json"));
         setFiles(prevFiles => [...prevFiles, ...jsonFiles]);
      }
   };

   const handleRemoveFile = (index) => {
      setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
   };

   const handleSettingsConfirmedToggle = () => {
      setSettingsConfirmed(!settingsConfirmed);
   };

   const handleUpload = async () => {
      if (files.length === 0) {
         return;
      }
         
      if (!userId) {
         console.error("Cannot upload: userId is not set");
         return;
      }

      // Require settings confirmation before upload
      if(!settingsConfirmed){
         setUploadError("Please confirm the import settings before uploading");
         return;
      }

      setUploadStatus("uploading");
      setUploadError(null);
      
      try {
         
         // Read and parse all files
         const fileContents = await Promise.all(
            files.map(file => readFileAsJSON(file))
         );
         
         const token = localStorage.getItem("access_token");
         
         // Send to server
         const response = await fetch(`http://localhost:3000/import-history/${userId}`, {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ files: fileContents })
         });
         
         if (!response.ok) {
            throw new Error("Error uploading files");
         }
         
         setUploadStatus("success");
         
         // Start connection after successful upload
         startImport();
         
      } catch (err) {
         console.error("Error uploading files:", err);
         setUploadError(err.message);
         setUploadStatus("error");
      }
   };

   const handleRetry = () => {
      resetImportState();
      setUploadStatus("idle");
      setUploadError(null);
      setSettingsConfirmed(false);
   }

   const readFileAsJSON = (file) => {
      return new Promise((resolve, reject) => {
         const reader = new FileReader();
         
         reader.onload = (event) => {
            try {
               const content = JSON.parse(event.target.result);
               if( !Array.isArray(content) ){
                  throw new Error(`File ${file["name"]} does not contain an array of streaming history`);
               }
               resolve({
                  name: file.name,
                  data: content
               });
            } catch (error) {
               reject(new Error(`Invalid JSON in file ${file.name}`));
            }
         };
         
         reader.onerror = () => {
            reject(new Error(`Error reading file ${file.name}`));
         };
         
         reader.readAsText(file);
      });
   };
   
   // Don't render until we've checked saved state
   if( !isUIReady ){
      return (
         <div className={styles.uploadContainer}>
            <div className={styles.stepContainer}>
               <h2 className={styles.stepTitle}>Loading import history...</h2>
            </div>
         </div>
      );
   }

    // Render the active processing state if we're in the middle of processing
    if (processStatus === "processing") {
      return (
         <div className={styles.uploadContainer}>
            <div className={styles.stepContainer}>
               <h2 className={styles.stepTitle}>Processing your Spotify history</h2>
            </div>
            
            <div style={{marginTop: "24px"}}>
               <p style={{marginBottom: "16px", fontSize: "18px"}}>
                  {processPhase === "initializing" && "Preparing to process your files..."}
                  {processPhase === "collecting" && "Collecting track information..."}
                  {processPhase === "fetching_track_data" && "Fetching track data from Spotify..."}
                  {processPhase === "processing_interactions" && "Processing your listening history..."}
                  {processPhase === "calculating" && "Calculating listening statistics..."}
                  {processPhase === "cleaning_up" && "Cleaning up the data..."}
               </p>
               
               <div className={styles.progressBarContainer}>
                  <div 
                     className={styles.progressBar} 
                     style={{width: `${processProgress}%`}}
                  />   
               </div>
               
               <p style={{
                  fontSize: "16px", 
                  marginTop: "8px",
                  textAlign: "center"
               }}>
                  {processProgress}% complete
               </p>
               
               <p style={{
                  fontSize: "14px", 
                  color: "#a0a0a0", 
                  marginTop: "16px",
                  textAlign: "center"
               }}>
                  This may take up to 2 hours for large files. You can close this page and come back later.
               </p>
            </div>
         </div>
      );
   }

   // Render the completed state
   if (processStatus === "complete" && statsData) {
      return (
         <div className={styles.uploadContainer}>
            <div className={styles.stepContainer}>
               <h2 className={styles.stepTitle}>Processing Complete!</h2>
            </div>
            
            <div style={{
               marginTop: "24px", 
               backgroundColor: "rgba(14, 170, 69, 0.1)",
               padding: "20px",
               borderRadius: "8px",
               textAlign: "center"
            }}>
               <p style={{fontWeight: "bold", fontSize: "18px", marginBottom: "16px"}}>
                  Your Spotify history has been successfully processed!
               </p>
               
               <div style={{margin: "20px 0"}}>
                  <p>Processed {statsData.totalProcessed} entries</p>
                  <p>Skipped {statsData.totalSkipped} entries (no track URI)</p>
                  <p>Imported {statsData.uniqueTracks} unique tracks</p>
                  <p>Removed {statsData.tracksUnderThreshold} tracks under the {minMinutesThreshold} minute threshold</p>
               </div>
               
               <button 
                  onClick={handleRetry}
                  className={styles.uploadButton}
                  style={{maxWidth: "200px", margin: "0 auto"}}
               >
                  Upload More Files
               </button>
            </div>
         </div>
      );
   }

   // Render the error state
   if (processStatus === "error") {
      return (
         <div className={styles.uploadContainer}>
            <div className={styles.stepContainer}>
               <h2 className={styles.stepTitle}>Processing Error</h2>
            </div>
            
            <div style={{
               marginTop: "24px", 
               backgroundColor: "rgba(231, 76, 60, 0.1)",
               padding: "20px",
               borderRadius: "8px",
               textAlign: "center"
            }}>
               <p style={{color: "#e74c3c", fontWeight: "bold", marginBottom: "16px"}}>
                  Error: {error || "There was an error processing your files."}
               </p>
               
               <button 
                  onClick={handleRetry}
                  className={styles.uploadButton}
                  style={{maxWidth: "200px", margin: "0 auto"}}
               >
                  Try Again
               </button>
            </div>
         </div>
      );
   }

   return (
      <div className={styles.uploadContainer}>
         <div className={styles.stepContainer}>
            <h2 className={styles.stepTitle}>Upload your files</h2>
         </div>
         
         <p className={styles.instructions}>
            Upload your Spotify streaming history files (.json) to enhance your experience with lifetime stats:
         </p>
         
         <div 
            className={`${styles.dropZone} ${isDragging ? styles.dragging : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
         >
            <Image 
               src="/images/riffle_logo.png"
               alt="Upload Icon"
               width={50}
               height={50}
               style={{marginBottom: "16px"}}
            />
            <p style={{fontSize: "18px", marginBottom: "8px"}}>Drag and drop your JSON files here</p>
            <p>or</p>
            <label className={styles.fileInputLabel}>
               Browse Files
               <input 
                  type="file" 
                  accept=".json" 
                  multiple 
                  onChange={handleFileSelect}
                  style={{display: "none"}}
               />
            </label>
         </div>
         
         {files.length > 0 && (
            <div style={{marginTop: "24px"}}>
               <h3>Selected Files:</h3>
               <ul>
                  {files.map((file, index) => (
                     <li key={index} className={styles.fileItem}>
                        <span>{file.name}</span>
                        <button 
                           onClick={() => handleRemoveFile(index)}
                           className={styles.removeButton}
                           aria-label="Remove file"
                        >
                           ✕
                        </button>
                     </li>
                  ))}
               </ul>

               <div className={styles.settingsSummary}>
                  <p>Current import settings:</p>
                  <p style={{marginTop: "8px"}}>Excluding tracks with less than <span className={styles.thresholdValue}>{minMinutesThreshold}</span> minute{minMinutesThreshold !== 1 ? 's' : ''} listened</p>
                  <p style={{fontSize: "14px", marginTop: "8px", color: "#aaa"}}>
                     <Link href={`/settings/${userId}`} className={styles.settingsLink}>
                        Adjust these settings
                     </Link> before proceeding if needed.
                  </p>
                  
                  <div className={styles.confirmContainer}>
                     <label className={styles.confirmLabel}>
                        <input 
                           type="checkbox" 
                           checked={settingsConfirmed}
                           onChange={handleSettingsConfirmedToggle}
                           className={styles.confirmCheckbox}
                        />
                        I confirm these import settings
                     </label>
                  </div>
               </div>
               
               <button 
                  onClick={handleUpload} 
                  className={styles.uploadButton}
                  disabled={uploadStatus === "uploading" || processStatus === "processing"}
               >
                  {uploadStatus === "uploading" ? "Uploading..." : "Upload Files"}
               </button>
               
               {uploadStatus === "success" && processStatus === "idle" && (
                  <p style={{ color: "#0eaa45", marginTop: "16px", fontWeight: "bold" }}>
                     Files uploaded successfully! Processing will begin shortly.
                  </p>
               )}

               {uploadStatus === "error"  && (
                  <p style={{ color: "#e74c3c", marginTop: "16px", fontWeight: "bold" }}>
                     Error: {uploadError || error || "There was an error uploading your files. Please try again."}
                  </p>
               )}
            </div>
         )}
         
         <div className={styles.benefitsBox}>
            <h3 style={{color: "#0eaa45", marginTop: 0, marginBottom: "8px"}}>What you'll get:</h3>
            <ul className={styles.benefitsList}>
               <li>Lifetime listening history</li>
               <li>Accurate listen and skip counts</li>
               <li>Detailed listening patterns</li>
               <li>Enhanced music insights</li>
            </ul>
         </div>
      </div>
   );
}