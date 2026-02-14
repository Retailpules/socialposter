export async function randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    process.stdout.write(`Waiting for ${delay}ms... `);
    return new Promise(resolve => setTimeout(() => {
        console.log('Done.');
        resolve();
    }, delay));
}

export async function simulateTyping(page: any, selector: string, text: string) {
    await page.focus(selector);
    for (const char of text) {
        await page.type(selector, char, { delay: Math.random() * 200 + 50 });
    }
}
