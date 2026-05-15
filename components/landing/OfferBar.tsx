"use client";

import { useEffect, useState } from "react";

function getSecondsUntilEndOfMonth(): number {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
  return Math.floor((end.getTime() - now.getTime()) / 1000);
}

function formatTime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return { d, h, m, s };
}

export default function OfferBar() {
  const [seconds, setSeconds] = useState(getSecondsUntilEndOfMonth());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  const { d, h, m, s } = formatTime(seconds);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: "linear-gradient(90deg, #dc2626 0%, #b91c1c 50%, #dc2626 100%)",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0.55rem 2.5rem 0.55rem 1rem",
      fontSize: "0.875rem",
      fontWeight: 500,
      gap: "1rem",
      minHeight: "40px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <span style={{
          background: "rgba(255,255,255,0.2)",
          border: "1px solid rgba(255,255,255,0.35)",
          borderRadius: "100px",
          padding: "0.1rem 0.65rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.03em",
          whiteSpace: "nowrap",
        }}>
          🔥 OFERTA DE LANZAMIENTO
        </span>

        <span style={{ color: "rgba(255,255,255,0.95)" }}>
          50% OFF el primer mes — solo quedan{" "}
          <strong style={{
            fontFamily: "'Courier New', monospace",
            fontWeight: 700,
            fontSize: "1rem",
            background: "rgba(0,0,0,0.25)",
            padding: "0.05rem 0.4rem",
            borderRadius: "4px",
            letterSpacing: "0.05em",
          }}>
            {d}d {pad(h)}:{pad(m)}:{pad(s)}
          </strong>
        </span>

        <a href="/registro" style={{
          background: "#fff",
          color: "#b91c1c",
          fontWeight: 700,
          fontSize: "0.8rem",
          padding: "0.25rem 0.85rem",
          borderRadius: "100px",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}>
          Reclamar ahora
        </a>
      </div>

      <button
        onClick={() => setVisible(false)}
        aria-label="Cerrar"
        style={{
          position: "absolute",
          right: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.7)",
          cursor: "pointer",
          fontSize: "0.8rem",
          padding: "0.25rem",
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}