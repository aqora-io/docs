// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://docs.aqora.io",
  integrations: [
    starlight({
      title: "aqora docs",
      logo: {
        light: "./src/assets/logo.svg",
        dark: "./src/assets/logo-dark.svg",
        replacesTitle: true,
        alt: "aqora",
      },
      favicon: "/favicon.png",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/aqora-io/cli",
        },
      ],
      customCss: [
        "@fontsource/inter/400.css",
        "@fontsource/inter/600.css",
        "@fontsource/poppins/500.css",
        "@fontsource/poppins/600.css",
        "./src/styles/custom.css",
      ],
      expressiveCode: {
        styleOverrides: { borderRadius: "0.5rem" },
      },
      sidebar: [
        {
          label: "Getting started",
          items: [
            { label: "Installation", slug: "getting-started/installation" },
            { label: "Authentication", slug: "getting-started/authentication" },
          ],
        },
        {
          label: "QPU library",
          items: [
            { label: "Running circuits", slug: "qpu" },
            { label: "Framework backends", slug: "qpu/frameworks" },
          ],
        },
        {
          label: "Storage",
          items: [
            { label: "Object storage", slug: "storage" },
            { label: "Key-value store", slug: "storage/kv" },
          ],
        },
        {
          label: "Workspace apps",
          items: [{ label: "Viewer login", slug: "workspaces/viewer-login" }],
        },
        {
          label: "Integrations",
          items: [{ label: "MCP server", slug: "mcp" }],
        },
      ],
    }),
  ],
});
