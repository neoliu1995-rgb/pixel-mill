import { getCurrentUser } from "@/lib/auth";

export function isAdminUser(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS || "";
  return adminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function requireAdmin(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Error("Authentication required");
  }
  if (!isAdminUser(user.email)) {
    throw new Error("Admin access required");
  }
  return user;
}
