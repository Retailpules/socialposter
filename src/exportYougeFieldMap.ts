import { chromium } from 'playwright';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const URL = `https://sanyu.cloud/ug/ug-pc-app-polymer/app/${process.env.YOUGE_APP_CODE}/${process.env.YOUGE_SCHEMA_CODE}/${process.env.YOUGE_VIEW_ID}`;
const TOKEN = process.env.YOUGE_API_TOKEN;

async function exportFieldMap() {
    console.log('Starting Field Mapping Tool...');
    console.log(`URL: ${URL}`);

    const browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' }); // Headless by default for automation
    const context = await browser.newContext();

    // Try to set token in local storage or cookies if possible
    // Note: Sanyu usually uses Bearer token in headers, but for the UI it uses session/cookies

    const page = await context.newPage();

    let fieldMap: Record<string, string> = {};

    page.on('response', async (response) => {
        const url = response.url();
        // Sanyu/Youge often uses /v3/control or /v3/schema for field definitions
        if (url.includes('/v3/control') || url.includes('/v3/schema') || url.includes('/v3/app')) {
            try {
                const json = await response.json();
                console.log(`Intercepted response from: ${url}`);

                // Logic to extract fields from Youge response
                // This will need adjustment based on the actual response structure
                // Usually it's in data.fields or data.controls
                const fields = json.data?.fields || json.data?.controls || json.data?.schema?.fields;

                if (fields && Array.isArray(fields)) {
                    fields.forEach((f: any) => {
                        const name = f.displayName || f.name || f.display_name;
                        const code = f.code || f.fieldCode || f.field_code;
                        if (name && code) {
                            fieldMap[name] = code;
                        }
                    });
                    console.log(`Extracted ${Object.keys(fieldMap).length} fields.`);
                }
            } catch (e) {
                // Not a JSON response or other error
            }
        }
    });

    await page.goto(URL);

    console.log('Please log in if necessary. Waiting for field definitions...');

    // Wait for the map to be populated or a timeout
    // We'll give it 60 seconds of waiting
    for (let i = 0; i < 60; i++) {
        if (Object.keys(fieldMap).length > 0) {
            // Keep waiting a bit more to catch all fragments if paginated
            await page.waitForTimeout(2000);
        } else {
            await page.waitForTimeout(1000);
        }
    }

    if (Object.keys(fieldMap).length > 0) {
        const configPath = path.join(__dirname, '../config/youge_field_map.json');
        await fs.ensureDir(path.dirname(configPath));
        await fs.writeJson(configPath, fieldMap, { spaces: 2 });
        console.log(`Field mapping saved to: ${configPath}`);
        console.log('Mapping results:');
        console.log(JSON.stringify(fieldMap, null, 2));
    } else {
        console.error('Failed to extract field mapping. Please check the network tab and adjust the script filters.');
    }

    await browser.close();
}

exportFieldMap().catch(console.error);
