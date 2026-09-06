"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm text-red-500 hover:underline"
    >
      تسجيل الخروج
    </button>
  );
}
