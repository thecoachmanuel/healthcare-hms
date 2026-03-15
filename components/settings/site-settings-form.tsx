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
            <CustomInput type="input" control={form.control} name="homepage_title" label="Homepage Title" placeholder="" />
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
