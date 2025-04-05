"use client";

import React, { useState } from "react";

export default function MySlider() {
  const [sliderValue, setSliderValue] = useState(0);

  // Inline styling
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#25292e",
    height: "100vh",
  };

  const sliderStyle = {
    width: "300px",
  };

  const textStyle = {
    color: "#fff",
    fontSize: "25px",
    marginTop: "20px",
  };

  return (
    <div style={containerStyle}>
      <input
        type="range"
        min="0"
        max="100"
        value={sliderValue}
        style={sliderStyle}
        onChange={(e) => setSliderValue(parseFloat(e.target.value))}
      />
      <p style={textStyle}>Value: {sliderValue.toFixed(0)}</p>
    </div>
  );
}
