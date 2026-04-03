import { google } from 'googleapis'

const getAuth = (() => {
  let cached: InstanceType<typeof google.auth.GoogleAuth> | null = null
  return () => {
    if (!cached) {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
      cached = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/drive.readonly',
          'https://www.googleapis.com/auth/documents.readonly',
        ],
      })
    }
    return cached
  }
})()

export async function findTranscriptForMeeting(scheduledAt: Date): Promise<string | null> {
  try {
    const auth = getAuth()
    const drive = google.drive({ version: 'v3', auth })

    const windowStart = new Date(scheduledAt.getTime() - 60 * 60 * 1000).toISOString()
    const windowEnd   = new Date(scheduledAt.getTime() + 4 * 60 * 60 * 1000).toISOString()
    const query = `name contains 'Notes by Gemini' and mimeType = 'application/vnd.google-apps.document' and trashed = false and createdTime > '${windowStart}' and createdTime < '${windowEnd}'`

    const res = await drive.files.list({
      q: query,
      fields: 'files(id, name, createdTime)',
      spaces: 'drive',
      orderBy: 'createdTime desc',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    })

    const files = res.data.files
    console.log('Drive search query:', query)
    console.log('Drive search results:', JSON.stringify(files))
    if (!files || files.length === 0) return null

    return files[0].id!
  } catch (err) {
    console.error('findTranscriptForMeeting error:', err)
    return null
  }
}

export async function readTranscriptFromDoc(fileId: string): Promise<string | null> {
  try {
    const auth = getAuth()
    const docs = google.docs({ version: 'v1', auth })

    const doc = await docs.documents.get({ documentId: fileId })

    // Try tabs first (newer docs format)
    const tabs = doc.data.tabs
    if (tabs && tabs.length > 0) {
      const transcriptTab =
        tabs.find(tab =>
          tab.tabProperties?.title?.toLowerCase() === 'transcript'
        ) ??
        tabs.find(tab =>
          tab.tabProperties?.title?.toLowerCase().includes('transcript')
        ) ??
        tabs[0]

      if (transcriptTab) {
        const content = transcriptTab.documentTab?.body?.content ?? []
        const text = content
          .flatMap(el => el.paragraph?.elements ?? [])
          .map(e => e.textRun?.content ?? '')
          .join('')
          .trim()
        if (text) return text
      }
    }

    // Fall back to body directly (older/simpler docs format)
    const content = doc.data.body?.content ?? []
    return content
      .flatMap(el => el.paragraph?.elements ?? [])
      .map(e => e.textRun?.content ?? '')
      .join('')
      .trim() || null

  } catch (err) {
    console.error('readTranscriptFromDoc error:', err)
    return null
  }
}
