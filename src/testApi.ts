import { fetchPendingContent, updateRecordStatus } from './utils/yougeApi';
import * as dotenv from 'dotenv';

dotenv.config();

async function testApi() {
    console.log('--- START YOUGE API TEST ---');

    // 1. Test Read
    console.log('Testing Read (fetchPendingContent)...');
    // We'll use a direct call to test connection if fetchPendingContent returns null due to time
    const client = await (await import('./utils/yougeApi')).fetchPendingContent();

    // Fallback: If no record is "due", fetch basically anything to test the PATCH
    // Since we know schema and everything works for POST if we get here (or error)

    const record = client;
    if (!record) {
        console.log('No record currently due. Attempting to fetch ANY record for connectivity test...');
        // Manual axios call to test PATCH on the object ID we know
        const bizObjectId = '9fa21c1f167a4623a5d8740e341e2a2d';
        console.log(`Manually testing write on known ID: ${bizObjectId}`);

        // Try updating Title
        const originalTitle = "北美家庭最近都在换这种户外折叠椅0";
        const newTitle = `北美家庭最近都在换这种户外折叠椅0 (TEST_${Date.now()})`;

        console.log('Trying Title update with fixed headers...');
        try {
            await updateRecordStatus(bizObjectId, { 'Title': newTitle });
            console.log('Update Title success! Reverting...');
            await updateRecordStatus(bizObjectId, { 'Title': originalTitle });
            console.log('Title reverted.');
        } catch (err: any) {
            console.error('Update failed even with headers:', err.response?.data || err.message);
        }

        return;
    }

    console.log(`Success! Found record: ${record.id}`);
    const bizObjectId = record.id;

    // 2. Test Write
    console.log('Testing Write (updateRecordStatus)...');
    try {
        // We update the 'ErrorMessage' as a safe test field
        const testMessage = `API_TEST_SUCCESS_${new Date().toISOString()}`;
        await updateRecordStatus(bizObjectId, { 'ErrorMessage': testMessage });
        console.log('Update call finished.');

        // 3. Verify Write
        console.log('Verifying Write...');
        // We'll use a direct axios call or just fetch again and check the raw record
        // For simplicity, let's just assume if PATCH returned 200/data:true, it worked.
        // But let's verify by re-fetching.
        const updatedRecord = await fetchPendingContent();
        // Note: fetchPendingContent might return the same record if it's still 'pending'

        if (updatedRecord && updatedRecord.id === bizObjectId) {
            // Check the internal code directly for verification because updateRecordStatus uses getFieldCode internally
            const fieldCode = await (await import('./utils/yougeApi')).getFieldCode('ErrorMessage');
            console.log(`Record ${bizObjectId} field ${fieldCode} is now: ${updatedRecord[fieldCode]}`);

            if (updatedRecord[fieldCode] === testMessage) {
                console.log('Verification SUCCESS: Record was updated correctly.');
            } else {
                console.warn('Verification FAILED: Map might be wrong or update didn\'t stick.');
            }

            // Cleanup: Clear the test message
            console.log('Cleaning up test message...');
            await updateRecordStatus(bizObjectId, { 'ErrorMessage': '' });
        }

    } catch (e) {
        console.error('API Test Failed during Write phase:', e);
    }

    console.log('--- END YOUGE API TEST ---');
}

testApi().catch(console.error);
