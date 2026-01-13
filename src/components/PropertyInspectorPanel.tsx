import { useState } from 'react'
import { usePlacedModels } from '../hooks/useSupabase'
import { useAppStore } from '../store/appStore'
import type { PlacedModel } from '../types/database'
import { 
  Trash2, 
  Settings, 
  Move, 
  Activity, 
  Play, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  MousePointer,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

const ANIMATION_PRESETS = [
  { key: 'Idle', label: '대기' },
  { key: 'Walk', label: '걷기' },
  { key: 'Run', label: '달리기' },
  { key: 'Jump', label: '점프' },
  { key: 'Action_01', label: '액션 1' },
  { key: 'Action_02', label: '액션 2' },
  { key: 'Interact', label: '상호작용' },
  { key: 'Celebrate', label: '축하' }
]

// Components must be declared OUTSIDE the main function to avoid re-declaration errors
const PropertyGroup = ({ title, icon: Icon, children, defaultExpanded = true }: any) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="border-b border-black/20 pb-6 last:border-0">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 mb-4 w-full text-left hover:text-white transition-colors group"
      >
        <div className="text-slate-500 group-hover:text-white transition-colors">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-200">
          <Icon size={14} />
          <span>{title}</span>
        </div>
      </button>
      
      {isExpanded && (
        <div className="space-y-4 pl-2 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}

const NumberInput = ({ label, value, onChange, step = 0.1, unit }: any) => (
  <div className="flex items-center bg-[#1e1e24] rounded border border-black/20 overflow-hidden hover:border-blue-500/50 transition-colors h-10">
    {label && (
      <div className="px-4 text-[11px] text-slate-500 font-medium border-r border-black/20 select-none cursor-ew-resize flex items-center h-full bg-[#25252b]">
        {label}
      </div>
    )}
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      step={step}
      className="w-full bg-[#18181e] text-xs px-3 outline-none text-slate-200 focus:text-white h-full"
    />
    {unit && <div className="px-3 text-[11px] text-slate-500 flex items-center h-full bg-[#25252b] border-l border-black/20">{unit}</div>}
  </div>
)

const Vector3Input = ({ values, onChange, labels = ['X', 'Y', 'Z'] }: any) => (
  <div className="grid grid-cols-3 gap-3">
    <NumberInput label={labels[0]} value={values[0]} onChange={(v: number) => onChange('x', v)} />
    <NumberInput label={labels[1]} value={values[1]} onChange={(v: number) => onChange('y', v)} />
    <NumberInput label={labels[2]} value={values[2]} onChange={(v: number) => onChange('z', v)} />
  </div>
)

export function PropertyInspectorPanel() {
  const { 
    selectedChapter, 
    selectedPlacedModel, 
    setSelectedPlacedModel,
    assets,
    animationState
  } = useAppStore()
  
  // Placed models for selected chapter
  const { modifyPlacedModel, deletePlacedModel } = usePlacedModels(selectedChapter?.id)
  
  const [saving, setSaving] = useState(false)

  // Handle position change
  const handlePositionChange = async (axis: 'x' | 'y' | 'z', value: number) => {
    if (!selectedPlacedModel) return
    setSaving(true)
    const field = `position_${axis}` as keyof PlacedModel
    await modifyPlacedModel(selectedPlacedModel.id, { [field]: value })
    setSelectedPlacedModel({ ...selectedPlacedModel, [field]: value })
    setSaving(false)
  }

  // Handle rotation change
  const handleRotationChange = async (axis: 'x' | 'y' | 'z', value: number) => {
    if (!selectedPlacedModel) return
    setSaving(true)
    const field = `rotation_${axis}` as keyof PlacedModel
    await modifyPlacedModel(selectedPlacedModel.id, { [field]: value })
    setSelectedPlacedModel({ ...selectedPlacedModel, [field]: value })
    setSaving(false)
  }

  // Handle scale change
  const handleScaleChange = async (axis: 'x' | 'y' | 'z', value: number) => {
    if (!selectedPlacedModel) return
    setSaving(true)
    const field = `scale_${axis}` as keyof PlacedModel
    await modifyPlacedModel(selectedPlacedModel.id, { [field]: value })
    setSelectedPlacedModel({ ...selectedPlacedModel, [field]: value })
    setSaving(false)
  }

  // Handle uniform scale change
  const handleUniformScaleChange = async (value: number) => {
    if (!selectedPlacedModel) return
    setSaving(true)
    await modifyPlacedModel(selectedPlacedModel.id, { 
      scale_x: value, 
      scale_y: value, 
      scale_z: value 
    })
    setSelectedPlacedModel({ 
      ...selectedPlacedModel, 
      scale_x: value, 
      scale_y: value, 
      scale_z: value 
    })
    setSaving(false)
  }

  // Handle field change
  const handleFieldChange = async <K extends keyof PlacedModel>(field: K, value: PlacedModel[K]) => {
    if (!selectedPlacedModel) return
    setSaving(true)
    await modifyPlacedModel(selectedPlacedModel.id, { [field]: value })
    setSelectedPlacedModel({ ...selectedPlacedModel, [field]: value })
    setSaving(false)
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedPlacedModel) return
    if (!confirm('이 모델을 삭제하시겠습니까?')) return
    await deletePlacedModel(selectedPlacedModel.id)
    setSelectedPlacedModel(null)
  }

  // Get asset name
  const getAssetName = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId)
    return asset?.name || '알 수 없는 에셋'
  }

  return (
    <div className="h-full flex flex-col bg-[#25252b] text-slate-300 select-none">
      {/* Header */}
      <div className="h-14 px-6 flex items-center justify-between bg-[#25252b] border-b border-black/20">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          <Settings size={14} />
          <span>Properties</span>
        </div>
        {saving && (
          <span className="text-[10px] text-blue-400 animate-pulse">Saving...</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
        {!selectedChapter ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <AlertCircle size={24} />
            <p className="text-xs">챕터를 선택하세요</p>
          </div>
        ) : !selectedPlacedModel ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <MousePointer size={24} />
            <p className="text-xs">모델을 선택하세요</p>
          </div>
        ) : (
          <>
            {/* Header Info */}
            <div className="pb-6 border-b border-black/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white text-base truncate pr-2">{selectedPlacedModel.name}</h3>
                <button
                  onClick={handleDelete}
                  className="p-2 text-slate-500 hover:text-red-400 rounded hover:bg-white/5 transition-colors"
                  title="삭제"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="text-xs text-slate-500 truncate bg-[#1e1e24] px-2 py-1 rounded inline-block">
                {getAssetName(selectedPlacedModel.asset_id)}
              </div>
            </div>

            {/* Transform */}
            <PropertyGroup title="Transform" icon={Move}>
              <div>
                <label className="text-[11px] text-slate-500 mb-2 block font-medium">Position</label>
                <Vector3Input
                  values={[selectedPlacedModel.position_x, selectedPlacedModel.position_y, selectedPlacedModel.position_z]}
                  onChange={handlePositionChange}
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-2 block font-medium">Rotation</label>
                <Vector3Input
                  values={[
                    Math.round((selectedPlacedModel.rotation_x || 0) * (180 / Math.PI)),
                    Math.round((selectedPlacedModel.rotation_y || 0) * (180 / Math.PI)),
                    Math.round((selectedPlacedModel.rotation_z || 0) * (180 / Math.PI))
                  ]}
                  onChange={(axis: any, v: number) => handleRotationChange(axis, v * (Math.PI / 180))}
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-2 block font-medium">Scale</label>
                <div className="flex gap-3 mb-2">
                  <div className="flex-1">
                     <NumberInput 
                        value={selectedPlacedModel.scale_x} 
                        onChange={handleUniformScaleChange}
                        label="Uniform"
                     />
                  </div>
                </div>
                <Vector3Input
                  values={[selectedPlacedModel.scale_x, selectedPlacedModel.scale_y, selectedPlacedModel.scale_z]}
                  onChange={handleScaleChange}
                />
              </div>
            </PropertyGroup>

            {/* Trigger */}
            <PropertyGroup title="Trigger Zone" icon={Activity}>
              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-3 font-medium">
                  <span>Radius</span>
                  <span className="text-white bg-[#1e1e24] px-2 py-0.5 rounded">{selectedPlacedModel.trigger_radius.toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={selectedPlacedModel.trigger_radius}
                  onChange={(e) => handleFieldChange('trigger_radius', parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#1e1e24] rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                />
              </div>
            </PropertyGroup>

            {/* Animation */}
            <PropertyGroup title="Animation" icon={Play}>
              {animationState.availableAnimations.length > 0 && (
                <div className="mb-4">
                  <label className="text-[11px] text-slate-500 mb-2 block font-medium">Source Clip</label>
                  <select
                    value={selectedPlacedModel.animation_key || ''}
                    onChange={(e) => handleFieldChange('animation_key', e.target.value || null)}
                    className="w-full h-10 bg-[#1e1e24] border border-black/20 rounded text-xs px-3 outline-none text-slate-300 focus:border-blue-500/50 hover:border-white/10 transition-colors"
                  >
                    <option value="">None</option>
                    {animationState.availableAnimations.map(anim => (
                      <option key={anim} value={anim}>{anim}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                {ANIMATION_PRESETS.map(anim => (
                  <button
                    key={anim.key}
                    onClick={() => handleFieldChange('animation_key', anim.key)}
                    className={`
                      h-9 px-3 text-[11px] rounded border transition-all text-left truncate font-medium
                      ${selectedPlacedModel.animation_key === anim.key
                        ? 'bg-blue-500/20 border-blue-500 text-blue-100 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                        : 'bg-[#1e1e24] border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#2a2a35] hover:border-white/10'
                      }
                    `}
                  >
                    {anim.label}
                  </button>
                ))}
              </div>
            </PropertyGroup>

            {/* State */}
            <PropertyGroup title="State" icon={CheckCircle}>
               <button
                  onClick={() => handleFieldChange('is_active', !selectedPlacedModel.is_active)}
                  className={`
                    w-full flex items-center justify-between px-4 h-12 rounded-lg border transition-all
                    ${selectedPlacedModel.is_active
                      ? 'bg-green-500/10 border-green-500/30 text-green-200 hover:bg-green-500/20 hover:border-green-500/50'
                      : 'bg-red-500/10 border-red-500/30 text-red-200 hover:bg-red-500/20 hover:border-red-500/50'
                    }
                  `}
               >
                 <span className="text-sm font-medium">
                   {selectedPlacedModel.is_active ? 'Active' : 'Inactive'}
                 </span>
                 {selectedPlacedModel.is_active ? <CheckCircle size={18} /> : <XCircle size={18} />}
               </button>
            </PropertyGroup>
          </>
        )}
      </div>
    </div>
  )
}
