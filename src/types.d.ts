interface HubAPI {
  getSettings(): Promise<Record<string, string>>
  saveSettings(s: Record<string, string>): Promise<void>

  spotifyIsConnected(): Promise<boolean>
  spotifyConnect(): Promise<void>
  spotifyDisconnect(): Promise<void>
  spotifyGetCurrentTrack(): Promise<SpotifyPlayback | null>
  spotifyPlayPause(isPlaying: boolean): Promise<void>
  spotifyNext(): Promise<void>
  spotifyPrevious(): Promise<void>
  spotifySetVolume(v: number): Promise<void>
  spotifyGetPlaylists(): Promise<SpotifyPlaylist[]>
  spotifyPlayPlaylist(uri: string): Promise<void>
  spotifyGetQueue(): Promise<{ currently_playing: SpotifyTrack | null; queue: SpotifyTrack[] }>
  spotifyGetDevices(): Promise<SpotifyDevice[]>
  spotifyPlayTrack(uri: string): Promise<void>
  spotifyGetPlaylistTracks(id: string): Promise<SpotifyTrack[]>
  spotifyToggleShuffle(state: boolean): Promise<void>
  spotifyAddToQueue(uri: string): Promise<void>

  gmailIsConnected(): Promise<boolean>
  gmailConnect(): Promise<void>
  gmailDisconnect(): Promise<void>
  gmailGetInbox(query?: string): Promise<GmailMessage[]>
  gmailGetMessage(id: string): Promise<GmailFullMessage>
  gmailSendReply(opts: { to: string; subject: string; body: string; threadId: string; inReplyTo: string }): Promise<void>
  gmailSearch(query: string): Promise<GmailMessage[]>

  openExternal(url: string): Promise<void>
}

interface SpotifyTrack {
  id: string
  name: string
  uri: string
  artists: { name: string }[]
  album: { name: string; images: { url: string }[] }
  duration_ms: number
}

interface SpotifyDevice {
  id: string
  name: string
  type: string
  is_active: boolean
  volume_percent: number
}

interface SpotifyPlayback {
  is_playing: boolean
  progress_ms: number
  shuffle_state: boolean
  item: SpotifyTrack | null
  device: { volume_percent: number; name: string } | null
}

interface SpotifyPlaylist {
  id: string
  name: string
  images: { url: string }[]
  items: { total: number }
  tracks?: { total: number }
  uri: string
}

interface GmailMessage {
  id: string
  threadId: string
  snippet: string
  from: string
  subject: string
  date: string
  unread: boolean
}

interface GmailFullMessage extends GmailMessage {
  body: string
  messageId: string
  to: string
}

declare global {
  interface Window {
    hub: HubAPI
  }
}

export {}
