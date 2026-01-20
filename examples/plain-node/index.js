/**
 * DevInsight - Plain Node.js Example
 * 
 * This example demonstrates DevInsight's error tracking and analysis.
 */

const { DevInsight } = require('devinsight');

// Enable DevInsight with default config
DevInsight.enable();

// Watch variables  
let user = { name: 'John', role: 'admin' };
DevInsight.watch('user', user);

// Simulate some async operations
async function fetchUserData(userId) {
    console.log(`Fetching data for user ${userId}...`);

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return { id: userId, email: `user${userId}@example.com` };
}

async function processUser(userId) {
    console.log('Starting user processing...');

    const userData = await fetchUserData(userId);

    // Update watched variable
    user = { ...user, ...userData };
    DevInsight.updateWatch('user', user);

    // This will cause an error - accessing property on undefined
    // DevInsight will detect this and provide intelligent analysis
    const result = userData.profile.settings.theme;

    return result;
}

// Main execution
async function main() {
    try {
        await processUser(123);
    } catch (error) {
        console.log('✓ Expected error was caught');
    }

    // Trigger an unhandled error to see DevInsight in action
    setTimeout(() => {
        processUser(456);  // This will cause unhandled rejection
    }, 200);
}

main();
