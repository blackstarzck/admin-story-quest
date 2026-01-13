import { AssetLibraryPanel } from '../components/AssetLibraryPanel'
import { CreationMockupPanel } from '../components/CreationMockupPanel'

export function AssetManagerPage() {
  return (
    <div className="flex flex-1 h-full overflow-hidden bg-slate-950">
      <div className="container mx-auto p-6 flex gap-6 h-full">
        {/* Left: AI Creation */}
        <div className="w-96 flex flex-col h-full">
          <CreationMockupPanel />
        </div>

        {/* Right: Asset Library (Upload & Management) */}
        <div className="flex-1 flex flex-col h-full bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
          <AssetLibraryPanel showUpload={true} />
        </div>
      </div>
    </div>
  )
}
