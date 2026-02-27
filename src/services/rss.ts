import { DatabaseService } from "./database";
import { getEnvConfig } from "../config/env";
import type { Post, RSSItem, ParsedPost, RSSProcessResult } from "../types";

export class RSSService {
  private readonly TIMEOUT: number;
  private readonly USER_AGENT: string;

  constructor(private dbService: DatabaseService) {
    const config = getEnvConfig();
    this.TIMEOUT = config.RSS_TIMEOUT;
    this.USER_AGENT = config.RSS_USER_AGENT;
  }

  /**
   * 获取代理配置（从数据库）
   */
  private getProxy(): string | undefined {
    const config = this.dbService.getBaseConfig();
    return config?.rss_proxy || undefined;
  }

  /**
   * 获取 RSS 配置（从数据库）
   */
  private getRSSConfig(): { url: string; intervalSeconds: number } {
    const config = this.dbService.getBaseConfig();
    return {
      url: config?.rss_url || "https://rss.nodeseek.com/",
      intervalSeconds: config?.rss_interval_seconds || 60,
    };
  }

  /**
   * 从 XML 文本中提取标签内容
   */
  private extractTagContent(xml: string, tagName: string): string {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, "i");
    const match = xml.match(regex);
    return match ? match[1].trim() : "";
  }

  /**
   * 从 XML 文本中提取 CDATA 内容
   */
  private extractCDATA(text: string): string {
    const cdataMatch = text.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
    return cdataMatch ? cdataMatch[1] : text;
  }

  /**
   * 解析 RSS XML 数据
   */
  private parseRSSXML(xmlText: string): RSSItem[] {
    try {
      // 提取所有 <item> 元素
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
      const items: RSSItem[] = [];
      let match;

      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemXML = match[1];

        // 提取各个字段
        const title = this.extractCDATA(
          this.extractTagContent(itemXML, "title"),
        );
        const link = this.extractTagContent(itemXML, "link");
        const pubDate = this.extractTagContent(itemXML, "pubDate");
        const creator = this.extractCDATA(
          this.extractTagContent(itemXML, "dc:creator"),
        );
        const category = this.extractCDATA(
          this.extractTagContent(itemXML, "category"),
        );
        const description = this.extractCDATA(
          this.extractTagContent(itemXML, "description"),
        );
        const content = this.extractCDATA(
          this.extractTagContent(itemXML, "content:encoded") || description,
        );
        const guid = this.extractTagContent(itemXML, "guid") || link;

        // 创建清理后的摘要
        let contentSnippet = description.replace(/<[^>]*>/g, "").trim();
        if (contentSnippet.length > 200) {
          contentSnippet = contentSnippet.substring(0, 200) + "...";
        }

        items.push({
          title,
          link,
          pubDate,
          creator,
          category,
          contentSnippet,
          content,
          guid,
        });
      }

      return items;
    } catch (error) {
      console.error("RSS XML 解析失败:", error);
      throw new Error(`RSS XML 解析失败: ${error}`);
    }
  }

  /**
   * 抓取并解析 RSS 数据
   */
  async fetchAndParseRSS(): Promise<RSSItem[]> {
    let controller: AbortController | undefined;
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      const rssConfig = this.getRSSConfig();
      console.log("开始抓取 RSS 数据...");
      console.log(`RSS URL: ${rssConfig.url}`);
      console.log(`超时设置: ${this.TIMEOUT}ms`);
      const proxy = this.getProxy();
      if (proxy) {
        console.log(`使用代理: ${proxy}`);
      }

      controller = new AbortController();
      timeoutId = setTimeout(() => {
        console.log("RSS 请求超时，正在终止...");
        controller?.abort();
      }, this.TIMEOUT);

      // 构建 fetch 选项
      const fetchOptions: RequestInit = {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Sec-Ch-Ua":
            '"Microsoft Edge";v="139", "Chromium";v="139", "Not=A?Brand";v="8"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          DNT: "1",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      };

      // 如果配置了代理，添加代理选项
      if (proxy) {
        (fetchOptions as any).proxy = proxy;
      }

      const response = await fetch(rssConfig.url, fetchOptions);

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log("RSS 响应接收成功，开始解析...");
      const xmlText = await response.text();
      console.log(`接收到 XML 数据，长度: ${xmlText.length} 字符`);

      const items = this.parseRSSXML(xmlText);

      if (!items || items.length === 0) {
        console.log("RSS 数据为空");
        return [];
      }

      console.log(`成功抓取到 ${items.length} 条 RSS 数据`);
      return items;
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // 处理不同类型的错误
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.error(
            `RSS 请求超时 (${this.TIMEOUT}ms)，可能是网络连接慢或服务器响应慢`,
          );
          throw new Error(`RSS 请求超时，请检查网络连接或增加超时时间`);
        } else if (error.message.includes("fetch")) {
          console.error("RSS 网络请求失败:", error.message);
          throw new Error(`RSS 网络请求失败: ${error.message}`);
        }
      }

      console.error("RSS 抓取失败:", error);
      throw new Error(`RSS 抓取失败: ${error}`);
    }
  }

  /**
   * 从链接中提取 post_id
   */
  private extractPostId(link: string): number | null {
    try {
      // NodeSeek 的链接格式通常是 https://www.nodeseek.com/post-{id}-1
      const match = link.match(/post-(\d+)-/);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }

      // 备用方案：从 URL 参数中提取
      const url = new URL(link);
      const id = url.searchParams.get("id");
      if (id) {
        return parseInt(id, 10);
      }

      return null;
    } catch (error) {
      console.error("提取 post_id 失败:", error);
      return null;
    }
  }

  /**
   * 清洗和格式化数据
   */
  private cleanAndFormatData(item: RSSItem): ParsedPost | null {
    const postId = this.extractPostId(item.link);
    if (!postId) {
      console.warn("无法提取 post_id:", item.link);
      return null;
    }

    // 清洗标题
    const title = item.title.trim().replace(/\s+/g, " ");

    // 清洗内容摘要
    let memo = item.contentSnippet || item.content || "";
    memo = memo.replace(/<[^>]*>/g, ""); // 移除 HTML 标签
    memo = memo.trim().replace(/\s+/g, " ");
    memo = memo.substring(0, 500); // 限制长度

    // 清洗分类
    const category = item.category ? item.category.trim() : "";

    // 清洗创建者
    const creator = item.creator ? item.creator.trim() : "";

    // 格式化发布时间
    let pubDate: string;
    try {
      const date = new Date(item.pubDate);
      if (isNaN(date.getTime())) {
        pubDate = new Date().toISOString();
      } else {
        pubDate = date.toISOString();
      }
    } catch (error) {
      pubDate = new Date().toISOString();
    }

    return {
      post_id: postId,
      title,
      memo,
      category,
      creator,
      pub_date: pubDate,
    };
  }

  /**
   * 处理新的 RSS 数据 - 优化版本，批量查询减少数据库访问
   */
  async processNewRSSData(): Promise<RSSProcessResult> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`开始第 ${attempt} 次尝试获取 RSS 数据...`);

        const rssItems = await this.fetchAndParseRSS();

        let processed = 0;
        let newPosts = 0;
        let errors = 0;

        // 第一步：批量解析所有RSS项目
        const parsedPosts: ParsedPost[] = [];
        const postIds: number[] = [];

        for (const item of rssItems) {
          try {
            processed++;

            const parsedPost = this.cleanAndFormatData(item);
            if (!parsedPost) {
              errors++;
              continue;
            }

            parsedPosts.push(parsedPost);
            postIds.push(parsedPost.post_id);
          } catch (error) {
            errors++;
            console.error("解析单条 RSS 数据失败:", error);
          }
        }

        // 第二步：批量查询已存在的文章
        const existingPosts = this.dbService.getPostsByPostIds(postIds);
        console.log(`批量查询完成: 找到 ${existingPosts.size} 个已存在的文章`);

        // 第三步：筛选出需要创建的新文章
        const newPostsToCreate = parsedPosts.filter((parsedPost) => {
          if (existingPosts.has(parsedPost.post_id)) {
            console.log(`文章已存在: ${parsedPost.post_id}`);
            return false;
          }
          return true;
        });

        // 第四步：批量创建新文章
        if (newPostsToCreate.length > 0) {
          try {
            const postsWithDefaults = newPostsToCreate.map((post) => ({
              ...post,
              push_status: 0, // 默认未推送（等待匹配）
            }));

            const createdCount =
              this.dbService.batchCreatePosts(postsWithDefaults);
            newPosts = createdCount;

            console.log(`批量创建完成: 成功创建 ${createdCount} 篇新文章`);

            // 记录创建的文章详情
            newPostsToCreate.forEach((post) => {
              console.log(`新增文章: ${post.title} (ID: ${post.post_id})`);
            });
          } catch (error) {
            errors += newPostsToCreate.length;
            console.error("批量创建文章失败:", error);
          }
        } else {
          console.log("没有新文章需要创建");
        }

        console.log(
          `RSS 处理完成: 处理 ${processed} 条，新增 ${newPosts} 条，错误 ${errors} 条`,
        );

        return {
          new: newPosts,
          updated: 0, // RSS 服务不更新现有文章
          skipped: processed - newPosts - errors,
        };
      } catch (error) {
        lastError = error as Error;
        console.error(`第 ${attempt} 次尝试失败:`, error);

        if (attempt < maxRetries) {
          const delayMs = attempt * 2000; // 递增延迟：2s, 4s, 6s
          console.log(`等待 ${delayMs}ms 后重试...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    // 所有重试都失败了
    console.error(
      `RSS 处理失败，已尝试 ${maxRetries} 次，最后错误:`,
      lastError,
    );
    throw lastError || new Error("RSS 处理失败，已达到最大重试次数");
  }

  /**
   * 获取最新的文章数据（用于测试）
   */
  getLatestPosts(limit: number = 5): Post[] {
    return this.dbService.getRecentPosts(limit);
  }

  /**
   * 手动触发 RSS 更新
   */
  async manualUpdate(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const result = await this.processNewRSSData();
      return {
        success: true,
        message: `RSS 更新成功`,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: `RSS 更新失败: ${error}`,
      };
    }
  }

  /**
   * 验证 RSS 源是否可访问（使用数据库配置的 URL）
   */
  async validateRSSSource(): Promise<{ accessible: boolean; message: string }> {
    const rssConfig = this.getRSSConfig();
    return this.validateRSSUrl(rssConfig.url);
  }

  /**
   * 验证指定 RSS URL 是否可访问
   */
  async validateRSSUrl(url: string): Promise<{ accessible: boolean; message: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const fetchOptions: RequestInit = {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Sec-Ch-Ua":
            '"Microsoft Edge";v="139", "Chromium";v="139", "Not=A?Brand";v="8"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          DNT: "1",
        },
      };

      // 如果配置了代理，添加代理选项
      const proxy = this.getProxy();
      if (proxy) {
        (fetchOptions as any).proxy = proxy;
      }

      const response = await fetch(url, fetchOptions);

      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          accessible: true,
          message: "RSS 源可正常访问",
        };
      } else {
        return {
          accessible: false,
          message: `RSS 源访问失败: HTTP ${response.status}`,
        };
      }
    } catch (error) {
      return {
        accessible: false,
        message: `RSS 源访问失败: ${error}`,
      };
    }
  }

  /**
   * 获取当前 RSS 配置
   */
  getRSSConfigFromDB(): { url: string; intervalSeconds: number } {
    return this.getRSSConfig();
  }
}
