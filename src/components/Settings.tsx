import { useState, useEffect } from 'react'

interface Props {
  onConnectionChange: () => void
}

export default function Settings({ onConnectionChange }: Props) {
  const [spotifyClientId, setSpotifyClientId] = useState('')
  const [googleClientId, setGoogleClientId] = useState('')
  const [googleClientSecret, setGoogleClientSecret] = useState('')
  const [spotifyConnected, setSpotifyConnected] = useState(false)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState('')

  useEffect(() => {
    window.hub.getSettings().then((s) => {
      setSpotifyClientId(s.spotifyClientId ?? '')
      setGoogleClientId(s.googleClientId ?? '')
      setGoogleClientSecret(s.googleClientSecret ?? '')
    })
    window.hub.spotifyIsConnected().then(setSpotifyConnected)
    window.hub.gmailIsConnected().then(setGmailConnected)
  }, [])

  async function saveSettings() {
    await window.hub.saveSettings({ spotifyClientId, googleClientId, googleClientSecret })
    setStatus('Saved!')
    setTimeout(() => setStatus(''), 2000)
  }

  async function connectSpotify() {
    setBusy('spotify')
    try {
      await window.hub.saveSettings({ spotifyClientId, googleClientId, googleClientSecret })
      await window.hub.spotifyConnect()
      setSpotifyConnected(true)
      onConnectionChange()
      setStatus('Spotify connected!')
    } catch (e: unknown) {
      setStatus(`Error: ${(e as Error).message}`)
    } finally {
      setBusy('')
      setTimeout(() => setStatus(''), 3000)
    }
  }

  async function disconnectSpotify() {
    await window.hub.spotifyDisconnect()
    setSpotifyConnected(false)
    onConnectionChange()
  }

  async function connectGmail() {
    setBusy('gmail')
    try {
      await window.hub.saveSettings({ spotifyClientId, googleClientId, googleClientSecret })
      await window.hub.gmailConnect()
      setGmailConnected(true)
      onConnectionChange()
      setStatus('Gmail connected!')
    } catch (e: unknown) {
      setStatus(`Error: ${(e as Error).message}`)
    } finally {
      setBusy('')
      setTimeout(() => setStatus(''), 3000)
    }
  }

  async function disconnectGmail() {
    await window.hub.gmailDisconnect()
    setGmailConnected(false)
    onConnectionChange()
  }

  return (
    <div className="h-full overflow-y-auto p-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-zinc-400 text-sm mb-8">Configure API credentials and connect your accounts.</p>

      {/* Spotify */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[#1DB954] font-semibold text-lg">Spotify</span>
          {spotifyConnected && (
            <span className="text-xs bg-[#1DB954]/20 text-[#1DB954] px-2 py-0.5 rounded-full">Connected</span>
          )}
        </div>
        <p className="text-zinc-400 text-xs mb-3">
          Create an app at{' '}
          <button className="text-[#1DB954] underline" onClick={() => window.hub.openExternal('https://developer.spotify.com/dashboard')}>
            developer.spotify.com
          </button>{' '}
          and add <code className="bg-zinc-800 px-1 rounded text-white">http://127.0.0.1:8888/callback</code> as a redirect URI.
        </p>
        <label className="block text-sm text-zinc-300 mb-1">Client ID</label>
        <input
          className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm text-white mb-3 outline-none focus:ring-2 focus:ring-[#1DB954] font-mono"
          value={spotifyClientId}
          onChange={(e) => setSpotifyClientId(e.target.value)}
          placeholder="e.g. abc123..."
        />
        <div className="flex gap-2">
          <button
            onClick={connectSpotify}
            disabled={!spotifyClientId || busy === 'spotify'}
            className="px-4 py-2 rounded-lg bg-[#1DB954] text-black text-sm font-semibold disabled:opacity-40 hover:bg-[#1ed760] transition-colors"
          >
            {busy === 'spotify' ? 'Waiting for browser…' : spotifyConnected ? 'Reconnect' : 'Connect Spotify'}
          </button>
          {spotifyConnected && (
            <button onClick={disconnectSpotify} className="px-4 py-2 rounded-lg bg-zinc-700 text-sm hover:bg-zinc-600 transition-colors">
              Disconnect
            </button>
          )}
        </div>
      </section>

      {/* Gmail */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[#EA4335] font-semibold text-lg">Gmail</span>
          {gmailConnected && (
            <span className="text-xs bg-[#EA4335]/20 text-[#EA4335] px-2 py-0.5 rounded-full">Connected</span>
          )}
        </div>
        <p className="text-zinc-400 text-xs mb-3">
          Create a{' '}
          <button className="text-[#EA4335] underline" onClick={() => window.hub.openExternal('https://console.cloud.google.com/')}>
            Google Cloud project
          </button>
          , enable the Gmail API, then create OAuth 2.0 credentials as a <strong>Desktop app</strong>. Add <code className="bg-zinc-800 px-1 rounded text-white">http://127.0.0.1:8889/callback</code> as an authorised redirect URI.
        </p>
        <label className="block text-sm text-zinc-300 mb-1">Client ID</label>
        <input
          className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm text-white mb-2 outline-none focus:ring-2 focus:ring-[#EA4335] font-mono"
          value={googleClientId}
          onChange={(e) => setGoogleClientId(e.target.value)}
          placeholder="…apps.googleusercontent.com"
        />
        <label className="block text-sm text-zinc-300 mb-1">Client Secret</label>
        <input
          type="password"
          className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm text-white mb-3 outline-none focus:ring-2 focus:ring-[#EA4335] font-mono"
          value={googleClientSecret}
          onChange={(e) => setGoogleClientSecret(e.target.value)}
          placeholder="GOCSPX-…"
        />
        <div className="flex gap-2">
          <button
            onClick={connectGmail}
            disabled={!googleClientId || !googleClientSecret || busy === 'gmail'}
            className="px-4 py-2 rounded-lg bg-[#EA4335] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#d93025] transition-colors"
          >
            {busy === 'gmail' ? 'Waiting for browser…' : gmailConnected ? 'Reconnect' : 'Connect Gmail'}
          </button>
          {gmailConnected && (
            <button onClick={disconnectGmail} className="px-4 py-2 rounded-lg bg-zinc-700 text-sm hover:bg-zinc-600 transition-colors">
              Disconnect
            </button>
          )}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={saveSettings}
          className="px-4 py-2 rounded-lg bg-zinc-700 text-sm hover:bg-zinc-600 transition-colors"
        >
          Save credentials
        </button>
        {status && <span className="text-sm text-zinc-300">{status}</span>}
      </div>
    </div>
  )
}
