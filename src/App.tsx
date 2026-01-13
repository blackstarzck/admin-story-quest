import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navigation } from './components/Navigation'
import { EditorPage } from './pages/EditorPage'
import { AssetManagerPage } from './pages/AssetManagerPage'

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
        <Navigation />
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<EditorPage />} />
            <Route path="/assets" element={<AssetManagerPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
