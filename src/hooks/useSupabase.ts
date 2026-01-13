import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/appStore'
import type { Asset, Book, Scene, Chapter, TriggerZone, PlacedModel, AssetMetadata, CameraConfig, TriggerType } from '../types/database'

// Type helpers for Supabase data transformations
function transformAsset(data: Record<string, unknown>): Asset {
  return {
    id: data.id as string,
    name: data.name as string,
    storage_url: data.storage_url as string,
    category: data.category as string,
    metadata: (data.metadata as AssetMetadata) || { scale: 1, rotation: [0, 0, 0], position: [0, 0, 0] },
    created_at: data.created_at as string
  }
}

function transformBook(data: Record<string, unknown>): Book {
  return {
    id: data.id as string,
    title: data.title as string,
    manuscript: data.manuscript as string,
    author: data.author as string,
    created_at: data.created_at as string
  }
}

function transformScene(data: Record<string, unknown>): Scene {
  return {
    id: data.id as string,
    book_id: data.book_id as string,
    trigger_text: data.trigger_text as string,
    asset_id: data.asset_id as string,
    animation_key: data.animation_key as string,
    camera_config: (data.camera_config as CameraConfig) || { position: [0, 2, 5], target: [0, 0, 0], fov: 75 },
    created_at: data.created_at as string
  }
}

function transformChapter(data: Record<string, unknown>): Chapter {
  return {
    id: data.id as string,
    book_id: data.book_id as string,
    title: data.title as string,
    order_index: data.order_index as number,
    content: (data.content as string) || '',
    environment_asset_id: (data.environment_asset_id as string) || null,
    created_at: data.created_at as string
  }
}

function transformTriggerZone(data: Record<string, unknown>): TriggerZone {
  return {
    id: data.id as string,
    chapter_id: data.chapter_id as string,
    name: data.name as string,
    position: (data.position as [number, number, number]) || [0, 0, 0],
    size: (data.size as [number, number, number]) || [2, 2, 2],
    asset_id: (data.asset_id as string) || null,
    animation_key: (data.animation_key as string) || 'Idle',
    display_text: (data.display_text as string) || '',
    text_position: (data.text_position as [number, number, number]) || [0, 1, 0],
    camera_config: (data.camera_config as CameraConfig) || { position: [0, 2, 5], target: [0, 0, 0], fov: 75 },
    trigger_type: (data.trigger_type as TriggerType) || 'enter',
    trigger_radius: (data.trigger_radius as number) || 1.5,
    is_active: data.is_active !== false,
    created_at: data.created_at as string
  }
}

function transformPlacedModel(data: Record<string, unknown>): PlacedModel {
  return {
    id: data.id as string,
    chapter_id: data.chapter_id as string,
    asset_id: data.asset_id as string,
    name: data.name as string,
    position_x: (data.position_x as number) || 0,
    position_y: (data.position_y as number) || 0,
    position_z: (data.position_z as number) || 0,
    rotation_x: (data.rotation_x as number) || 0,
    rotation_y: (data.rotation_y as number) || 0,
    rotation_z: (data.rotation_z as number) || 0,
    scale_x: (data.scale_x as number) || 1,
    scale_y: (data.scale_y as number) || 1,
    scale_z: (data.scale_z as number) || 1,
    trigger_radius: (data.trigger_radius as number) || 2.0,
    animation_key: (data.animation_key as string) || null,
    is_active: data.is_active !== false,
    sort_order: (data.sort_order as number) || 0,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
    asset: data.asset ? transformAsset(data.asset as Record<string, unknown>) : undefined
  }
}

// Helper to extract storage path from public URL
function getStoragePathFromUrl(url: string): string | null {
  try {
    // URL format: https://xxx.supabase.co/storage/v1/object/public/assets/filename.glb
    const match = url.match(/\/storage\/v1\/object\/public\/assets\/(.+)$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

// Assets Hook
export function useAssets() {
  const { assets, setAssets, addAsset, updateAsset, removeAsset } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setAssets((data || []).map(d => transformAsset(d as Record<string, unknown>)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assets')
    } finally {
      setLoading(false)
    }
  }, [setAssets])

  const createAsset = useCallback(async (asset: Omit<Asset, 'id' | 'created_at'>) => {
    setError(null)
    try {
      const { data, error: createError } = await supabase
        .from('assets')
        .insert({
          name: asset.name,
          storage_url: asset.storage_url,
          category: asset.category,
          metadata: asset.metadata
        })
        .select()
        .single()

      if (createError) throw createError
      if (data) {
        const transformed = transformAsset(data as Record<string, unknown>)
        addAsset(transformed)
        return transformed
      }
      return null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset')
      return null
    }
  }, [addAsset])

  const modifyAsset = useCallback(async (id: string, updates: Partial<Asset>) => {
    setError(null)
    try {
      const updateData: Record<string, unknown> = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.storage_url !== undefined) updateData.storage_url = updates.storage_url
      if (updates.category !== undefined) updateData.category = updates.category
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata

      const { error: updateError } = await supabase
        .from('assets')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError
      updateAsset(id, updates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update asset')
    }
  }, [updateAsset])

  const deleteAsset = useCallback(async (id: string, storageUrl?: string) => {
    setError(null)
    try {
      // First, delete from database
      const { error: deleteError } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Then, try to delete from storage if URL is provided
      if (storageUrl) {
        const storagePath = getStoragePathFromUrl(storageUrl)
        if (storagePath) {
          await supabase.storage
            .from('assets')
            .remove([storagePath])
          // Don't throw on storage delete failure - file may not exist
        }
      }

      removeAsset(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete asset')
    }
  }, [removeAsset])

  // Sync assets from Storage to DB - registers files that exist in Storage but not in DB
  const syncFromStorage = useCallback(async () => {
    setLoading(true)
    setError(null)
    let syncedCount = 0

    try {
      // 1. List all files in Storage
      const { data: storageFiles, error: listError } = await supabase.storage
        .from('assets')
        .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

      if (listError) throw listError
      if (!storageFiles || storageFiles.length === 0) {
        return { synced: 0, message: 'No files found in Storage' }
      }

      // Filter only .glb and .gltf files (exclude folders)
      const modelFiles = storageFiles.filter(file => 
        file.name && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))
      )

      if (modelFiles.length === 0) {
        return { synced: 0, message: 'No .glb/.gltf files found in Storage' }
      }

      // 2. Get existing assets from DB to compare
      const { data: existingAssets, error: fetchError } = await supabase
        .from('assets')
        .select('storage_url')

      if (fetchError) throw fetchError

      // Extract existing storage URLs for comparison
      const existingUrls = new Set(
        (existingAssets || []).map(a => {
          const url = (a as Record<string, unknown>).storage_url as string
          // Extract just the filename from the URL for comparison
          const match = url.match(/\/assets\/([^?]+)/)
          return match ? match[1] : url
        })
      )

      // 3. Create assets for files not in DB
      for (const file of modelFiles) {
        if (existingUrls.has(file.name)) {
          continue // Already registered
        }

        // Get public URL for this file
        const { data: urlData } = supabase.storage
          .from('assets')
          .getPublicUrl(file.name)

        // Extract a clean name from filename (remove UUID prefix if present)
        let cleanName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
        const uuidMatch = cleanName.match(/^[a-f0-9-]{36}_(.+)$/i)
        if (uuidMatch) {
          cleanName = uuidMatch[1] // Remove UUID prefix
        }

        // Guess category from filename
        let category = 'general'
        const lowerName = cleanName.toLowerCase()
        if (lowerName.includes('character') || lowerName.includes('person') || lowerName.includes('human')) {
          category = 'character'
        } else if (lowerName.includes('forest') || lowerName.includes('tree') || lowerName.includes('environment') || lowerName.includes('scene')) {
          category = 'environment'
        } else if (lowerName.includes('book') || lowerName.includes('prop') || lowerName.includes('item')) {
          category = 'prop'
        }

        const { error: insertError } = await supabase
          .from('assets')
          .insert({
            name: cleanName,
            storage_url: urlData.publicUrl,
            category,
            metadata: { scale: 1, rotation: [0, 0, 0], position: [0, 0, 0] }
          })

        if (!insertError) {
          syncedCount++
        }
      }

      // 4. Refresh assets list
      await fetchAssets()

      return { synced: syncedCount, message: `Synced ${syncedCount} new asset(s) from Storage` }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync from storage')
      return { synced: 0, message: 'Sync failed' }
    } finally {
      setLoading(false)
    }
  }, [fetchAssets])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  return { assets, loading, error, fetchAssets, createAsset, modifyAsset, deleteAsset, syncFromStorage }
}

// Books Hook
export function useBooks() {
  const { books, setBooks, addBook, updateBook, removeBook } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch books with nested chapter counts
      const { data, error: fetchError } = await supabase
        .from('books')
        .select(`
          *,
          chapters (
            id,
            placed_models (count)
          )
        `)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      
      const transformedBooks = (data || []).map((d: any) => {
        const book = transformBook(d)
        
        // Calculate status
        const chapters = d.chapters || []
        const total = chapters.length
        const completed = chapters.filter((c: any) => c.placed_models && c.placed_models[0]?.count > 0).length
        
        return {
          ...book,
          chapter_status: { total, completed }
        }
      })
      
      setBooks(transformedBooks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch books')
    } finally {
      setLoading(false)
    }
  }, [setBooks])

  const createBook = useCallback(async (book: Omit<Book, 'id' | 'created_at'>) => {
    setError(null)
    try {
      const { data, error: createError } = await supabase
        .from('books')
        .insert({
          title: book.title,
          manuscript: book.manuscript,
          author: book.author
        })
        .select()
        .single()

      if (createError) throw createError
      if (data) {
        const transformed = transformBook(data as Record<string, unknown>)
        addBook(transformed)
        return transformed
      }
      return null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create book')
      return null
    }
  }, [addBook])

  const modifyBook = useCallback(async (id: string, updates: Partial<Book>) => {
    setError(null)
    try {
      const updateData: Record<string, unknown> = {}
      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.manuscript !== undefined) updateData.manuscript = updates.manuscript
      if (updates.author !== undefined) updateData.author = updates.author

      const { error: updateError } = await supabase
        .from('books')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError
      updateBook(id, updates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update book')
    }
  }, [updateBook])

  const deleteBook = useCallback(async (id: string) => {
    setError(null)
    try {
      const { error: deleteError } = await supabase
        .from('books')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      removeBook(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete book')
    }
  }, [removeBook])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  return { books, loading, error, fetchBooks, createBook, modifyBook, deleteBook }
}

// Scenes Hook
export function useScenes(bookId?: string) {
  const { scenes, setScenes, addScene, updateScene, removeScene } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchScenes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('scenes')
        .select('*')
        .order('created_at', { ascending: true })

      if (bookId) {
        query = query.eq('book_id', bookId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setScenes((data || []).map(d => transformScene(d as Record<string, unknown>)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scenes')
    } finally {
      setLoading(false)
    }
  }, [setScenes, bookId])

  const createScene = useCallback(async (scene: Omit<Scene, 'id' | 'created_at'>) => {
    setError(null)
    try {
      const { data, error: createError } = await supabase
        .from('scenes')
        .insert({
          book_id: scene.book_id,
          trigger_text: scene.trigger_text,
          asset_id: scene.asset_id,
          animation_key: scene.animation_key,
          camera_config: scene.camera_config
        })
        .select()
        .single()

      if (createError) throw createError
      if (data) {
        const transformed = transformScene(data as Record<string, unknown>)
        addScene(transformed)
        return transformed
      }
      return null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create scene')
      return null
    }
  }, [addScene])

  const modifyScene = useCallback(async (id: string, updates: Partial<Scene>) => {
    setError(null)
    try {
      const updateData: Record<string, unknown> = {}
      if (updates.book_id !== undefined) updateData.book_id = updates.book_id
      if (updates.trigger_text !== undefined) updateData.trigger_text = updates.trigger_text
      if (updates.asset_id !== undefined) updateData.asset_id = updates.asset_id
      if (updates.animation_key !== undefined) updateData.animation_key = updates.animation_key
      if (updates.camera_config !== undefined) updateData.camera_config = updates.camera_config

      const { error: updateError } = await supabase
        .from('scenes')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError
      updateScene(id, updates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update scene')
    }
  }, [updateScene])

  const deleteScene = useCallback(async (id: string) => {
    setError(null)
    try {
      const { error: deleteError } = await supabase
        .from('scenes')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      removeScene(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete scene')
    }
  }, [removeScene])

  useEffect(() => {
    fetchScenes()
  }, [fetchScenes])

  return { scenes, loading, error, fetchScenes, createScene, modifyScene, deleteScene }
}

// Storage Hook
export function useStorage() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(async (file: File, path: string) => {
    setUploading(true)
    setError(null)
    try {
      const { data, error: uploadError } = await supabase.storage
        .from('assets')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('assets')
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  const deleteFile = useCallback(async (path: string) => {
    setError(null)
    try {
      const { error: deleteError } = await supabase.storage
        .from('assets')
        .remove([path])

      if (deleteError) throw deleteError
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file')
      return false
    }
  }, [])

  const listFiles = useCallback(async (folder: string = '') => {
    setError(null)
    try {
      const { data, error: listError } = await supabase.storage
        .from('assets')
        .list(folder, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

      if (listError) throw listError
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list files')
      return []
    }
  }, [])

  return { uploading, error, uploadFile, deleteFile, listFiles }
}

// Chapters Hook
export function useChapters(bookId?: string) {
  const { chapters, setChapters, addChapter, updateChapter, removeChapter } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchChapters = useCallback(async () => {
    if (!bookId) {
      setChapters([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('chapters')
        .select(`
          *,
          placed_models (count)
        `)
        .eq('book_id', bookId)
        .order('order_index', { ascending: true })

      if (fetchError) throw fetchError
      console.log(`[useChapters] Fetched ${data?.length} chapters for book ${bookId}`)
      
      setChapters((data || []).map((d: any) => ({
        ...transformChapter(d),
        placed_models_count: d.placed_models?.[0]?.count || 0
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chapters')
    } finally {
      setLoading(false)
    }
  }, [setChapters, bookId])

  const createChapter = useCallback(async (chapter: Omit<Chapter, 'id' | 'created_at' | 'environment_asset'>) => {
    setError(null)
    try {
      const { data, error: createError } = await supabase
        .from('chapters')
        .insert({
          book_id: chapter.book_id,
          title: chapter.title,
          order_index: chapter.order_index,
          content: chapter.content,
          environment_asset_id: chapter.environment_asset_id
        })
        .select()
        .single()

      if (createError) throw createError
      if (data) {
        const transformed = transformChapter(data as Record<string, unknown>)
        addChapter(transformed)
        return transformed
      }
      return null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chapter')
      return null
    }
  }, [addChapter])

  const modifyChapter = useCallback(async (id: string, updates: Partial<Chapter>) => {
    setError(null)
    try {
      const updateData: Record<string, unknown> = {}
      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.order_index !== undefined) updateData.order_index = updates.order_index
      if (updates.content !== undefined) updateData.content = updates.content
      if (updates.environment_asset_id !== undefined) updateData.environment_asset_id = updates.environment_asset_id

      const { error: updateError } = await supabase
        .from('chapters')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError
      updateChapter(id, updates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update chapter')
    }
  }, [updateChapter])

  const deleteChapter = useCallback(async (id: string) => {
    setError(null)
    try {
      const { error: deleteError } = await supabase
        .from('chapters')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      removeChapter(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chapter')
    }
  }, [removeChapter])

  useEffect(() => {
    fetchChapters()
  }, [fetchChapters])

  return { chapters, loading, error, fetchChapters, createChapter, modifyChapter, deleteChapter }
}

// Trigger Zones Hook (Legacy - for backwards compatibility)
export function useTriggerZones(chapterId?: string) {
  const { triggerZones, setTriggerZones, addTriggerZone, updateTriggerZone, removeTriggerZone } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTriggerZones = useCallback(async () => {
    if (!chapterId) {
      setTriggerZones([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('trigger_zones')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError
      setTriggerZones((data || []).map(d => transformTriggerZone(d as Record<string, unknown>)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trigger zones')
    } finally {
      setLoading(false)
    }
  }, [setTriggerZones, chapterId])

  const createTriggerZone = useCallback(async (zone: Omit<TriggerZone, 'id' | 'created_at'>) => {
    setError(null)
    try {
      const { data, error: createError } = await supabase
        .from('trigger_zones')
        .insert({
          chapter_id: zone.chapter_id,
          name: zone.name,
          position: zone.position,
          size: zone.size,
          asset_id: zone.asset_id,
          animation_key: zone.animation_key,
          display_text: zone.display_text,
          text_position: zone.text_position,
          camera_config: zone.camera_config,
          trigger_type: zone.trigger_type,
          trigger_radius: zone.trigger_radius,
          is_active: zone.is_active
        })
        .select()
        .single()

      if (createError) throw createError
      if (data) {
        const transformed = transformTriggerZone(data as Record<string, unknown>)
        addTriggerZone(transformed)
        return transformed
      }
      return null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trigger zone')
      return null
    }
  }, [addTriggerZone])

  const modifyTriggerZone = useCallback(async (id: string, updates: Partial<TriggerZone>) => {
    setError(null)
    try {
      const updateData: Record<string, unknown> = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.position !== undefined) updateData.position = updates.position
      if (updates.size !== undefined) updateData.size = updates.size
      if (updates.asset_id !== undefined) updateData.asset_id = updates.asset_id
      if (updates.animation_key !== undefined) updateData.animation_key = updates.animation_key
      if (updates.display_text !== undefined) updateData.display_text = updates.display_text
      if (updates.text_position !== undefined) updateData.text_position = updates.text_position
      if (updates.camera_config !== undefined) updateData.camera_config = updates.camera_config
      if (updates.trigger_type !== undefined) updateData.trigger_type = updates.trigger_type
      if (updates.trigger_radius !== undefined) updateData.trigger_radius = updates.trigger_radius
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active

      const { error: updateError } = await supabase
        .from('trigger_zones')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError
      updateTriggerZone(id, updates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update trigger zone')
    }
  }, [updateTriggerZone])

  const deleteTriggerZone = useCallback(async (id: string) => {
    setError(null)
    try {
      const { error: deleteError } = await supabase
        .from('trigger_zones')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      removeTriggerZone(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete trigger zone')
    }
  }, [removeTriggerZone])

  useEffect(() => {
    fetchTriggerZones()
  }, [fetchTriggerZones])

  return { triggerZones, loading, error, fetchTriggerZones, createTriggerZone, modifyTriggerZone, deleteTriggerZone }
}

// Placed Models Hook (New - for chapter-based 3D model placement)
export function usePlacedModels(chapterId?: string) {
  const { placedModels, setPlacedModels, addPlacedModel, updatePlacedModel, removePlacedModel } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPlacedModels = useCallback(async () => {
    if (!chapterId) {
      setPlacedModels([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('placed_models')
        .select('*, asset:assets(*)')
        .eq('chapter_id', chapterId)
        .order('sort_order', { ascending: true })

      if (fetchError) throw fetchError
      setPlacedModels((data || []).map(d => transformPlacedModel(d as Record<string, unknown>)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch placed models')
    } finally {
      setLoading(false)
    }
  }, [setPlacedModels, chapterId])

  const createPlacedModel = useCallback(async (model: Omit<PlacedModel, 'id' | 'created_at' | 'updated_at' | 'asset'>) => {
    setError(null)
    try {
      const { data, error: createError } = await supabase
        .from('placed_models')
        .insert({
          chapter_id: model.chapter_id,
          asset_id: model.asset_id,
          name: model.name,
          position_x: model.position_x,
          position_y: model.position_y,
          position_z: model.position_z,
          rotation_x: model.rotation_x,
          rotation_y: model.rotation_y,
          rotation_z: model.rotation_z,
          scale_x: model.scale_x,
          scale_y: model.scale_y,
          scale_z: model.scale_z,
          trigger_radius: model.trigger_radius,
          animation_key: model.animation_key,
          is_active: model.is_active,
          sort_order: model.sort_order
        })
        .select('*, asset:assets(*)')
        .single()

      if (createError) throw createError
      if (data) {
        const transformed = transformPlacedModel(data as Record<string, unknown>)
        addPlacedModel(transformed)
        return transformed
      }
      return null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create placed model')
      return null
    }
  }, [addPlacedModel])

  const modifyPlacedModel = useCallback(async (id: string, updates: Partial<PlacedModel>) => {
    setError(null)
    try {
      const updateData: Record<string, unknown> = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.position_x !== undefined) updateData.position_x = updates.position_x
      if (updates.position_y !== undefined) updateData.position_y = updates.position_y
      if (updates.position_z !== undefined) updateData.position_z = updates.position_z
      if (updates.rotation_x !== undefined) updateData.rotation_x = updates.rotation_x
      if (updates.rotation_y !== undefined) updateData.rotation_y = updates.rotation_y
      if (updates.rotation_z !== undefined) updateData.rotation_z = updates.rotation_z
      if (updates.scale_x !== undefined) updateData.scale_x = updates.scale_x
      if (updates.scale_y !== undefined) updateData.scale_y = updates.scale_y
      if (updates.scale_z !== undefined) updateData.scale_z = updates.scale_z
      if (updates.trigger_radius !== undefined) updateData.trigger_radius = updates.trigger_radius
      if (updates.animation_key !== undefined) updateData.animation_key = updates.animation_key
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active
      if (updates.sort_order !== undefined) updateData.sort_order = updates.sort_order

      // Add updated_at timestamp
      updateData.updated_at = new Date().toISOString()

      const { error: updateError } = await supabase
        .from('placed_models')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError
      updatePlacedModel(id, updates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update placed model')
    }
  }, [updatePlacedModel])

  const deletePlacedModel = useCallback(async (id: string) => {
    setError(null)
    try {
      const { error: deleteError } = await supabase
        .from('placed_models')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      removePlacedModel(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete placed model')
    }
  }, [removePlacedModel])

  useEffect(() => {
    fetchPlacedModels()
  }, [fetchPlacedModels])

  return { placedModels, loading, error, fetchPlacedModels, createPlacedModel, modifyPlacedModel, deletePlacedModel }
}

// Demo Data Generator Hook
export function useDemoData() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateDemoData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. 기존 데모 데이터 삭제
      const { data: existingBooks } = await supabase
        .from('books')
        .select('id')
        .like('title', '%[데모]%')

      if (existingBooks && existingBooks.length > 0) {
        const bookIds = existingBooks.map(b => (b as Record<string, unknown>).id as string)
        
        // 챕터 ID 가져오기
        const { data: chapters } = await supabase
          .from('chapters')
          .select('id')
          .in('book_id', bookIds)
        
        if (chapters && chapters.length > 0) {
          const chapterIds = chapters.map(c => (c as Record<string, unknown>).id as string)
          // 배치된 모델 삭제
          await supabase.from('placed_models').delete().in('chapter_id', chapterIds)
          // 트리거 존 삭제 (레거시)
          await supabase.from('trigger_zones').delete().in('chapter_id', chapterIds)
        }
        
        // 챕터 삭제
        await supabase.from('chapters').delete().in('book_id', bookIds)
        // 장면 삭제
        await supabase.from('scenes').delete().in('book_id', bookIds)
        // 도서 삭제
        await supabase.from('books').delete().in('id', bookIds)
      }

      // 2. 도서 1: 이상한 나라의 앨리스
      const { data: book1 } = await supabase.from('books').insert({
        title: '[데모] 이상한 나라의 앨리스',
        author: '루이스 캐럴',
        manuscript: '앨리스는 언니 옆에 앉아 있었습니다. 너무 지루해서 졸음이 쏟아졌습니다.'
      }).select().single()

      if (book1) {
        const bookId1 = (book1 as Record<string, unknown>).id as string

        // 챕터 1
        const { data: ch1 } = await supabase.from('chapters').insert({
          book_id: bookId1,
          title: '1장: 토끼굴로',
          order_index: 0,
          content: '앨리스는 언니 옆 강둑에 앉아 할 일이 없어 지루해하고 있었습니다.',
          environment_asset_id: null
        }).select().single()

        if (ch1) {
          const chapterId1 = (ch1 as Record<string, unknown>).id as string
          // 배치된 모델은 에셋이 있을 때 추가됨
          console.log('Chapter 1 created:', chapterId1)
        }

        // 챕터 2
        await supabase.from('chapters').insert({
          book_id: bookId1,
          title: '2장: 눈물의 연못',
          order_index: 1,
          content: '앨리스가 "이상하고 이상해!"라고 외쳤습니다.',
          environment_asset_id: null
        })

        // 챕터 3
        await supabase.from('chapters').insert({
          book_id: bookId1,
          title: '3장: 미친 다과회',
          order_index: 2,
          content: '집 앞 나무 아래에 탁자가 놓여 있었습니다.',
          environment_asset_id: null
        })
      }

      // 3. 도서 2: 빨간 모자
      const { data: book2 } = await supabase.from('books').insert({
        title: '[데모] 빨간 모자',
        author: '그림 형제',
        manuscript: '옛날 옛적에 빨간 모자를 쓴 소녀가 살았습니다.'
      }).select().single()

      if (book2) {
        const bookId2 = (book2 as Record<string, unknown>).id as string

        await supabase.from('chapters').insert({
          book_id: bookId2,
          title: '1장: 심부름',
          order_index: 0,
          content: '옛날 옛적에 모두에게 사랑받는 귀여운 소녀가 살았습니다.',
          environment_asset_id: null
        })

        await supabase.from('chapters').insert({
          book_id: bookId2,
          title: '2장: 숲속의 늑대',
          order_index: 1,
          content: '빨간 모자가 숲으로 들어서자 늑대가 나타났습니다.',
          environment_asset_id: null
        })
      }

      // 4. 도서 3: 피터팬
      const { data: book3 } = await supabase.from('books').insert({
        title: '[데모] 피터팬',
        author: 'J.M. 배리',
        manuscript: '모든 아이들은 자랍니다. 딱 한 명만 빼고요.'
      }).select().single()

      if (book3) {
        const bookId3 = (book3 as Record<string, unknown>).id as string

        await supabase.from('chapters').insert({
          book_id: bookId3,
          title: '1장: 피터를 만나다',
          order_index: 0,
          content: '웬디 달링은 런던의 한 집에서 동생들과 함께 살았습니다.',
          environment_asset_id: null
        })

        await supabase.from('chapters').insert({
          book_id: bookId3,
          title: '2장: 하늘을 날다',
          order_index: 1,
          content: '팅커벨이 요정 가루를 뿌리자 아이들이 공중에 떠올랐습니다!',
          environment_asset_id: null
        })

        await supabase.from('chapters').insert({
          book_id: bookId3,
          title: '3장: 네버랜드',
          order_index: 2,
          content: '두 번째 별을 지나 아침까지 쭉 가면 네버랜드가 나타납니다.',
          environment_asset_id: null
        })
      }

      // 5. 도서 4: 백설공주
      const { data: book4 } = await supabase.from('books').insert({
        title: '[데모] 백설공주',
        author: '그림 형제',
        manuscript: '옛날 옛적에 눈처럼 하얀 피부를 가진 공주가 살았습니다.'
      }).select().single()

      if (book4) {
        const bookId4 = (book4 as Record<string, unknown>).id as string

        await supabase.from('chapters').insert({
          book_id: bookId4,
          title: '1장: 마법의 거울',
          order_index: 0,
          content: '"거울아 거울아, 세상에서 누가 가장 예쁘니?"',
          environment_asset_id: null
        })

        await supabase.from('chapters').insert({
          book_id: bookId4,
          title: '2장: 숲속의 오두막',
          order_index: 1,
          content: '백설공주는 깊은 숲속에서 작은 오두막을 발견했습니다.',
          environment_asset_id: null
        })

        await supabase.from('chapters').insert({
          book_id: bookId4,
          title: '3장: 일곱 난쟁이',
          order_index: 2,
          content: '난쟁이들은 광산에서 돌아와 집에 누군가 있는 것을 발견했습니다.',
          environment_asset_id: null
        })

        await supabase.from('chapters').insert({
          book_id: bookId4,
          title: '4장: 독 사과',
          order_index: 3,
          content: '왕비는 노파로 변장해 독이 든 사과를 가지고 왔습니다.',
          environment_asset_id: null
        })

        await supabase.from('chapters').insert({
          book_id: bookId4,
          title: '5장: 왕자의 키스',
          order_index: 4,
          content: '왕자가 백설공주에게 사랑의 키스를 하자 마법이 풀렸습니다.',
          environment_asset_id: null
        })
      }

      // 6. 도서 5: 신데렐라
      const { data: book5 } = await supabase.from('books').insert({
        title: '[데모] 신데렐라',
        author: '샤를 페로',
        manuscript: '옛날에 착하고 아름다운 소녀가 살았습니다.'
      }).select().single()

      if (book5) {
        const bookId5 = (book5 as Record<string, unknown>).id as string

        await supabase.from('chapters').insert({
          book_id: bookId5,
          title: '1장: 재투성이 소녀',
          order_index: 0,
          content: '신데렐라는 계모와 언니들에게 온갖 심부름을 해야 했습니다.',
          environment_asset_id: null
        })

        await supabase.from('chapters').insert({
          book_id: bookId5,
          title: '2장: 요정 대모',
          order_index: 1,
          content: '"걱정 마, 너도 무도회에 갈 수 있어!" 요정 대모가 말했습니다.',
          environment_asset_id: null
        })

        await supabase.from('chapters').insert({
          book_id: bookId5,
          title: '3장: 호박 마차',
          order_index: 2,
          content: '마법 지팡이를 휘두르자 호박이 황금 마차로 변했습니다.',
          environment_asset_id: null
        })

        await supabase.from('chapters').insert({
          book_id: bookId5,
          title: '4장: 무도회',
          order_index: 3,
          content: '왕자는 신비로운 소녀에게 한눈에 반했습니다.',
          environment_asset_id: null
        })

        await supabase.from('chapters').insert({
          book_id: bookId5,
          title: '5장: 자정의 종소리',
          order_index: 4,
          content: '땡! 자정을 알리는 종이 울렸습니다. 서둘러 도망가야 해!',
          environment_asset_id: null
        })

        await supabase.from('chapters').insert({
          book_id: bookId5,
          title: '6장: 유리 구두',
          order_index: 5,
          content: '왕자는 남겨진 유리 구두의 주인을 찾아 나섰습니다.',
          environment_asset_id: null
        })
      }

      // 7. 도서 6: 인어공주
      const { data: book6 } = await supabase.from('books').insert({
        title: '[데모] 인어공주',
        author: '한스 크리스티안 안데르센',
        manuscript: '깊은 바다 속 궁전에 아름다운 인어 공주가 살았습니다.'
      }).select().single()

      if (book6) {
        const bookId6 = (book6 as Record<string, unknown>).id as string

        await supabase.from('chapters').insert({
          book_id: bookId6,
          title: '1장: 바다 속 궁전',
          order_index: 0,
          content: '인어 공주는 여섯 자매 중 막내였습니다.',
          environment_asset_id: null
        })

        await supabase.from('chapters').insert({
          book_id: bookId6,
          title: '2장: 수면 위의 세상',
          order_index: 1,
          content: '15번째 생일에 인어공주는 처음으로 수면 위로 올라갔습니다.',
          environment_asset_id: null
        })

        await supabase.from('chapters').insert({
          book_id: bookId6,
          title: '3장: 폭풍우와 왕자',
          order_index: 2,
          content: '폭풍우가 배를 덮쳤고, 인어공주는 왕자를 구했습니다.',
          environment_asset_id: null
        })

        await supabase.from('chapters').insert({
          book_id: bookId6,
          title: '4장: 바다 마녀',
          order_index: 3,
          content: '"목소리를 주면 다리를 줄게." 바다 마녀가 말했습니다.',
          environment_asset_id: null
        })
      }

      // 8. 도서 7: 잭과 콩나무
      const { data: book7 } = await supabase.from('books').insert({
        title: '[데모] 잭과 콩나무',
        author: '영국 전래동화',
        manuscript: '가난한 소년 잭은 어머니와 함께 살았습니다.'
      }).select().single()

      if (book7) {
        const bookId7 = (book7 as Record<string, unknown>).id as string

        await supabase.from('chapters').insert({
          book_id: bookId7,
          title: '1장: 마법의 콩',
          order_index: 0,
          content: '잭은 소를 팔러 가다가 이상한 노인을 만났습니다.',
          environment_asset_id: null
        })

        await supabase.from('chapters').insert({
          book_id: bookId7,
          title: '2장: 하늘까지 닿은 콩나무',
          order_index: 1,
          content: '다음 날 아침, 거대한 콩나무가 하늘까지 솟아 있었습니다.',
          environment_asset_id: null
        })

        await supabase.from('chapters').insert({
          book_id: bookId7,
          title: '3장: 거인의 성',
          order_index: 2,
          content: '구름 위에는 무시무시한 거인이 사는 거대한 성이 있었습니다.',
          environment_asset_id: null
        })

        await supabase.from('chapters').insert({
          book_id: bookId7,
          title: '4장: 황금 알을 낳는 거위',
          order_index: 3,
          content: '잭은 황금 알을 낳는 신비로운 거위를 발견했습니다.',
          environment_asset_id: null
        })

        await supabase.from('chapters').insert({
          book_id: bookId7,
          title: '5장: 탈출',
          order_index: 4,
          content: '"인간 냄새가 나! 누가 내 성에 들어왔어!" 거인이 외쳤습니다.',
          environment_asset_id: null
        })
      }

      return { success: true, message: '데모 데이터가 생성되었습니다! (도서 7권, 챕터 25개)' }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate demo data'
      setError(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }, [])

  const clearDemoData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: existingBooks } = await supabase
        .from('books')
        .select('id')
        .like('title', '%[데모]%')

      if (existingBooks && existingBooks.length > 0) {
        const bookIds = existingBooks.map(b => (b as Record<string, unknown>).id as string)
        
        const { data: chapters } = await supabase
          .from('chapters')
          .select('id')
          .in('book_id', bookIds)
        
        if (chapters && chapters.length > 0) {
          const chapterIds = chapters.map(c => (c as Record<string, unknown>).id as string)
          await supabase.from('placed_models').delete().in('chapter_id', chapterIds)
          await supabase.from('trigger_zones').delete().in('chapter_id', chapterIds)
        }
        
        await supabase.from('chapters').delete().in('book_id', bookIds)
        await supabase.from('scenes').delete().in('book_id', bookIds)
        await supabase.from('books').delete().in('id', bookIds)
      }

      return { success: true, message: '데모 데이터가 삭제되었습니다.' }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear demo data'
      setError(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, generateDemoData, clearDemoData }
}
