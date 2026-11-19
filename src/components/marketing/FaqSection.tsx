import type { Dictionary } from '@/lib/i18n'
import { Container } from './Container'
import styles from './landing.module.css'
import { Section } from './Section'

/**
 * The questions a buyer actually asks, answered from what the product does.
 *
 * Native <details>, not a JS accordion: it opens without hydration, it is
 * findable by the browser's own in-page search, and it needs no ARIA. Every
 * answer is a claim about code or the legal pages, because this same text is
 * emitted as FAQPage structured data and an answer engine quotes it verbatim.
 */
export function FaqSection({ t }: { t: Dictionary }) {
  return (
    <Section id="faq" tone="rule">
      <Container width="text">
        <div className={styles.head}>
          <span className="mk-eyebrow">{t.faq.eyebrow}</span>
          <h2 className="mk-display-lg">{t.faq.title}</h2>
        </div>
        <div className={styles.faq}>
          {t.faq.items.map((item) => (
            <details key={item.question} className={styles.faqItem}>
              <summary className={styles.faqQuestion}>{item.question}</summary>
              <p className={styles.faqAnswer}>{item.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  )
}
