import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      
      {/* 1. The Fixed Sidebar Component */}
      <Sidebar />
      
      {/* 2. The Main Scrolling Content Area with padding */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth p-8 md:p-10">
        <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-500">
          {children}
        </div>
      </main>
      
    </div>
  )
}