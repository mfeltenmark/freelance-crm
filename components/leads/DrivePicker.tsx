'use client'

import { useEffect, useRef } from 'react'

interface DrivePickerProps {
  onPicked: (file: { id: string; name: string; url: string }) => void
  onClose: () => void
}

export function DrivePicker({ onPicked, onClose }: DrivePickerProps) {
  const pickerRef = useRef<any>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.onload = () => {
      (window as any).gapi.load('picker', () => {
        openPicker()
      })
    }
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  async function openPicker() {
    const tokenRes = await fetch('/api/google/picker-token')
    const { accessToken } = await tokenRes.json()

    const picker = new (window as any).google.picker.PickerBuilder()
      .addView(new (window as any).google.picker.DocsView()
        .setIncludeFolders(false)
        .setMimeTypes('application/pdf')
      )
      .setOAuthToken(accessToken)
      .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY!)
      .setCallback((data: any) => {
        if (data.action === 'picked') {
          const file = data.docs[0]
          onPicked({
            id: file.id,
            name: file.name,
            url: `https://drive.google.com/file/d/${file.id}/view`,
          })
        } else if (data.action === 'cancel') {
          onClose()
        }
      })
      .build()

    pickerRef.current = picker
    picker.setVisible(true)
  }

  return null
}
