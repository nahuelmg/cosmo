import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "always",
  localeDetection: false,
  pathnames: {
    "/": "/",
    "/people": { es: "/personas", en: "/people" },
    "/people/[slug]": { es: "/personas/[slug]", en: "/people/[slug]" },
    "/research": { es: "/investigacion", en: "/research" },
    "/publications": { es: "/publicaciones", en: "/publications" },
    "/journal-club": { es: "/journal-club", en: "/journal-club" },
    "/outreach": { es: "/divulgacion", en: "/outreach" },
    "/contact": { es: "/contacto", en: "/contact" },
  },
});
