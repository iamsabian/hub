import { useState, useEffect, useRef, useCallback } from 'react'

interface Props {
  connected: boolean
  onConnectionChange: () => void
}

function ms(ms: number) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0')
  return `${m}:${s}`
}

function PrevIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
}
function PlayIcon() {
  return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
}
function PauseIcon() {
  return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
}
function NextIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm8.5-6 1.5 1.06V8.94L14.5 12z M16 6h2v12h-2z"/></svg>
}
function VolumeIcon({ muted }: { muted: boolean }) {
  return muted
    ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.72 18L19 19.27 20.27 18 5.27 3 4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>
    : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
}

export default function SpotifyView({ connected, onConnectionChange }: Props) {
  const [playback, setPlayback] = useState<SpotifyPlayback | null>(null)
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [queue, setQueue] = useState<SpotifyTrack[]>([])
  const [tab, setTab] = useState<'playlists' | 'queue'>('playlists')
  const [volume, setVolume] = useState(50)
  const [error, setError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchPlayback = useCallback(async () => {
    if (!connected) return
    try {
      const p = await window.hub.spotifyGetCurrentTrack()
      setPlayback(p)
      if (p?.device) setVolume(p.device.volume_percent)
      setError('')
    } catch (e: unknown) {
      setError((e as Error).message)
    }
  }, [connected])

  useEffect(() => {
    if (!connected) return
    fetchPlayback()
    window.hub.spotifyGetPlaylists().then(setPlaylists).catch(() => {})
    pollRef.current = setInterval(fetchPlayback, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [connected, fetchPlayback])

  useEffect(() => {
    if (connected && tab === 'queue') {
      window.hub.spotifyGetQueue().then((q) => setQueue(q.queue)).catch(() => {})
    }
  }, [connected, tab])

  async function handlePlayPause() {
    if (!playback) return
    await window.hub.spotifyPlayPause(playback.is_playing)
    setTimeout(fetchPlayback, 300)
  }

  async function handleNext() {
    await window.hub.spotifyNext()
    setTimeout(fetchPlayback, 600)
  }

  async function handlePrev() {
    await window.hub.spotifyPrevious()
    setTimeout(fetchPlayback, 600)
  }

  async function handleVolume(v: number) {
    setVolume(v)
    await window.hub.spotifySetVolume(v)
  }

  async function handlePlaylist(uri: string) {
    await window.hub.spotifyPlayPlaylist(uri)
    setTimeout(fetchPlayback, 800)
  }

  if (!connected) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-400">
        <div className="text-[#1DB954] mb-4">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.516 17.311c-.217.356-.68.468-1.037.251-2.84-1.735-6.417-2.128-10.63-1.166-.406.093-.81-.161-.902-.567-.093-.406.16-.81.566-.902 4.61-1.053 8.566-.6 11.752 1.347.357.218.469.681.251 1.037zm1.471-3.272c-.273.444-.854.583-1.298.31-3.25-1.997-8.2-2.576-12.038-1.41-.499.15-1.025-.132-1.176-.631-.15-.499.131-1.025.63-1.176 4.387-1.332 9.839-.686 13.572 1.608.444.273.583.854.31 1.299zm.126-3.407c-3.9-2.317-10.336-2.529-14.064-1.399-.598.182-1.23-.154-1.412-.752-.182-.598.154-1.23.752-1.412 4.277-1.299 11.387-1.048 15.886 1.617.538.32.716 1.013.396 1.551-.32.537-1.013.716-1.558.395z"/></svg>
        </div>
        <p className="text-lg font-medium mb-2">Connect Spotify</p>
        <p className="text-sm text-zinc-500">Go to Settings to add your credentials.</p>
      </div>
    )
  }

  const track = playback?.item
  const albumArt = track?.album?.images?.[0]?.url

  return (
    <div className="flex flex-col h-full">
      {/* Now playing */}
      <div className="flex items-center gap-5 px-6 py-5 bg-zinc-900/50 border-b border-zinc-800">
        {albumArt ? (
          <img src={albumArt} alt="album art" className="w-16 h-16 rounded-md shadow-lg shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
            <span className="text-zinc-600 text-2xl">♪</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{track?.name ?? 'Nothing playing'}</p>
          <p className="text-sm text-zinc-400 truncate">{track?.artists?.map((a) => a.name).join(', ')}</p>
          {track && (
            <p className="text-xs text-zinc-500 truncate">{track?.album?.name}</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={handlePrev} className="text-zinc-400 hover:text-white transition-colors">
              <PrevIcon />
            </button>
            <button
              onClick={handlePlayPause}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
            >
              {playback?.is_playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button onClick={handleNext} className="text-zinc-400 hover:text-white transition-colors">
              <NextIcon />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => handleVolume(0)} className="text-zinc-500 hover:text-white">
              <VolumeIcon muted={volume === 0} />
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => handleVolume(Number(e.target.value))}
              className="w-24 accent-[#1DB954] cursor-pointer"
            />
            <span className="text-xs text-zinc-500 w-6">{volume}</span>
          </div>
        </div>

        {track && (
          <div className="text-xs text-zinc-500 w-20 text-right shrink-0">
            {ms(playback?.progress_ms ?? 0)} / {ms(track.duration_ms)}
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-xs px-6 py-2">{error}</p>}

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4 pb-2 border-b border-zinc-800">
        {(['playlists', 'queue'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors
              ${tab === t ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'playlists' && (
          <ul>
            {playlists.map((pl) => (
              <li key={pl.id}>
                <button
                  onClick={() => handlePlaylist(pl.uri)}
                  className="w-full flex items-center gap-3 px-6 py-3 hover:bg-zinc-800/50 transition-colors text-left"
                >
                  {pl.images[0] ? (
                    <img src={pl.images[0].url} alt="" className="w-10 h-10 rounded shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-zinc-800 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{pl.name}</p>
                    <p className="text-xs text-zinc-500">{pl.tracks.total} tracks</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {tab === 'queue' && (
          <ul>
            {queue.length === 0 && (
              <li className="px-6 py-8 text-zinc-500 text-sm text-center">Queue is empty</li>
            )}
            {queue.map((track, i) => (
              <li key={`${track.id}-${i}`} className="flex items-center gap-3 px-6 py-3 hover:bg-zinc-800/50">
                {track.album.images[0] ? (
                  <img src={track.album.images[0].url} alt="" className="w-9 h-9 rounded shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded bg-zinc-800 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{track.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{track.artists.map((a) => a.name).join(', ')}</p>
                </div>
                <span className="text-xs text-zinc-600">{ms(track.duration_ms)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Spotify Premium note */}
      <p className="text-center text-xs text-zinc-700 py-2">Playback controls require Spotify Premium</p>
    </div>
  )
}
