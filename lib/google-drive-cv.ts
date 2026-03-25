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
  })

  const subfolderItem = foldersRes.data.files?.[0]
  if (!subfolderItem?.id) return []

  const filesRes = await drive.files.list({
    q: `'${subfolderItem.id}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, modifiedTime)',
    orderBy: 'modifiedTime desc',
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

export async function readAllCVFiles(riktning?: string): Promise<string> {
  const files = await listCVFiles('raw')
  const generatedFiles = await listCVFiles('generated')
  const allFiles = [...files, ...generatedFiles].slice(0, 20)

  const texts = await Promise.all(
    allFiles.map(async (file) => {
      try {
        const text = await readFileAsText(file.id!, file.mimeType!)
        return `=== ${file.name} ===\n${text.slice(0, 3000)}`
      } catch {
        return ''
      }
    })
  )

  return texts.filter(Boolean).join('\n\n')
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
    })
  } else {
    await drive.files.create({
      requestBody: {
        name: 'master-prompt.txt',
        parents: [masterFolderId],
        mimeType: 'text/plain',
      },
      media: { mimeType: 'text/plain', body: content },
    })
  }
}

export async function saveGeneratedCV(filename: string, content: string): Promise<void> {
  const drive = getDriveClient()

  const foldersRes = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and name = 'generated' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
  })

  const generatedFolderId = foldersRes.data.files?.[0]?.id
  if (!generatedFolderId) throw new Error('generated-mappen hittades inte i Drive')

  await drive.files.create({
    requestBody: {
      name: filename,
      parents: [generatedFolderId],
      mimeType: 'text/plain',
    },
    media: { mimeType: 'text/plain', body: content },
  })
}
