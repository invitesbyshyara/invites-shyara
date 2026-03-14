import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbEntry {
  label: string;
  href?: string;
}

interface DashboardLayoutProps {
  breadcrumbs: BreadcrumbEntry[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shared navigation wrapper for authenticated dashboard pages.
 * Provides a consistent sticky navbar with logo, breadcrumb trail, and an optional right-side action slot.
 *
 * Usage:
 *   <DashboardLayout
 *     breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Sarah & John" }]}
 *     actions={<Button onClick={export}>Export CSV</Button>}
 *   >
 *     {pageContent}
 *   </DashboardLayout>
 */
const DashboardLayout = ({ breadcrumbs, actions, children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16 gap-4 px-4">
          {/* Logo + Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="font-display text-xl font-bold shrink-0">
              Shyara
            </Link>
            {breadcrumbs.length > 0 && (
              <>
                <span className="text-muted-foreground/40 hidden sm:inline">/</span>
                <Breadcrumb className="hidden sm:block min-w-0">
                  <BreadcrumbList>
                    {breadcrumbs.map((crumb, index) => {
                      const isLast = index === breadcrumbs.length - 1;
                      return (
                        <span key={crumb.label} className="flex items-center">
                          <BreadcrumbItem>
                            {isLast ? (
                              <BreadcrumbPage className="max-w-[160px] truncate">
                                {crumb.label}
                              </BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink asChild>
                                <Link to={crumb.href ?? "#"}>{crumb.label}</Link>
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                          {!isLast && <BreadcrumbSeparator className="mx-1" />}
                        </span>
                      );
                    })}
                  </BreadcrumbList>
                </Breadcrumb>
              </>
            )}
          </div>

          {/* Right-side actions */}
          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>
      </nav>

      {children}
    </div>
  );
};

export default DashboardLayout;
