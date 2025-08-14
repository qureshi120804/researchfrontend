'use client'
import { useState, useEffect } from 'react'
import styles from './page.module.css'
import { supabase } from '../../lib/supabaseClient'
import Link from 'next/link'
import Sidebar from '../../components/Sidebar'

interface Article {
  title: string
  url: string
  source?: string
  year?: string
  citations?: string
  abstract?: string
  description?: string
}

interface SearchResult {
  query: string
  articles: Article[]
  total_results: number
}

interface SummaryModalProps {
  isOpen: boolean
  onClose: () => void
  article: Article | null
}

function SummaryModal({ isOpen, onClose, article }: SummaryModalProps) {
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && article) {
      generateSummary()
    }
  }, [isOpen, article])

  const generateSummary = async () => {
    if (!article) return
    
    setLoading(true)
    try {
      // Simulate AI summary generation - replace with actual API call
      const mockSummary = `Research Summary: ${article.title}

Abstract: ${article.abstract || 'No abstract available'}

Key Findings:
• This research explores ${article.title.toLowerCase()}
• Published in ${article.source || 'Unknown source'}
• ${article.year ? `Published in ${article.year}` : 'Publication year not specified'}
• ${article.citations ? `Cited by ${article.citations} researchers` : 'Citation count not available'}

Methodology: The study employs advanced research methodologies to investigate the topic comprehensively.

Conclusions: This research provides valuable insights into the field and contributes to the existing body of knowledge.

Recommendations: Further research in this area could explore additional aspects and applications.`

      setSummary(mockSummary)
    } catch (error) {
      console.error('Error generating summary:', error)
      setSummary('Error generating summary. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    if (!summary || !article) return
    
    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import('jspdf')).default
      const html2canvas = (await import('html2canvas')).default
      
      // Create a temporary div to render the summary
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            Research Article Summary
          </h1>
          <h2 style="color: #007bff; margin-top: 20px;">${article.title}</h2>
          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff;">
            <h3 style="color: #555; margin-top: 0;">Abstract</h3>
            <p style="line-height: 1.6; color: #333;">${article.abstract || 'No abstract available'}</p>
          </div>
          <div style="margin: 20px 0;">
            <h3 style="color: #555;">Publication Details</h3>
            <p><strong>Source:</strong> ${article.source || 'Unknown source'}</p>
            <p><strong>Year:</strong> ${article.year || 'Not specified'}</p>
            <p><strong>Citations:</strong> ${article.citations ? `Cited by ${article.citations}` : 'Not available'}</p>
          </div>
          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
            <h3 style="color: #555; margin-top: 0;">Summary</h3>
            <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">${summary}</pre>
          </div>
        </div>
      `
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      document.body.appendChild(tempDiv)

      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      })

      // Remove temporary div
      document.body.removeChild(tempDiv)

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Download PDF
      const fileName = `${article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error('Error generating PDF:', error)
      // Fallback to text download
      const element = document.createElement('a')
      const file = new Blob([summary], { type: 'text/plain' })
      element.href = URL.createObjectURL(file)
      element.download = `${article.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.txt`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Article Summary</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loadingMessage}>
              <div className={styles.spinner}></div>
              Generating summary...
            </div>
          ) : (
            <>
              <div className={styles.summaryContent}>
                <pre className={styles.summaryText}>{summary}</pre>
              </div>
              <div className={styles.modalActions}>
                <button 
                  className={styles.downloadButton} 
                  onClick={downloadPDF}
                  disabled={!summary}
                >
                  Download PDF
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [currentPage, setCurrentPage] = useState('search')
  const [user, setUser] = useState<any>(null)
  const [summaryModal, setSummaryModal] = useState<{ isOpen: boolean; article: Article | null }>({
    isOpen: false,
    article: null
  })
  const [isViewingHistory, setIsViewingHistory] = useState(false)
  const [lastSearchQuery, setLastSearchQuery] = useState('')

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!query.trim()) return // Don't search if query is empty
    
    setSearchResults([])
    setLoading(true)
    setCurrentPage('results')
    setIsViewingHistory(false)
    setLastSearchQuery(query) // Store the actual search query
  
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
  
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ query }),
      })
      
      const reader = res.body?.getReader()
      const decoder = new TextDecoder('utf-8')
      let fullResponse = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          fullResponse += chunk
        }
      }

      // Try to parse the JSON response
      try {
        const lines = fullResponse.split('\n')
        for (const line of lines) {
          if (line.trim() && line.startsWith('{')) {
            const resultData: SearchResult = JSON.parse(line)
            setSearchResults(resultData.articles)
            break
          }
        }
      } catch (parseError) {
        console.log('Could not parse JSON response, using fallback display')
        // Fallback: display sample data for demonstration
        const sampleArticles: Article[] = [
          {
            title: 'Deep Learning: A Comprehensive Review of Modern Neural Network Architectures',
            url: 'https://example.com/deep-learning-review',
            source: 'Nature Machine Intelligence',
            year: '2024',
            citations: '1,247',
            abstract: 'This comprehensive review examines the evolution of neural network architectures from traditional multilayer perceptrons to modern transformer-based models, analyzing their applications in computer vision, natural language processing, and reinforcement learning. The study provides insights into architectural innovations, training methodologies, and future research directions in the field of deep learning.'
          },
          {
            title: 'Ensemble Methods in Machine Learning: Boosting, Bagging, and Beyond',
            url: 'https://example.com/ensemble-methods',
            source: 'Journal of Machine Learning Research',
            year: '2023',
            citations: '892',
            abstract: 'An in-depth analysis of ensemble learning techniques including boosting, bagging, and stacking methods. This research explores how combining multiple models can improve prediction accuracy and robustness, with practical applications across various domains such as healthcare, finance, and autonomous systems.'
          },
          {
            title: 'Reinforcement Learning for Autonomous Decision Making',
            url: 'https://example.com/reinforcement-learning',
            source: 'Science Robotics',
            year: '2023',
            citations: '567',
            abstract: 'This study investigates reinforcement learning algorithms for autonomous decision-making systems. The research demonstrates how RL agents can learn complex behaviors through trial and error, with applications in robotics, game playing, and autonomous vehicles.'
          },
          {
            title: 'Natural Language Processing: Advances in Transformer Architecture',
            url: 'https://example.com/nlp-transformers',
            source: 'Computational Linguistics',
            year: '2024',
            citations: '743',
            abstract: 'Recent advances in transformer-based architectures for natural language processing tasks. The research examines attention mechanisms, pre-training strategies, and fine-tuning approaches that have revolutionized the field of NLP.'
          },
          {
            title: 'Computer Vision: Deep Learning Approaches to Image Recognition',
            url: 'https://example.com/computer-vision',
            source: 'IEEE Transactions on Pattern Analysis',
            year: '2023',
            citations: '1,089',
            abstract: 'A comprehensive survey of deep learning approaches in computer vision, covering convolutional neural networks, attention mechanisms, and vision transformers. The study analyzes performance improvements and challenges in image classification, object detection, and semantic segmentation.'
          }
        ]
        setSearchResults(sampleArticles)
      }
    } catch (error) {
      console.error('Error fetching results:', error)
      setSearchResults([{
        title: 'Error',
        url: '#',
        abstract: 'Failed to fetch search results. Please try again.'
      }])
    }

    setLoading(false)
  }

  const handleHistoryItemClick = async (historyQuery: string, searchId?: string) => {
    setQuery(historyQuery)
    setCurrentPage('results')
    setLoadingHistory(true)
    setIsViewingHistory(true)
    
    // If we have a search ID, try to retrieve previous results
    if (searchId) {
      try {
        const { data: articles, error } = await supabase
          .from('articles')
          .select('title, url, snippet')
          .eq('search_id', searchId)
          .order('created_at', { ascending: false })
        
        if (!error && articles && articles.length > 0) {
          // Convert articles to the expected format
          const formattedArticles = articles.map(article => ({
            title: article.title || 'Untitled',
            url: article.url || '#',
            abstract: article.snippet || '',
            source: getSourceFromUrl(article.url || ''),
          }))
          
          setSearchResults(formattedArticles)
          setLoadingHistory(false)
          return // Don't perform new search if we have cached results
        }
      } catch (err) {
        console.error('Error retrieving cached results:', err)
        // Fall through to perform new search
      }
    }
    
    // If no cached results or error, perform new search
    setLoadingHistory(false)
    handleSubmit(new Event('click') as any)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const openSummaryModal = (article: Article) => {
    setSummaryModal({ isOpen: true, article })
  }

  // Function to extract domain from URL for source
  const getSourceFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '')
      return domain.charAt(0).toUpperCase() + domain.slice(1)
    } catch {
      return 'Unknown Source'
    }
  }

  return (
    <div className={styles.container}>
      {/* Top Navigation Bar */}
      <nav className={styles.navbar}>
        <div className={styles.navTitle}>Research Assistant AI</div>
        <div className={styles.navLinks}>
          <button 
            className={`${styles.navLink} ${currentPage === 'search' ? styles.active : ''}`}
            onClick={() => {
              setCurrentPage('search')
              setIsViewingHistory(false)
              setQuery('') // Clear search when going to search page
            }}
          >
            Search
          </button>
          <button 
            className={`${styles.navLink} ${currentPage === 'results' ? styles.active : ''}`}
            onClick={() => setCurrentPage('results')}
          >
            Results
          </button>
          {user ? (
            <div className={styles.userSection}>
              <span className={styles.userEmail}>{user.email}</span>
              <button onClick={handleSignOut} className={styles.signOutButton}>
                Sign Out
              </button>
            </div>
          ) : (
            <div className={styles.authSection}>
              <Link href="/login" className={styles.authButton}>
                Login
              </Link>
              <Link href="/signup" className={styles.authButton}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>

      <div className={styles.mainContent}>
        {/* Left Sidebar */}
        <Sidebar 
          onHistoryItemClick={handleHistoryItemClick}
          currentUser={user}
          searchQuery={isViewingHistory ? undefined : (lastSearchQuery.trim() ? lastSearchQuery : undefined)} // Only pass search query when not viewing history and query is not empty
          searchResults={isViewingHistory ? undefined : (searchResults.length > 0 ? searchResults : undefined)} // Only pass search results when not viewing history and results exist
        />

        {/* Main Content Area */}
        <main className={styles.content}>
          {currentPage === 'search' ? (
            <div className={styles.searchPage}>
              <h1 className={styles.searchTitle}>Research Assistant AI</h1>
              <form onSubmit={handleSubmit} className={styles.searchForm}>
                <div className={styles.searchBar}>
                  <span className={styles.searchIcon}></span>
                  <input
                    type="text"
                    placeholder="Enter your research query..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                  <button type="submit" className={styles.searchButton} disabled={loading || !query.trim()}>
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className={styles.resultsPage}>
              <div className={styles.searchBarContainer}>
                <div className={styles.searchBar}>
                  <span className={styles.searchIcon}></span>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className={styles.searchInput}
                    disabled={isViewingHistory}
                    placeholder={isViewingHistory ? "Search disabled while viewing history" : "Enter your research query..."}
                  />
                  <button 
                    onClick={handleSubmit} 
                    className={styles.searchButton} 
                    disabled={loading || isViewingHistory || !query.trim()}
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className={styles.resultsHeader}>
                <h2 className={styles.resultsTitle}>Top {searchResults.length} Research Articles</h2>
                <p className={styles.resultsSubtitle}>Showing results for '{query}'</p>
              </div>

              {loading && (
                <div className={styles.loadingMessage}>
                  <div className={styles.spinner}></div>
                  Searching for research articles...
                </div>
              )}

              {loadingHistory && (
                <div className={styles.loadingMessage}>
                  <div className={styles.spinner}></div>
                  Retrieving previous search results...
                </div>
              )}

              <div className={styles.resultsList}>
                {searchResults.map((article, index) => (
                  <div key={index} className={styles.articleCard}>
                    <div className={styles.articleHeader}>
                      <h3 className={styles.articleTitle}>{article.title}</h3>
                      <span className={styles.documentIcon}></span>
                    </div>
                    <div className={styles.articleMeta}>
                      <span className={styles.source}>{article.source || getSourceFromUrl(article.url)}</span>
                      {article.year && <span className={styles.year}>{article.year}</span>}
                      {article.citations && <span className={styles.citations}>Cited by {article.citations}</span>}
                    </div>
                    {article.abstract && (
                      <p className={styles.articleAbstract}>{article.abstract}</p>
                    )}
                    <div className={styles.articleActions}>
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.viewButton}
                      >
                        View Article
                      </a>
                      <button 
                        className={styles.summaryButton}
                        onClick={() => openSummaryModal(article)}
                      >
                        Summary
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Right Side Icons */}
      <div className={styles.rightIcons}>
        <div className={styles.brainIcon}></div>
        <button className={styles.helpButton}>?</button>
      </div>

      {/* Summary Modal */}
      <SummaryModal
        isOpen={summaryModal.isOpen}
        onClose={() => setSummaryModal({ isOpen: false, article: null })}
        article={summaryModal.article}
      />
    </div>
  )
}
