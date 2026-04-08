'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Download, Settings, RefreshCw, Save, X, FileText } from 'lucide-react'

const RIKTNINGAR = [
  'Produktledning / CPO',
  'Digital transformation',
  'Plattformsstrategi',
  'Agil coach',
  'Integrations-PM',
  'Interims-CTO',
  'Interim Head of Product',
  'Projektledning / PM',
]

interface CVData {
  name: string
  title: string
  tagline: string
  contact: { email: string; phone: string; linkedin: string; location: string }
  competencies: string[]
  engagements: { client: string; role: string; period: string; description: string }[]
  education: { degree: string; school: string; year: string }[]
  references?: { quote: string; name: string; title: string }[]
  certifications?: { name: string; issuer: string; year: string }[]
  languages?: { language: string; level: string }[]
}

export default function CVGeneratorPage() {
  const [kravprofil, setKravprofil] = useState('')
  const [riktning, setRiktning] = useState(RIKTNINGAR[0])
  const [sprak, setSprak] = useState('Svenska')
  const [fokus, setFokus] = useState('Balanserat')
  const [langd, setLangd] = useState('Standard 2 sidor')
  const [ton, setTon] = useState('Direkt och affärsnära')
  const [lyttFram, setLyttFram] = useState('Automatiskt')
  const [antalUppdrag, setAntalUppdrag] = useState('5')
  const [ovriga, setOvriga] = useState('')
  const [model, setModel] = useState<'sonnet' | 'opus'>('sonnet')
  const [inputMode, setInputMode] = useState<'kravprofil' | 'befintlig'>('kravprofil')
  const [loadingCV, setLoadingCV] = useState(false)
  const [loadingCoverLetter, setLoadingCoverLetter] = useState(false)
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [error, setError] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [masterPrompt, setMasterPrompt] = useState('')
  const [savingPrompt, setSavingPrompt] = useState(false)
  const [driveFiles, setDriveFiles] = useState<{ total: number; raw: any[]; generated: any[] }>({ total: 0, raw: [], generated: [] })
  const [showLeadPicker, setShowLeadPicker] = useState(false)
  const [leads, setLeads] = useState<any[]>([])
  const [savedToDrive, setSavedToDrive] = useState(false)
  const [driveLink, setDriveLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [suggestingSettings, setSuggestingSettings] = useState(false)
  const [includeCoverLetter, setIncludeCoverLetter] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [coverLetterCopied, setCoverLetterCopied] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    fetch('/api/cv/drive-files')
      .then(r => r.json())
      .then(setDriveFiles)
      .catch(() => {})
  }, [])

  useEffect(() => {
    const leadId = searchParams.get('leadId')
    if (!leadId) return

    fetch(`/api/leads/${leadId}`)
      .then(r => r.json())
      .then(async (data) => {
        const lead = data.lead || data
        const desc = lead.description ?? ''
        const instr = lead.instructions ?? ''
        if (desc) setKravprofil(desc)
        if (instr) setOvriga(instr)

        if (desc) {
          setSuggestingSettings(true)
          try {
            const res = await fetch('/api/cv-generator/suggest-settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ description: desc, instructions: instr }),
            })
            const suggestions = await res.json()

            const riktningOptions = [
              'Produktledning / CPO', 'Digital transformation', 'Plattformsstrategi',
              'Agil coach', 'Integrations-PM', 'Interims-CTO', 'Interim Head of Product', 'Projektledning / PM',
            ]
            const fokusOptions = ['Balanserat', 'Strategisk tyngd', 'Teknisk tyngd']
            const tonOptions = ['Direkt och affärsnära', 'Formell']
            const lyftOptions = ['Automatiskt', 'Plattformsstrategi', 'Digital transformation', 'Produktledning', 'Ledarskap', 'Förändringsledning']

            if (suggestions.riktning && riktningOptions.includes(suggestions.riktning)) setRiktning(suggestions.riktning)
            if (suggestions.fokus && fokusOptions.includes(suggestions.fokus)) setFokus(suggestions.fokus)
            if (suggestions.ton && tonOptions.includes(suggestions.ton)) setTon(suggestions.ton)
            if (suggestions.lyft && lyftOptions.includes(suggestions.lyft)) setLyttFram(suggestions.lyft)
          } catch {
            // tyst fel, behåll defaults
          } finally {
            setSuggestingSettings(false)
          }
        }
      })
      .catch(() => {})
  }, [])

  async function handleGenerateCoverLetter() {
    if (!kravprofil.trim()) return
    setLoadingCoverLetter(true)
    setError('')
    setCoverLetter('')
    try {
      const clRes = await fetch('/api/cv-generator/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: kravprofil, instructions: ovriga, riktning, model, language: sprak }),
      })
      const clData = await clRes.json()
      if (clData.coverLetter) setCoverLetter(clData.coverLetter)
    } catch (e: any) {
      setError(e.message || 'Något gick fel')
    } finally {
      setLoadingCoverLetter(false)
    }
  }

  async function handleGenerate() {
    if (!kravprofil.trim()) return
    setLoadingCV(true)
    setError('')
    setCvData(null)
    setCoverLetter('')
    setSavedToDrive(false)

    try {
      const res = await fetch('/api/cv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kravprofil, riktning, sprak, fokus, langd, ton, lyttFram, ovriga, model, antalUppdrag, inputMode }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCvData(data.cv)

      if (includeCoverLetter) {
        setLoadingCoverLetter(true)
        const clRes = await fetch('/api/cv-generator/generate-cover-letter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: kravprofil, instructions: ovriga, riktning, model, language: sprak }),
        })
        const clData = await clRes.json()
        if (clData.coverLetter) setCoverLetter(clData.coverLetter)
      }
    } catch (e: any) {
      setError(e.message || 'Något gick fel')
    } finally {
      setLoadingCV(false)
      setLoadingCoverLetter(false)
    }
  }

  async function handleDownloadPDF() {
    if (!cvData) return
    const res = await fetch('/api/cv/export-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cv: cvData }),
    })
    const html = await res.text()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  async function handleSaveToDrive() {
    if (!cvData) return
    const filename = `CV_${riktning.replace(/\//g, '-')}_${new Date().toISOString().split('T')[0]}.json`
    const res = await fetch('/api/cv/save-drive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cv: cvData, filename }),
    })
    if (res.ok) {
      const data = await res.json()
      setSavedToDrive(true)
      if (data.webViewLink) setDriveLink(data.webViewLink)
      const updated = await fetch('/api/cv/drive-files').then(r => r.json())
      setDriveFiles(updated)
    }
  }

  async function handleOpenSettings() {
    setSettingsOpen(true)
    if (!masterPrompt) {
      const res = await fetch('/api/cv/master-prompt')
      const data = await res.json()
      setMasterPrompt(data.prompt)
    }
  }

  async function handleSaveMasterPrompt() {
    setSavingPrompt(true)
    await fetch('/api/cv/master-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: masterPrompt }),
    })
    setSavingPrompt(false)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-lg font-medium text-gray-900">
            CV-generator <span style={{ color: '#5e3a8c' }}>/ Tech & Change</span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {driveFiles.total > 0 ? `${driveFiles.total} CV-filer i databasen` : 'Laddar databas...'}
          </p>
        </div>
        <button
          onClick={handleOpenSettings}
          className="flex items-center gap-2 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50"
        >
          <Settings size={14} />
          Inställningar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {inputMode === 'kravprofil' ? 'Kravprofil / uppdragsbeskrivning' : 'Befintlig CV-text'}
              </div>
              <button
                onClick={async () => {
                  const res = await fetch('/api/leads?limit=50')
                  const data = await res.json()
                  setLeads(data.leads ?? [])
                  setShowLeadPicker(true)
                }}
                className="px-3 py-1.5 border border-purple-200 text-purple-600 rounded text-xs hover:bg-purple-50"
              >
                Hämta från lead
              </button>
            </div>
            <div className="flex rounded-lg overflow-hidden border border-gray-100 text-xs">
              <button
                onClick={() => setInputMode('kravprofil')}
                className="px-3 py-1.5 transition-colors"
                style={inputMode === 'kravprofil'
                  ? { background: '#5e3a8c', color: '#fff' }
                  : { background: '#f9fafb', color: '#9ca3af' }
                }
              >
                Kravprofil
              </button>
              <button
                onClick={() => setInputMode('befintlig')}
                className="px-3 py-1.5 transition-colors"
                style={inputMode === 'befintlig'
                  ? { background: '#5e3a8c', color: '#fff' }
                  : { background: '#f9fafb', color: '#9ca3af' }
                }
              >
                Befintlig CV-text
              </button>
            </div>
          </div>
          <textarea
            value={kravprofil}
            onChange={e => setKravprofil(e.target.value)}
            placeholder={inputMode === 'kravprofil'
              ? 'Klistra in kravprofil, jobbannons eller uppdragsbeskrivning här...'
              : 'Klistra in en befintlig CV-text som ska användas som bas...'
            }
            className="w-full h-48 text-sm text-gray-800 bg-gray-50 border border-gray-100 rounded-lg p-3 resize-none focus:outline-none focus:border-purple-400"
            style={{ fontFamily: 'inherit' }}
          />

          <div className="flex items-center gap-2 mt-4 mb-1">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Inställningar</span>
            {suggestingSettings && (
              <span className="flex items-center gap-1 text-xs text-purple-500">
                <RefreshCw size={10} className="animate-spin" /> Föreslår...
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            {[
              { label: 'CV-riktning', value: riktning, setter: setRiktning, options: RIKTNINGAR },
              { label: 'Språk', value: sprak, setter: setSprak, options: ['Svenska', 'Engelska'] },
              { label: 'Fokus', value: fokus, setter: setFokus, options: ['Balanserat', 'Strategisk tyngd', 'Teknisk tyngd'] },
              { label: 'Längd', value: langd, setter: setLangd, options: ['Standard 2 sidor', 'Kompakt 1 sida', 'Lång 3 sidor'] },
              { label: 'Ton', value: ton, setter: setTon, options: ['Direkt och affärsnära', 'Formell'] },
              { label: 'Lyft fram', value: lyttFram, setter: setLyttFram, options: ['Automatiskt', 'Plattformsstrategi', 'Digital transformation', 'Produktledning', 'Ledarskap', 'Förändringsledning'] },
              { label: 'Antal uppdrag', value: antalUppdrag, setter: setAntalUppdrag, options: ['3', '4', '5', '6', '7'] },
            ].map(({ label, value, setter, options }) => (
              <div key={label}>
                <label className="block text-xs text-gray-400 font-medium mb-1">{label}</label>
                <select
                  value={value}
                  onChange={e => setter(e.target.value)}
                  className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-400"
                >
                  {options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}

            <div className="col-span-2">
              <label className="block text-xs text-gray-400 font-medium mb-1">Övriga instruktioner</label>
              <input
                type="text"
                value={ovriga}
                onChange={e => setOvriga(e.target.value)}
                placeholder="T.ex. betona TUI-uppdraget, skriv kortare ingångsmening..."
                className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCoverLetter}
                  onChange={e => setIncludeCoverLetter(e.target.checked)}
                  className="w-4 h-4 rounded accent-purple-600"
                />
                <span className="text-xs text-gray-500 font-medium">Generera motivering / hisspitch</span>
              </label>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs text-gray-400 font-medium mb-2">AI-modell</div>
            <div className="flex gap-2 w-full">
              {(['sonnet', 'opus'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setModel(m)}
                  className="flex-1 text-sm py-2 rounded-lg border transition-colors"
                  style={model === m
                    ? { borderColor: '#5e3a8c', color: '#5e3a8c', background: '#f5f0fb', fontWeight: 500 }
                    : { borderColor: '#e5e7eb', color: '#9ca3af', background: '#f9fafb' }
                  }
                >
                  Claude {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className={`mt-4 ${includeCoverLetter ? 'grid grid-cols-2 gap-2' : ''}`}>
            <button
              onClick={handleGenerate}
              disabled={loadingCV || !kravprofil.trim()}
              className="w-full py-3 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
              style={{ background: '#5e3a8c' }}
            >
              {loadingCV ? <><RefreshCw size={14} className="animate-spin" /> Genererar...</> : 'Generera CV'}
            </button>
            {includeCoverLetter && (
              <button
                onClick={handleGenerateCoverLetter}
                disabled={loadingCoverLetter || !kravprofil.trim()}
                className="w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-40 border"
                style={{ borderColor: '#5e3a8c', color: '#5e3a8c', background: '#f5f0fb' }}
              >
                {loadingCoverLetter ? <><RefreshCw size={14} className="animate-spin" /> Genererar...</> : 'Generera motivering'}
              </button>
            )}
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-500">{error}</p>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Förhandsgranskning
          </div>

          <div className="flex-1 bg-gray-50 rounded-lg p-4 min-h-48">
            {!cvData && !loadingCV && (
              <div className="h-full flex items-center justify-center text-center text-gray-300 text-sm">
                <div>
                  <FileText size={24} className="mx-auto mb-2" style={{ color: '#5e3a8c', opacity: 0.3 }} />
                  Klistra in en kravprofil och tryck<br />"Generera CV" för att se resultat
                </div>
              </div>
            )}
            {loadingCV && (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                <RefreshCw size={16} className="animate-spin mr-2" /> Genererar med Claude...
              </div>
            )}
            {cvData && (
              <div className="text-sm leading-relaxed">
                <div className="border-l-2 pl-3 mb-3" style={{ borderColor: '#5e3a8c' }}>
                  <div className="font-medium text-gray-900">{cvData.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#5e3a8c' }}>{cvData.title}</div>
                </div>
                <p className="text-xs text-gray-600 italic mb-3">{cvData.tagline}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {cvData.competencies.slice(0, 6).map(c => (
                    <span key={c} className="text-xs px-2 py-0.5 rounded border" style={{ borderColor: '#5e3a8c', color: '#5e3a8c' }}>{c}</span>
                  ))}
                </div>
                {cvData.engagements.slice(0, 2).map(e => (
                  <div key={e.client} className="mb-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-xs text-gray-800">{e.client}</span>
                      <span className="text-xs text-gray-400">{e.period}</span>
                    </div>
                    <div className="text-xs" style={{ color: '#5e3a8c' }}>{e.role}</div>
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{e.description}</div>
                  </div>
                ))}
                {cvData.engagements.length > 2 && (
                  <div className="text-xs text-gray-400">+{cvData.engagements.length - 2} uppdrag till</div>
                )}
                {(cvData.certifications?.length ?? 0) > 0 && (
                  <div className="mt-2">
                    <div className="text-xs font-medium mt-2 mb-1" style={{ color: '#5e3a8c' }}>Certifieringar</div>
                    {cvData.certifications?.slice(0, 2).map((c: any) => (
                      <div key={c.name} className="text-xs text-gray-500">{c.name}, {c.year}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {includeCoverLetter && coverLetter && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Motivering / Hisspitch</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(coverLetter)
                    setCoverLetterCopied(true)
                    setTimeout(() => setCoverLetterCopied(false), 2000)
                  }}
                  className="text-xs px-2 py-1 rounded border transition-colors"
                  style={{ borderColor: '#e5e7eb', color: coverLetterCopied ? '#16a34a' : '#7c3aed' }}
                >
                  {coverLetterCopied ? '✓ Kopierad!' : 'Kopiera'}
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 leading-relaxed border border-gray-100">
                {coverLetter}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <button
              onClick={handleDownloadPDF}
              disabled={!cvData}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded-lg border font-medium disabled:opacity-30 transition-colors w-full"
              style={{ borderColor: '#5e3a8c', color: '#5e3a8c' }}
            >
              <Download size={13} /> Ladda ned
            </button>
            <button
              onClick={handleSaveToDrive}
              disabled={!cvData || savedToDrive}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded-lg border disabled:opacity-30 transition-colors hover:bg-gray-50"
              style={{ borderColor: '#e5e7eb', color: savedToDrive ? '#16a34a' : '#6b7280' }}
            >
              <Save size={13} /> {savedToDrive ? 'Sparat' : 'Spara till Drive'}
            </button>
            {savedToDrive && driveLink && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(driveLink)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                style={{ borderColor: '#e5e7eb', color: copied ? '#16a34a' : '#7c3aed' }}
                className="flex items-center gap-1 px-3 py-1.5 border rounded text-xs"
              >
                {copied ? '✓ Kopierad!' : 'Kopiera Drive-länk'}
              </button>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">CV-databas</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#f5f0fb', color: '#5e3a8c' }}>
                {driveFiles.total} filer
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {driveFiles.raw.slice(0, 5).map((f: any) => (
                <span key={f.id} className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1">
                  {f.name.replace(/\.(docx?|pdf|txt)$/i, '').slice(0, 24)}
                </span>
              ))}
              {driveFiles.total > 5 && (
                <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1">
                  +{driveFiles.total - 5} filer
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {settingsOpen && (
        <div className="mt-6 bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-gray-800">Inställningar</h2>
            <button onClick={() => setSettingsOpen(false)} className="text-gray-300 hover:text-gray-500">
              <X size={16} />
            </button>
          </div>

          <div className="mb-1 text-xs font-medium text-gray-400">Master-prompt</div>
          <textarea
            value={masterPrompt}
            onChange={e => setMasterPrompt(e.target.value)}
            className="w-full h-48 text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-3 resize-y focus:outline-none focus:border-purple-400 font-mono"
          />
          <button
            onClick={handleSaveMasterPrompt}
            disabled={savingPrompt}
            className="mt-2 text-sm px-4 py-2 rounded-lg text-white"
            style={{ background: '#5e3a8c' }}
          >
            {savingPrompt ? 'Sparar...' : 'Spara till Drive'}
          </button>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-400 mb-2">CV-riktningar</div>
            <div className="flex flex-wrap gap-2">
              {RIKTNINGAR.map(r => (
                <span key={r} className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">{r}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {showLeadPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowLeadPicker(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Välj lead</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {leads.map((lead: any) => (
                <button
                  key={lead.id}
                  onClick={() => {
                    if (lead.description) setKravprofil(lead.description)
                    if (lead.instructions) setOvriga(lead.instructions)
                    setShowLeadPicker(false)
                  }}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-200"
                >
                  <p className="font-medium text-sm text-gray-900">{lead.title}</p>
                  {lead.contact && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {lead.contact.firstName} {lead.contact.lastName}
                    </p>
                  )}
                </button>
              ))}
              {leads.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">Inga aktiva leads hittades</p>
              )}
            </div>
            <button
              onClick={() => setShowLeadPicker(false)}
              className="mt-4 w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
