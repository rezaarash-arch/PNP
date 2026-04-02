import styles from './DisclaimerBanner.module.css'

const DEFAULT_TEXT =
  'This assessment provides estimates based on publicly available program information and does not constitute legal immigration advice. Consult a licensed consultant for personalized guidance.'

interface DisclaimerBannerProps {
  /** 'banner' renders a full-width bar with background; 'inline' renders small plain text */
  variant: 'banner' | 'inline'
  /** Optional additional CSS class name */
  className?: string
  /** Override the default disclaimer text */
  children?: string
}

export default function DisclaimerBanner({
  variant,
  className,
  children,
}: DisclaimerBannerProps) {
  const text = children ?? DEFAULT_TEXT

  if (variant === 'inline') {
    return (
      <p
        className={[styles.inline, className].filter(Boolean).join(' ')}
        role="note"
        aria-label="Disclaimer"
      >
        {text}
      </p>
    )
  }

  return (
    <aside
      className={[styles.banner, className].filter(Boolean).join(' ')}
      role="note"
      aria-label="Disclaimer"
    >
      <span className={styles.bannerIcon} aria-hidden="true">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <line x1="8" y1="5" x2="8" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
        </svg>
      </span>
      <p className={styles.bannerText}>{text}</p>
    </aside>
  )
}
