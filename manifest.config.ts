import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: pkg.extension_name,
  description: pkg.extension_description,
  version: pkg.version,
  icons: {
    16: "public/icon16.png",
    32: "public/icon32.png",
    48: "public/icon48.png",
    128: "public/icon128.png",
  },
  permissions: ["sidePanel", "activeTab", "scripting"],
  host_permissions: ["<all_urls>"],
  action: {
    default_title: pkg.extension_name,
  },
  background: {
    service_worker: "src/background.ts",
  },
  side_panel: {
    default_path: "src/sidepanel/index.html",
  },
});
