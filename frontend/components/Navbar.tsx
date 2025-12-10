import { useTheme } from 'next-themes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

const Navbar = () => {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const showSidebar = pathname === '/scanner'

  // Wait for mounting to complete before rendering to avoid hydration errors
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/60 dark:bg-gray-900/60 border-b
      border-gray-200/50 dark:border-cyan-500/20 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="transition-transform duration-300 group-hover:scale-105">
                <img
                  src="/company-logo.png"
                  alt="Company Logo"
                  className="w-[100px] h-[100px] object-contain"
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600
                dark:from-cyan-400 dark:to-blue-300 bg-clip-text text-transparent">
                Network Scanner
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button - Only show on scanner page */}
            {showSidebar && (
              <button
              onClick={() => {
                const sidebar = document.querySelector('.sidebar')
                const overlay = document.querySelector('.sidebar-mobile-overlay')
                if (sidebar) {
                  sidebar.classList.toggle('-translate-x-full')
                }
                if (overlay) {
                  overlay.classList.toggle('hidden')
                }
              }}
              className="lg:hidden p-2 rounded-lg bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80
                dark:hover:bg-cyan-500/20 transition-all duration-300 hover:scale-105 dark:border dark:border-cyan-500/30"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            )}

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80
                dark:hover:bg-cyan-500/20 transition-all duration-300 hover:scale-105 dark:border dark:border-cyan-500/30"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? (
                <SunIcon className="w-5 h-5 text-cyan-400" />
              ) : (
                <MoonIcon className="w-5 h-5 text-blue-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 