// src/context/ImportContext.js
"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const ImportContext = createContext(null);

export function ImportProvider({ children }) {
   const [userId, setUserId] = useState(null);
   const [processStatus, setProcessStatus] = useState("idle");
   const [processProgress, setProcessProgress] = useState(0);
   const [processPhase, setProcessPhase] = useState("");
   const [statsData, setStatsData] = useState(null);
   const [error, setError] = useState(null);
   const [isUIReady, setIsUIReady] = useState(false);
   
   const eventSourceRef = useRef(null);
   const reconnectAttemptRef = useRef(0);
   
   // Initialize userId from localStorage
   useEffect(() => {
      if (typeof window !== 'undefined') {
         const storedUserId = localStorage.getItem("user_id");
         if (storedUserId) {
            setUserId(storedUserId);
         }
      }
   }, []);
   
   // Connect to progress updates
   useEffect(() => {
      if (!userId) return;
      
      // Check for persisted process state
      const savedStatus = localStorage.getItem(`import_process_status_${userId}`);
      console.log("Checking for saved status:", savedStatus);

      if (savedStatus === "processing") {
         const savedProgress = localStorage.getItem(`import_process_progress_${userId}`);
         const savedPhase = localStorage.getItem(`import_process_phase_${userId}`);
         console.log("Restoring state:", { savedStatus, savedProgress, savedPhase });
         
         setProcessStatus(savedStatus);
         setProcessProgress(Number(savedProgress) || 0);
         setProcessPhase(savedPhase || "");
         
         connectToProgressUpdates();
      }

      setIsUIReady(true); // Mark UI as ready after checking save state
      
      return () => {
         if (eventSourceRef.current) {
            eventSourceRef.current.close();
         }
      };
   }, [userId]);
   
   const connectToProgressUpdates = () => {

      if( !userId ){
         console.log("Cannot connect: userId not set");
         return;
      }

      const token = localStorage.getItem("access_token");
      console.log("Connecting to progress updates for user:", userId);
      
      if (eventSourceRef.current) {
         eventSourceRef.current.close();
      }
      
      const eventSource = new EventSource(`http://localhost:3000/import-progress/${userId}?token=${token}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
         console.log("EventSource connection established");
         reconnectAttemptRef.current = 0; // Reset reconnect attempts on successful connection
      }
      
      eventSource.onmessage = (event) => {
         const data = JSON.parse(event.data);
         console.log("Import progress update:", data);
         
         if (data.status === "processing") {
            setProcessStatus("processing");
            setProcessProgress(data.progress);
            setProcessPhase(data.phase);
            
            // Update local storage
            localStorage.setItem(`import_process_status_${userId}`, "processing");
            localStorage.setItem(`import_process_progress_${userId}`, data.progress);
            localStorage.setItem(`import_process_phase_${userId}`, data.phase);
            
         } else if (data.status === "complete") {
            setProcessStatus("complete");
            setProcessProgress(100);
            setStatsData(data);
            
            // Clear persisted state
            localStorage.removeItem(`import_process_status_${userId}`);
            localStorage.removeItem(`import_process_progress_${userId}`);
            localStorage.removeItem(`import_process_phase_${userId}`);
            
            eventSource.close();
            
            // Reset after a delay
            setTimeout(() => {
               setProcessStatus("idle");
               setProcessProgress(0);
               setProcessPhase("");
               setStatsData(null);
            }, 5000);
            
         } else if (data.status === "error") {
            setProcessStatus("error");
            setError(data.error);
            
            // Clear persisted state
            localStorage.removeItem(`import_process_status_${userId}`);
            localStorage.removeItem(`import_process_progress_${userId}`);
            localStorage.removeItem(`import_process_phase_${userId}`);
            
            eventSource.close();
         }
      };
      
      eventSource.onerror = (error) => {
         console.error("SSE connection error:", error);
         
         eventSource.close();
         // Clear persisted state
         // localStorage.removeItem(`import_process_status_${userId}`);
         // localStorage.removeItem(`import_process_progress_${userId}`);
         // localStorage.removeItem(`import_process_phase_${userId}`);

         // Attempt to reconnect if still processing
         if (processStatus === "processing") {
            reconnectAttemptRef.current += 1;
            setTimeout(() => {
               console.log("Attempting to reconnect...");
               connectToProgressUpdates();
            }, 2000);
         }
      };
   };
   
   const startImport = () => {
      console.log("Starting import process and connecting to updates");
      setProcessStatus("processing");
      setProcessProgress(0);
      setProcessPhase("initializing");
      setError(null);

      // Save initial state immediately
      if (userId) {
         localStorage.setItem(`import_process_status_${userId}`, "processing");
         localStorage.setItem(`import_process_progress_${userId}`, "0");
         localStorage.setItem(`import_process_phase_${userId}`, "initializing");
      }

      connectToProgressUpdates();
   };

   const resetImportState = () => {
      // Only allow resetting if we're in an error state or complete state
      if (processStatus === "error" || processStatus === "complete") {
         setProcessStatus("idle");
         setProcessProgress(0);
         setProcessPhase("");
         setStatsData(null);
         setError(null);
         
         // Clear persisted state
         if (userId) {
            localStorage.removeItem(`import_process_status_${userId}`);
            localStorage.removeItem(`import_process_progress_${userId}`);
            localStorage.removeItem(`import_process_phase_${userId}`);
         }
      }
   };
   
   const contextValue = {
      processStatus,
      processProgress,
      processPhase,
      statsData,
      error,
      isUIReady,
      startImport,
      resetImportState
   };
   
   return (
      <ImportContext.Provider value={contextValue}>
         {children}
      </ImportContext.Provider>
   );
}

export function useImport() {
   const context = useContext(ImportContext);
   if (!context) {
      throw new Error("useImport must be used within an ImportProvider");
   }
   return context;
}