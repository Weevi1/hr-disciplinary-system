import Logger from 'logger';
// frontend/src/utils/newsApi.ts
// 📰 Real News Data - Final version using DOMParser to fix browser compatibility

import axios from 'axios'; // This can be removed if not used elsewhere

// --- TYPE DEFINITION ---
interface NewsItem {
  id: string;
  title: string;
  summary: string;
  hashtags: string[];
  time: string;
  priority: 'high' | 'medium' | 'low';
  source?: string;
  url?: string;
}

// --- SECURE API CONFIGURATION (VITE) ---
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const NEWS_BASE_URL = 'https://newsapi.org/v2';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';


// --- HELPER FUNCTIONS ---

const formatTimeAgo = (dateString: string | undefined): string => {
  if (!dateString) return 'recently';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  let interval = seconds / 86400; if (interval > 1) return `${Math.floor(interval)}d ago`;
  interval = seconds / 3600; if (interval > 1) return `${Math.floor(interval)}h ago`;
  interval = seconds / 60; if (interval > 1) return `${Math.floor(interval)}m ago`;
  return `Just now`;
};

const determinePriority = (title: string): 'high' | 'medium' | 'low' => {
  const lowercasedTitle = title.toLowerCase();
  if (lowercasedTitle.includes('strike') || lowercasedTitle.includes('protest')) return 'high';
  if (lowercasedTitle.includes('load shedding') || lowercasedTitle.includes('traffic')) return 'medium';
  return 'low';
};

const generateHashtags = (title: string): string[] => {
    const tags = new Set<string>();
    const lowercasedTitle = title.toLowerCase();
    if (lowercasedTitle.includes('taxi')) tags.add('#taxistrike');
    if (lowercasedTitle.includes('load shedding')) tags.add('#loadshedding');
    if (lowercasedTitle.includes('transport')) tags.add('#transport');
    if (lowercasedTitle.includes('cape town')) tags.add('#capetown');
    if (tags.size === 0) tags.add('#localnews');
    return Array.from(tags);
};


// --- API FUNCTIONS ---

/**
 * 🔍 Searches NewsAPI using a CORS proxy.
 */
export const getNewsByKeywords = async (keywords: string[]): Promise<NewsItem[]> => {
  if (!NEWS_API_KEY) throw new Error('News API key is not configured.');
  
  const newsApiUrl = `${NEWS_BASE_URL}/everything?q=${encodeURIComponent(keywords.map(k => `"${k}"`).join(' OR '))}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`;
  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(newsApiUrl)}`;

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`Proxy/API responded with status ${response.status}`);
    const data = await response.json();
    if (data.status !== 'ok') throw new Error(data.message || 'News API returned an error.');

    return data.articles.map((article: any): NewsItem => ({
      id: article.url,
      title: article.title,
      summary: article.description?.substring(0, 150) + '...' || 'No summary.',
      hashtags: generateHashtags(article.title),
      time: formatTimeAgo(article.publishedAt),
      priority: determinePriority(article.title),
      url: article.url,
      source: article.source.name,
    })).sort((a, b) => {
      const p = { high: 3, medium: 2, low: 1 };
      return p[b.priority] - p[a.priority];
    }).slice(0, 5);

  } catch (error) {
    Logger.error('News API fetch failed through proxy:', error)
    return []; // Return empty array on failure to allow fallback to RSS
  }
};


/**
 * 🔄 Fetches and parses RSS using the browser's built-in DOMParser.
 */
export const getCapeNewsFromRSS = async (): Promise<NewsItem[]> => {
  const rssFeedUrl = 'https://www.news24.com/tags/topics/cape-town/rss';
  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(rssFeedUrl)}`;

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`RSS feed fetch failed with status ${response.status}`);
    
    const xmlString = await response.text();
    const domParser = new window.DOMParser();
    const doc = domParser.parseFromString(xmlString, "application/xml");
    
    // Check for parsing errors
    if (doc.getElementsByTagName("parsererror").length) {
      throw new Error("Failed to parse RSS feed XML.");
    }
    
    const items = Array.from(doc.querySelectorAll("item")).slice(0, 5);

    return items.map((item): NewsItem => {
      const title = item.querySelector("title")?.textContent || "No title";
      const link = item.querySelector("link")?.textContent || Date.now().toString();
      const description = item.querySelector("description")?.textContent || "No summary.";
      const pubDate = item.querySelector("pubDate")?.textContent;

      return {
        id: link,
        title: title,
        summary: description.replace(/<[^>]*>/g, '').substring(0, 150) + '...',
        hashtags: generateHashtags(title),
        time: formatTimeAgo(pubDate),
        priority: determinePriority(title),
        url: link,
        source: "News24 RSS",
      };
    });

  } catch (error) {
    Logger.error('RSS News fetch failed:', error)
    // Throw the final error to be caught by the component
    throw new Error('Could not fetch news from backup RSS feed.');
  }
};