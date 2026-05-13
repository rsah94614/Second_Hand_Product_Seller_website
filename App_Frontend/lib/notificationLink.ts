/** Map web client paths from notification.link to Expo Router hrefs. */
export function notificationLinkToHref(link: string): string | null {
  const path = link.split("?")[0];
  if (path.startsWith("/products/")) {
    const id = path.replace("/products/", "");
    if (id) return `/product/${id}`;
  }
  if (path === "/cart") return "/(tabs)/cart";
  if (path === "/orders") return "/orders";
  if (path.startsWith("/order/")) {
    const id = path.replace("/order/", "");
    if (id) return `/order/${id}`;
  }
  if (path === "/profile") return "/(tabs)/profile";
  if (path === "/wishlist") return "/wishlist";
  if (path === "/notifications") return "/notifications";
  if (path === "/chat") return "/(tabs)/chat";
  if (path === "/dashboard" || path === "/seller-dashboard") return "/dashboard";
  if (path === "/my-products") return "/my-products";
  if (path === "/admin-dashboard") return "/admin";
  if (path.startsWith("/admin/")) {
    const rest = path.replace("/admin/", "");
    const map: Record<string, string> = {
      users: "/admin/users",
      products: "/admin/products",
      categories: "/admin/categories",
      orders: "/admin/orders",
      reports: "/admin/reports",
      "audit-logs": "/admin/audit",
    };
    return map[rest] ?? "/admin";
  }
  return null;
}
