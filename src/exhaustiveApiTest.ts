import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'https://sanyu.cloud/openapi';
const TOKEN = process.env.YOUGE_API_TOKEN;
const APP_CODE = process.env.YOUGE_APP_CODE;
const SCHEMA_CODE = process.env.YOUGE_SCHEMA_CODE;
const BIZ_OBJECT_ID = '9fa21c1f167a4623a5d8740e341e2a2d';

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'X-H3-AppCode': APP_CODE
    }
});

async function runTests() {
    console.log('--- START EXHAUSTIVE API TEST ---');

    const titleCode = 'F00000AXX';
    const statusCode = 'F00000AY1';
    const testTitle = `Test Title ${Date.now()}`;

    const payloads = [
        { name: 'Direct Object (Title)', data: { [titleCode]: testTitle } },
        { name: 'Direct Object (Status)', data: { [statusCode]: 'pending' } },
        { name: 'Nested Data', data: { data: { [titleCode]: testTitle } } },
        { name: 'Nested Controls', data: { controls: { [titleCode]: testTitle } } },
        { name: 'Field Value Style', data: { [titleCode]: { value: testTitle } } }
    ];

    for (const test of payloads) {
        console.log(`\nTesting format: ${test.name}`);
        try {
            const res = await client.patch(`/record/${APP_CODE}/${SCHEMA_CODE}/${BIZ_OBJECT_ID}`, test.data);
            console.log(`HTTP Result for ${test.name}:`, res.status, res.data);
            if (res.data?.data === true) {
                console.log(`SUCCESS with format: ${test.name}`);
                // return;
            }
        } catch (err: any) {
            console.log(`Error for ${test.name}:`, err.response?.status, JSON.stringify(err.response?.data || err.message));
        }
    }

    console.log('\n--- TESTING ALTERNATIVE ENDPOINTS ---');
    const endpoints = [
        `/record/update/${APP_CODE}/${SCHEMA_CODE}/${BIZ_OBJECT_ID}`,
        `/records/${APP_CODE}/${SCHEMA_CODE}/update`,
        `/record/${APP_CODE}/${SCHEMA_CODE}/${BIZ_OBJECT_ID}/update`
    ];

    for (const ep of endpoints) {
        console.log(`\nTesting endpoint: ${ep}`);
        try {
            const res = await client.post(ep, { [titleCode]: testTitle });
            console.log(`Result for ${ep}:`, res.data);
            if (res.data?.data === true) {
                console.log(`SUCCESS with endpoint: ${ep}`);
                return;
            }
        } catch (err: any) {
            console.log(`Error for ${ep}:`, err.response?.data?.errorMessage || err.response?.data || err.message);
        }
    }

    console.log('--- END EXHAUSTIVE API TEST ---');
}

runTests().catch(console.error);
