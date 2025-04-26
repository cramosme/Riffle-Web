"use client";

import styles from "./page.module.css";
import ImportHistory from "@/components/ImportHistory";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function ImportPage() {
   const [userId, setUserId] = useState(null);

   useEffect(() => {
      // Get userId from localStorage
      const storedUserId = localStorage.getItem("user_id");
      if (storedUserId) {
         setUserId(storedUserId);
      }
   }, []);

   return (
      <div className={styles.container}>
         <h1 className={styles.title}>Import Spotify History</h1>
         
         <div className={styles.importSection}>
            {/* Use the ImportHistory component for upload functionality */}
            <ImportHistory userId={userId} />

            <h2 className={styles.instructionsTitle}>Don't have your data yet? Here's how to get it:</h2>
            
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
                  When Spotify has prepared your data, you'll receive an email with a download link
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