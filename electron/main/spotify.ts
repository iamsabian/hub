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
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return null
  return res.json()
}

// ── Devices ───────────────────────────────────────────────────────────────────

export interface Device {
  id: string
  name: string
  type: string
  is_active: boolean
  volume_percent: number
}

export async function getDevices(): Promise<Device[]> {
  const data = await api('/me/player/devices')
  return data?.devices ?? []
}

/** Returns the active device ID, or transfers to the first available one.
 *  Throws a clear message if no devices are found at all. */
async function ensureDevice(): Promise<string> {
  const devices = await getDevices()
  if (devices.length === 0) {
    throw new Error('No Spotify devices found. Open the Spotify app on any device first.')
  }
  const active = devices.find((d) => d.is_active)
  if (active) return active.id
  // Transfer playback to the first available device (without auto-playing)
  const device = devices[0]
  await api('/me/player', 'PUT', { device_ids: [device.id], play: false })
  // Small wait for Spotify to register the transfer
  await new Promise((r) => setTimeout(r, 500))
  return device.id
}

// ── Tracks ────────────────────────────────────────────────────────────────────

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
  shuffle_state: boolean
  item: Track | null
  device: { id: string; volume_percent: number; name: string } | null
}

export async function getCurrentPlayback(): Promise<PlaybackState | null> {
  return api('/me/player')
}

export async function playPause(isPlaying: boolean): Promise<void> {
  if (isPlaying) {
    await api('/me/player/pause', 'PUT')
  } else {
    const deviceId = await ensureDevice()
    await api(`/me/player/play?device_id=${deviceId}`, 'PUT')
  }
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

// ── Playlists ─────────────────────────────────────────────────────────────────

export interface Playlist {
  id: string
  name: string
  images: { url: string }[]
  items: { total: number }
  uri: string
}

export async function getPlaylists(): Promise<Playlist[]> {
  const meData = await api('/me')
  const userId: string = meData?.id ?? ''

  // Paginate through all playlists (Spotify returns max 50 per page)
  const all: Record<string, unknown>[] = []
  let path: string | null = '/me/playlists?limit=50'
  while (path) {
    const data = await api(path)
    all.push(...(data?.items ?? []))
    const next: string | null = data?.next ?? null
    path = next ? next.replace('https://api.spotify.com/v1', '') : null
  }

  return all.filter((pl) => (pl.owner as Record<string, unknown>)?.id === userId)
}

export async function playPlaylist(uri: string): Promise<void> {
  const deviceId = await ensureDevice()
  await api(`/me/player/play?device_id=${deviceId}`, 'PUT', { context_uri: uri })
}

export async function getPlaylistTracks(playlistId: string): Promise<Track[]> {
  // Each entry: { added_at, added_by, item: { id, name, uri, artists, album, duration_ms } }
  let data: Record<string, unknown> | null
  try {
    data = await api(`/playlists/${playlistId}/items?limit=100`)
  } catch (e: unknown) {
    const msg = (e as Error).message ?? ''
    if (msg.includes('403')) {
      throw new Error('OWNED_BY_OTHER')
    }
    throw e
  }
  const rawItems: unknown[] = Array.isArray(data?.items) ? data.items : []
  return rawItems
    .map((entry: unknown): Track | null => {
      const t = (entry as Record<string, unknown>).item as Record<string, unknown> | null | undefined
      if (t?.id) return t as unknown as Track
      return null
    })
    .filter(Boolean) as Track[]
}

export async function playTrack(uri: string): Promise<void> {
  const deviceId = await ensureDevice()
  await api(`/me/player/play?device_id=${deviceId}`, 'PUT', { uris: [uri] })
}

export async function toggleShuffle(state: boolean): Promise<void> {
  await api(`/me/player/shuffle?state=${state}`, 'PUT')
}

export async function addToQueue(uri: string): Promise<void> {
  // Do NOT call ensureDevice here — transferring the device interrupts playback.
  // The queue endpoint works with the existing active session.
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
