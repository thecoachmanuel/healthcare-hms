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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim();
    if (!validate()) {
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email: em,
      password,
      options: {
        data: {
          first_name: fn,
          last_name: ln,
        },
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data.session) {
      toast.success("Check your email to confirm your account.");
      return;
    }

    router.replace("/patient/registration");
    router.refresh();
  };

  return (
    <Card className="w-full max-w-md shadow-none border-none">
      <CardHeader className="space-y-2">
        <CardTitle className="text-3xl font-semibold tracking-tight">
          Create your account
        </CardTitle>
        <CardDescription className="text-base">
          Create an account to access the patient portal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={onSubmit} className="space-y-4" aria-live="polite">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

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
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => setCapsLockOn((e as any).getModifierState && (e as any).getModifierState("CapsLock"))}
                required
                minLength={8}
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
            <p className="text-xs text-gray-600">Use at least 8 characters with letters and numbers</p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Continue"}
          </Button>
        </form>

        <div className="flex items-center gap-4">
          <Separator className="flex-1" />
          <span className="text-sm text-gray-500">or</span>
          <Separator className="flex-1" />
        </div>

        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
