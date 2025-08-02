import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <main className="container">
      <section className={styles.hero}>
        <h1>Welcome to Bodal.dev</h1>
        <p className={styles.lead}>
          A personal space for thoughts, projects, and explorations in web development.
        </p>
      </section>

      <section className={styles.sections}>
        <div className={styles.sectionCard}>
          <h2>About</h2>
          <p>Learn more about my journey and experience in software development.</p>
          <Link href="/about">Read more →</Link>
        </div>

        <div className={styles.sectionCard}>
          <h2>Projects</h2>
          <p>Explore my open source contributions and personal projects.</p>
          <Link href="/projects">View projects →</Link>
        </div>

        <div className={styles.sectionCard}>
          <h2>Blog</h2>
          <p>Technical articles, tutorials, and thoughts on web development.</p>
          <Link href="/blog">Read blog →</Link>
        </div>
      </section>
    </main>
  );
}