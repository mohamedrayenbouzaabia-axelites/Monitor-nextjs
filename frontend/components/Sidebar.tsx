import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

const Sidebar = () => {
  const pathname = usePathname()

  const menuItems = [
    {
      section: 'Main',
      items: [
        {
          name: '⚡ Dashboard',
          href: '/'
        }
      ]
    },
    {
      section: 'Reconnaissance',
      items: [
        {
          name: '🌐 Network Scanner',
          href: '/admin'
        },
        {
          name: '📊 Monitoring',
          href: '/'
        }
      ]
    },
    {
      section: 'Pentest Tools',
      items: [
        {
          name: '🤖 AI Tools',
          href: '/admin'
        },
        {
          name: '🗂️ Domain Tools',
          href: '/admin'
        },
        {
          name: '🏢 Company Tools',
          href: '/admin'
        }
      ]
    }
  ]

  return (
    <div className="sidebar fixed left-0 top-0 h-screen z-40 border-r border-cyan-500/20 lg:w-[230px] w-64 bg-gray-900 dark:bg-gray-950 transform transition-transform duration-300 ease-in-out lg:translate-x-0 -translate-x-full lg:-translate-x-0">
      <div className="pt-20">
        {/* App Logo */}
        <div className="px-4 py-4">
          <div className="logo mx-auto mb-6">
            <Image
              src="/app-logo.png"
              alt="App Logo"
              width={150}
              height={40}
              className="object-contain"
            />
          </div>
        </div>

        {/* Navigation Items */}
        <nav>
          {menuItems.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {/* Section Header */}
              <div className="sidebar-section">
                {section.section}
              </div>

              {/* Section Items */}
              {section.items.map((item, itemIndex) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={itemIndex}
                    href={item.href}
                    className={`sidebar-item block ${
                      isActive ? 'active' : ''
                    }`}
                  >
                    <span className="sidebar-item-content">
                      {item.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Mobile Close Button */}
      <button
        className="lg:hidden absolute top-24 right-4 p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
        onClick={() => {
          // Close mobile sidebar functionality
          document.querySelector('.sidebar')?.classList.add('-translate-x-full')
        }}
      >
        ✕
      </button>
    </div>
  )
}

export default Sidebar