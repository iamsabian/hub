import { useState, useEffect } from 'react'
import SpotifyView from './components/spotify/SpotifyView'
import GmailView from './components/gmail/GmailView'
import Settings from './components/Settings'
import ErrorBoundary from './components/ErrorBoundary'

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.92c.04-.3.07-.62.07-.95 0-.33-.03-.65-.07-.96l2.06-1.61c.19-.15.24-.42.12-.64l-1.95-3.38c-.12-.22-.39-.3-.61-.22l-2.43.98c-.5-.38-1.04-.7-1.62-.95L14.8 2.84c-.04-.24-.24-.42-.49-.42h-3.9c-.25 0-.45.18-.49.42l-.37 2.61c-.58.25-1.12.57-1.62.95l-2.43-.98c-.23-.09-.49 0-.61.22L3.44 8.64c-.13.22-.07.49.12.64l2.06 1.61c-.04.31-.07.63-.07.96 0 .33.03.65.07.96l-2.06 1.61c-.19.15-.24.42-.12.64l1.95 3.38c.12.22.39.3.61.22l2.43-.98c.5.38 1.04.7 1.62.95l.37 2.61c.04.24.24.42.49.42h3.9c.25 0 .45-.18.49-.42l.37-2.61c.58-.25 1.12-.57 1.62-.95l2.43.98c.23.09.49 0 .61-.22l1.95-3.38c.12-.22.07-.49-.12-.64l-2.06-1.61z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  )
}

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [spotifyConnected, setSpotifyConnected] = useState(false)
  const [gmailConnected, setGmailConnected] = useState(false)

  useEffect(() => {
    window.hub.spotifyIsConnected().then(setSpotifyConnected)
    window.hub.gmailIsConnected().then(setGmailConnected)
  }, [])

  function handleConnectionChange() {
    window.hub.spotifyIsConnected().then(setSpotifyConnected)
    window.hub.gmailIsConnected().then(setGmailConnected)
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#121212]">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 h-10 shrink-0 bg-[#0a0a0a] border-b border-zinc-800">
        <span className="text-sm font-bold tracking-widest text-white uppercase">Hub</span>
        <button
          onClick={() => setSettingsOpen(true)}
          className="text-zinc-400 hover:text-white transition-colors"
          title="Settings"
        >
          <GearIcon />
        </button>
      </header>

      {/* ── Two panels ──────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Spotify — left panel */}
        <div className="w-[400px] shrink-0 border-r border-zinc-800 overflow-hidden flex flex-col">
          <ErrorBoundary key="spotify">
            <SpotifyView connected={spotifyConnected} onConnectionChange={handleConnectionChange} />
          </ErrorBoundary>
        </div>

        {/* Gmail — right panel */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ErrorBoundary key="gmail">
            <GmailView connected={gmailConnected} onConnectionChange={handleConnectionChange} />
          </ErrorBoundary>
        </div>

      </div>

      {/* ── Settings overlay ─────────────────────────────────────── */}
      {settingsOpen && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={(e) => { if (e.target === e.currentTarget) setSettingsOpen(false) }}
        >
          <div className="relative bg-[#181818] border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto">
            <button
              onClick={() => setSettingsOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10"
            >
              <CloseIcon />
            </button>
            <ErrorBoundary key="settings">
              <Settings onConnectionChange={() => { handleConnectionChange(); setSettingsOpen(false) }} />
            </ErrorBoundary>
          </div>
        </div>
      )}

    </div>
  )
}
