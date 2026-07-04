'use client'

import { useState, useEffect } from 'react'

const SCRIPT_TYPES = [
  { value: 'link', label: 'Link de Compra', icon: '🔗', desc: 'Envia link para compra do produto' },
  { value: 'booking', label: 'Agendamento', icon: '📅', desc: 'Envia link para agendar consultoria' },
  { value: 'script', label: 'Ensinamento', icon: '📖', desc: 'Resposta educativa ou conteúdo' },
  { value: 'objection', label: 'Objeção', icon: '💬', desc: 'Resposta para dúvida ou resistência' },
  ]

const EMPTY_SCRIPT = {
    id: null, name: '', type: 'link', triggers: '', url: '', response: '', active: true,
}

export default function ScriptsPage() {
    const [scripts, setScripts] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editing, setEditing] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [filterType, setFilterType] = useState('all')
    const [error, setError] = useState(null)

  useEffect(() => { fetchScripts() }, [])

  async function fetchScripts() {
        try {
                setLoading(true)
                const res = await fetch('/api/admin/scripts?tenant_id=camila-rocha')
                const data = await res.json()
                setScripts(data.scripts || [])
        } catch (e) { setError('Erro ao carregar scripts') }
        finally { setLoading(false) }
  }

  async function saveScript(script) {
        try {
                setSaving(true)
                setError(null)
                const res = await fetch('/api/admin/scripts', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ tenant_id: 'camila-rocha', script }),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Erro ao salvar')
                setScripts(data.scripts || [])
                setShowForm(false)
                setEditing(null)
        } catch (e) { setError(e.message) }
        finally { setSaving(false) }
  }

  async function deleteScript(id) {
        if (!confirm('Remover este script?')) return
        try {
                const res = await fetch('/api/admin/scripts', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ tenant_id: 'camila-rocha', script_id: id }),
                })
                const data = await res.json()
                setScripts(data.scripts || [])
        } catch (e) { setError('Erro ao remover script') }
  }

  async function toggleActive(script) {
        await saveScript({ ...script, active: !script.active })
  }

  const filtered = filterType === 'all' ? scripts : scripts.filter(s => s.type === filterType)
    const typeInfo = (type) => SCRIPT_TYPES.find(t => t.value === type) || SCRIPT_TYPES[0]

  return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white">Scripts & Links</h1>
              <p className="text-gray-400 text-sm mt-1">Ensine a IA a responder com links, agendamentos e scripts</p>
    </div>
            <button
              onClick={() => { setEditing({ ...EMPTY_SCRIPT }); setShowForm(true) }}
              className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
                            + Novo Script
                </button>
                </div>

  {error && (
              <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
           )}

        <div className="flex gap-2 mb-6 flex-wrap">
                    <button onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterType === 'all' ? 'bg-pink-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            Todos ({scripts.length})
              </button>
{SCRIPT_TYPES.map(t => (
              <button key={t.value} onClick={() => setFilterType(t.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterType === t.value ? 'bg-pink-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
{t.icon} {t.label} ({scripts.filter(s => s.type === t.value).length})
</button>
          ))}
            </div>

{showForm && editing && (
            <ScriptForm
             script={editing}
             saving={saving}
             onSave={saveScript}
             onCancel={() => { setShowForm(false); setEditing(null); setError(null) }}
             types={SCRIPT_TYPES}
           />
                       )}

{loading ? (
            <div className="text-center py-12 text-gray-500">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">Nenhum script encontrado</p>
              <button onClick={() => { setEditing({ ...EMPTY_SCRIPT }); setShowForm(true) }} className="text-pink-400 text-sm hover:underline">
                Criar o primeiro script
  </button>
  </div>
        ) : (
                    <div className="space-y-3">
          {filtered.map(script => {
                        const info = typeInfo(script.type)
                        return (
                                          <div key={script.id} className={`bg-gray-900 border rounded-xl p-4 transition-all ${script.active ? 'border-gray-700' : 'border-gray-800 opacity-60'}`}>
                  <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <span className="text-xl mt-0.5 flex-shrink-0">{info.icon}</span>
                      <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-white text-sm">{script.name}</span>
                          <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full">{info.label}</span>
{!script.active && <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-500 rounded-full">Inativo</span>}
  </div>
 {script.triggers && <p className="text-xs text-gray-500 mt-1">Gatilhos: {script.triggers}</p>}
  {script.url && <p className="text-xs text-blue-400 mt-1 truncate">{script.url}</p>}
   {script.response && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{script.response}</p>}
     </div>
     </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                           <button onClick={() => toggleActive(script)}
                            className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${script.active ? 'bg-pink-600' : 'bg-gray-700'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow ${script.active ? 'left-5' : 'left-0.5'}`} />
    </button>
                        <button onClick={() => { setEditing({ ...script }); setShowForm(true) }}
                         className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-gray-800 transition-colors">
                                                   Editar
                           </button>
                       <button onClick={() => deleteScript(script.id)}
                        className="text-gray-600 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-gray-800 transition-colors">
                                                  ✕
                          </button>
                          </div>
                          </div>
                          </div>
              )
})}
</div>
        )}
</div>
          </div>
  )
}

function ScriptForm({ script, saving, onSave, onCancel, types }) {
    const [form, setForm] = useState(script)
    const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  function handleSubmit(e) {
        e.preventDefault()
        if (!form.name.trim()) return
        onSave(form)
  }

  const selectedType = types.find(t => t.value === form.type)

  return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">{form.id ? 'Editar Script' : 'Novo Script'}</h2>
          <p className="text-gray-500 text-sm mt-0.5">{selectedType?.desc}</p>
  </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
{types.map(t => (
                  <button key={t.value} type="button" onClick={() => update('type', t.value)}
                  className={`p-2.5 rounded-lg border text-left transition-all text-xs ${form.type === t.value ? 'border-pink-500 bg-pink-950/40 text-pink-300' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'}`}>
                  <span className="text-base mr-1">{t.icon}</span>
                  <span className="font-medium">{t.label}</span>
                    </button>
              ))}
                </div>
                </div>

          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Nome do Script</label>
            <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
                              placeholder="Ex: Link de compra do curso"
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-pink-500 placeholder-gray-600"
              required />
                </div>

          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">
                              Gatilhos <span className="text-gray-600 font-normal">(palavras separadas por vírgula)</span>
                </label>
            <input type="text" value={form.triggers} onChange={e => update('triggers', e.target.value)}
                              placeholder="Ex: quero comprar, como faço, preço, valor"
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-pink-500 placeholder-gray-600" />
                </div>

{(form.type === 'link' || form.type === 'booking') && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Link URL</label>
               <input type="url" value={form.url} onChange={e => update('url', e.target.value)}
                  placeholder="https://"
                 className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-pink-500 placeholder-gray-600" />
                   </div>
           )}

          <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">
                          Resposta da IA {form.url && <span className="text-gray-600 font-normal">— use {'{URL}'} para incluir o link</span>}
            </label>
                                                      <textarea value={form.response} onChange={e => update('response', e.target.value)}
                          placeholder={form.type === 'link' ? 'Ex: Para garantir sua vaga, acesse: {URL}' : 'Ex: Agende sua consultoria aqui: {URL}'}
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-pink-500 placeholder-gray-600 resize-none" />
                </div>

          <div className="flex items-center justify-between pt-1">
                            <div>
                              <span className="text-sm text-gray-300">Script ativo</span>
              <p className="text-xs text-gray-600">A IA usará este script nas conversas</p>
                </div>
            <button type="button" onClick={() => update('active', !form.active)}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.active ? 'bg-pink-600' : 'bg-gray-700'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow ${form.active ? 'left-7' : 'left-1'}`} />
                </button>
                </div>

          <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors">
                              Cancelar
                </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 bg-pink-600 hover:bg-pink-500 disabled:bg-pink-900 text-white text-sm font-medium rounded-lg transition-colors">
              {saving ? 'Salvando...' : 'Salvar Script'}
</button>
  </div>
  </form>
  </div>
  </div>
  )
}
