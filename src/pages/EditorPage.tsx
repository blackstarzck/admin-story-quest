import { AssetLibraryPanel } from '../components/AssetLibraryPanel'
import BookChapterPanel from '../components/BookChapterPanel'
import { PropertyInspectorPanel } from '../components/PropertyInspectorPanel'
import { PreviewCanvas } from '../components/PreviewCanvas'

export function EditorPage() {
  return (
    <div className="flex w-full h-full overflow-hidden relative">
      {/* Left Sidebar - Book/Chapter Explorer & Asset Library */}
      <aside className="w-80 flex flex-col border-r border-black/20 bg-[#1e1e24] z-20 h-full relative">
        <div className="flex-1 overflow-hidden flex flex-col">
          <BookChapterPanel />
        </div>
        <div className="h-1/3 border-t border-black/20 overflow-hidden flex flex-col">
          <AssetLibraryPanel showUpload={false} />
        </div>
      </aside>

      {/* Main Content - 3D Preview & Floating Inspector */}
      <div className="absolute inset-0 pl-80 bg-slate-950 overflow-hidden">
        {/* Canvas fills the area */}
        <div className="w-full h-full">
          <PreviewCanvas />
        </div>

        {/* Floating Right Panel - Property Inspector */}
        <div className="absolute top-6 right-6 w-80 max-h-[calc(100%-3rem)] flex flex-col rounded-xl shadow-2xl overflow-hidden border border-white/10 z-10 bg-[#25252b]/95 backdrop-blur-sm pointer-events-auto">
          <PropertyInspectorPanel />
        </div>
      </div>
    </div>
  )
}
