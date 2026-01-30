import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ username: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { username } = await params;

  // Require authentication
  if (!session) {
    redirect(`/login?callbackUrl=/${username}/dashboard`);
  }

  // Verify user belongs to this organization
  if (session.user.organizationUsername !== username) {
    redirect(`/${session.user.organizationUsername}/dashboard`);
  }

  return <>{children}</>;
}
