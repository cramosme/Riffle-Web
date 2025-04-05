"use client";

import React, { useState } from "react";
import styles from "./page.module.css";

export default function MySlider() {
  const [sliderValue, setSliderValue] = useState(0);

  return (
    <div className={styles.container}>
      <input
        type="range"
        min="0"
        max="100"
        value={sliderValue}
        className={styles.slider}
        onChange={(e) => setSliderValue(parseFloat(e.target.value))}
      />
      <p className={styles.sliderValue}>Value: {sliderValue.toFixed(0)}</p>
    </div>
  );
}