import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 96, fontWeight: 700, color: 'var(--sand)', lineHeight: 1, marginBottom: 16 }}>404</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--soil)', marginBottom: 8 }}>Page not found</h2>
        <p style={{ color: 'var(--earth)', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          Looks like this field hasn't been planted yet. Let's get you back on solid ground.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ gap: 8 }}>
            <ArrowLeft size={14} /> Go back
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ gap: 8 }}>
            <Home size={14} /> Home
          </button>
        </div>
      </div>
    </div>
  )
}
