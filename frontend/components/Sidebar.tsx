'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import styles from './Sidebar.module.css'

interface SearchHistoryItem {
  id: string
  query: string
  results_count: number
  created_at: string
}

interface SidebarProps {
  onHistoryItemClick: (query: string, searchId?: string) => void
  currentUser: any
  searchQuery?: string | undefined
  searchResults?: any[] | undefined
}

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemQuery: string
}

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, itemQuery }: DeleteConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Delete Search History</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.deleteContent}>
            <p>Are you sure you want to delete this search from your history?</p>
            <p className={styles.deleteQuery}>"{itemQuery}"</p>
            <p className={styles.deleteWarning}>This action cannot be undone.</p>
          </div>
          <div className={styles.modalActions}>
            <button 
              className={styles.cancelButton} 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className={styles.deleteConfirmButton} 
              onClick={onConfirm}
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ onHistoryItemClick, currentUser, searchQuery, searchResults }: SidebarProps) {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; item: SearchHistoryItem | null }>({
    isOpen: false,
    item: null
  })

  useEffect(() => {
    if (currentUser) {
      fetchSearchHistory()
    } else {
      setSearchHistory([])
      setLoading(false)
    }
  }, [currentUser])

  const isValidSearchData = (query: string | undefined, results: any[] | undefined): boolean => {
    return !!(query && query.trim() && results && Array.isArray(results) && results.length > 0)
  }

  // Auto-update sidebar when new search is performed
  useEffect(() => {
    if (isValidSearchData(searchQuery, searchResults) && currentUser) {
      // Use a try-catch wrapper to prevent errors from breaking the UI
      try {
        addToSearchHistory(searchQuery!, searchResults?.length)
      } catch (error) {
        console.warn('Failed to update search history, but continuing:', error)
        // Still update local state even if database fails
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newItem: SearchHistoryItem = {
          id: tempId,
          query: searchQuery!,
          results_count: searchResults?.length,
          created_at: new Date().toISOString()
        }
        setSearchHistory(prev => [newItem, ...prev.slice(0, 19)])
      }
    }
  }, [searchQuery, searchResults, currentUser])

  const openDeleteModal = (item: SearchHistoryItem) => {
    setDeleteModal({ isOpen: true, item })
  }

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, item: null })
  }

  const handleDeleteHistoryItem = async () => {
    if (!deleteModal.item) return

    const itemToDelete = deleteModal.item
    closeDeleteModal()

    console.log('Attempting to delete item:', itemToDelete)

    try {
      // Try to delete from database first
      if (currentUser?.id && supabase && typeof window !== 'undefined') {
        console.log('Deleting from database with user_id:', currentUser.id, 'and item_id:', itemToDelete.id)
        
        // First, verify the item exists in the database
        const { data: verifyData, error: verifyError } = await supabase
          .from('search_history')
          .select('id, query')
          .eq('user_id', currentUser.id)
          .eq('id', itemToDelete.id)
          .single()

        if (verifyError) {
          console.error('Error verifying item exists:', verifyError)
          if (verifyError.code === 'PGRST116') {
            console.log('Item not found in database, might have been deleted already')
            // Remove from local state since it's not in the database
      setSearchHistory(prev => prev.filter(item => item.id !== itemToDelete.id))
            return
          }
        } else {
          console.log('Item verified in database:', verifyData)
        }

        // Try to delete by ID first
        const { error: dbError, count } = await supabase
          .from('search_history')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('id', itemToDelete.id)

        console.log('Delete result:', { error: dbError, count })

        if (dbError) {
          console.error('Failed to delete from database by ID:', dbError)
          
          // Try fallback deletion by query
          console.log('Trying fallback deletion by query...')
          const { error: fallbackError, count: fallbackCount } = await supabase
            .from('search_history')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('query', itemToDelete.query)

          console.log('Fallback delete result:', { error: fallbackError, count: fallbackCount })

          if (fallbackError) {
            console.error('Fallback deletion also failed:', fallbackError)
            alert('Failed to delete item. Please try again.')
            return
          } else {
            console.log('Successfully deleted from database using fallback method')
          }
        } else {
          console.log('Successfully deleted from database using ID')
        }
        
        // Only remove from local state after successful database deletion
        setSearchHistory(prev => prev.filter(item => item.id !== itemToDelete.id))
      } else {
        console.log('No database connection, removing from local state only')
        // Fallback: remove from local state if no database connection
        setSearchHistory(prev => prev.filter(item => item.id !== itemToDelete.id))
      }
    } catch (error) {
      console.error('Error deleting history item:', error)
      alert('Failed to delete item. Please try again.')
    }
  }

  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...')
      
      // Check if Supabase is properly configured
      if (!supabase || !supabase.from) {
        return 'Supabase client not properly configured'
      }

      const { data, error } = await supabase
        .from('search_history')
        .select('count')
        .limit(1)
      
      if (error) {
        console.error('Database test error:', error)
        return `Connection failed: ${error.message || 'Unknown error'}`
      }
      
      return 'Database connection successful!'
    } catch (err) {
      console.error('Database test exception:', err)
      return `Connection test failed: ${err}`
    }
  }

  const checkDatabaseHealth = async () => {
    try {
      if (!supabase || !supabase.from) {
        return false
      }

      const { error } = await supabase
        .from('search_history')
        .select('id')
        .limit(1)
      
      return !error
    } catch {
      return false
    }
  }

  const checkConfiguration = () => {
    const config = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasUser: !!currentUser?.id,
      isClient: typeof window !== 'undefined',
      hasSupabaseClient: !!supabase,
      hasSupabaseAuth: !!(supabase && supabase.auth),
      hasSupabaseFrom: !!(supabase && supabase.from)
    }
    
    console.log('Configuration check:', config)
    return config
  }

  const addToSearchHistory = async (query: string, resultsCount: number) => {
    try {
      // Check if this query already exists in recent history
      const existingItem = searchHistory.find(item => 
        item.query.toLowerCase() === query.toLowerCase()
      )

      if (existingItem) {
        // Update existing item timestamp and results count
        const updatedHistory = searchHistory.map(item =>
          item.id === existingItem.id
            ? { ...item, results_count: resultsCount, created_at: new Date().toISOString() }
            : item
        )
        setSearchHistory(updatedHistory)
      } else {
        // Add new item to the beginning with a temporary ID
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newItem: SearchHistoryItem = {
          id: tempId, // Temporary ID for UI
          query,
          results_count: resultsCount,
          created_at: new Date().toISOString()
        }
        setSearchHistory(prev => [newItem, ...prev.slice(0, 19)]) // Keep max 20 items
      }

      // Check environment variables and configuration before attempting database save
      const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      // Additional safety checks
      if (!hasSupabaseConfig) {
        console.log('Skipping database save - Supabase environment variables not configured')
        return
      }
      
      if (!currentUser?.id) {
        console.log('Skipping database save - user not authenticated')
        return
      }
      
      if (typeof window === 'undefined') {
        console.log('Skipping database save - running on server')
        return
      }
      
      if (!supabase) {
        console.log('Skipping database save - Supabase client not available')
        return
      }
      
      // Only attempt database save if we have proper authentication and configuration
      try {
        // Check if Supabase is properly configured
        if (!supabase.auth || !supabase.from) {
          console.warn('Supabase client not properly configured - skipping database save')
          return
        }

        // Check database health before attempting save
        const isHealthy = await checkDatabaseHealth()
        if (!isHealthy) {
          console.warn('Database health check failed - skipping database save')
          return
        }

        console.log('Attempting to save to database:', {
          user_id: currentUser.id,
          query,
          results_count: resultsCount
        })

        // First, try to find existing record
        const { data: existingData, error: selectError } = await supabase
          .from('search_history')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('query', query)
          .single()

        if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error checking existing record:', selectError)
        }

        let recordId: string | null = null

        if (existingData) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('search_history')
            .update({
              results_count: resultsCount,
              created_at: new Date().toISOString()
            })
            .eq('id', existingData.id)

          if (updateError) {
            console.error('Error updating existing record:', updateError)
          } else {
            recordId = existingData.id
            console.log('Successfully updated existing record with ID:', recordId)
          }
        } else {
          // Insert new record
          const { data: insertData, error: insertError } = await supabase
          .from('search_history')
            .insert({
            user_id: currentUser.id,
            query,
            results_count: resultsCount,
            created_at: new Date().toISOString()
            })
            .select('id')
            .single()

          if (insertError) {
            console.error('Error inserting new record:', insertError)
          } else if (insertData) {
            recordId = insertData.id
            console.log('Successfully inserted new record with ID:', recordId)
          }
        }

        // Update local state with the actual database ID
        if (recordId) {
          setSearchHistory(prev => prev.map(item => 
            item.query === query && item.id.startsWith('temp_')
              ? { ...item, id: recordId! }
              : item
          ))
        }
      } catch (dbErr) {
        // Ensure we have a proper error object
        const errorInfo = {
          message: dbErr instanceof Error ? dbErr.message : 'Unknown database exception',
          stack: dbErr instanceof Error ? dbErr.stack : 'No stack trace available',
          error: dbErr
        }
        
        console.error('Database save exception:', errorInfo)
        console.warn('Database save failed, but continuing with local history')
      }
    } catch (err) {
      // Ensure we have a proper error object
      const errorInfo = {
        message: err instanceof Error ? err.message : 'Unknown error in search history update',
        stack: err instanceof Error ? err.stack : 'No stack trace available',
        error: err
      }
      
      console.error('Error updating search history:', errorInfo)
      // Don't throw error to user, just log it
    }
  }

  const fetchSearchHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if user has a valid ID
      if (!currentUser?.id) {
        throw new Error('User not properly authenticated. Please login again.')
      }

      console.log('Fetching search history for user:', currentUser.id)

      const { data, error } = await supabase
        .from('search_history')
        .select(`
          id,
          query,
          results_count,
          created_at
        `