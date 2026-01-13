import { Suspense, useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, PerspectiveCamera, Html, useGLTF, Center, useAnimations, PivotControls } from '@react-three/drei'
import { useAppStore } from '../store/appStore'
import { usePlacedModels, useAssets } from '../hooks/useSupabase'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import type { PlacedModel, Asset } from '../types/database'

// GLB Model Loader Component with Animation Support
function GLBModel({ 
  url, 
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  isSelected = false,
  onClick
}: { 
  url: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
  isSelected?: boolean
  onClick?: () => void
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const { scene, animations } = useGLTF(url)
  
  // Clone the scene properly to preserve skeleton bindings for animations
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene])
  
  // useAnimations needs the cloned scene and the group ref
  const { actions, names } = useAnimations(animations, groupRef)
  
  const { 
    animationState,
    setAvailableAnimations, 
    setCurrentAnimation,
    resetAnimationState
  } = useAppStore()

  // Register available animations when model loads
  useEffect(() => {
    console.log('Detected animations:', names)
    if (names.length > 0) {
      setAvailableAnimations(names)
      // Auto-play first animation
      if (!animationState.currentAnimation) {
        setCurrentAnimation(names[0])
      }
    } else {
      resetAnimationState()
    }
    
    return () => {
      // Stop all animations on unmount
      Object.values(actions).forEach(action => action?.stop())
    }
  }, [names])

  // Unified animation control - handles all state changes
  useEffect(() => {
    const currentAnim = animationState.currentAnimation
    if (!currentAnim || !actions[currentAnim]) {
      return
    }

    const action = actions[currentAnim]
    if (!action) return

    // Stop all other animations
    Object.entries(actions).forEach(([name, act]) => {
      if (name !== currentAnim && act && act.isRunning()) {
        act.fadeOut(0.2)
      }
    })

    // Apply all animation settings
    action.setLoop(
      animationState.loop ? THREE.LoopRepeat : THREE.LoopOnce,
      animationState.loop ? Infinity : 1
    )
    action.clampWhenFinished = !animationState.loop
    action.timeScale = animationState.speed

    // Handle play state
    if (!action.isRunning()) {
      action.reset()
      action.fadeIn(0.2)
      action.play()
    }
    
    // Apply pause state
    action.paused = !animationState.isPlaying

  }, [
    actions,
    animationState.currentAnimation,
    animationState.isPlaying,
    animationState.speed,
    animationState.loop
  ])

  // Enable shadows on all meshes
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [clonedScene])

  return (
    <group 
      ref={groupRef} 
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
    >
      <primitive object={clonedScene} />
      {isSelected && (
        <mesh>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#7c3aed" />
        </mesh>
      )}
    </group>
  )
}

// Fallback Model (when GLB fails to load)
function FallbackModel({ category }: { category: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3
    }
  })

  const getGeometry = () => {
    switch (category) {
      case 'character':
        return <capsuleGeometry args={[0.3, 1, 8, 16]} />
      case 'environment':
        return <boxGeometry args={[2, 2, 2]} />
      case 'prop':
        return <dodecahedronGeometry args={[0.5]} />
      default:
        return <sphereGeometry args={[0.5, 32, 32]} />
    }
  }

  const getColor = () => {
    switch (category) {
      case 'character': return '#7c3aed'
      case 'environment': return '#10b981'
      case 'prop': return '#f59e0b'
      default: return '#06b6d4'
    }
  }

  return (
    <mesh ref={meshRef} position={[0, 0.5, 0]} castShadow>
      {getGeometry()}
      <meshStandardMaterial 
        color={getColor()} 
        metalness={0.3} 
        roughness={0.6} 
        emissive={getColor()}
        emissiveIntensity={0.1}
      />
    </mesh>
  )
}

// Model Wrapper with Error Boundary
function ModelLoader({ 
  url, 
  category,
  position,
  rotation,
  scale,
  isSelected,
  onClick
}: { 
  url: string
  category: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
  isSelected?: boolean
  onClick?: () => void
}) {
  const [hasError, setHasError] = useState(false)
  const [key, setKey] = useState(0)

  useEffect(() => {
    setHasError(false)
    setKey(prev => prev + 1)
  }, [url])

  if (hasError || !url) {
    return <FallbackModel category={category} />
  }

  return (
    <Suspense fallback={<LoadingIndicator />}>
      <ErrorBoundary onError={() => setHasError(true)} key={key}>
        <GLBModel 
          url={url} 
          position={position}
          rotation={rotation}
          scale={scale}
          isSelected={isSelected}
          onClick={onClick}
        />
      </ErrorBoundary>
    </Suspense>
  )
}

// Simple Error Boundary for Three.js
function ErrorBoundary({ children, onError }: { children: React.ReactNode; onError: () => void }) {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('GLB') || event.message.includes('GLTF') || event.message.includes('fetch')) {
        onError()
      }
    }
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [onError])

  return <>{children}</>
}

// Loading Indicator
function LoadingIndicator() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 2
      meshRef.current.rotation.y += delta * 2
    }
  })

  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[0.3]} />
      <meshStandardMaterial color="#7c3aed" wireframe />
    </mesh>
  )
}

// Empty Scene Component
function EmptyScene() {
  return (
    <Html center>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        color: 'white',
        textAlign: 'center',
        pointerEvents: 'none'
      }}>
        <div style={{ fontSize: '3rem' }}>🗺️</div>
        <div style={{ fontSize: '1rem', fontWeight: 600 }}>3D 평면도</div>
        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
          챕터를 선택하고 모델을 배치하세요
        </div>
      </div>
    </Html>
  )
}

// Trigger Radius Circle
function TriggerRadiusCircle({ 
  radius, 
  position,
  isSelected
}: { 
  radius: number
  position: [number, number, number]
  isSelected: boolean
}) {
  const ref = useRef<THREE.Mesh>(null)
  
  useFrame((_, delta) => {
    if (ref.current && isSelected) {
      ref.current.rotation.z += delta * 0.5
    }
  })

  return (
    <mesh 
      ref={ref}
      position={[position[0], 0.01, position[2]]} 
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[radius - 0.05, radius, 32]} />
      <meshBasicMaterial 
        color={isSelected ? '#7c3aed' : '#3b82f6'} 
        transparent 
        opacity={isSelected ? 0.5 : 0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// Placed Model Renderer
function PlacedModelRenderer({ 
  model, 
  asset,
  isSelected,
  onClick,
  onTransformChange
}: { 
  model: PlacedModel
  asset: Asset | undefined
  isSelected: boolean
  onClick: () => void
  onTransformChange: (field: keyof PlacedModel, value: any) => void
}) {
  if (!asset) return null

  const position: [number, number, number] = [
    model.position_x,
    model.position_y,
    model.position_z
  ]

  const rotation: [number, number, number] = [
    model.rotation_x,
    model.rotation_y,
    model.rotation_z
  ]

  const scale: [number, number, number] = [
    model.scale_x,
    model.scale_y,
    model.scale_z
  ]

  const Model = (
    <group>
      <ModelLoader
        url={asset.storage_url}
        category={asset.category}
        position={isSelected ? [0, 0, 0] : position}
        rotation={isSelected ? [0, 0, 0] : rotation}
        scale={scale}
        isSelected={isSelected}
        onClick={onClick}
      />
      
      {/* Trigger radius visualization */}
      <TriggerRadiusCircle 
        radius={model.trigger_radius} 
        position={isSelected ? [0, 0, 0] : position}
        isSelected={isSelected}
      />

      {/* Model name label */}
      <Html position={isSelected ? [0, 2, 0] : [position[0], position[1] + 2, position[2]]} center>
        <div style={{
          background: isSelected ? '#7c3aed' : 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem',
          fontSize: '0.75rem',
          whiteSpace: 'nowrap',
          opacity: isSelected ? 1 : 0.7
        }}>
          {model.name}
        </div>
      </Html>
    </group>
  )

  if (isSelected) {
    return (
      <PivotControls
        visible={isSelected}
        scale={1.5}
        lineWidth={2}
        activeAxes={[true, true, true]}
        anchor={[0, 0, 0]}
        onDragEnd={() => {
          // Force update to save final position
        }}
        onDrag={(l, dl, w, dw) => {
          const newPos = new THREE.Vector3()
          const newRot = new THREE.Quaternion()
          const newScale = new THREE.Vector3()
          w.decompose(newPos, newRot, newScale)
          
          const euler = new THREE.Euler().setFromQuaternion(newRot)
          
          onTransformChange('position_x', newPos.x)
          onTransformChange('position_y', newPos.y)
          onTransformChange('position_z', newPos.z)
          
          onTransformChange('rotation_x', euler.x)
          onTransformChange('rotation_y', euler.y)
          onTransformChange('rotation_z', euler.z)
        }}
      >
        {/* We wrap the model in a group at the original position so PivotControls can control it */}
        <group position={position} rotation={rotation} scale={[1,1,1]}>
           {Model}
        </group>
      </PivotControls>
    )
  }

  return Model
}

// Drop Zone for adding models
function DropZone() {
  const { gl, camera, scene } = useThree()
  const { selectedChapter } = useAppStore()

  useEffect(() => {
    const canvas = gl.domElement

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy'
      }
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      if (!selectedChapter || !e.dataTransfer) return

      const assetId = e.dataTransfer.getData('assetId')
      const assetName = e.dataTransfer.getData('assetName')
      const assetCategory = e.dataTransfer.getData('assetCategory')

      if (!assetId || assetCategory === 'environment') return

      // Calculate drop position in 3D space
      const rect = canvas.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
      
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const intersection = new THREE.Vector3()
      raycaster.ray.intersectPlane(plane, intersection)

      // Call the global handler from BookChapterPanel
      const handler = (window as unknown as { handleAddModelToChapter?: (assetId: string, assetName: string, x?: number, z?: number) => void }).handleAddModelToChapter
      if (handler) {
        handler(assetId, assetName)
      }
    }

    canvas.addEventListener('dragover', handleDragOver)
    canvas.addEventListener('drop', handleDrop)

    return () => {
      canvas.removeEventListener('dragover', handleDragOver)
      canvas.removeEventListener('drop', handleDrop)
    }
  }, [gl, camera, scene, selectedChapter])

  return null
}

// Scene Content
function SceneContent() {
  const { 
    selectedAsset, 
    selectedChapter,
    selectedPlacedModel,
    setSelectedPlacedModel,
    assets,
    updatePlacedModel
  } = useAppStore()
  
  const { placedModels } = usePlacedModels(selectedChapter?.id)

  const handleTransformChange = (modelId: string) => (field: keyof PlacedModel, value: any) => {
    // Update local state immediately for smooth dragging
    updatePlacedModel(modelId, { [field]: value })
    
    // In a real app, we would save to DB here (debounced)
    if (selectedPlacedModel?.id === modelId) {
      setSelectedPlacedModel({ ...selectedPlacedModel, [field]: value })
    }
  }

  // Get environment asset for current chapter
  const environmentAsset = selectedChapter?.environment_asset_id
    ? assets.find(a => a.id === selectedChapter.environment_asset_id)
    : null

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[8, 8, 8]}
        fov={60}
      />
      
      <OrbitControls 
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={30}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={1.2} 
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight 
        position={[-5, 5, -5]} 
        intensity={0.5} 
      />
      <pointLight position={[0, 5, 0]} intensity={0.3} color="#7c3aed" />
      
      {/* Ground Grid */}
      <Grid
        position={[0, -0.01, 0]}
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#1a1a2e"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#2a2a3e"
        fadeDistance={25}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />
      
      {/* Ground Plane for shadows */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <shadowMaterial opacity={0.3} />
      </mesh>

      {/* Drop Zone Handler */}
      <DropZone />
      
      {/* Content */}
      {selectedChapter ? (
        <>
          {/* Environment Asset (floor plan) */}
          {environmentAsset && (
            <Center position={[0, 0, 0]}>
              <ModelLoader 
                url={environmentAsset.storage_url} 
                category={environmentAsset.category} 
              />
            </Center>
          )}

          {/* Placed Models */}
          {placedModels.map(model => (
            <PlacedModelRenderer
              key={model.id}
              model={model}
              asset={assets.find(a => a.id === model.asset_id)}
              isSelected={selectedPlacedModel?.id === model.id}
              onClick={() => setSelectedPlacedModel(model)}
              onTransformChange={handleTransformChange(model.id)}
            />
          ))}

          {/* Empty state if no models */}
          {placedModels.length === 0 && !environmentAsset && (
            <EmptyScene />
          )}
        </>
      ) : selectedAsset ? (
        <Center>
          <ModelLoader url={selectedAsset.storage_url} category={selectedAsset.category} />
        </Center>
      ) : (
        <EmptyScene />
      )}
    </>
  )
}

// Helper function to format animation name for display
function formatAnimationName(name: string): string {
  // Common patterns to clean up
  let cleaned = name
    .replace(/^(Armature|mixamo\.com|Take\s*\d+)\|/i, '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
  
  cleaned = cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
  
  const nameMap: Record<string, string> = {
    'Run': '🏃 달리기 (Run)',
    'Running': '🏃 달리기 (Running)',
    'Walk': '🚶 걷기 (Walk)',
    'Walking': '🚶 걷기 (Walking)',
    'Idle': '🧍 대기 (Idle)',
    'Jump': '⬆️ 점프 (Jump)',
    'Jumping': '⬆️ 점프 (Jumping)',
    'Attack': '⚔️ 공격 (Attack)',
    'Die': '💀 사망 (Die)',
    'Death': '💀 사망 (Death)',
    'Dance': '💃 춤 (Dance)',
    'Dancing': '💃 춤 (Dancing)',
    'Sit': '🪑 앉기 (Sit)',
    'Sitting': '🪑 앉기 (Sitting)',
    'Stand': '🧍 서기 (Stand)',
    'Wave': '👋 손흔들기 (Wave)',
    'Crouch': '🦵 웅크리기 (Crouch)',
    'Swim': '🏊 수영 (Swim)',
    'Fly': '🦅 비행 (Fly)',
    'Climb': '🧗 오르기 (Climb)',
  }
  
  for (const [key, value] of Object.entries(nameMap)) {
    if (cleaned.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }
  
  return cleaned
}

// Animation Controls Component
function AnimationControls() {
  const { 
    animationState, 
    setCurrentAnimation, 
    setIsPlaying, 
    setAnimationSpeed,
    setAnimationLoop 
  } = useAppStore()

  if (animationState.availableAnimations.length === 0) {
    return null
  }

  return (
    <div className="animation-controls">
      {/* Animation Selector */}
      <div className="animation-controls-row">
        <select
          className="animation-select"
          value={animationState.currentAnimation || ''}
          onChange={(e) => setCurrentAnimation(e.target.value || null)}
        >
          <option value="">-- 애니메이션 선택 --</option>
          {animationState.availableAnimations.map((name) => (
            <option key={name} value={name}>
              {formatAnimationName(name)}
            </option>
          ))}
        </select>
      </div>
      
      {/* Playback Controls */}
      <div className="animation-controls-row">
        <button
          className={`animation-btn ${animationState.isPlaying ? 'active' : ''}`}
          onClick={() => setIsPlaying(!animationState.isPlaying)}
          title={animationState.isPlaying ? '일시정지' : '재생'}
        >
          {animationState.isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <button
          className={`animation-btn ${animationState.loop ? 'active' : ''}`}
          onClick={() => setAnimationLoop(!animationState.loop)}
          title={animationState.loop ? '반복 켜짐' : '반복 꺼짐'}
        >
          🔁
        </button>
        
        {/* Speed Control */}
        <div className="animation-speed">
          <span className="animation-speed-label">{animationState.speed.toFixed(1)}x</span>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={animationState.speed}
            onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
            className="animation-speed-slider"
            title="재생 속도"
          />
        </div>
      </div>
      
      {/* Animation Info */}
      <div className="animation-info">
        <span className="animation-count">
          {animationState.availableAnimations.length}개 애니메이션
        </span>
        {animationState.currentAnimation && (
          <span className="animation-current">
            현재: {formatAnimationName(animationState.currentAnimation)}
          </span>
        )}
      </div>
    </div>
  )
}

export function PreviewCanvas() {
  const { selectedChapter, placedModels } = useAppStore()
  const [canvasError, setCanvasError] = useState(false)

  // Load assets
  useAssets()

  if (canvasError) {
    return (
      <div className="panel canvas-container" style={{ flex: 2 }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--color-text-muted)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <div>3D 미리보기를 사용할 수 없습니다</div>
          <button 
            className="btn btn-primary btn-sm" 
            style={{ marginTop: '1rem' }}
            onClick={() => setCanvasError(false)}
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="panel canvas-container h-full w-full" style={{ borderRadius: 0, border: 'none' }}>
      {/* Overlay Badges */}
      <div className="canvas-overlay">
        <div className="canvas-badge">
          {selectedChapter ? selectedChapter.title : '챕터 미선택'}
        </div>
        <div className="canvas-badge">
          배치된 모델: {placedModels.length}개
        </div>
      </div>
      
      {/* Animation Controls */}
      <AnimationControls />
      
      {/* 3D Canvas */}
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'default'
        }}
        className="canvas-3d"
        onCreated={({ gl }) => {
          gl.setClearColor('#0a0a0f', 1)
        }}
        onError={() => setCanvasError(true)}
      >
        <color attach="background" args={['#0a0a0f']} />
        <fog attach="fog" args={['#0a0a0f', 15, 50]} />
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  )
}
