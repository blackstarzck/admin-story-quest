import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import { useBooks, useChapters, useAssets, usePlacedModels } from '../hooks/useSupabase'
import {
  ChevronRight,
  ChevronDown,
  Book as BookIcon,
  Box,
  Layers,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'

export default function BookChapterPanel() {
  const {
    selectedBook, setSelectedBook,
    selectedChapter, setSelectedChapter,
    selectedPlacedModel, setSelectedPlacedModel,
  } = useAppStore()

  const { books, loading: booksLoading } = useBooks()
  // Always fetch chapters for the selected book
  const { chapters, loading: chaptersLoading, fetchChapters } = useChapters(selectedBook?.id)
  // Always fetch placed models for the selected chapter
  const { placedModels, createPlacedModel } = usePlacedModels(selectedChapter?.id)

  useAssets() // Ensure assets are loaded

  // UI State
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set())
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [dragOverChapter, setDragOverChapter] = useState<string | null>(null)

  // Track initialization
  const initialized = useRef(false)

  // Auto-expand/select logic
  useEffect(() => {
    if (books.length > 0 && !initialized.current) {
      if (selectedBook) {
        setExpandedBooks(new Set([selectedBook.id]))
      } else {
        const firstBook = books[0]
        setSelectedBook(firstBook)
        setExpandedBooks(new Set([firstBook.id]))
      }
      initialized.current = true
    }
  }, [books, selectedBook, setSelectedBook])

  // Automatically expand selected chapter to show models
  useEffect(() => {
    if (selectedChapter) {
      setExpandedChapters(prev => new Set(prev).add(selectedChapter.id))
    }
  }, [selectedChapter])

  // Handlers
  const toggleBook = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newExpanded = new Set(expandedBooks)
    if (newExpanded.has(bookId)) newExpanded.delete(bookId)
    else newExpanded.add(bookId)
    setExpandedBooks(newExpanded)
  }

  const toggleChapter = (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newExpanded = new Set(expandedChapters)
    if (newExpanded.has(chapterId)) newExpanded.delete(chapterId)
    else newExpanded.add(chapterId)
    setExpandedChapters(newExpanded)
  }

  const handleSelectBook = (bookId: string) => {
    const book = books.find(b => b.id === bookId)
    if (book) {
      setSelectedBook(book)
      if (!expandedBooks.has(bookId)) {
        setExpandedBooks(prev => new Set(prev).add(bookId))
      }
    }
  }

  const handleSelectChapter = (chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId)
    if (chapter) {
      setSelectedChapter(chapter)
      setSelectedPlacedModel(null)
    }
  }

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent, chapterId: string) => {
    e.preventDefault()
    setDragOverChapter(chapterId)
  }

  const handleDragLeave = () => {
    setDragOverChapter(null)
  }

  const handleDropOnChapter = async (e: React.DragEvent, chapterId: string) => {
    e.preventDefault()
    setDragOverChapter(null)

    // Check model count limit (max 3)
    const chapter = chapters.find(c => c.id === chapterId)
    const currentCount = chapter?.placed_models_count || 0

    if (currentCount >= 3) {
      alert('챕터당 최대 3개의 모델만 배치할 수 있습니다.')
      return
    }

    const assetId = e.dataTransfer.getData('assetId')
    const assetName = e.dataTransfer.getData('assetName')

    if (!assetId) return

    // Create placed model regardless of category
    await createPlacedModel({
      chapter_id: chapterId,
      asset_id: assetId,
      name: assetName || 'New Model',
      position_x: 0, position_y: 0, position_z: 0,
      rotation_x: 0, rotation_y: 0, rotation_z: 0,
      scale_x: 1, scale_y: 1, scale_z: 1,
      trigger_radius: 2.0,
      animation_key: 'Idle',
      is_active: true,
      sort_order: currentCount
    })

    // Refresh chapters to update count
    fetchChapters()
  }

  // Handle adding model from PreviewCanvas drop
  const handleAddModelToChapter = async (assetId: string, assetName: string) => {
    if (!selectedChapter) return

    // Check limit
    if (placedModels.length >= 3) {
      alert('챕터당 최대 3개의 모델만 배치할 수 있습니다.')
      return
    }

    await createPlacedModel({
      chapter_id: selectedChapter.id,
      asset_id: assetId,
      name: assetName,
      position_x: 0, position_y: 0, position_z: 0,
      rotation_x: 0, rotation_y: 0, rotation_z: 0,
      scale_x: 1, scale_y: 1, scale_z: 1,
      trigger_radius: 2.0,
      animation_key: 'Idle',
      is_active: true,
      sort_order: placedModels.length
    })

    fetchChapters()
  }

  // Expose global handler
  useEffect(() => {
    (window as unknown as { handleAddModelToChapter?: typeof handleAddModelToChapter }).handleAddModelToChapter = handleAddModelToChapter
    return () => {
      delete (window as unknown as { handleAddModelToChapter?: typeof handleAddModelToChapter }).handleAddModelToChapter
    }
  }, [selectedChapter, placedModels.length])

  // -- RENDER HELPERS --

  const TreeItem = ({
    level,
    label,
    icon: Icon,
    isExpanded,
    onToggle,
    isSelected,
    onSelect,
    children,
    hasChildren = false,
    trailing,
    isDropTarget,
    statusColor
  }: any) => (
    <div className="select-none">
      <div
        onClick={onSelect}
        className={`
          flex items-center h-9 pr-3 cursor-pointer transition-colors border-l-2
          ${isSelected
            ? 'bg-blue-500/20 border-blue-500 text-blue-100'
            : 'border-transparent hover:bg-slate-800 text-slate-300 hover:text-white'
          }
          ${isDropTarget ? 'bg-green-500/20 border-green-500' : ''}
        `}
        style={{ paddingLeft: `${level * 12 + 4}px` }}
      >
        <div
          onClick={hasChildren ? onToggle : undefined}
          className={`
            p-1 rounded hover:bg-white/10 mr-1
            ${!hasChildren ? 'opacity-0 pointer-events-none' : ''}
          `}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>

        <div className="relative">
          <Icon size={16} className={`mr-2 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
          {statusColor && (
            <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#1e1e24] ${statusColor}`} />
          )}
        </div>

        <span className="flex-1 text-sm truncate font-medium">{label}</span>

        {trailing}
      </div>

      {isExpanded && children}
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-[#1e1e24] text-slate-300 border-r border-black/20 select-none">
      {/* Panel Header */}
      <div className="h-10 px-4 flex items-center justify-between bg-[#25252b] border-b border-black/20">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          <Layers size={14} />
          <span>Outliner</span>
        </div>
        <div className="flex gap-1">
          <button className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white" title="검색">
            <Search size={14} />
          </button>
          <button
            onClick={() => fetchChapters()}
            className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white"
            title="새로고침"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto py-2">
        {booksLoading ? (
          <div className="flex justify-center p-8">
            <RefreshCw className="animate-spin text-slate-500" />
          </div>
        ) : books.length === 0 ? (
          <div className="text-center p-8 text-slate-500 text-sm">
            도서가 없습니다
          </div>
        ) : (
          <div className="flex flex-col">
            {books.map(book => {
              // Check if book is fully completed (all chapters have models)
              const isCompleted = book.chapter_status && book.chapter_status.total > 0 && book.chapter_status.completed === book.chapter_status.total
              const statusColor = isCompleted ? 'bg-green-500' : 'bg-orange-500'

              return (
                <TreeItem
                  key={book.id}
                  level={0}
                  label={book.title}
                  icon={BookIcon}
                  isExpanded={expandedBooks.has(book.id)}
                  onToggle={(e: any) => toggleBook(book.id, e)}
                  isSelected={selectedBook?.id === book.id}
                  onSelect={() => handleSelectBook(book.id)}
                  hasChildren={true}
                  statusColor={statusColor}
                  trailing={
                    book.chapter_status && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${isCompleted ? 'text-green-400 bg-green-500/10' : 'text-orange-400 bg-orange-500/10'}`}>
                        {book.chapter_status.completed}/{book.chapter_status.total}
                      </span>
                    )
                  }
                >
                  {/* Chapters */}
                  {chaptersLoading && selectedBook?.id === book.id ? (
                    <div className="pl-8 py-2 text-xs text-slate-500">로딩 중...</div>
                  ) : selectedBook?.id === book.id && (
                    <div>
                      {chapters.map(chapter => {
                        const isSelected = selectedChapter?.id === chapter.id
                        const isChapterExpanded = expandedChapters.has(chapter.id)
                        const isDragOver = dragOverChapter === chapter.id

                        // Use real-time count if selected, otherwise use fetched count
                        const modelCount = isSelected ? placedModels.length : (chapter.placed_models_count || 0)
                        const hasModels = modelCount > 0

                        // Filter placed models for this chapter
                        const chapterModels = isSelected ? placedModels : []

                        return (
                          <TreeItem
                            key={chapter.id}
                            level={1}
                            label={chapter.title}
                            icon={hasModels ? CheckCircle2 : AlertTriangle}
                            isExpanded={isChapterExpanded}
                            onToggle={(e: any) => toggleChapter(chapter.id, e)}
                            isSelected={isSelected}
                            onSelect={() => handleSelectChapter(chapter.id)}
                            hasChildren={chapterModels.length > 0}
                            isDropTarget={isDragOver}
                            trailing={
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${hasModels ? 'text-slate-400 bg-slate-800' : 'text-red-400 bg-red-500/10'}`}>
                                  {modelCount}/3
                                </span>
                                {!hasModels && (
                                  <span className="text-[10px] text-red-400/70" title="모델 배치 필요">
                                    ⚠️
                                  </span>
                                )}
                              </div>
                            }
                          >
                            {/* Drop Zone Listeners */}
                            <div
                              className="hidden"
                              onDragOver={(e) => handleDragOver(e, chapter.id)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDropOnChapter(e, chapter.id)}
                            />

                            {/* Placed Models (Only visible if chapter selected & expanded) */}
                            {isSelected && isChapterExpanded && (
                              <div>
                                {chapterModels.map(model => (
                                  <TreeItem
                                    key={model.id}
                                    level={2}
                                    label={model.name}
                                    icon={Box}
                                    isSelected={selectedPlacedModel?.id === model.id}
                                    onSelect={(e: any) => {
                                      e.stopPropagation()
                                      setSelectedPlacedModel(model)
                                    }}
                                    hasChildren={false}
                                    trailing={
                                      !model.is_active && (
                                        <span className="text-[10px] text-slate-600 ml-auto">
                                          (비활성)
                                        </span>
                                      )
                                    }
                                  />
                                ))}
                                {chapterModels.length === 0 && (
                                  <div className="pl-12 py-1 text-[10px] text-slate-600 italic">
                                    배치된 모델 없음
                                  </div>
                                )}
                              </div>
                            )}
                          </TreeItem>
                        )
                      })}
                      {chapters.length === 0 && (
                        <div className="pl-8 py-2 text-xs text-slate-500">챕터가 없습니다</div>
                      )}
                    </div>
                  )}
                </TreeItem>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="h-8 bg-[#25252b] border-t border-black/20 flex items-center px-3 text-[10px] text-slate-500 justify-between">
        <span>{books.length} 도서</span>
        <span>
          {selectedBook && chapters ? `${chapters.length} 챕터` : ''}
          {selectedChapter && placedModels ? ` / ${placedModels.length} 모델` : ''}
        </span>
      </div>
    </div>
  )
}
