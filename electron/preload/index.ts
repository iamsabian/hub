import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s: unknown) => ipcRenderer.invoke('save-settings', s),

  // Spotify
  spotifyIsConnected: () => ipcRenderer.invoke('spotify:is-connected'),
  spotifyConnect: () => ipcRenderer.invoke('spotify:connect'),
  spotifyDisconnect: () => ipcRenderer.invoke('spotify:disconnect'),
  spotifyGetCurrentTrack: () => ipcRenderer.invoke('spotify:get-current-track'),
  spotifyPlayPause: (isPlaying: boolean) => ipcRenderer.invoke('spotify:play-pause', isPlaying),
  spotifyNext: () => ipcRenderer.invoke('spotify:next'),
  spotifyPrevious: () => ipcRenderer.invoke('spotify:previous'),
  spotifySetVolume: (v: number) => ipcRenderer.invoke('spotify:set-volume', v),
  spotifyGetPlaylists: () => ipcRenderer.invoke('spotify:get-playlists'),
  spotifyPlayPlaylist: (uri: string) => ipcRenderer.invoke('spotify:play-playlist', uri),
  spotifyGetQueue: () => ipcRenderer.invoke('spotify:get-queue'),
  spotifyGetDevices: () => ipcRenderer.invoke('spotify:get-devices'),
  spotifyPlayTrack: (uri: string) => ipcRenderer.invoke('spotify:play-track', uri),
  spotifyGetPlaylistTracks: (id: string) => ipcRenderer.invoke('spotify:get-playlist-tracks', id),
  spotifyToggleShuffle: (state: boolean) => ipcRenderer.invoke('spotify:toggle-shuffle', state),
  spotifyAddToQueue: (uri: string) => ipcRenderer.invoke('spotify:add-to-queue', uri),

  // Gmail
  gmailIsConnected: () => ipcRenderer.invoke('gmail:is-connected'),
  gmailConnect: () => ipcRenderer.invoke('gmail:connect'),
  gmailDisconnect: () => ipcRenderer.invoke('gmail:disconnect'),
  gmailGetInbox: (query?: string) => ipcRenderer.invoke('gmail:get-inbox', query),
  gmailGetMessage: (id: string) => ipcRenderer.invoke('gmail:get-message', id),
  gmailSendReply: (opts: unknown) => ipcRenderer.invoke('gmail:send-reply', opts),
  gmailSearch: (query: string) => ipcRenderer.invoke('gmail:search', query),

  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
}

contextBridge.exposeInMainWorld('hub', api)
