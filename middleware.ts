import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    // أي شخص غير الأدمن يتحول لصفحة دخول الأدمن
    pages: { signIn: "/admin/login" },
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        if (path === "/admin/login") return true;

        // صفحات ومسارات الأدمن: لازم يكون المستخدم أدمن فعليًا (مو أي عميل مسجّل دخول)
        if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
          return token?.role === "ADMIN";
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
