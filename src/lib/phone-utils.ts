/**
 * Phone utilities for extracting, normalizing, and formatting multiple phone numbers.
 * Supports Pakistani mobile numbers (03xx / 923xx) and international numbers.
 */

export function normalizeSinglePhone(raw: string): string | null {
  if (!raw) return null
  let phone = String(raw).replace(/\D/g, '')
  if (!phone) return null

  // Normalize Pakistani formats
  if (phone.startsWith('0092')) {
    phone = '92' + phone.slice(4)
  } else if (phone.startsWith('03') && phone.length === 11) {
    phone = '923' + phone.slice(2)
  } else if (phone.startsWith('3') && phone.length === 10) {
    phone = '92' + phone
  } else if (phone.startsWith('92') && phone.length === 12) {
    // Already normalized 923...
  }

  // Validate standard phone digit length (10 to 15 digits)
  if (phone.length < 10 || phone.length > 15) {
    return null
  }

  return phone
}

/**
 * Parses and extracts all valid unique phone numbers from a string
 * Delimiters supported: comma, slash, semicolon, pipe, ampersand, newlines, "and", "or", or whitespace.
 */
export function extractPhoneNumbers(raw: string | null | undefined): string[] {
  if (!raw) return []

  const text = String(raw).trim()
  if (!text) return []

  // Split by common delimiters
  const tokens = text.split(/[,/\\;|&\n\r]+|\band\b|\bor\b/i)
  const numbers: string[] = []

  for (let token of tokens) {
    token = token.trim()
    if (!token) continue

    // Check if token has multiple numbers separated by space (e.g. "03001234567 03217654321")
    const subTokens = token.split(/\s+/)
    if (subTokens.length > 1) {
      let allSubTokensAreNumbers = true
      const tempParsed: string[] = []
      for (const st of subTokens) {
        const p = normalizeSinglePhone(st)
        if (p) {
          tempParsed.push(p)
        } else {
          allSubTokensAreNumbers = false
          break
        }
      }
      if (allSubTokensAreNumbers && tempParsed.length > 0) {
        numbers.push(...tempParsed)
        continue
      }
    }

    // Try normalizing the whole token (e.g. "0300-1234567")
    const normalized = normalizeSinglePhone(token)
    if (normalized) {
      numbers.push(normalized)
    } else {
      // Fallback regex scan for mobile numbers inside formatted text (e.g. "03001234567 (Father)")
      const matches = token.match(/(?:(?:\+?92|0092|0)?3\d{2}[-.\s]?\d{7})/g)
      if (matches) {
        for (const m of matches) {
          const norm = normalizeSinglePhone(m)
          if (norm) numbers.push(norm)
        }
      }
    }
  }

  // Deduplicate while preserving order
  return Array.from(new Set(numbers))
}

/**
 * Takes one or more inputs, extracts all numbers, and formats as comma-separated string
 */
export function formatPhoneList(raw: string | string[] | null | undefined): string {
  if (!raw) return ''
  const list = Array.isArray(raw) ? raw.flatMap(extractPhoneNumbers) : extractPhoneNumbers(raw)
  return Array.from(new Set(list)).join(', ')
}

/**
 * Merges multiple phone inputs from separate fields/columns into a single comma-separated string
 */
export function mergePhoneInputs(...inputs: (string | null | undefined)[]): string {
  const allNumbers: string[] = []
  for (const input of inputs) {
    if (input) {
      allNumbers.push(...extractPhoneNumbers(input))
    }
  }
  return Array.from(new Set(allNumbers)).join(', ')
}
