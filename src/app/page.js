import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.badge}>Memory Match Website</p>
          <h1>Find your photos instantly with face search or secure password access.</h1>
          <p>
            Add your images in <strong>public/dataset</strong>. You can use face
            matching to find your own photos, or use the password option to open
            the full gallery.
          </p>
        </section>

        <section className={styles.actionGrid}>
          <article className={styles.card}>
            <h2>Open Face Search</h2>
            <p>
              Upload a selfie and the system will return only related images from
              your dataset.
            </p>
            <Link className={styles.primary} href="/find-me">
              Start Face Search
            </Link>
          </article>

          <article className={styles.card}>
            <h2>Password Access</h2>
            <p>
              If no face is detected or you want full access, enter password and
              view all available photos.
            </p>
            <Link className={styles.secondary} href="/access-all">
              Open With Password
            </Link>
          </article>
        </section>

        <section className={styles.infoRow}>
          <div>
            <h3>How It Works</h3>
            <p>1. Upload selfie. 2. Match from dataset. 3. See relevant photos.</p>
          </div>
          <div>
            <h3>Security Goal</h3>
            <p>Only matched images should be visible to the user by default.</p>
          </div>
          <div>
            <h3>Stack</h3>
            <p>Next.js backend + React frontend + JavaScript only workflow.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
