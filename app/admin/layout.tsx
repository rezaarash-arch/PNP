import Link from 'next/link'

export const metadata = {
  title: 'Admin | GenesisLink',
  description: 'GenesisLink administration dashboard',
}

const sidebarStyle: React.CSSProperties = {
  width: 220,
  minHeight: '100vh',
  backgroundColor: '#1a1a2e',
  color: '#e0e0e0',
  display: 'flex',
  flexDirection: 'column',
  padding: '24px 0',
}

const logoStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  padding: '0 20px 24px',
  borderBottom: '1px solid #2a2a4a',
  marginBottom: 16,
  color: '#ffffff',
  letterSpacing: '0.02em',
}

const navLinkStyle: React.CSSProperties = {
  display: 'block',
  padding: '10px 20px',
  color: '#b0b0c8',
  textDecoration: 'none',
  fontSize: 14,
  borderLeft: '3px solid transparent',
  transition: 'background 0.15s',
}

const contentStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#ffffff',
  minHeight: '100vh',
  padding: '32px 40px',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={sidebarStyle}>
        <div style={logoStyle}>GenesisLink Admin</div>
        <nav>
          <Link
            href="/admin/pipeline"
            style={navLinkStyle}
          >
            Pipeline
          </Link>
          <Link
            href="/admin/programs"
            style={navLinkStyle}
          >
            Programs
          </Link>
        </nav>
      </aside>
      <main style={contentStyle}>{children}</main>
    </div>
  )
}
