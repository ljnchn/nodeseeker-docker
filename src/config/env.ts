import { z } from "zod";

// 环境变量验证 schema
const envSchema = z.object({
  // Server
  PORT: z.string().transform(Number).default("3010"),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database
  DATABASE_PATH: z.string().default("./data/nodeseeker.db"),

  // RSS
  RSS_TIMEOUT: z.string().transform(Number).default("30000"),
  RSS_CHECK_ENABLED: z
    .string()
    .transform((val) => val !== "false")
    .default("true"),

  // Telegram (Optional)
  TELEGRAM_WEBHOOK_URL: z.string().url().optional(),

  // CORS
  CORS_ORIGINS: z.string().default("http://localhost:3010"),
});

export type EnvConfig = z.infer<typeof envSchema>;

let cachedConfig: EnvConfig | null = null;

export async function loadEnvConfig(): Promise<EnvConfig> {
  // 强制重新加载配置
  cachedConfig = null;

  try {
    // 尝试加载 .env 文件
    try {
      const envFile = Bun.file(".env");
      if (await envFile.exists()) {
        const envContent = await envFile.text();
        const envLines = envContent.split("\n");

        for (const line of envLines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            const [key, ...valueParts] = trimmed.split("=");
            if (key && valueParts.length > 0) {
              const value = valueParts.join("=").replace(/^["']|["']$/g, "");
              process.env[key.trim()] = value;
            }
          }
        }
      }
    } catch (error) {
      console.warn("无法加载 .env 文件:", error);
    }

    // 验证环境变量
    cachedConfig = envSchema.parse(process.env);

    console.log("环境配置加载成功");
    return cachedConfig;
  } catch (error) {
    console.error("环境配置验证失败:", error);
    throw new Error(`环境配置无效: ${error}`);
  }
}

export function getEnvConfig(): EnvConfig {
  if (!cachedConfig) {
    throw new Error("环境配置未加载，请先调用 loadEnvConfig()");
  }
  return cachedConfig;
}
