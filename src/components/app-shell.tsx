import { Sidebar } from "@/components/sidebar";
import { TopHeader } from "@/components/top-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopHeader />
        <main className="page-shell flex-1 px-6 pb-12 pt-7 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
