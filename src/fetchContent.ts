import { fetchPendingContent } from './utils/yougeApi';

async function main() {
    const content = await fetchPendingContent();
    if (content) {
        console.log('Content fetched:', JSON.stringify(content, null, 2));
        // You can use this for debugging
    }
}

if (require.main === module) {
    main().catch(console.error);
}

export { fetchPendingContent };
