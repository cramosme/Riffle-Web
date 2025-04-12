"use client";

import React, { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

export default function BackgroundParticles() {

   const particlesInit = useCallback(async engine => {
      await loadSlim(engine);
   }, []);

   return (

      <Particles
         id="tsparticles"
         init={particlesInit}
         options={{
            background: {
               color: {
                  value: "transparent",
               },
            },
            fpsLimit: 60,
            interactivity: {
               events: {
                  onClick: {
                     enable: true,
                     mode: "push",
                  },
                  onHover: {
                     enable: true,
                     mode: "repulse",
                  },
                  resize: true,
               },
               modes: {
                  push: {
                     quantity: 4,
                  },
                  repulse: {
                     distance: 100,
                     duration: 0.4,
                  },
               },
            },
            particles: {
               color: {
                  value: "#0eaa45",
               },
               links: {
                  color: "#0eaa45",
                  distance: 150,
                  enable: true,
                  opacity: 0.4,
                  width: 1,
               },
               move: {
                  direction: "none",
                  enable: true,
                  outModes: {
                     default: "bounce",
                  },
                  random: false,
                  speed: 1.5,
                  straight: false,
               },
               number: {
                  density: {
                     enable: true,
                     area: 800,
                  },
                  value: 60,
               },
               opacity: {
                  value: 0.5,
               },
               shape: {
                  type: "circle",
               },
               size: {
                  value: { min: 1, max: 3},
               },
            },
            detectRetina: true,
         }}
         style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: -1,
            pointerEvents: "none",
         }}
      />
   );
}