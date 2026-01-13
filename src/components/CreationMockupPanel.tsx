import { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'

const SAMPLE_ASSETS = [
  { name: '마법의 드래곤', category: 'character' },
  { name: '고대 성', category: 'environment' },
  { name: '마법 검', category: 'prop' },
  { name: '숲의 수호자', category: 'character' },
]

export function CreationMockupPanel() {
  const { isGenerating, setIsGenerating, generationProgress, setGenerationProgress } = useAppStore()
  const [prompt, setPrompt] = useState('')
  const [generatedAsset, setGeneratedAsset] = useState<typeof SAMPLE_ASSETS[0] | null>(null)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>

    if (isGenerating) {
      interval = setInterval(() => {
        setGenerationProgress(Math.min(generationProgress + Math.random() * 15, 100))
      }, 300)
    }

    return () => clearInterval(interval)
  }, [isGenerating, generationProgress, setGenerationProgress])

  useEffect(() => {
    if (generationProgress >= 100 && isGenerating) {
      setIsGenerating(false)
      setGenerationProgress(0)
      // Select random sample asset
      const randomAsset = SAMPLE_ASSETS[Math.floor(Math.random() * SAMPLE_ASSETS.length)]
      setGeneratedAsset(randomAsset)
    }
  }, [generationProgress, isGenerating, setIsGenerating, setGenerationProgress])

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return
    setIsGenerating(true)
    setGenerationProgress(0)
    setGeneratedAsset(null)
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'character': return '캐릭터'
      case 'environment': return '환경'
      case 'prop': return '소품'
      default: return category
    }
  }

  return (
    <div className="panel" style={{ flex: 1 }}>
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-title-icon">✨</span>
          AI 모델 생성
        </div>
        <span className="tag tag-accent">목업</span>
      </div>
      
      <div className="panel-content">
        <div className="input-group" style={{ marginBottom: '1rem' }}>
          <label className="input-label">생성 프롬프트</label>
          <textarea
            className="textarea"
            placeholder="생성하고 싶은 3D 모델을 설명하세요...&#10;&#10;예시: 빛나는 눈과 나무 갑옷을 가진 신비로운 숲의 생물"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            style={{ minHeight: '100px' }}
          />
        </div>

        <button
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginBottom: '1rem' }}
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
        >
          {isGenerating ? (
            <>
              <span className="generation-spinner" />
              생성 중...
            </>
          ) : (
            <>✨ 3D 모델 생성</>
          )}
        </button>

        {isGenerating && (
          <div className="generation-status fade-in">
            <div className="generation-status-text">
              <span className="generation-spinner" />
              AI가 모델을 생성하고 있습니다...
            </div>
            <div className="progress">
              <div 
                className="progress-bar" 
                style={{ width: `${generationProgress}%` }} 
              />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              {Math.round(generationProgress)}% 완료
            </div>
          </div>
        )}

        {generatedAsset && !isGenerating && (
          <div className="fade-in" style={{ marginTop: '1rem' }}>
            <div className="card active">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="asset-thumbnail" style={{ background: 'var(--gradient-primary)' }}>
                  🎉
                </div>
                <div>
                  <div className="card-title">생성 완료!</div>
                  <div className="card-subtitle">{generatedAsset.name}</div>
                </div>
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className="tag tag-primary">{getCategoryLabel(generatedAsset.category)}</span>
                <span className="tag tag-secondary">사용 준비됨</span>
              </div>
            </div>
            
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '0.75rem' }}
              onClick={() => setGeneratedAsset(null)}
            >
              에셋 라이브러리에 추가
            </button>
          </div>
        )}

        <div className="divider" />
        
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          <strong>참고:</strong> 이것은 UI 목업입니다. 생성 과정을 시뮬레이션하고 
          샘플 에셋을 표시합니다. 실제 AI 생성은 프로덕션에서 연결됩니다.
        </div>
      </div>
    </div>
  )
}
