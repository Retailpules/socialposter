import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'https://sanyu.cloud/openapi';
const TOKEN = process.env.YOUGE_API_TOKEN;
const APP_CODE = process.env.YOUGE_APP_CODE;
const SCHEMA_CODE = process.env.YOUGE_SCHEMA_CODE;

async function inspect() {
    const client = axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        }
    });

    const payload = {
        offset: 0,
        limit: 1,
        filters: [],
        sorts: []
    };

    try {
        console.log(`Fetching records from ${APP_CODE}/${SCHEMA_CODE}...`);
        const response = await client.post(`/records/${APP_CODE}/${SCHEMA_CODE}`, payload);
        if (response.data?.data?.records?.length > 0) {
            const record = response.data.data.records[0];
            const fs = require('fs-extra');
            const path = require('path');
            const outputPath = path.join(__dirname, '../config/sample_record.json');
            fs.writeJsonSync(outputPath, record, { spaces: 2 });
            console.log(`Full record saved to: ${outputPath}`);
        } else {
            console.log('No records found.');
        }
    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

inspect();
