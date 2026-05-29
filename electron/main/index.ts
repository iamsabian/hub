import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import * as store from './store'
import * as auth from './auth'
import * as spotify from './spotify'
import * as gmail from './gmail'

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#121212',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── Settings ──────────────────────────────────────────────────────────────────

ipcMain.handle('get-settings', () => store.get('settings') ?? {})

ipcMain.handle('save-settings', (_e, settings) => {
  store.set('settings', settings)
})

// ── Spotify ───────────────────────────────────────────────────────────────────

ipcMain.handle('spotify:is-connected', () => auth.spotifyIsConnected())

ipcMain.handle('spotify:connect', async () => {
  await auth.spotifyConnect()
})

ipcMain.handle('spotify:disconnect', () => auth.spotifyDisconnect())

ipcMain.handle('spotify:get-current-track', async () => {
  return spotify.getCurrentPlayback()
})

ipcMain.handle('spotify:play-pause', async (_e, isPlaying: boolean) => {
  await spotify.playPause(isPlaying)
})

ipcMain.handle('spotify:next', async () => {
  await spotify.skipNext()
})

ipcMain.handle('spotify:previous', async () => {
  await spotify.skipPrevious()
})

ipcMain.handle('spotify:set-volume', async (_e, volume: number) => {
  await spotify.setVolume(volume)
})

ipcMain.handle('spotify:get-playlists', async () => {
  return spotify.getPlaylists()
})

ipcMain.handle('spotify:play-playlist', async (_e, uri: string) => {
  await spotify.playPlaylist(uri)
})

ipcMain.handle('spotify:get-queue', async () => {
  return spotify.getQueue()
})

// ── Gmail ─────────────────────────────────────────────────────────────────────

ipcMain.handle('gmail:is-connected', () => auth.gmailIsConnected())

ipcMain.handle('gmail:connect', async () => {
  await auth.gmailConnect()
})

ipcMain.handle('gmail:disconnect', () => auth.gmailDisconnect())

ipcMain.handle('gmail:get-inbox', async (_e, query?: string) => {
  return gmail.getInbox(query)
})

ipcMain.handle('gmail:get-message', async (_e, id: string) => {
  const msg = await gmail.getMessage(id)
  await gmail.markAsRead(id)
  return msg
})

ipcMain.handle('gmail:send-reply', async (_e, opts) => {
  await gmail.sendReply(opts)
})

ipcMain.handle('gmail:search', async (_e, query: string) => {
  return gmail.getInbox(query)
})

// Open external links in the default browser
ipcMain.handle('open-external', (_e, url: string) => {
  shell.openExternal(url)
})
