"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, UserPlus, Users, Briefcase, LogOut, Leaf } from 'lucide-react'

const navItems = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Recruitment', path: '/dashboard/recruitment', icon: UserPlus },
  { name: 'Pre-employee', path: '/dashboard/pre-employee', icon: Users },
  { name: 'Active Employees', path: '/dashboard/employees', icon: Briefcase },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  const [displayName, setDisplayName] = useState("Loading...")
  const [initial, setInitial] = useState("-")

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const name = user.user_metadata?.display_name || "HR Admin"
        setDisplayName(name)
        setInitial(name.charAt(0).toUpperCase())
      } else {
        setDisplayName("Guest")
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col justify-between shrink-0">
      
      {/* TOP SECTION: Brand & Navigation */}
      {/* flex-1 overflow-y-auto ensures the nav scrolls if it gets too long, protecting the bottom profile */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100 mb-4 sticky top-0 bg-white z-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 border border-emerald-100 text-emerald-600">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg leading-tight">Human Success</h1>
            <p className="text-xs text-slate-500 font-medium">HR Workspace</p>
          </div>
        </div>

        <nav className="px-4 space-y-1 pb-4">
          {navItems.map((item) => {
            const isActive = pathname === item.path
            const Icon = item.icon
            
            return (
              <Link key={item.name} href={item.path}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {item.name}
                </div>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* BOTTOM SECTION: User Profile & Logout */}
      {/* Increased padding (p-6) and bg-color to firmly separate it from the bottom corner */}
      <div className="p-6 border-t border-slate-100 bg-slate-50/50 mt-auto">
        <div className="flex items-center gap-3 mb-5">
          {/* Dark Circle Avatar */}
          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            {initial}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
            <p className="text-xs text-slate-500 font-medium truncate">System Admin</p>
          </div>
        </div>
        
        {/* Modernized Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all border border-rose-100 shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          Secure Logout
        </button>
      </div>

    </div>
  )
}