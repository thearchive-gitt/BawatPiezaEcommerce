import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

function loadBackendPublicEnv() {
  const envPath = path.resolve(
    process.cwd(),
    "..",
    "backend",
    ".env",
  );

  if (!fs.existsSync(envPath)) {
    return {};
  }

  const values = Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map(([, key, value]) => [key, value.replace(/^["']|["']$/g, "")]),
  );

  return {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? values.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? values.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ?? values.API_URL ?? "http://localhost:4000",
  };
}

const nextConfig: NextConfig = {
  /* config options here */
  env: loadBackendPublicEnv(),
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
