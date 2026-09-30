import { NavLink, Outlet, useLocation } from 'react-router-dom'

const navigation = [
  { label: 'Map', to: '/', icon: '⌖' },
  { label: 'Diary', to: '/diary', icon: '▤' },
  { label: 'Add', to: '/add', icon: '+' },
  { label: 'Wishlist', to: '/wishlist', icon: '♡' },
  { label: 'Profile', to: '/profile', icon: '○' },
]

export function AppShell() {
  const location = useLocation()
  const isMapRoute = location.pathname === '/'

  return (
    <div className="min-h-screen bg-[#fffaf5]">
      <main
        className={`mx-auto w-full ${
          isMapRoute
            ? 'h-[100dvh] max-w-7xl overflow-hidden px-5 pb-24 pt-4 md:px-8 md:pt-6'
            : 'min-h-screen max-w-xl px-5 pb-28 pt-6'
        }`}
      >
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-[#eadfd6] bg-[#fffaf5]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          {navigation.map(({ label, to, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-w-14 flex-col items-center gap-1 text-xs font-medium transition ${
                  isActive ? 'text-[#c75b32]' : 'text-[#9b8c82]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`rounded-2xl px-3 py-1 text-xl leading-5 ${
                      isActive ? 'bg-[#fbe4d7]' : ''
                    }`}
                  >
                    {icon}
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
