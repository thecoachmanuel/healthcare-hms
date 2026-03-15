"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validate = () => {
    const e = email.trim();
    const p = password;
    let ok = true;
    setEmailError(null);
    setPasswordError(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(e)) {
      setEmailError("Enter a valid email address");
      ok = false;
    }
    if (!p || p.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      ok = false;
    }
    return ok;
  };

  const mapError = (m?: string) => {
    if (!m) return "Sign in failed";
    const s = m.toLowerCase();
    if (s.includes("invalid login")) return "Invalid email or password";
    if (s.includes("email not confirmed")) return "Please confirm your email to continue";
    if (s.includes("rate limit")) return "Too many attempts. Try again later";
    return m;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!validate()) {
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(mapError(error.message));
      return;
    }

    router.replace("/");
    router.refresh();
  };

  return (
    <Card className="w-full max-w-md shadow-none border-none">
      <CardHeader className="space-y-2">
        <CardTitle className="text-3xl font-semibold tracking-tight">
          Sign in
        </CardTitle>
        <CardDescription className="text-base">
          Welcome back. Enter your email and password to continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={onSubmit} className="space-y-4" aria-live="polite">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-invalid={!!emailError}
            />
            {emailError && <p className="text-sm text-red-600">{emailError}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => setCapsLockOn((e as any).getModifierState && (e as any).getModifierState("CapsLock"))}
                required
                aria-invalid={!!passwordError}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {capsLockOn && <p className="text-xs text-amber-600">Caps Lock is on</p>}
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Continue"}
          </Button>
        </form>

        <div className="flex items-center gap-4">
          <Separator className="flex-1" />
          <span className="text-sm text-gray-500">or</span>
          <Separator className="flex-1" />
        </div>

        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
