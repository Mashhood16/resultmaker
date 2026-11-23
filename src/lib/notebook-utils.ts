export function parseMissingChapters(raw: string | null | undefined): { count: number, text: string } | null {
  if (!raw || !raw.trim()) return null
  const cleaned = raw.trim()
  
  // Extract parts separated by commas, ampersands, slashes, or 'and' / 'aur'
  const parts = cleaned.split(/[,/&+]|\band\b|\baur\b/i).map(p => p.trim()).filter(Boolean)
  const count = parts.length > 0 ? parts.length : 1
  
  let displayText = cleaned
  if (!/^(ch|chapter|sabaq|unit|baab)\b/i.test(cleaned)) {
    displayText = `Ch ${cleaned}`
  }
  
  return {
    count,
    text: displayText
  }
}

export function formatCheckStatus(rawStatus: string | null | undefined): {
  code: 'C' | 'I' | 'A' | 'N'
  label: 'Complete' | 'Incomplete' | 'Absent' | 'Not Brought'
  isComplete: boolean
  isIncomplete: boolean
  isAbsent: boolean
  isNotBrought: boolean
  missingChapters?: string
  missingCount?: number
  fullDescription: string
} {
  const status = (rawStatus || '').trim()
  if (!status || status === 'C' || status === 'COMPLETE') {
    return {
      code: 'C',
      label: 'Complete',
      isComplete: true,
      isIncomplete: false,
      isAbsent: false,
      isNotBrought: false,
      fullDescription: 'Notebook copy complete'
    }
  }

  if (status === 'A' || status === 'ABSENT') {
    return {
      code: 'A',
      label: 'Absent',
      isComplete: false,
      isIncomplete: false,
      isAbsent: true,
      isNotBrought: false,
      fullDescription: 'Student was absent on this date'
    }
  }

  if (status === 'N' || status === 'NOT BROUGHT') {
    return {
      code: 'N',
      label: 'Not Brought',
      isComplete: false,
      isIncomplete: false,
      isAbsent: false,
      isNotBrought: true,
      fullDescription: 'Did not bring notebook to school'
    }
  }

  // Incomplete status
  let rawMissing = ''
  if (status.startsWith('I:')) {
    rawMissing = status.substring(2).trim()
  } else if (status.startsWith('I') && status.length > 1) {
    rawMissing = status.substring(1).trim()
  }

  const parsed = parseMissingChapters(rawMissing)
  const missingCount = parsed ? parsed.count : 0
  const missingText = parsed ? parsed.text : ''
  const chapterWord = missingCount === 1 ? 'chapter' : 'chapters'

  return {
    code: 'I',
    label: 'Incomplete',
    isComplete: false,
    isIncomplete: true,
    isAbsent: false,
    isNotBrought: false,
    missingChapters: missingText || undefined,
    missingCount: missingCount || undefined,
    fullDescription: parsed
      ? `${missingCount} ${chapterWord} missing (${missingText})`
      : 'Incomplete notebook'
  }
}
