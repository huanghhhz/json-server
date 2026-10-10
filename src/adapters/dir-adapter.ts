import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'

import JSON5 from 'json5'
import type { Adapter } from 'lowdb'

import type { RawData } from './normalized-adapter.ts'

// Maps a directory tree to a nested object and back:
//   dir/           -> {}
//   dir/a/         -> { a: {} }
//   dir/a/b.json   -> { a: { b: <file contents> } }
export class DirAdapter implements Adapter<RawData> {
  #dir: string
  #sources = new Map<string, string>() // JSON key path -> file path

  constructor(dir: string) {
    this.#dir = dir
  }

  async read(): Promise<RawData | null> {
    this.#sources.clear()
    const data: RawData = {}
    this.#loadDir(this.#dir, [], data)
    return data
  }

  async write(data: RawData): Promise<void> {
    for (const [pathKey, file] of this.#sources) {
      const keys = JSON.parse(pathKey) as string[]
      let value: unknown = data
      for (const key of keys) {
        value = (value as Record<string, unknown>)?.[key]
      }
      if (value !== undefined) {
        writeFileSync(file, JSON.stringify(value, null, 2))
      }
    }
  }

  #loadDir(dir: string, path: string[], out: Record<string, unknown>) {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith('.')) continue // ponytail: skip .git/.DS_Store; follow dotdirs if ever needed
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        const sub: Record<string, unknown> = {}
        out[entry] = sub
        this.#loadDir(full, [...path, entry], sub)
      } else {
        const ext = extname(entry)
        if (ext === '.json' || ext === '.json5') {
          const key = entry.slice(0, -ext.length)
          out[key] = JSON5.parse(readFileSync(full, 'utf-8'))
          this.#sources.set(JSON.stringify([...path, key]), full)
        }
      }
    }
  }
}
