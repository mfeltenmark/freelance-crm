import { google } from 'googleapis'

const FOLDER_ID = process.env.GOOGLE_DRIVE_CV_FOLDER_ID!

function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
  return google.drive({ version: 'v3', auth })
}

export async function listCVFiles(subfolder: 'raw' | 'generated' | 'master') {
  const drive = getDriveClient()

  const foldersRes = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and name = '${subfolder}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })

  const subfolderItem = foldersRes.data.files?.[0]
  if (!subfolderItem?.id) return []

  const filesRes = await drive.files.list({
    q: `'${subfolderItem.id}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, modifiedTime)',
    orderBy: 'modifiedTime desc',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })

  return filesRes.data.files || []
}

export async function readFileAsText(fileId: string, mimeType: string): Promise<string> {
  const drive = getDriveClient()

  if (mimeType === 'application/vnd.google-apps.document') {
    const res = await drive.files.export({ fileId, mimeType: 'text/plain' }, { responseType: 'text' })
    return res.data as string
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' })
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer: Buffer.from(res.data as ArrayBuffer) })
    return result.value
  }

  if (mimeType === 'text/plain') {
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' })
    return res.data as string
  }

  return ''
}

export async function readAllCVFiles(kravprofil?: string): Promise<string> {
  const rawFiles = await listCVFiles('raw')
  const generatedFiles = await listCVFiles('generated')

  const profileFile = rawFiles.find(f => f.name?.toLowerCase().includes('profile'))
  const otherRawFiles = rawFiles.filter(f => !f.name?.toLowerCase().includes('profile'))
  const allOtherFiles = [...otherRawFiles, ...generatedFiles]

  let selectedFiles = allOtherFiles
  if (kravprofil && kravprofil.trim().length > 0) {
    const keywords = extractKeywords(kravprofil)
    const scored = allOtherFiles.map(f => ({
      file: f,
      score: scoreFile(f.name || '', keywords),
    }))
    scored.sort((a, b) => b.score - a.score)
    selectedFiles = scored.slice(0, 18).map(s => s.file)
  } else {
    selectedFiles = allOtherFiles.slice(0, 18)
  }

  const filesToRead = profileFile
    ? [profileFile, ...selectedFiles]
    : selectedFiles

  const texts = await Promise.all(
    filesToRead.map(async (file) => {
      try {
        const text = await readFileAsText(file.id!, file.mimeType!)
        const label = file.name?.toLowerCase().includes('profile')
          ? '=== LINKEDIN PROFILE (kronologisk erfarenhetshistorik) ==='
          : `=== ${file.name} ===`
        return `${label}\n${text.slice(0, 2500)}`
      } catch {
        return ''
      }
    })
  )

  return texts.filter(Boolean).join('\n\n')
}

function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase()
  const stopwords = new Set(['och', 'att', 'det', 'som', 'för', 'med', 'på', 'av', 'en', 'ett', 'är', 'the', 'and', 'for', 'with', 'that', 'this', 'have', 'has', 'from', 'you', 'your', 'our', 'are', 'not', 'but', 'will', 'can', 'may', 'ska', 'som', 'till', 'vid', 'inom', 'över', 'under', 'vara', 'eller', 'även', 'samt', 'där', 'när'])
  const words = lower.match(/[a-zåäö]{4,}/g) || []
  return [...new Set(words.filter(w => !stopwords.has(w)))].slice(0, 40)
}

function scoreFile(filename: string, keywords: string[]): number {
  const lower = filename.toLowerCase()
  return keywords.reduce((score, kw) => {
    return lower.includes(kw) ? score + 1 : score
  }, 0)
}

export async function getMasterPrompt(): Promise<string | null> {
  const files = await listCVFiles('master')
  if (!files.length) return null

  const file = files[0]
  return readFileAsText(file.id!, file.mimeType!)
}

export async function saveMasterPrompt(content: string): Promise<void> {
  const drive = getDriveClient()

  const foldersRes = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and name = 'master' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
  })

  const masterFolderId = foldersRes.data.files?.[0]?.id
  if (!masterFolderId) throw new Error('master-mappen hittades inte i Drive')

  const existing = await drive.files.list({
    q: `'${masterFolderId}' in parents and trashed = false`,
    fields: 'files(id)',
  })

  if (existing.data.files?.length) {
    await drive.files.update({
      fileId: existing.data.files[0].id!,
      media: { mimeType: 'text/plain', body: content },
      supportsAllDrives: true,
    })
  } else {
    await drive.files.create({
      requestBody: {
        name: 'master-prompt.txt',
        parents: [masterFolderId],
        mimeType: 'text/plain',
      },
      media: { mimeType: 'text/plain', body: content },
      supportsAllDrives: true,
    })
  }
}

export async function saveGeneratedCV(filename: string, content: string): Promise<string | null> {
  const drive = getDriveClient()

  const foldersRes = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and name = 'generated' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })

  const generatedFolderId = foldersRes.data.files?.[0]?.id
  if (!generatedFolderId) throw new Error('generated-mappen hittades inte i Drive')

  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [generatedFolderId],
      mimeType: 'application/json',
    },
    media: { mimeType: 'application/json', body: content },
    fields: 'id, webViewLink',
    supportsAllDrives: true,
  })

  return res.data.webViewLink ?? null
}

export async function savePDFToDriver(filename: string, content: Buffer): Promise<string | null> {
  const drive = getDriveClient()

  const foldersRes = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and name = 'generated' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })

  const generatedFolderId = foldersRes.data.files?.[0]?.id
  if (!generatedFolderId) throw new Error('generated-mappen hittades inte i Drive')

  const { Readable } = await import('stream')
  const stream = Readable.from(content)

  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [generatedFolderId],
      mimeType: 'application/pdf',
    },
    media: { mimeType: 'application/pdf', body: stream },
    fields: 'id, webViewLink',
    supportsAllDrives: true,
  })

  return res.data.webViewLink ?? null
}
