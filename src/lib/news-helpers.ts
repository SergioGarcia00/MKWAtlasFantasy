'use server';

import path from 'path';
import fs from 'fs/promises';

const NEWS_PATH = path.join(process.cwd(), 'src', 'data', 'news.json');
const MAX_NEWS_ITEMS = 100;

async function getNews(): Promise<any[]> {
    try {
        const fileContent = await fs.readFile(NEWS_PATH, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

export async function addNewsItem(message: string) {
    try {
        const news = await getNews();
        const newNewsItem = {
            id: `news-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            message,
        };

        const updatedNews = [newNewsItem, ...news].slice(0, MAX_NEWS_ITEMS);
        await fs.writeFile(NEWS_PATH, JSON.stringify(updatedNews, null, 2), 'utf-8');
    } catch (error) {
        console.error("Failed to add news item:", error);
        // Fail silently in production so it doesn't break the core functionality
    }
}
