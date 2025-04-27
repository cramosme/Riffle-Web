"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import Button from "@/components/Button";
import buttonStyles from "@/components/Button.module.css";

export default function Settings() {
   const [skipThreshold, setSkipThreshold] = useState("");
   const [minMinutesThreshold, setMinMinutesThreshold] = useState("");
   const [originalThreshold, setOriginalThreshold] = useState("");
   const [originalMinMinutes, setOriginalMinMinutes] = useState("");
   const [isSaving, setIsSaving] = useState(false);
   const [saveMessage, setSaveMessage] = useState(null);
   const [userId, setUserId] = useState(null);
   const [hasChanges, setHasChanges] = useState(false);
   const [inputError, setInputError] = useState("");
   const [minutesInputError, setMinutesInputError] = useState("");

   // Fetch current settings
   useEffect(() => {
      const fetchSettings = async () => {
         try{
            const userId = localStorage.getItem("user_id");
            setUserId(userId);
            const response = await fetch(`http://localhost:3000/settings/${userId}`);

            if( response.ok ){
               const data = await response.json();
               // Don't set the input value, just set the original threshold for comparison
               setOriginalThreshold(data["settings"]["skip_threshold"]);
               setOriginalMinMinutes(data["settings"]["min_minutes_threshold"]);
            }
         } catch(error){
            console.error("Error fetching settings:", error);
         }
      };

      fetchSettings();
   }, []);

   // Update hasChanges whenever skipThreshold changes
   useEffect(() => {
      // Check if the input is not empty and different from original value
      const skipChanged = skipThreshold !== "" && parseInt(skipThreshold) !== originalThreshold;
      const minutesChanged = minMinutesThreshold !== "" && parseFloat(minMinutesThreshold) !== originalMinMinutes;
      setHasChanges(skipChanged || minutesChanged);
   }, [skipThreshold, minMinutesThreshold, originalThreshold, originalMinMinutes]);

   const handleSkipThresholdChange = (e) => {
      const value = e.target.value;
      
      // Allow empty input for typing purposes
      if (value === "") {
         setSkipThreshold("");
         setInputError("");
         return;
      }
      
      // Convert to number and validate
      const numValue = parseInt(value);
      
      if (isNaN(numValue)) {
         setInputError("Please enter a valid number");
         return;
      }
      
      if (numValue < 1 || numValue > 100) {
         setInputError("Value must be between 1 and 100");
         return;
      }
      
      setSkipThreshold(numValue);
      setInputError("");
   }

   const handleMinMinutesChange = (e) => {
      const value = e.target.value;
      
      // Allow empty input for typing purposes
      if (value === "") {
         setMinMinutesThreshold("");
         setMinutesInputError("");
         return;
      }
      
      // Convert to number and validate
      const numValue = parseFloat(value);
      
      if (isNaN(numValue)) {
         setMinutesInputError("Please enter a valid number");
         return;
      }
      
      if (numValue < 0) {
         setMinutesInputError("Value must be greater than or equal to 0");
         return;
      }
      
      if (numValue > 30) {
         setMinutesInputError("Value must be 30 minutes or less");
         return;
      }
      
      setMinMinutesThreshold(numValue);
      setMinutesInputError("");
   }

   // Function to cancel changes and revert to original values
   const handleCancel = () => {
      setSkipThreshold("");
      setMinMinutesThreshold("");
      setInputError("");
      setMinutesInputError("");
      setSaveMessage({
         type: "info",
         text: "Changes cancelled"
      });
      setTimeout(() => setSaveMessage(null), 3000);
   }

   // Function to save settings
   const handleSaveSettings = async () => {
      // Skip validation if no changes were made to that field
      if (skipThreshold && inputError) {
         return;
      }
      
      if (minMinutesThreshold && minutesInputError) {
         return;
      }

      // Only save if the value has changed
      if (!hasChanges) {
         setSaveMessage({
            type: "info",
            text: "No changes to save"
         });
         setTimeout(() => setSaveMessage(null), 3000);
         return;
      }

      setIsSaving(true);
      setSaveMessage(null);

      try {
         const token = localStorage.getItem("access_token");
         
         // Build the update object with only changed fields
         const updateData = {};
         if (skipThreshold !== "") {
            updateData.skip_threshold = skipThreshold;
         }
         if (minMinutesThreshold !== "") {
            updateData.min_minutes_threshold = minMinutesThreshold;
         }

         // Update settings in the database
         const response = await fetch(`http://localhost:3000/settings/${userId}`, {
            method: "PUT",
            headers: {
               "Content-Type": "application/json",
               "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
         });

         if (response.ok) {
            const data = await response.json();

            // Update original values for comparison
            if (skipThreshold !== "") {
               setOriginalThreshold(parseInt(skipThreshold));
            }
            if (minMinutesThreshold !== "") {
               setOriginalMinMinutes(parseFloat(minMinutesThreshold));
            }
            
            // Clear inputs
            setSkipThreshold("");
            setMinMinutesThreshold("");
            
            // Show success message, including recalculation stats if available
            setSaveMessage({
               type: "success",
               text: data.message || "Settings saved successfully"
            });
         } else {
            const errorData = await response.json();
            setSaveMessage({
               type: "error",
               text: errorData.error || "Failed to save settings"
            });
         }
      } catch (error) {
         console.error("Error saving settings:", error);
         setSaveMessage({
            type: "error",
            text: "An error occurred while saving settings"
         });
      } finally {
         setIsSaving(false);
         // Clear message after 5 seconds
         setTimeout(() => setSaveMessage(null), 5000);
      }
   }

   // Logout function, pretty straightforward just clear out the stored info and redirect to homepage
   const handleLogout = () => {
      localStorage.clear();
      window.location.href = "/";
   }

   // Function to delete account, clears out local storage and calls delete end point so database can handle it
   const handleDeleteAccount = async () => {
      if( confirm("Are you sure you want to delete your account? This action cannot be undone.")){
         try{
            const userId = localStorage.getItem("user_id");

            const response = await fetch(`http://localhost:3000/user/${userId}`, {
               method: "DELETE"
            });

            if( response.ok ){
               localStorage.clear();

               window.location.href = "/";

               alert("Your account has been successfully deleted.");
            }
            else{
               alert("Failed to delete account. Please try again.");
            }
         } catch( err ){
            console.error("Error deleting account", err);
            alert("An error occurred while trying to delete your account.");
         }
      }
   };

   return (
      <div className={styles.container}>
         {/* Skip threshold settings */}
         <div className={styles.settingsSection}>
            
            <div className={styles.settingItem}>
               <label htmlFor="skipThreshold" className={styles.settingLabel}>
                  Skip Threshold (%)
               </label>
               <div className={styles.settingControl}>
                  <input
                     type="text"
                     id="skipThreshold"
                     value={skipThreshold}
                     onChange={handleSkipThresholdChange}
                     className={styles.textInput}
                     placeholder={originalThreshold.toString()}
                  />
                  {inputError && (
                     <div className={styles.inputError}>
                        {inputError}
                     </div>
                  )}
               </div>
               <p className={styles.settingDescription}>
                  Tracks played less than this percentage will be counted as skipped.
                  Enter a value between 1 and 100.
               </p>
            </div>

            {/* Minimum minutes setting */}
            <div className={styles.settingItem}>
               <label htmlFor="minMinutesThreshold" className={styles.settingLabel}>
                  Minimum Minutes Threshold
               </label>
               <div className={styles.settingControl}>
                  <input
                     type="text"
                     id="minMinutesThreshold"
                     value={minMinutesThreshold}
                     onChange={handleMinMinutesChange}
                     className={styles.textInput}
                     placeholder={originalMinMinutes.toString()}
                  />
                  {minutesInputError && (
                     <div className={styles.inputError}>
                        {minutesInputError}
                     </div>
                  )}
               </div>
               <p className={styles.settingDescription}>
                  When importing your Spotify history, tracks with less than this number of minutes 
                  listened will be excluded.
               </p>
            </div>
            
            {/* Action buttons */}
            <div className={styles.actionButtons}>
               <Button 
                  label={isSaving ? "Saving..." : "Save Settings"} 
                  onClick={handleSaveSettings} 
                  variant="primaryLogout"
                  disabled={isSaving || !hasChanges || !!inputError}
               />
               
               {/* Only show Cancel button when there are changes */}
               {hasChanges && (
                  <Button 
                     label="Cancel" 
                     onClick={handleCancel} 
                     variant="secondary"
                     disabled={isSaving}
                  />
               )}
            </div>
            
            {/* Save message */}
            {saveMessage && (
               <div className={`${styles.saveMessage} ${styles[saveMessage.type]}`}>
                  {saveMessage.text}
               </div>
            )}
         </div>

         {/* Account buttons */}
         <div className={buttonStyles.buttonsContainer}>
            <Button label="Logout" onClick={handleLogout} variant="primaryLogout" />
            <Button label="Delete Account" onClick={handleDeleteAccount} variant="danger" />
         </div>
      </div>
   );
}