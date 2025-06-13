import { type ReactNode } from 'react'
import { AppSidebar } from './app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

interface LayoutProps {
  children: ReactNode
  title: string
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-xl font-semibold">{title}</h1>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
            <div className="p-6 space-y-6">
              {children}
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
} 