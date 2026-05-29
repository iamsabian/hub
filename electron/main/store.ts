import { app } from 'electron'
import fs from 'fs'
import path from 'path'

const storePath = path.join(app.getPath('userData'), 'hub-store.json')

interface Store {
  settings?: {
    spotifyClientId?: string
    googleClientId?: string
    googleClientSecret?: string
  }
  spotifyTokens?: {
    accessToken: string
    refreshToken: string
    expiresAt: number
  }
  gmailTokens?: {
    accessToken: string
    refreshToken: string
    expiresAt: number
  }
}

function read(): Store {
  try {
    return JSON.parse(fs.readFileSync(storePath, 'utf-8'))
  } catch {
    return {}
  }
}

function write(data: Store): void {
  fs.writeFileSync(storePath, JSON.stringify(data, null, 2))
}

export function get<K extends keyof Store>(key: K): Store[K] {
  return read()[key]
}

export function set<K extends keyof Store>(key: K, value: Store[K]): void {
  const data = read()
  data[key] = value
  write(data)
}

export function clear(key: keyof Store): void {
  const data = read()
  delete data[key]
  write(data)
}
