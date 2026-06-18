/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />

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
