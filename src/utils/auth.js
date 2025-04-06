"use client";

// Utility functions for checking if the user is logged in or not

export function isUserLoggedIn() {
   if (typeof window === 'undefined') {
     return false; // Not logged in during server-side rendering
   }
   
   try {
     const accessToken = localStorage.getItem('access_token');
     const userId = localStorage.getItem('user_id');
     const tokenExpiry = localStorage.getItem('token_expiry');
     
     console.log('Auth check values:', { 
      hasAccessToken: !!accessToken, 
      hasUserId: !!userId,
      tokenExpiry: tokenExpiry ? new Date(parseInt(tokenExpiry)).toISOString() : null,
      currentTime: new Date().toISOString()
    });

     // Check if all required values exist
     if (!accessToken || !userId) {
      console.log('Missing required auth values');
       return false;
     }
     
     // Check if token is expired
     if (tokenExpiry) {
       const expiryTime = parseInt(tokenExpiry);
       if (Date.now() > expiryTime) {
         console.log('Token is expired');
         return false; // Token is expired
       }
     }
     
     return true;
   } catch (error) {
     console.error('Error checking login status:', error);
     return false;
   }
}
 
 /*
  Get the user ID if the user is logged in
*/
export function getLoggedInUserId() {

   if (typeof window === 'undefined' || !isUserLoggedIn()) {
      return null;
   }

   try {
      return localStorage.getItem('user_id');
   } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
   }
}