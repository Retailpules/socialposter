import { chromium, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs-extra';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { fetchPendingContent, updateRecordStatus } from './utils/yougeApi';
import { randomDelay, simulateTyping } from './utils/randomDelay';

dotenv.config();

const STORAGE_STATE_PATH = path.join(__dirname, '../config/xhs_storage_state.json');
const TEMP_IMG_DIR = path.join(__dirname, '../temp_images');

async function downloadImages(urls: string[]): Promise<string[]> {
    await fs.ensureDir(TEMP_IMG_DIR);
    await fs.emptyDir(TEMP_IMG_DIR);

    const paths: string[] = [];
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i].trim();
        if (!url) continue;

        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const ext = path.extname(new URL(url).pathname) || '.jpg';
            const filePath = path.join(TEMP_IMG_DIR, `img_${i}${ext}`);
            await fs.writeFile(filePath, response.data);
            paths.push(filePath);
            console.log(`Downloaded image ${i + 1}/${urls.length}: ${url}`);
        } catch (e) {
            console.error(`Failed to download image: ${url}`, e);
        }
    }
    return paths;
}

async function publishToXHS(title: string, content: string, imagePaths: string[]) {
    console.log('Starting XHS Publishing process...');

    if (!await fs.pathExists(STORAGE_STATE_PATH)) {
        throw new Error(`Storage state not found at ${STORAGE_STATE_PATH}. Please provide a valid session.`);
    }

    const browser = await chromium.launch({
        headless: process.env.NODE_ENV === 'production',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
        storageState: STORAGE_STATE_PATH,
        viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();

    try {
        console.log('Navigating to XHS Creator Center...');
        await page.goto('https://creator.xiaohongshu.com/publish/publish', { waitUntil: 'networkidle' });

        // Check if logged in
        if (page.url().includes('login')) {
            throw new Error('Not logged in. Storage state might be expired.');
        }

        console.log('Uploading images...');
        // Selector for image upload input
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('.upload-wrapper, .upload-container, .upload-input'); // Click the upload area
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(imagePaths);

        await randomDelay(2000, 5000);

        console.log('Entering title and content...');
        // Selectors might change, using common ones found in similar projects
        const titleSelector = 'input[placeholder*="标题"], .title-input input';
        const contentSelector = '.content-textarea, div[contenteditable="true"], textarea[placeholder*="正文"]';

        await page.waitForSelector(titleSelector);
        await simulateTyping(page, titleSelector, title);

        await randomDelay(1000, 3000);

        await page.waitForSelector(contentSelector);
        await simulateTyping(page, contentSelector, content);

        await randomDelay(3000, 7000);

        console.log('Clicking Publish...');
        const publishBtnSelector = '.publish-btn, button:has-text("发布")';
        await page.click(publishBtnSelector);

        // Wait for success indicator
        console.log('Waiting for success confirmation...');
        await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });

        console.log('Publish successful!');
    } catch (error) {
        console.error('Error during publishing:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

async function main() {
    try {
        const record = await fetchPendingContent();
        if (!record) {
            console.log('No content to publish.');
            return;
        }

        const title = record.Title || record[await import('./utils/yougeApi').then(m => m.getFieldCode('Title'))];
        const content = record.Content || record[await import('./utils/yougeApi').then(m => m.getFieldCode('Content'))];
        const imageUrlsStr = record.ImageURLs || record[await import('./utils/yougeApi').then(m => m.getFieldCode('ImageURLs'))];
        const bizObjectId = record.id;

        if (!title || !content || !imageUrlsStr) {
            throw new Error('Incomplete content data in Youge record.');
        }

        const urls = imageUrlsStr.split(',').map((u: string) => u.trim());
        const imagePaths = await downloadImages(urls);

        if (imagePaths.length === 0) {
            throw new Error('No images could be downloaded.');
        }

        try {
            await publishToXHS(title, content, imagePaths);
            await updateRecordStatus(bizObjectId, { 'Status': 'posted', 'PublishedTime': new Date().toISOString() });
        } catch (postError: any) {
            await updateRecordStatus(bizObjectId, { 'Status': 'failed', 'ErrorMessage': postError.message });
            throw postError;
        } finally {
            // Clean up temp images
            await fs.remove(TEMP_IMG_DIR);
        }

    } catch (error) {
        console.error('Main process failed:', error);
        process.exit(1);
    }
}

main().catch(console.error);
