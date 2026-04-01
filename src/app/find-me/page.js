"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import styles from "./page.module.css";

export default function FindMePage() {
  const [selfie, setSelfie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [matches, setMatches] = useState([]);

  const preview = useMemo(() => {
    if (!selfie) return "";
    return URL.createObjectURL(selfie);
  }, [selfie]);

  async function onSubmit(event) {
    event.preventDefault();
    if (!selfie) {
      setMessage("Please choose a selfie first.");
      return;
    }

    const formData = new FormData();
    formData.append("selfie", selfie);

    setLoading(true);
    setMessage("Matching faces from dataset...");
    setMatches([]);

    try {
      const response = await fetch("/api/match", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Matching failed");
      }

      setMatches(data.matches || []);
      setMessage(data.message || "Completed");
    } catch (error) {
      setMessage(error.message || "Failed to match faces.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <section className={styles.panel}>
        <h1>Find My Photos</h1>
        <p>Upload one selfie and find matching photos from public/dataset.</p>

        <form onSubmit={onSubmit} className={styles.form}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelfie(e.target.files?.[0] || null)}
          />
          <button disabled={loading} type="submit">
            {loading ? "Analyzing..." : "Find Matches"}
          </button>
        </form>

        {preview ? (
          <div className={styles.preview}>
            <h3>Selfie Preview</h3>
            <Image
              src={preview}
              alt="Uploaded selfie"
              width={260}
              height={260}
              unoptimized
              style={{ borderRadius: 8, height: "auto" }}
            />
          </div>
        ) : null}

        {message ? <p className={styles.status}>{message}</p> : null}

        {matches.length > 0 ? (
          <section>
            <h2>Matched Images</h2>
            <div className={styles.grid}>
              {matches.map((item) => (
                <figure key={item.path} className={styles.card}>
                  <Image
                    src={item.path}
                    alt={item.fileName}
                    width={320}
                    height={220}
                    style={{ width: "100%", height: "auto" }}
                  />
                  <figcaption>{item.fileName}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
