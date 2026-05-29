import { spotifyGetToken } from './auth'

async function api(path: string, method = 'GET', body?: unknown) {
  const token = await spotifyGetToken()
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return null
  if (!res.ok) throw new Error(`Spotify ${res.status}: ${await res.text()}`)
  return res.json()
}

export interface Track {
  id: string
  name: string
  artists: { name: string }[]
  album: { name: string; images: { url: string }[] }
  duration_ms: number
}

export interface PlaybackState {
  is_playing: boolean
  progress_ms: number
  item: Track | null
  device: { volume_percent: number; name: string } | null
}

export async function getCurrentPlayback(): Promise<PlaybackState | null> {
  return api('/me/player')
}

export async function playPause(isPlaying: boolean): Promise<void> {
  await api(`/me/player/${isPlaying ? 'pause' : 'play'}`, 'PUT')
}

export async function skipNext(): Promise<void> {
  await api('/me/player/next', 'POST')
}

export async function skipPrevious(): Promise<void> {
  await api('/me/player/previous', 'POST')
}

export async function setVolume(percent: number): Promise<void> {
  await api(`/me/player/volume?volume_percent=${Math.round(percent)}`, 'PUT')
}

export interface Playlist {
  id: string
  name: string
  images: { url: string }[]
  tracks: { total: number }
  uri: string
}

export async function getPlaylists(): Promise<Playlist[]> {
  const data = await api('/me/playlists?limit=50')
  return data?.items ?? []
}

export async function playPlaylist(uri: string): Promise<void> {
  await api('/me/player/play', 'PUT', { context_uri: uri })
}

export async function getPlaylistTracks(playlistId: string): Promise<Track[]> {
  const data = await api(`/playlists/${playlistId}`)
  // Inspect the structure so we can verify the exact path
  const itemsVal = data?.items
  throw new Error(
    `DEBUG items type=${typeof itemsVal} isArray=${Array.isArray(itemsVal)} ` +
    `keys=${itemsVal && typeof itemsVal === 'object' ? Object.keys(itemsVal).join(',') : 'n/a'} ` +
    `items.items isArray=${Array.isArray((itemsVal as Record<string,unknown>)?.items)} ` +
    `items.items length=${((itemsVal as Record<string,unknown>)?.items as unknown[])?.length ?? 'n/a'} ` +
    `first=${JSON.stringify(((itemsVal as Record<string,unknown>)?.items as unknown[])?.[0]).substring(0,150)}`
  )
}

export async function toggleShuffle(state: boolean): Promise<void> {
  await api(`/me/player/shuffle?state=${state}`, 'PUT')
}

export async function addToQueue(uri: string): Promise<void> {
  await api(`/me/player/queue?uri=${encodeURIComponent(uri)}`, 'POST')
}

export interface QueueItem {
  id: string
  name: string
  artists: { name: string }[]
  album: { images: { url: string }[] }
  duration_ms: number
}

export async function getQueue(): Promise<{ currently_playing: QueueItem | null; queue: QueueItem[] }> {
  const data = await api('/me/player/queue')
  return { currently_playing: data?.currently_playing ?? null, queue: data?.queue ?? [] }
}
