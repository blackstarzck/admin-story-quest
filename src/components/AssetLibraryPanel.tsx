import { useRef, useState, useEffect } from 'react'
import { useAssets, useStorage } from '../hooks/useSupabase'
import { useAppStore } from '../store/appStore'
import { v4 as uuidv4 } from 'uuid'

export function AssetLibraryPanel({ showUpload = true }: { showUpload?: boolean }) {
  const { assets, loading, createAsset, deleteAsset, syncFromStorage } = useAssets()
  const { uploadFile, uploading } = useStorage()
  const { selectedAsset, setSelectedAsset } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newAssetName, setNewAssetName] = useState('')
  const [newAssetCategory, setNewAssetCategory] = useState('general')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const hasAutoSynced = useRef(false)

  // Auto-sync from Storage on first mount
  useEffect(() => {
    if (!hasAutoSynced.current && !loading) {
      hasAutoSynced.current = true
      handleSync(true) // silent mode
    }
  }, [loading])

  const handleSync = async (silent = false) => {
    if (syncing) return
    setSyncing(true)
    setSyncMessage(null)
    
    try {
      const result = await syncFromStorage()
      if (!silent && result) {
        setSyncMessage(result.message)
        setTimeout(() => setSyncMessage(null), 3000)
      }
    } finally {
      setSyncing(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileName = `${uuidv4()}_${file.name}`
    const url = await uploadFile(file, fileName)
    
    if (url) {
      await createAsset({
        name: newAssetName || file.name.replace(/\.[^/.]+$/, ''),
        storage_url: url,
        category: newAssetCategory,
        metadata: { scale: 1, rotation: [0, 0, 0], position: [0, 0, 0] }
      })
      setNewAssetName('')
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteAsset = async (assetId: string, storageUrl: string) => {
    if (deleting) return
    
    const confirmed = window.confirm('이 에셋을 삭제하시겠습니까? Storage의 파일도 함께 삭제됩니다.')
    if (!confirmed) return

    setDeleting(assetId)
    try {
      await deleteAsset(assetId, storageUrl)
      if (selectedAsset?.id === assetId) {
        setSelectedAsset(null)
      }
    } finally {
      setDeleting(null)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'character': return '👤'
      case 'environment': return '🌲'
      case 'prop': return '📦'
      default: return '🎨'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'character': return '캐릭터'
      case 'environment': return '환경'
      case 'prop': return '소품'
      case 'general': return '일반'
      default: return category
    }
  }

  return (
    <div className="panel" style={{ flex: 1 }}>
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-title-icon">📚</span>
          에셋 라이브러리
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => handleSync(false)}
            disabled={syncing || loading}
            title="Storage에서 파일 동기화"
          >
            {syncing ? '⏳' : '🔄'}
          </button>
          {showUpload && (
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? '업로드 중...' : '+ 업로드'}
            </button>
          )}
        </div>
      </div>
      
      <div className="panel-content">
        {/* Sync Message */}
        {syncMessage && (
          <div style={{ 
            marginBottom: '0.75rem', 
            padding: '0.5rem 0.75rem',
            backgroundColor: 'var(--color-success)',
            color: 'white',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            textAlign: 'center'
          }}>
            {syncMessage}
          </div>
        )}
        {/* Upload Form */}
        {showUpload && (
          <div style={{ marginBottom: '1rem' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb,.gltf"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            
            <div className="input-group" style={{ marginBottom: '0.5rem' }}>
              <label className="input-label">에셋 이름 (선택사항)</label>
              <input
                type="text"
                className="input"
                placeholder="파일명에서 자동 감지..."
                value={newAssetName}
                onChange={(e) => setNewAssetName(e.target.value)}
              />
            </div>
            
            <div className="input-group">
              <label className="input-label">카테고리</label>
              <select
                className="select"
                value={newAssetCategory}
                onChange={(e) => setNewAssetCategory(e.target.value)}
              >
                <option value="general">일반</option>
                <option value="character">캐릭터</option>
                <option value="environment">환경</option>
                <option value="prop">소품</option>
              </select>
            </div>
          </div>
        )}
        
        {showUpload && <div className="divider" />}
        
        {/* Asset List */}
        {loading ? (
          <div className="empty-state">
            <div className="generation-spinner" />
          </div>
        ) : assets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">에셋 없음</div>
            <div className="empty-state-text">.glb 또는 .gltf 파일을 업로드하세요</div>
          </div>
        ) : (
          <div className="list">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className={`asset-item ${selectedAsset?.id === asset.id ? 'active' : ''}`}
                onClick={() => setSelectedAsset(asset)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('assetId', asset.id)
                  e.dataTransfer.setData('assetName', asset.name)
                  e.dataTransfer.effectAllowed = 'copy'
                }}
              >
                <div className="asset-thumbnail">
                  {getCategoryIcon(asset.category)}
                </div>
                <div className="asset-info">
                  <div className="asset-name">{asset.name}</div>
                  <div className="asset-category">{getCategoryLabel(asset.category)}</div>
                </div>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteAsset(asset.id, asset.storage_url)
                  }}
                  disabled={deleting === asset.id}
                  title="에셋 및 파일 삭제"
                  style={{ opacity: deleting === asset.id ? 0.5 : 1 }}
                >
                  {deleting === asset.id ? '⏳' : '🗑️'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Asset Count */}
        {assets.length > 0 && (
          <div style={{ 
            marginTop: '1rem', 
            fontSize: '0.75rem', 
            color: 'var(--color-text-muted)',
            textAlign: 'center' 
          }}>
            라이브러리에 {assets.length}개 에셋
          </div>
        )}
      </div>
    </div>
  )
}
