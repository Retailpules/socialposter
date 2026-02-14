import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs-extra';
import * as path from 'path';

dotenv.config();

const BASE_URL = 'https://sanyu.cloud/openapi';
const TOKEN = process.env.YOUGE_API_TOKEN;
const APP_CODE = process.env.YOUGE_APP_CODE;
const ENGINE_CODE = 'c00000000000s4-0'; // From SOP/Token
const SCHEMA_CODE = process.env.YOUGE_SCHEMA_CODE;

const fieldMapPath = path.join(__dirname, '../../config/youge_field_map.json');

export interface YougeRecord {
    id: string;
    [key: string]: any;
}

export async function getFieldCode(displayName: string): Promise<string> {
    if (await fs.pathExists(fieldMapPath)) {
        const map = await fs.readJson(fieldMapPath);
        return map[displayName] || displayName;
    }
    return displayName;
}

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'X-H3-AppCode': APP_CODE,
        'X-H3-EngineCode': ENGINE_CODE
    }
});

export async function fetchPendingContent(): Promise<YougeRecord | null> {
    const statusField = await getFieldCode('Status');
    const scheduledTimeField = await getFieldCode('ScheduledTime');

    const payload = {
        offset: 0,
        limit: 1,
        filters: [
            {
                code: statusField,
                operator: 'equal',
                value: ['pending']
            }
        ],
        sorts: [
            {
                code: scheduledTimeField,
                sortType: 0 // Ascending
            }
        ]
    };

    console.log(`Fetching pending content from ${APP_CODE}/${SCHEMA_CODE}...`);
    try {
        const response = await client.post(`/records/${APP_CODE}/${SCHEMA_CODE}`, payload);
        const records = response.data?.data?.records || [];

        if (records.length === 0) {
            console.log('No pending content found.');
            return null;
        }

        const record = records[0];

        // Check if ScheduledTime <= current time
        const scheduledTime = record[scheduledTimeField];
        if (scheduledTime && new Date(scheduledTime) > new Date()) {
            console.log('Found pending content but it is not yet scheduled for release.');
            return null;
        }

        return record;
    } catch (error: any) {
        console.error('Error fetching content:', error.response?.data || error.message);
        throw error;
    }
}

export async function updateRecordStatus(bizObjectId: string, data: Record<string, any>): Promise<void> {
    const payload: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
        const code = await getFieldCode(key);
        payload[code] = value;
    }

    console.log(`Updating record ${bizObjectId} with ${JSON.stringify(payload)}...`);
    try {
        const response = await client.patch(`/record/${APP_CODE}/${SCHEMA_CODE}/${bizObjectId}`, payload);
        if (response.data?.data !== true) {
            console.warn('Update might have failed:', response.data);
        }
    } catch (error: any) {
        console.error('Error updating status:', error.response?.data || error.message);
        throw error;
    }
}
