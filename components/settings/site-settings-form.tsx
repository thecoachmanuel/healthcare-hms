"use client";

import { setSiteSettings } from "@/app/actions/admin";
import { CustomInput } from "@/components/custom-input";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function SiteSettingsForm({ initial }: { initial: any }) {
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [authImageFile, setAuthImageFile] = useState<File | null>(null);
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      site_name: initial?.site_name ?? "Healthcare HMS",
      site_title: initial?.site_title ?? "",
      logo_url: initial?.logo_url ?? "",
      homepage_title_highlight: initial?.homepage_title_highlight ?? "",
      auth_image_url: initial?.auth_image_url ?? "",
      homepage_title: initial?.homepage_title ?? "Modern Hospital Management, Simplified",
      homepage_subtitle: initial?.homepage_subtitle ?? "",
      homepage_text:
        initial?.homepage_text ??
        "Streamline appointments, clinical documentation, lab workflows, billing, and inpatient care in one secure system. Built for frontline teams and administrators to work faster, reduce errors, and deliver better patient outcomes.",
    },
  });

  const onSubmit = async (values: any) => {
    try {
      setLoading(true);
      let logo_url = values.logo_url;
      if (logoFile) {
        logo_url = await uploadToCloudinary(logoFile, "hms/site");
      }

      let auth_image_url = values.auth_image_url;
      if (authImageFile) {
        auth_image_url = await uploadToCloudinary(authImageFile, "hms/auth");
      }

      const res = await setSiteSettings({
        site_name: values.site_name,
        site_title: values.site_title,
        logo_url,
        homepage_title_highlight: values.homepage_title_highlight,
        auth_image_url,
        homepage_title: values.homepage_title,
        homepage_subtitle: values.homepage_subtitle,
        homepage_text: values.homepage_text,
      });
      if (res.success) {
        toast.success(res.msg);
        router.refresh();
      }
      else toast.error(res.msg);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="capitalize">Site Settings</CardTitle>
          <CardDescription>Update site name, logo, auth image, and homepage text.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CustomInput type="input" control={form.control} name="site_name" label="Site Name" placeholder="" />
            <CustomInput type="input" control={form.control} name="site_title" label="Site Title" placeholder="" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomInput type="input" control={form.control} name="homepage_title" label="Homepage Title (Top)" placeholder="" />
              <CustomInput type="input" control={form.control} name="homepage_title_highlight" label="Homepage Title Highlight (Blue)" placeholder="" />
            </div>

            <div className="rounded-lg border p-4 bg-gray-50">
              <p className="text-sm text-gray-600 mb-2">Homepage Preview</p>
              <div className="flex flex-col items-center gap-3 mb-4">
                {Boolean((form.watch("logo_url") || "").trim()) && (
                  <Image
                    src={(form.watch("logo_url") || "").trim()}
                    alt={(form.watch("site_name") || "Healthcare HMS").trim()}
                    width={220}
                    height={48}
                    unoptimized
                    loader={({ src }) => src}
                    className="h-12 w-auto"
                  />
                )}
                <div className="text-3xl md:text-4xl font-bold leading-tight text-center">
                  <span className="block">{form.watch("homepage_title") || "Modern Hospital Management,"}</span>
                  {(form.watch("homepage_title_highlight") || "Simplified").trim() ? (
                    <span className="block text-blue-600">{(form.watch("homepage_title_highlight") || "Simplified").trim()}</span>
                  ) : null}
                </div>
                {Boolean((form.watch("homepage_subtitle") || "").trim()) && (
                  <p className="text-center text-gray-600">{(form.watch("homepage_subtitle") || "").trim()}</p>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-700 max-w-2xl mx-auto text-center">
                {(form.watch("homepage_text") ||
                  "Streamline appointments, clinical documentation, lab workflows, billing, and inpatient care in one secure system.") as string}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-logo">Site logo</Label>
              <Input
                id="site-logo"
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <CustomInput type="input" control={form.control} name="logo_url" label="Logo URL" placeholder="" />
            <div className="space-y-2">
              <Label htmlFor="auth-image">Auth page image</Label>
              <Input
                id="auth-image"
                type="file"
                accept="image/*"
                onChange={(e) => setAuthImageFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <CustomInput type="input" control={form.control} name="auth_image_url" label="Auth Image URL" placeholder="" />
            <CustomInput type="input" control={form.control} name="homepage_subtitle" label="Homepage Subtitle" placeholder="" />
            <CustomInput type="textarea" control={form.control} name="homepage_text" label="Homepage Text" placeholder="" />
            <Button type="submit" disabled={loading} className="bg-blue-600">
              {loading ? "Saving..." : "Save"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </>
  );
}
