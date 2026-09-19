export const APP_NAV_ITEMS = [
  { href: "/accounts/overview", label: "Accounts" },
  { href: "/dashboard", label: "Summary" },
  { href: "/statement", label: "Statement" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/transactions", label: "Transactions" },
  { href: "/settings", label: "Settings" },
] as const;

export function isAppNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return (
      pathname === "/dashboard" || pathname.startsWith("/dashboard/")
    );
  }
  if (href === "/portfolio") {
    return (
      pathname === "/portfolio" || pathname.startsWith("/portfolio/")
    );
  }
  if (href === "/accounts/overview") {
    return (
      pathname === "/accounts" || pathname.startsWith("/accounts/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
