import type { User } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { friendlyName, googleProfile, sizedAvatar } from './authState'

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

describe('googleProfile', () => {
  const photo = 'https://lh3.googleusercontent.com/a/abc123=s96-c'

  it('is null when nobody is signed in', () => {
    expect(googleProfile(null)).toBeNull()
  })

  it('reads the name and photo Google shared', () => {
    expect(googleProfile(user({ full_name: ' Ada  Lovelace ', avatar_url: photo }))).toEqual({ fullName: 'Ada Lovelace', avatarUrl: photo })
    expect(googleProfile(user({ name: 'Mae Jemison', picture: photo }))).toEqual({ fullName: 'Mae Jemison', avatarUrl: photo })
  })

  it('only accepts https photos', () => {
    for (const bad of ['javascript:alert(1)', 'data:image/png;base64,AAAA', 'http://example.com/a.png', '//example.com/a.png', 42]) {
      expect(googleProfile(user({ avatar_url: bad }))?.avatarUrl).toBeNull()
    }
  })

  it('copes with no name or photo', () => {
    expect(googleProfile(user({}))).toEqual({ fullName: null, avatarUrl: null })
  })
})

describe('sizedAvatar', () => {
  it('asks Google for a sharp photo at the drawn size', () => {
    expect(sizedAvatar('https://lh3.googleusercontent.com/a/abc=s96-c', 32)).toBe('https://lh3.googleusercontent.com/a/abc=s64-c')
    expect(sizedAvatar('https://lh3.googleusercontent.com/a/abc=s96', 112)).toBe('https://lh3.googleusercontent.com/a/abc=s224-c')
  })

  it('leaves other URLs alone', () => {
    expect(sizedAvatar('https://example.com/me.png', 32)).toBe('https://example.com/me.png')
  })
})
