import { Link, useLocation } from 'react-router-dom'

export function Navigation() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="app-header">
      <div className="flex items-center gap-6">
        <div className="app-logo">
          <div className="app-logo-icon">📚</div>
          StoryQuest 관리자
        </div>
        
        <nav className="flex items-center gap-1">
          <Link 
            to="/" 
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/') 
                ? 'bg-slate-700 text-white' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            챕터 편집기
          </Link>
          <Link 
            to="/assets" 
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/assets') 
                ? 'bg-slate-700 text-white' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            에셋 관리
          </Link>
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span className="tag tag-primary">프로토타입 v0.2</span>
      </div>
    </header>
  )
}
