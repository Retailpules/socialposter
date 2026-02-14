import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'https://sanyu.cloud/openapi';
const TOKEN = process.env.YOUGE_API_TOKEN;
const APP_CODE = process.env.YOUGE_APP_CODE;
const SCHEMA_CODE = process.env.YOUGE_SCHEMA_CODE;
const BIZ_OBJECT_ID = '9fa21c1f167a4623a5d8740e341e2a2d';

async function test() {
    console.log('--- FINAL API TEST v2 ---');

    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'X-H3-AppCode': APP_CODE,
        'X-H3-EngineCode': 'c00000000000s4-0',
        'X-H3-MemberId': '1079'
    };

    const titleCode = 'F00000AXX';
    const testTitle = `Final Test Title ${Date.now()}`;

    // 1. Try PATCH with ALL HEADERS + Query Param
    try {
        console.log('\n1. Testing PATCH with all headers + AppCode query param');
        const res = await axios.patch(`${BASE_URL}/record/${APP_CODE}/${SCHEMA_CODE}/${BIZ_OBJECT_ID}?AppCode=${APP_CODE}`,
            { [titleCode]: testTitle },
            { headers }
        );
        console.log('PATCH Result:', res.data);
    } catch (err: any) {
        console.log('PATCH Failed:', err.response?.status, err.response?.data || err.message);
    }

    // 2. Try POST with all headers + Query Param
    try {
        console.log('\n2. Testing POST create with all headers + AppCode query param');
        const res = await axios.post(`${BASE_URL}/record/${APP_CODE}/${SCHEMA_CODE}?AppCode=${APP_CODE}`,
            { [titleCode]: 'API_CREATION_TEST' },
            { headers }
        );
        console.log('POST Create Result:', res.data);
    } catch (err: any) {
        console.log('POST Create Failed:', err.response?.status, err.response?.data || err.message);
    }
}

test().catch(console.error);
