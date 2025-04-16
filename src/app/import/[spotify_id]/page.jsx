"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";

export default function ImportPage(){
   const [files, setFiles] = useState([]);
   const [isDragging, setIsDragging] = useState(false);
   const [uploadStatus, setUploadStatus] = useState("idle");
   const [processStatus, setProcessStatus] = useState("idle");
   const [processProgress, setProcessProgress] = useState(0);

   const handleDragOver = (e) =>{
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

      setFiles(prevFiles => [...prevFiles, ...jsonFiles]); // Combines previous files with new files
   };

   const handleFileSelect = (e) => {
      const selectedFiles = Array.from(e.target.files);
      const jsonFiles = selectedFiles.filter(file => file.name.endsWith(".json"));
      
      setFiles(prevFiles => [...prevFiles, ...jsonFiles]);
   };

   const handleRemoveFile = (index) => {
      setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
   };

   // Function for progress bar so user is aware that theyre files are being procesed
   const processFiles = () => {
      setProcessStatus("processing");
      setProcessProgress(0);

      // Used for testing bar
      const totalSteps = 100;
      let currentStep = 0;

      const processInterval = setInterval(() => {
         if( currentStep < totalSteps ){
            currentStep += 1;
            setProcessProgress(currentStep);
         }
         else{
            clearInterval(processInterval);
            setProcessStatus("complete");

            // After 5 seconds, reset everything
            setTimeout(() => {
               setFiles([]);
               setUploadStatus('idle');
               setProcessStatus('idle');
               setProcessProgress(0);
            }, 5000);
         }
      }, 100); // Will update every 100ms
   };

   const handleUpload = () => {

      
      // This is just a UI placeholder - actual upload functionality will be implemented later
      setUploadStatus("uploading");
      
      setTimeout(() => {
         // Using this to test whether i clear the files after successful upload
         const isSuccess = Math.random() < 0.7;
         if( isSuccess ){
            setUploadStatus("success");
            processFiles();
         }
         else{
            setUploadStatus("error");
         }
         // Process the files here
      }, 2000);
   };

   return (
      <div className={styles.container}>
         <h1 className={styles.title}>Import Spotify History</h1>
         
         <div className={styles.importSection}>
            {/* Upload Section First */}
            <div className={styles.importBox}>
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
                  
                  {processStatus === "processing" && (
                     <div style={{marginTop: "16px"}}>
                        <p style={{marginBottom: "8px"}}>
                           Processing your files...( {processProgress < 100  ? `${processProgress}%` : `${processProgress}`})
                        </p>
                        <div className={styles.progressBarContainer}>
                           <div className={styles.progressBar} style={{width: `${processProgress}%`}}/>   
                        </div>
                        <p style={{fontSize: "14px", color:"#a0a0a0", marginTop: "8px"}}>
                           This may take several minutes for large files.
                        </p>
                     </div>
                  )}

                  {processStatus === "complete" && (
                     <p style={{color:"#0eaa45", marginTop: "16px", fontWeight: "bold"}}>
                        Processing complete! Your lifetime stats are now available.
                     </p>
                  )}

                  {uploadStatus === "error" && (
                     <p style={{ color: "#e74c3c", marginTop: "16px", fontWeight: "bold" }}>
                        There was an error uploading your files. Please try again.
                     </p>
                  )}
               </div>
               )}
               
               <div className={styles.benefitsBox}>
               <h3 style={{color: "#0eaa45", marginTop: 0}}>What you"ll get:</h3>
               <ul className={styles.benefitsList}>
                  <li>Lifetime listening history</li>
                  <li>Accurate listen and skip counts</li>
                  <li>Detailed listening patterns</li>
                  <li>Enhanced music insights</li>
               </ul>
               </div>
            </div>

            <h2 className={styles.instructionsTitle}>Don"t have your data yet? Here"s how to get it:</h2>
            
            {/* Step 1: Request data */}
            <div className={styles.importBox}>
               <div className={styles.stepContainer}>
               <div className={styles.stepNumber}>1</div>
               <h2 className={styles.stepTitle}>Request your data from Spotify</h2>
               </div>
               
               <p className={styles.instructions}>
               Go to the <a href="https://www.spotify.com/account/privacy/" target="_blank" rel="noopener noreferrer" className={styles.link}>Spotify Privacy page</a> and select "Extended streaming history"
               </p>
               
               <div className={styles.imageContainer}>
               <Image 
                  src="/images/privacy-step3.webp"
                  alt="Spotify Data Request Screenshot"
                  width={600}
                  height={400}
                  className={styles.instructionImage}
               />
               <p className={styles.imageCaption}>Select only "Extended streaming history" option</p>
               </div>
            </div>

            {/* Step 2: Confirm request */}
            <div className={styles.importBox}>
               <div className={styles.stepContainer}>
               <div className={styles.stepNumber}>2</div>
               <h2 className={styles.stepTitle}>Confirm your request</h2>
               </div>
               
               <p className={styles.instructions}>
               Check your email and click the confirmation link from Spotify
               </p>
               
               <div className={styles.imageContainer}>
               <Image 
                  src="/images/step2.png"
                  alt="Spotify Confirmation Email"
                  width={600}
                  height={400}
                  className={styles.instructionImage}
               />
               <p className={styles.imageCaption}>Click "CONFIRM" in the email from Spotify</p>
               </div>
               
               <p style={{fontSize: "14px", color: "#a0a0a0", fontStyle: "italic", marginTop: "16px", justifySelf: "center"}}>
               *After confirming, Spotify will process your request, which can take up to 30 days.
               </p>
            </div>

            {/* Step 3: Download files */}
            <div className={styles.importBox}>
               <div className={styles.stepContainer}>
               <div className={styles.stepNumber}>3</div>
               <h2 className={styles.stepTitle}>Download and extract the files</h2>
               </div>
               
               <p className={styles.instructions}>
               When Spotify has prepared your data, you"ll receive an email with a download link
               </p>
               
               <div className={styles.imageContainer}>
               <Image 
                  src="/images/step5.webp"
                  alt="Spotify Download Ready Email"
                  width={600}
                  height={400}
                  className={styles.instructionImage}
               />
               <p className={styles.imageCaption}>Click the "DOWNLOAD" button in the email when your data is ready</p>
               </div>
               
               <ol className={styles.stepsList}>
               <li>Download the ZIP file from the link in the email</li>
               <li>Extract the contents of the ZIP file to a folder on your computer</li>
               <li>Look for files named like "StreamingHistory0.json", "StreamingHistory1.json", etc.</li>
               <li>Return to this page to upload those files</li>
               </ol>
            </div>
         </div>
      </div>
   );
}