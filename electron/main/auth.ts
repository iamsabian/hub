import { shell } from 'electron'
import http from 'http'
import crypto from 'crypto'
import * as store from './store'

// ── helpers ──────────────────────────────────────────────────────────────────

function randomPort(): Promise<number> {
  return new Promise((resolve) => {
    const srv = http.createServer()
    srv.listen(0, () => {
      const port = (srv.address() as { port: number }).port
      srv.close(() => resolve(port))
    })
  })
}

function waitForCallback(port: number): Promise<URLSearchParams> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const params = new URL(req.url!, `http://localhost:${port}`).searchParams
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(`<html><body style="font-family:sans-serif;background:#121212;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
        <h2>✓ Connected! You can close this tab.</h2>
      </body></html>`)
      server.close()
      resolve(params)
    })
    server.listen(port)
    setTimeout(() => { server.close(); reject(new Error('Auth timeout')) }, 120_000)
  })
}

// ── Spotify ───────────────────────────────────────────────────────────────────

const SPOTIFY_SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-read-collaborative',
].join(' ')

export async function spotifyConnect(): Promise<void> {
  const settings = store.get('settings')
  if (!settings?.spotifyClientId) throw new Error('Spotify Client ID not set')

  const port = await randomPort()
  const redirectUri = `http://localhost:${port}/callback`
  const verifier = crypto.randomBytes(64).toString('base64url')
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
  const state = crypto.randomBytes(16).toString('hex')

  const url = new URL('https://accounts.spotify.com/authorize')
  url.searchParams.set('client_id', settings.spotifyClientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', SPOTIFY_SCOPES)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('state', state)

  shell.openExternal(url.toString())
  const params = await waitForCallback(port)

  if (params.get('state') !== state) throw new Error('State mismatch')
  const code = params.get('code')
  if (!code) throw new Error(params.get('error') ?? 'No code')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: settings.spotifyClientId,
      code_verifier: verifier,
    }),
  })
  const json = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number }
  store.set('spotifyTokens', {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  })
}

export async function spotifyGetToken(): Promise<string> {
  const tokens = store.get('spotifyTokens')
  if (!tokens) throw new Error('Not connected to Spotify')

  if (Date.now() < tokens.expiresAt - 60_000) return tokens.accessToken

  const settings = store.get('settings')!
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
      client_id: settings.spotifyClientId!,
    }),
  })
  const json = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number }
  store.set('spotifyTokens', {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? tokens.refreshToken,
    expiresAt: Date.now() + json.expires_in * 1000,
  })
  return json.access_token
}

export function spotifyDisconnect(): void {
  store.clear('spotifyTokens')
}

export function spotifyIsConnected(): boolean {
  return !!store.get('spotifyTokens')
}

// ── Gmail ─────────────────────────────────────────────────────────────────────

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
].join(' ')

export async function gmailConnect(): Promise<void> {
  const settings = store.get('settings')
  if (!settings?.googleClientId || !settings?.googleClientSecret)
    throw new Error('Google Client ID and Secret not set')

  const port = await randomPort()
  const redirectUri = `http://localhost:${port}/callback`
  const state = crypto.randomBytes(16).toString('hex')
  const verifier = crypto.randomBytes(64).toString('base64url')
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', settings.googleClientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', GMAIL_SCOPES)
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('code_challenge', challenge)

  shell.openExternal(url.toString())
  const params = await waitForCallback(port)

  if (params.get('state') !== state) throw new Error('State mismatch')
  const code = params.get('code')
  if (!code) throw new Error(params.get('error') ?? 'No code')

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: settings.googleClientId,
      client_secret: settings.googleClientSecret,
      code_verifier: verifier,
    }),
  })
  const json = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number }
  store.set('gmailTokens', {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  })
}

export async function gmailGetToken(): Promise<string> {
  const tokens = store.get('gmailTokens')
  if (!tokens) throw new Error('Not connected to Gmail')

  if (Date.now() < tokens.expiresAt - 60_000) return tokens.accessToken

  const settings = store.get('settings')!
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
      client_id: settings.googleClientId!,
      client_secret: settings.googleClientSecret!,
    }),
  })
  const json = (await res.json()) as { access_token: string; expires_in: number }
  store.set('gmailTokens', {
    ...tokens,
    accessToken: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  })
  return json.access_token
}

export function gmailDisconnect(): void {
  store.clear('gmailTokens')
}

export function gmailIsConnected(): boolean {
  return !!store.get('gmailTokens')
}
