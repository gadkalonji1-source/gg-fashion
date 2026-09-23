import { writeFileSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

function readBuildEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  return (process.env[name] ?? "").trim().replace(/^['"]|['"]$/g, "");
}

let supabaseUrl = readBuildEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = readBuildEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
if (supabaseUrl && !/^https?:\/\//i.test(supabaseUrl)) {
  supabaseUrl = `https://${supabaseUrl}`;
}
supabaseUrl = supabaseUrl.replace(/\/+$/, "");

writeFileSync(
  path.join(__dirname, "src/lib/supabase-public-env.ts"),
  `/* Generated at build start from process.env.NEXT_PUBLIC_SUPABASE_URL and process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY. */\nexport const EMBEDDED_SUPABASE_URL = ${JSON.stringify(supabaseUrl)};\nexport const EMBEDDED_SUPABASE_ANON_KEY = ${JSON.stringify(supabaseAnonKey)};\n`,
);

const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : "(missing)";
console.log(`[supabase] NEXT_PUBLIC_SUPABASE_URL host: ${supabaseHost}`);
console.log(
  `[supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "present" : "missing"}`,
);

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
