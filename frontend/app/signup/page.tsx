import React from "react";
import type { Metadata } from "next";
import { PageLayout } from "@/components/page-layout";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign up | DocuMind",
  description: "Create an account to start asking your documents anything.",
};

export default function SignupPage() {
  return (
    <PageLayout variant="auth">
      <div className="flex-1 flex items-center justify-center py-12">
        <AuthForm mode="signup" />
      </div>
    </PageLayout>
  );
}
