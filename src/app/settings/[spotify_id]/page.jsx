"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import Button from "@/components/Button";
import buttonStyles from "@/components/Button.module.css";

export default function Settings() {
   const [skipThreshold, setSkipThreshold] = useState(20);

   // Fetch current settings
   useEffect(() => {
      const fetchSettings = async () => {
         try{
            const userId = localStorage.getItem("user_id");
            const response = await fetch(`http://localhost:3000/settings/${userId}`);

            if( response.ok ){
               const data = await response.json();
               setSkipThreshold(data["settings"]["skip_threshold"]);
            }
         } catch(error){
            console.error("Error fetching settings:", error);
         }
      };

      fetchSettings();
   }, []);


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
         
         {/* Skip threshold stuff */}
         <div>
            <label htmlFor="skipThreshold">Skip Threshold: </label>
            <input
               type="number"
               id="skipThreshold"
               value={skipThreshold}
               min="1"
               max="100"
            />
         </div>
         

         {/* Add buttons */}
         <div className={buttonStyles.buttonsContainer}>
            <Button label="Logout" onClick={handleLogout} variant="primary" />
            <Button label="Delete Account" onClick={handleDeleteAccount} variant="danger" />
         </div>
      </div>
   );
}