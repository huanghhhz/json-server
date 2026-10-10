import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

import { temporaryDirectory } from 'tempy'

import { DirAdapter } from './dir-adapter.ts'

await test('read maps directory tree to nested object', async () => {
  const dir = temporaryDirectory()
  writeFileSync(join(dir, 'posts.json'), JSON.stringify([{ id: '1' }]))
  mkdirSync(join(dir, 'nested'))
  writeFileSync(join(dir, 'nested', 'comments.json5'), "{ text: 'hi' }")

  const adapter = new DirAdapter(dir)
  const data = await adapter.read()

  assert.deepEqual(data, {
    posts: [{ id: '1' }],
    nested: { comments: { text: 'hi' } },
  })
})

await test('write persists back to source files and skips $schema', async () => {
  const dir = temporaryDirectory()
  writeFileSync(join(dir, 'posts.json'), '[]')

  const adapter = new DirAdapter(dir)
  await adapter.read()

  await adapter.write({
    $schema: './schema.json',
    posts: [{ id: '1' }],
  })

  assert.deepEqual(JSON.parse(readFileSync(join(dir, 'posts.json'), 'utf-8')), [{ id: '1' }])
  assert.equal(existsSync(join(dir, '$schema.json')), false)
})
