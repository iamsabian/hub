import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import SpotifyView from './components/spotify/SpotifyView'
import GmailView from './components/gmail/GmailView'
import Settings from './components/Settings'
import ErrorBoundary from './components/ErrorBoundary'

export type View = 'spotify' | 'gmail' | 'settings'

export default function App() {
  const [view, setView] = useState<View>('spotify')
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#121212]">
      <Sidebar
        view={view}
        onNavigate={setView}
        spotifyConnected={spotifyConnected}
        gmailConnected={gmailConnected}
      />
      <main className="flex-1 overflow-hidden">
        <ErrorBoundary key={view}>
          {view === 'spotify' && <SpotifyView connected={spotifyConnected} onConnectionChange={handleConnectionChange} />}
          {view === 'gmail' && <GmailView connected={gmailConnected} onConnectionChange={handleConnectionChange} />}
          {view === 'settings' && <Settings onConnectionChange={handleConnectionChange} />}
        </ErrorBoundary>
      </main>
    </div>
  )
}
