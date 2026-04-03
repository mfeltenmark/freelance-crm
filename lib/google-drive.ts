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
    })

    const files = res.data.files
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
    const tabs = doc.data.tabs
    if (!tabs) return null

    const transcriptTab =
      tabs.find(tab =>
        tab.tabProperties?.title?.toLowerCase() === 'transcript'
      ) ??
      tabs.find(tab =>
        tab.tabProperties?.title?.toLowerCase().includes('transcript')
      )

    if (!transcriptTab) return null

    const content = transcriptTab.documentTab?.body?.content ?? []
    return content
      .flatMap(el => el.paragraph?.elements ?? [])
      .map(e => e.textRun?.content ?? '')
      .join('')
      .trim() || null
  } catch (err) {
    console.error(`readTranscriptFromDoc error for fileId ${fileId}:`, err)
    return null
  }
}
