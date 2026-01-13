import { create } from 'zustand'
import type { Asset, Book, Scene, Chapter, TriggerZone, PlacedModel } from '../types/database'

interface AnimationState {
  availableAnimations: string[]
  currentAnimation: string | null
  isPlaying: boolean
  speed: number
  loop: boolean
}

interface AppState {
  // Assets
  assets: Asset[]
  selectedAsset: Asset | null
  setAssets: (assets: Asset[]) => void
  setSelectedAsset: (asset: Asset | null) => void
  addAsset: (asset: Asset) => void
  updateAsset: (id: string, updates: Partial<Asset>) => void
  removeAsset: (id: string) => void

  // Books
  books: Book[]
  selectedBook: Book | null
  setBooks: (books: Book[]) => void
  setSelectedBook: (book: Book | null) => void
  addBook: (book: Book) => void
  updateBook: (id: string, updates: Partial<Book>) => void
  removeBook: (id: string) => void

  // Scenes
  scenes: Scene[]
  selectedScene: Scene | null
  setScenes: (scenes: Scene[]) => void
  setSelectedScene: (scene: Scene | null) => void
  addScene: (scene: Scene) => void
  updateScene: (id: string, updates: Partial<Scene>) => void
  removeScene: (id: string) => void

  // Chapters
  chapters: Chapter[]
  selectedChapter: Chapter | null
  setChapters: (chapters: Chapter[]) => void
  setSelectedChapter: (chapter: Chapter | null) => void
  addChapter: (chapter: Chapter) => void
  updateChapter: (id: string, updates: Partial<Chapter>) => void
  removeChapter: (id: string) => void

  // Trigger Zones (Legacy)
  triggerZones: TriggerZone[]
  selectedTriggerZone: TriggerZone | null
  setTriggerZones: (zones: TriggerZone[]) => void
  setSelectedTriggerZone: (zone: TriggerZone | null) => void
  addTriggerZone: (zone: TriggerZone) => void
  updateTriggerZone: (id: string, updates: Partial<TriggerZone>) => void
  removeTriggerZone: (id: string) => void

  // Placed Models (New - for chapter-based 3D model placement)
  placedModels: PlacedModel[]
  selectedPlacedModel: PlacedModel | null
  setPlacedModels: (models: PlacedModel[]) => void
  setSelectedPlacedModel: (model: PlacedModel | null) => void
  addPlacedModel: (model: PlacedModel) => void
  updatePlacedModel: (id: string, updates: Partial<PlacedModel>) => void
  removePlacedModel: (id: string) => void

  // UI State
  activePanel: 'assets' | 'creation' | 'manuscript' | 'inspector' | 'preview'
  setActivePanel: (panel: AppState['activePanel']) => void
  isGenerating: boolean
  setIsGenerating: (generating: boolean) => void
  generationProgress: number
  setGenerationProgress: (progress: number) => void

  // Trigger selections
  selectedTriggerText: string | null
  setSelectedTriggerText: (text: string | null) => void

  // Animation State
  animationState: AnimationState
  setAvailableAnimations: (animations: string[]) => void
  setCurrentAnimation: (name: string | null) => void
  setIsPlaying: (playing: boolean) => void
  setAnimationSpeed: (speed: number) => void
  setAnimationLoop: (loop: boolean) => void
  resetAnimationState: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // Assets
  assets: [],
  selectedAsset: null,
  setAssets: (assets) => set({ assets }),
  setSelectedAsset: (asset) => set({ selectedAsset: asset }),
  addAsset: (asset) => set((state) => ({ assets: [...state.assets, asset] })),
  updateAsset: (id, updates) =>
    set((state) => ({
      assets: state.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  removeAsset: (id) =>
    set((state) => ({
      assets: state.assets.filter((a) => a.id !== id),
      selectedAsset: state.selectedAsset?.id === id ? null : state.selectedAsset,
    })),

  // Books
  books: [],
  selectedBook: null,
  setBooks: (books) => set({ books }),
  setSelectedBook: (book) => set({ selectedBook: book }),
  addBook: (book) => set((state) => ({ books: [...state.books, book] })),
  updateBook: (id, updates) =>
    set((state) => ({
      books: state.books.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),
  removeBook: (id) =>
    set((state) => ({
      books: state.books.filter((b) => b.id !== id),
      selectedBook: state.selectedBook?.id === id ? null : state.selectedBook,
    })),

  // Scenes
  scenes: [],
  selectedScene: null,
  setScenes: (scenes) => set({ scenes }),
  setSelectedScene: (scene) => set({ selectedScene: scene }),
  addScene: (scene) => set((state) => ({ scenes: [...state.scenes, scene] })),
  updateScene: (id, updates) =>
    set((state) => ({
      scenes: state.scenes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
  removeScene: (id) =>
    set((state) => ({
      scenes: state.scenes.filter((s) => s.id !== id),
      selectedScene: state.selectedScene?.id === id ? null : state.selectedScene,
    })),

  // Chapters
  chapters: [],
  selectedChapter: null,
  setChapters: (chapters) => set({ chapters }),
  setSelectedChapter: (chapter) => set({ selectedChapter: chapter }),
  addChapter: (chapter) => set((state) => ({ chapters: [...state.chapters, chapter] })),
  updateChapter: (id, updates) =>
    set((state) => ({
      chapters: state.chapters.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeChapter: (id) =>
    set((state) => ({
      chapters: state.chapters.filter((c) => c.id !== id),
      selectedChapter: state.selectedChapter?.id === id ? null : state.selectedChapter,
    })),

  // Trigger Zones (Legacy)
  triggerZones: [],
  selectedTriggerZone: null,
  setTriggerZones: (zones) => set({ triggerZones: zones }),
  setSelectedTriggerZone: (zone) => set({ selectedTriggerZone: zone }),
  addTriggerZone: (zone) => set((state) => ({ triggerZones: [...state.triggerZones, zone] })),
  updateTriggerZone: (id, updates) =>
    set((state) => ({
      triggerZones: state.triggerZones.map((z) => (z.id === id ? { ...z, ...updates } : z)),
    })),
  removeTriggerZone: (id) =>
    set((state) => ({
      triggerZones: state.triggerZones.filter((z) => z.id !== id),
      selectedTriggerZone: state.selectedTriggerZone?.id === id ? null : state.selectedTriggerZone,
    })),

  // Placed Models (New)
  placedModels: [],
  selectedPlacedModel: null,
  setPlacedModels: (models) => set({ placedModels: models }),
  setSelectedPlacedModel: (model) => set({ selectedPlacedModel: model }),
  addPlacedModel: (model) => set((state) => ({ placedModels: [...state.placedModels, model] })),
  updatePlacedModel: (id, updates) =>
    set((state) => ({
      placedModels: state.placedModels.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  removePlacedModel: (id) =>
    set((state) => ({
      placedModels: state.placedModels.filter((m) => m.id !== id),
      selectedPlacedModel: state.selectedPlacedModel?.id === id ? null : state.selectedPlacedModel,
    })),

  // UI State
  activePanel: 'assets',
  setActivePanel: (panel) => set({ activePanel: panel }),
  isGenerating: false,
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  generationProgress: 0,
  setGenerationProgress: (progress) => set({ generationProgress: progress }),

  // Trigger selections
  selectedTriggerText: null,
  setSelectedTriggerText: (text) => set({ selectedTriggerText: text }),

  // Animation State
  animationState: {
    availableAnimations: [],
    currentAnimation: null,
    isPlaying: true,
    speed: 1,
    loop: true
  },
  setAvailableAnimations: (animations) => set((state) => ({
    animationState: { ...state.animationState, availableAnimations: animations }
  })),
  setCurrentAnimation: (name) => set((state) => ({
    animationState: { ...state.animationState, currentAnimation: name }
  })),
  setIsPlaying: (playing) => set((state) => ({
    animationState: { ...state.animationState, isPlaying: playing }
  })),
  setAnimationSpeed: (speed) => set((state) => ({
    animationState: { ...state.animationState, speed }
  })),
  setAnimationLoop: (loop) => set((state) => ({
    animationState: { ...state.animationState, loop }
  })),
  resetAnimationState: () => set({
    animationState: {
      availableAnimations: [],
      currentAnimation: null,
      isPlaying: true,
      speed: 1,
      loop: true
    }
  }),
}))
