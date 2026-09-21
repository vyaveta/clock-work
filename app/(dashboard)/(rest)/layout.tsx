import AppHeader from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <AppHeader />
            <main className="flex-1">
                {children}
            </main>
        </>
    )
}

export default Layout