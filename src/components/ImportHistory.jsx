/* Import logic */
"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./ImportHistory.module.css";
import { useImport } from "@/context/ImportContext";

export default function ImportHistory({ userId }) {
   
   const {
      processStatus,
      processProgress,
      processPhase,
      statsData,
      error,
      startImport
   } = useImport();

   const [files, setFiles] = useState([]);
   const [isDragging, setIsDragging] = useState(false);
   const [uploadStatus, setUploadStatus] = useState("idle");
   const [uploadError, setUploadError] = useState(null);

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

      const droppedFiles = Array.from(e.dataTransfer.files);
      const jsonFiles = droppedFiles.filter(file => file.name.endsWith(".json"));

      setFiles(prevFiles => [...prevFiles, ...jsonFiles]);
   };

   const handleFileSelect = (e) => {
      const selectedFiles = Array.from(e.target.files);
      const jsonFiles = selectedFiles.filter(file => file.name.endsWith(".json"));
      
      setFiles(prevFiles => [...prevFiles, ...jsonFiles]);
   };

   const handleRemoveFile = (index) => {
      setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
   };

   const handleUpload = async () => {
      if (files.length === 0) {
         return;
      }
         
      if (!userId) {
         console.error("Cannot upload: userId is not set");
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
               
               {processStatus === "processing" && uploadStatus === "success" && (
                  <div style={{marginTop: "16px"}}>
                     <p style={{marginBottom: "8px"}}>
                        {processPhase === "calculating" 
                           ? "Calculating minutes listened..." 
                           : processPhase === "fetching_track_data"
                           ? "Fetching track data from Spotify..."
                           : processPhase === "processing_interactions"
                           ? "Processing track interactions..."
                           : "Processing your files..."}
                        ({processProgress}%)
                     </p>
                     <div className={styles.progressBarContainer}>
                        <div className={styles.progressBar} style={{width: `${processProgress}%`}}/>   
                     </div>
                     <p style={{fontSize: "14px", color:"#a0a0a0", marginTop: "8px"}}>
                        This may take several minutes for large files.
                     </p>
                  </div>
               )}

               {processStatus === "complete" && statsData && (
                  <div style={{marginTop: "16px", color: "#0eaa45"}}>
                     <p style={{fontWeight: "bold"}}>Processing complete!</p>
                     <p>Processed {statsData.totalProcessed} entries</p>
                     <p>Skipped {statsData.totalSkipped} entries (no track URI)</p>
                     <p>Imported {statsData.uniqueTracks} unique tracks</p>
                  </div>
               )}

               {(uploadStatus === "error" || processStatus === "error") && (
                  <p style={{ color: "#e74c3c", marginTop: "16px", fontWeight: "bold" }}>
                     Error: {uploadError || error || "There was an error processing your files. Please try again."}
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