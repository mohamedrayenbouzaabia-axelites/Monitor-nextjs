import Head from 'next/head'
import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
  title?: string
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const pathname = usePathname()
  const showSidebar = pathname === '/admin' // Only show sidebar on admin page

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Only on scanner page and desktop */}
      {showSidebar && <Sidebar />}

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div
          className="sidebar-mobile-overlay hidden lg:hidden"
          onClick={() => {
            const sidebar = document.querySelector('.sidebar')
            const overlay = document.querySelector('.sidebar-mobile-overlay')
            if (sidebar) {
              sidebar.classList.add('-translate-x-full')
            }
            if (overlay) {
              overlay.classList.add('hidden')
            }
          }}
        />
      )}

      {/* Main content area */}
      <div className={`min-h-screen transition-all duration-300 ${showSidebar ? 'lg:ml-[230px]' : ''}`}>
        <Navbar />
        <main className="pt-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout 