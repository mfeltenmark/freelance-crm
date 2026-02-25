'use client'

import { useState } from 'react'
import { Key, Copy, Eye, EyeOff, Plus, Trash2, AlertTriangle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ApiKey {
  id: string
  name: string
  key: string
  created: string
  lastUsed: string | null
}

export function ApiSettings() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState<string | null>(null)
  
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production Key',
      key: 'crm_live_sk_1234567890abcdef',
      created: '2024-01-15',
      lastUsed: '2024-01-20',
    },
    {
      id: '2',
      name: 'Development Key',
      key: 'crm_test_sk_0987654321fedcba',
      created: '2024-01-10',
      lastUsed: null,
    },
  ])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')

  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const copyKey = async (key: string, id: string) => {
    await navigator.clipboard.writeText(key)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const deleteKey = (id: string) => {
    if (confirm('Är du säker på att du vill ta bort denna API-nyckel? Detta kan inte ångras.')) {
      setApiKeys(prev => prev.filter(k => k.id !== id))
    }
  }

  const maskKey = (key: string) => {
    return key.substring(0, 12) + '•'.repeat(20)
  }

  const createNewKey = () => {
    if (!newKeyName) return
    
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `crm_live_sk_${Math.random().toString(36).substring(2, 18)}`,
      created: new Date().toISOString().split('T')[0],
      lastUsed: null,
    }
    
    setApiKeys(prev => [...prev, newKey])
    setNewKeyName('')
    setShowCreateModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Warning banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-800">Hantera med försiktighet</p>
          <p className="text-sm text-yellow-700 mt-1">
            API-nycklar ger full åtkomst till ditt CRM. Dela aldrig dina nycklar och rotera dem regelbundet.
          </p>
        </div>
      </div>

      {/* API Keys */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">API-nycklar</h3>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary text-sm"
          >
            <Plus className="w-4 h-4" />
            Skapa nyckel
          </button>
        </div>
        <div className="card-body p-0">
          {apiKeys.length === 0 ? (
            <div className="p-8 text-center">
              <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Inga API-nycklar</p>
              <p className="text-sm text-gray-400 mt-1">Skapa din första nyckel för att komma igång</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{apiKey.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Skapad: {apiKey.created}
                        {apiKey.lastUsed && ` • Senast använd: ${apiKey.lastUsed}`}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteKey(apiKey.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-mono text-gray-700">
                      {showKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                    </code>
                    <button
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      {showKeys[apiKey.id] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => copyKey(apiKey.key, apiKey.id)}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        copied === apiKey.id 
                          ? 'text-green-600 bg-green-50' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {copied === apiKey.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* API Documentation */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">API-dokumentation</h3>
        </div>
        <div className="card-body">
          <p className="text-gray-600 mb-4">
            Använd vårt REST API för att integrera med externa system och automatisera arbetsflöden.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-500 mb-2">Base URL</p>
            <code className="text-sm font-mono text-gray-700">
              https://leads.techchange.io/api/v1
            </code>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <code className="text-sm font-mono text-brand-600">GET /leads</code>
                <p className="text-sm text-gray-500">Lista alla leads</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <code className="text-sm font-mono text-brand-600">POST /leads</code>
                <p className="text-sm text-gray-500">Skapa ny lead</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <code className="text-sm font-mono text-brand-600">GET /contacts</code>
                <p className="text-sm text-gray-500">Lista alla kontakter</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <code className="text-sm font-mono text-brand-600">POST /activities</code>
                <p className="text-sm text-gray-500">Logga ny aktivitet</p>
              </div>
            </div>
          </div>

          <a 
            href="/api-docs" 
            className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium text-sm mt-4"
          >
            Visa full dokumentation →
          </a>
        </div>
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skapa ny API-nyckel</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Namn
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="t.ex. Production, Zapier, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                Avbryt
              </button>
              <button
                onClick={createNewKey}
                disabled={!newKeyName}
                className="btn-primary disabled:opacity-50"
              >
                Skapa nyckel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
