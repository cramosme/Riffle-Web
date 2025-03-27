// app.config.js
require('dotenv').config();

module.exports = {
   expo: {
     name: 'Riffle',
     slug: 'Riffle',
     version: '1.0.0',
     orientation: 'portrait',
     icon: './assets/images/icon.png',
     scheme: 'riffle-auth-login',
     userInterfaceStyle: 'automatic',
     newArchEnabled: true,
     ios: {
       supportsTablet: true,
     },
     android: {
       package: 'com.testing.riffle',
       adaptiveIcon: {
         foregroundImage: './assets/images/adaptive-icon.png',
         backgroundColor: '#ffffff',
       },
     },
     web: {
       bundler: 'metro',
       output: 'static',
       favicon: './assets/images/favicon.png',
     },
     plugins: [
       'expo-router',
       [
         'expo-splash-screen',
         {
           image: './assets/images/splash-icon.png',
           imageWidth: 200,
           resizeMode: 'contain',
           backgroundColor: '#ffffff',
         },
       ],
     ],
     experiments: {
       typedRoutes: true,
     },
     extra: {
       CLIENT_ID: process.env.CLIENT_ID,
     },
   },
 };