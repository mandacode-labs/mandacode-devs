/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />

declare module "lucide/dist/esm/createElement.mjs" {
  const createElement: (
    iconNode: [string, Record<string, string | number>][],
    customAttrs?: Record<string, string | number>,
  ) => SVGSVGElement;
  export default createElement;
}

declare module "lucide/dist/esm/icons/copy.mjs" {
  const Copy: [string, Record<string, string | number>][];
  export default Copy;
}

declare module "lucide/dist/esm/icons/check.mjs" {
  const Check: [string, Record<string, string | number>][];
  export default Check;
}

declare global {
  namespace App {
    interface Locals {
      user: {
        email: string;
      } | null;
    }
  }
}

export {};
