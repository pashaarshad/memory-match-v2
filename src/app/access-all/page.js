"use client";

import Image from "next/image";
import { useState } from "react";

import styles from "./page.module.css";

export default function AccessAllPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Enter password to open full gallery.");
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("Checking password...");

    try {
      const response = await fetch("/api/access-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Access denied.");
      }

      setPhotos(data.photos || []);
      setMessage(`Access granted. Loaded ${data.count} photos.`);
    } catch (error) {
      setPhotos([]);
      setMessage(error.message || "Failed to verify password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <section className={styles.panel}>
        <h1>Password Gallery Access</h1>
        <p>
          This option opens the complete dataset gallery. Configure
          GALLERY_ACCESS_PASSWORD in environment for production use.
        </p>

        <form className={styles.form} onSubmit={onSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Open All Photos"}
          </button>
        </form>

        <p className={styles.status}>{message}</p>

        {photos.length > 0 ? (
          <div className={styles.grid}>
            {photos.map((item) => (
              <figure key={item.path} className={styles.card}>
                <Image
                  src={item.path}
                  alt={item.fileName}
                  width={360}
                  height={240}
                  style={{ width: "100%", height: "auto" }}
                />
                <figcaption>{item.fileName}</figcaption>
              </figure>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
