import type { User } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { friendlyName } from './authState'

const user = (meta: Record<string, unknown>, email?: string) => ({ user_metadata: meta, email }) as unknown as User

describe('friendlyName', () => {
  it('is null when nobody is signed in', () => {
    expect(friendlyName(null)).toBeNull()
  })

  it('prefers the first name Google gives', () => {
    expect(friendlyName(user({ given_name: 'Ada', full_name: 'Ada Lovelace' }))).toBe('Ada')
  })

  it('falls back to the first word of the full name', () => {
    expect(friendlyName(user({ full_name: '  Mae   Jemison ' }))).toBe('Mae')
    expect(friendlyName(user({ name: 'Sally Ride' }))).toBe('Sally')
  })

  it('never shows the whole email address', () => {
    expect(friendlyName(user({}, 'katherine.j@example.com'))).toBe('katherine.j')
  })

  it('ignores blank or non-text names', () => {
    expect(friendlyName(user({ given_name: '  ', full_name: 42 }, 'yuri@example.com'))).toBe('yuri')
    expect(friendlyName(user({}))).toBe('Explorer')
  })
})
