import { DisclaimerBanner } from '@/components/assessment/shared'

export default function AssessmentLandingPage() {
  const enabled = process.env.ASSESSMENT_ENABLED === 'true'

  if (!enabled) {
    return <ComingSoonPage />
  }

  return (
    <main
      style={{
        fontFamily: "var(--font-body, 'Nunito', sans-serif)",
        color: 'var(--color-navy, #000)',
      }}
    >
      {/* Hero Section */}
      <section
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '4rem 1.5rem 2rem',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            color: 'var(--color-navy, #000)',
            marginBottom: '1rem',
          }}
        >
          Find Your Best Path to Canadian Entrepreneurship
        </h1>
        <p
          style={{
            fontSize: '1.1rem',
            lineHeight: 1.6,
            color: 'var(--color-gray, #93a0a9)',
            maxWidth: '600px',
            margin: '0 auto 2rem',
          }}
        >
          Discover which Provincial Nominee Programs match your profile. Our
          assessment evaluates your eligibility across 15+ entrepreneur streams
          in under 5 minutes.
        </p>
        <a
          href="/assessment/questionnaire"
          style={{
            display: 'inline-block',
            padding: '0.875rem 2rem',
            backgroundColor: 'var(--color-cyan, #0099cc)',
            color: '#fff',
            fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
            fontWeight: 700,
            fontSize: '1.05rem',
            borderRadius: 'var(--radius-lg, 12px)',
            textDecoration: 'none',
            transition: 'background-color 0.2s ease',
          }}
        >
          Start Assessment &rarr;
        </a>
      </section>

      {/* Feature Cards */}
      <section
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '1rem 1.5rem 3rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <FeatureCard icon="clock" title="5-Minute Questionnaire" />
        <FeatureCard icon="chart" title="Scored Against 15+ Programs" />
        <FeatureCard icon="target" title="Personalized Gap Analysis" />
      </section>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem 3rem' }}>
        <DisclaimerBanner variant="banner" />
      </div>
    </main>
  )
}

/* ---------- Internal helper components ---------- */

function ComingSoonPage() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        fontFamily: "var(--font-body, 'Nunito', sans-serif)",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
          fontSize: '2rem',
          fontWeight: 800,
          color: 'var(--color-navy, #000)',
          marginBottom: '0.75rem',
        }}
      >
        Assessment Tool &mdash; Coming Soon
      </h1>
      <p
        style={{
          fontSize: '1.05rem',
          color: 'var(--color-gray, #93a0a9)',
          maxWidth: '480px',
          lineHeight: 1.6,
          marginBottom: '2rem',
        }}
      >
        We&apos;re building a comprehensive PNP entrepreneur assessment tool.
        Check back soon!
      </p>
      <a
        href="/"
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.75rem',
          backgroundColor: 'var(--color-cyan, #0099cc)',
          color: '#fff',
          fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
          fontWeight: 700,
          fontSize: '1rem',
          borderRadius: 'var(--radius-lg, 12px)',
          textDecoration: 'none',
        }}
      >
        Return to Homepage
      </a>
    </main>
  )
}

const ICONS: Record<string, React.ReactNode> = {
  clock: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  chart: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  target: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
}

function FeatureCard({ icon, title }: { icon: string; title: string }) {
  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '1.5rem',
        textAlign: 'center',
        boxShadow: 'var(--shadow-card, 0 1px 3px rgba(0,0,0,0.1))',
      }}
    >
      <div
        style={{
          color: 'var(--color-cyan, #0099cc)',
          marginBottom: '0.75rem',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {ICONS[icon]}
      </div>
      <p
        style={{
          fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
          fontWeight: 700,
          fontSize: '0.95rem',
          color: 'var(--color-navy, #000)',
          margin: 0,
        }}
      >
        {title}
      </p>
    </div>
  )
}
