import type { View } from '../App'

interface Props {
  view: View
  onNavigate: (v: View) => void
  spotifyConnected: boolean
  gmailConnected: boolean
}

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.516 17.311c-.217.356-.68.468-1.037.251-2.84-1.735-6.417-2.128-10.63-1.166-.406.093-.81-.161-.902-.567-.093-.406.16-.81.566-.902 4.61-1.053 8.566-.6 11.752 1.347.357.218.469.681.251 1.037zm1.471-3.272c-.273.444-.854.583-1.298.31-3.25-1.997-8.2-2.576-12.038-1.41-.499.15-1.025-.132-1.176-.631-.15-.499.131-1.025.63-1.176 4.387-1.332 9.839-.686 13.572 1.608.444.273.583.854.31 1.299zm.126-3.407c-3.9-2.317-10.336-2.529-14.064-1.399-.598.182-1.23-.154-1.412-.752-.182-.598.154-1.23.752-1.412 4.277-1.299 11.387-1.048 15.886 1.617.538.32.716 1.013.396 1.551-.32.537-1.013.716-1.558.395z" />
    </svg>
  )
}

function GmailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

interface NavBtnProps {
  active: boolean
  connected: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
  color?: string
}

function NavBtn({ active, connected, onClick, label, children, color = '#1DB954' }: NavBtnProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-150 group
        ${active ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
      style={active ? { backgroundColor: color + '22', color } : {}}
    >
      {children}
      {connected && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      )}
    </button>
  )
}

export default function Sidebar({ view, onNavigate, spotifyConnected, gmailConnected }: Props) {
  return (
    <aside className="flex flex-col items-center gap-3 w-[72px] bg-black pt-10 pb-6 shrink-0">
      <div className="flex flex-col gap-2 flex-1">
        <NavBtn
          active={view === 'spotify'}
          connected={spotifyConnected}
          onClick={() => onNavigate('spotify')}
          label="Spotify"
          color="#1DB954"
        >
          <SpotifyIcon />
        </NavBtn>

        <NavBtn
          active={view === 'gmail'}
          connected={gmailConnected}
          onClick={() => onNavigate('gmail')}
          label="Gmail"
          color="#EA4335"
        >
          <GmailIcon />
        </NavBtn>
      </div>

      <NavBtn
        active={view === 'settings'}
        connected={false}
        onClick={() => onNavigate('settings')}
        label="Settings"
        color="#a78bfa"
      >
        <SettingsIcon />
      </NavBtn>
    </aside>
  )
}
