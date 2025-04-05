"use client";

import React from "react";

export default function CustomButton({ label, onClick }) {
  return (
    <>
      <button className="custom-button" onClick={onClick}>
        {label}
      </button>
      <style jsx>{`
        .custom-button {
          background-color: #0eaa45;
          border: none;
          border-radius: 15px;
          padding: 12px 20px;
          margin-right: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-family: "Lato-Bold", sans-serif;
          color: #fff;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .custom-button:active {
          background-color: #0c8a3e;
        }
      `}</style>
    </>
  );
}
