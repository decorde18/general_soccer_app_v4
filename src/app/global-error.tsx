"use client";

import React from "react";

export default function GlobalError() {
  return (
    <html lang="en">
      <body style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb", fontFamily: "sans-serif", margin: 0 }}>
        <div style={{ textAlign: "center", maxWidth: "400px", padding: "20px" }}>
          <h1 style={{ fontSize: "2rem", color: "#dc2626", fontWeight: "bold" }}>Something went wrong!</h1>
          <p style={{ color: "#4b5563", marginTop: "10px" }}>
            A critical application error occurred.
          </p>
          <a
            href="/"
            style={{ display: "inline-block", marginTop: "20px", padding: "10px 20px", backgroundColor: "#2563eb", color: "#ffffff", borderRadius: "6px", textDecoration: "none", fontWeight: "600" }}
          >
            Return Home
          </a>
        </div>
      </body>
    </html>
  );
}
