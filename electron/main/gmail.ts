import { gmailGetToken } from './auth'

const BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'

async function api(path: string, method = 'GET', body?: unknown) {
  const token = await gmailGetToken()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`Gmail ${res.status}: ${await res.text()}`)
  return res.json()
}

export interface MessageSummary {
  id: string
  threadId: string
  snippet: string
  from: string
  subject: string
  date: string
  unread: boolean
}

function headerVal(headers: { name: string; value: string }[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''
}

function decodeBody(part: { body?: { data?: string }; parts?: unknown[] }): string {
  if (part.body?.data) {
    return Buffer.from(part.body.data, 'base64').toString('utf-8')
  }
  if (part.parts) {
    for (const p of part.parts as typeof part[]) {
      const text = decodeBody(p)
      if (text) return text
    }
  }
  return ''
}

export async function getInbox(query = 'in:inbox'): Promise<MessageSummary[]> {
  const list = await api(`/messages?maxResults=30&q=${encodeURIComponent(query)}`)
  if (!list.messages) return []

  const summaries = await Promise.all(
    list.messages.map(async ({ id }: { id: string }) => {
      const msg = await api(`/messages/${id}?format=metadata&metadataHeaders=From,Subject,Date`)
      const headers: { name: string; value: string }[] = msg.payload?.headers ?? []
      return {
        id: msg.id,
        threadId: msg.threadId,
        snippet: msg.snippet ?? '',
        from: headerVal(headers, 'From'),
        subject: headerVal(headers, 'Subject'),
        date: headerVal(headers, 'Date'),
        unread: (msg.labelIds as string[])?.includes('UNREAD') ?? false,
      } satisfies MessageSummary
    })
  )
  return summaries
}

export interface FullMessage extends MessageSummary {
  body: string
  messageId: string
  to: string
}

export async function getMessage(id: string): Promise<FullMessage> {
  const msg = await api(`/messages/${id}?format=full`)
  const headers: { name: string; value: string }[] = msg.payload?.headers ?? []
  return {
    id: msg.id,
    threadId: msg.threadId,
    snippet: msg.snippet ?? '',
    from: headerVal(headers, 'From'),
    to: headerVal(headers, 'To'),
    subject: headerVal(headers, 'Subject'),
    date: headerVal(headers, 'Date'),
    unread: (msg.labelIds as string[])?.includes('UNREAD') ?? false,
    body: decodeBody(msg.payload),
    messageId: headerVal(headers, 'Message-ID'),
  }
}

export async function sendReply(opts: {
  to: string
  subject: string
  body: string
  threadId: string
  inReplyTo: string
}): Promise<void> {
  const raw = [
    `To: ${opts.to}`,
    `Subject: ${opts.subject.startsWith('Re:') ? opts.subject : `Re: ${opts.subject}`}`,
    `In-Reply-To: ${opts.inReplyTo}`,
    `References: ${opts.inReplyTo}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    opts.body,
  ].join('\r\n')

  await api('/messages/send', 'POST', {
    raw: Buffer.from(raw).toString('base64url'),
    threadId: opts.threadId,
  })
}

export async function markAsRead(id: string): Promise<void> {
  await api(`/messages/${id}/modify`, 'POST', { removeLabelIds: ['UNREAD'] })
}
