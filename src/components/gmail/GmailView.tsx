import { useState, useEffect, useCallback } from 'react'

interface Props {
  connected: boolean
  onConnectionChange: () => void
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  return isToday
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function senderName(from: string) {
  const match = from.match(/^"?([^"<]+)"?\s*</)
  return match ? match[1].trim() : from.replace(/<.*>/, '').trim() || from
}

function BackIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/></svg>
}

export default function GmailView({ connected }: Props) {
  const [messages, setMessages] = useState<GmailMessage[]>([])
  const [selected, setSelected] = useState<GmailFullMessage | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [replying, setReplying] = useState(false)
  const [replyStatus, setReplyStatus] = useState('')
  const [error, setError] = useState('')

  const fetchInbox = useCallback(async (query?: string) => {
    if (!connected) return
    setLoading(true)
    try {
      const msgs = query
        ? await window.hub.gmailSearch(query)
        : await window.hub.gmailGetInbox()
      setMessages(msgs)
      setError('')
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [connected])

  useEffect(() => {
    fetchInbox()
  }, [fetchInbox])

  async function openMessage(msg: GmailMessage) {
    setLoadingMsg(true)
    setSelected(null)
    setReplyBody('')
    setReplyStatus('')
    try {
      const full = await window.hub.gmailGetMessage(msg.id)
      setSelected(full)
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, unread: false } : m))
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoadingMsg(false)
    }
  }

  async function sendReply() {
    if (!selected || !replyBody.trim()) return
    setReplying(true)
    try {
      await window.hub.gmailSendReply({
        to: selected.from,
        subject: selected.subject,
        body: replyBody,
        threadId: selected.threadId,
        inReplyTo: selected.messageId,
      })
      setReplyBody('')
      setReplyStatus('Reply sent!')
      setTimeout(() => setReplyStatus(''), 3000)
    } catch (e: unknown) {
      setReplyStatus(`Error: ${(e as Error).message}`)
    } finally {
      setReplying(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    fetchInbox(searchInput || undefined)
    setSelected(null)
  }

  if (!connected) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-400">
        <div className="text-[#EA4335] mb-4">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16">
            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
          </svg>
        </div>
        <p className="text-lg font-medium mb-2">Connect Gmail</p>
        <p className="text-sm text-zinc-500">Go to Settings to add your credentials.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Left panel – inbox list */}
      <div className="w-80 flex flex-col border-r border-zinc-800 shrink-0">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 p-3 border-b border-zinc-800">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search mail…"
            className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#EA4335]"
          />
          <button type="submit" className="px-3 py-2 bg-[#EA4335] rounded-lg text-white text-sm font-medium hover:bg-[#d93025] transition-colors">
            Go
          </button>
        </form>

        {search && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-xs text-zinc-400 border-b border-zinc-800">
            <span>Results for "{search}"</span>
            <button
              onClick={() => { setSearchInput(''); setSearch(''); fetchInbox() }}
              className="ml-auto text-zinc-500 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-20 text-zinc-500 text-sm">Loading…</div>
          )}
          {!loading && messages.length === 0 && (
            <div className="flex items-center justify-center h-20 text-zinc-500 text-sm">No messages</div>
          )}
          {messages.map((msg) => (
            <button
              key={msg.id}
              onClick={() => openMessage(msg)}
              className={`w-full text-left px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/40 transition-colors
                ${selected?.id === msg.id ? 'bg-zinc-800/60' : ''}
                ${msg.unread ? 'bg-zinc-900/30' : ''}`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-sm truncate ${msg.unread ? 'font-semibold text-white' : 'text-zinc-300'}`}>
                  {senderName(msg.from)}
                </span>
                <span className="text-xs text-zinc-500 shrink-0 ml-2">{formatDate(msg.date)}</span>
              </div>
              <p className={`text-xs truncate ${msg.unread ? 'text-white' : 'text-zinc-400'}`}>{msg.subject}</p>
              <p className="text-xs text-zinc-600 truncate mt-0.5">{msg.snippet}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel – message detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {loadingMsg && (
          <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">Loading…</div>
        )}
        {!selected && !loadingMsg && (
          <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
            Select an email to read
          </div>
        )}
        {selected && !loadingMsg && (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800">
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-xs mb-3 transition-colors"
              >
                <BackIcon /> Back
              </button>
              <h2 className="text-lg font-semibold text-white leading-tight mb-1">{selected.subject}</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-300">{selected.from}</p>
                  <p className="text-xs text-zinc-500">To: {selected.to}</p>
                </div>
                <p className="text-xs text-zinc-500">{formatDate(selected.date)}</p>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">{selected.body}</pre>
            </div>

            {/* Reply */}
            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/30">
              <p className="text-xs text-zinc-500 mb-2">Reply to {senderName(selected.from)}</p>
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Write your reply…"
                rows={4}
                className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm text-white resize-none outline-none focus:ring-2 focus:ring-[#EA4335] mb-2"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={sendReply}
                  disabled={!replyBody.trim() || replying}
                  className="px-4 py-2 bg-[#EA4335] text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-[#d93025] transition-colors"
                >
                  {replying ? 'Sending…' : 'Send Reply'}
                </button>
                {replyStatus && <span className="text-sm text-zinc-400">{replyStatus}</span>}
              </div>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="absolute bottom-4 right-4 bg-red-900/80 text-red-200 text-xs px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  )
}
