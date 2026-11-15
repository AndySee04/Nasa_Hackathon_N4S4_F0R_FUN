/**
 * Certificate rules (docs/specs/game-moon-campaign.md §6).
 * The nickname is typed by the child, shown and printed, and never saved or sent anywhere.
 */

export const NICKNAME_MAX = 20

/** Letters (any language), numbers and single spaces only, at most 20 characters. */
export function cleanNickname(input: string): string {
  return input
    .normalize('NFC')
    .replace(/[^\p{L}\p{N} ]+/gu, '')
    .replace(/\s+/g, ' ')
    .trimStart()
    .slice(0, NICKNAME_MAX)
}

/** No 0/O or 1/I, so the code is easy to read out loud. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** A random code like N4S4-MOON-7K3Q-92XD, made in the browser. It identifies nothing about the child. */
export function makeCertificateId(campaign = 'MOON', random: (n: number) => Uint8Array = randomBytes): string {
  const bytes = random(8)
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
  return `N4S4-${campaign}-${chars.slice(0, 4)}-${chars.slice(4, 8)}`
}

function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n)
  crypto.getRandomValues(out)
  return out
}

export const UNOFFICIAL_NOTE = 'Unofficial N4S4 F0R FUN achievement certificate. Not issued or endorsed by NASA.'
