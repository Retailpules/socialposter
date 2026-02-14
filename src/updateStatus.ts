import { updateRecordStatus } from './utils/yougeApi';

async function main(bizObjectId: string, status: string, errorMessage?: string) {
    const data: any = {
        'Status': status,
        'PublishedTime': status === 'posted' ? new Date().toISOString() : undefined,
        'ErrorMessage': errorMessage
    };
    await updateRecordStatus(bizObjectId, data);
}

if (require.main === module) {
    // Usage: ts-node src/updateStatus.ts <id> <status> [error]
    const [, , id, status, error] = process.argv;
    if (id && status) {
        main(id, status, error).catch(console.error);
    }
}

export { updateRecordStatus };
