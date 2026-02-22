'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/brands', label: 'Brands' },
  { href: '/admin/coupons', label: 'Coupons' },
  { href: '/admin/banners', label: 'Banners' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/returns', label: 'Returns' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 border-r border-zinc-200 bg-white min-h-[calc(100vh-49px)]">
      <ul className="p-3 space-y-1 text-sm">
        {items.map(it => {
          let active = false

          if (it.href === '/admin') {
            active = pathname === '/admin' // dashboard aktif hanya di /admin persis
          } else {
            active = pathname === it.href || pathname?.startsWith(it.href + '/')
          }

          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`block rounded px-3 py-2 ${active ? 'bg-orange-50 text-orange-700' : 'hover:bg-zinc-50'}`}
              >
                {it.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
