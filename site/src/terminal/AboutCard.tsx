import { BIO } from '@/content/bio';
import styles from './AboutCard.module.css';

export function AboutCard() {
  return (
    <div className={styles.card} data-inline-slug="about">
      <div className={styles.kicker}>§ COLOPHON</div>
      <h2 className={styles.title}>Randy Ren</h2>
      <p className={styles.blurb}>{BIO.about}</p>
      <div className={styles.rule} />
      <dl className={styles.meta}>
        <dt>Based</dt>
        <dd>San Francisco, CA</dd>
        <dt>Focus</dt>
        <dd>AI × Interface</dd>
        <dt>Status</dt>
        <dd>Open Fall 2026</dd>
        <dt>Practice</dt>
        <dd>Design + Engineering</dd>
      </dl>
      <div className={styles.hint}>
        Type <code>cat contact</code> to reach out.
      </div>
    </div>
  );
}
