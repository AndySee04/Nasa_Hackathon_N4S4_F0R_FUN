import { describe, expect, it } from 'vitest'
import { cleanNickname, makeCertificateId, NICKNAME_MAX, UNOFFICIAL_NOTE } from './certificate'

describe('nickname', () => {
  it('keeps letters, numbers and single spaces only', () => {
    expect(cleanNickname('  Star   Kid 7!! ')).toBe('Star Kid 7 ')
    expect(cleanNickname('<script>alert(1)</script>')).toBe('scriptalert1script')
    expect(cleanNickname('Zoë 🚀')).toBe('Zoë ')
    expect(cleanNickname('a'.repeat(50))).toHaveLength(NICKNAME_MAX)
  })
})

describe('certificate id', () => {
  it('has the expected shape and avoids look-alike characters', () => {
    const id = makeCertificateId('MOON', (n) => new Uint8Array(n).map((_, i) => i * 37))
    expect(id).toMatch(/^N4S4-MOON-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
    expect(id.slice(10)).not.toMatch(/[01OI]/)
  })

  it('is random each time by default', () => {
    expect(makeCertificateId()).not.toBe(makeCertificateId())
  })

  it('says it is unofficial and not from NASA', () => {
    expect(UNOFFICIAL_NOTE).toMatch(/Unofficial/)
    expect(UNOFFICIAL_NOTE).toMatch(/Not issued or endorsed by NASA/)
  })
})
