import '@/styles/assessment.css'

export const metadata = {
  title: 'PNP Assessment | GenesisLink',
  description:
    'Evaluate your eligibility for Canadian Provincial Nominee Program entrepreneur streams',
}

export default function AssessmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {children}
    </div>
  )
}
