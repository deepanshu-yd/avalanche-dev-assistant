// Quick test to verify chunks loading
const { readFileSync } = require('fs');
const { join } = require('path');

console.log('Current working directory:', process.cwd());

// Try different path strategies
const strategies = [
  '../data/chunks/chunks.jsonl',
  './data/chunks/chunks.jsonl',
  join(process.cwd(), '../data/chunks/chunks.jsonl'),
  join(__dirname, '../../../data/chunks/chunks.jsonl'),
  '/home/deepanshu/Projects/avalanche-dev-assistant/data/chunks/chunks.jsonl'
];

for (const path of strategies) {
  try {
    const data = readFileSync(path, 'utf-8');
    const lines = data.split('\n').filter(line => line.trim());
    console.log(`✓ Found chunks at: ${path} (${lines.length} chunks)`);

    // Show first chunk
    if (lines.length > 0) {
      const firstChunk = JSON.parse(lines[0]);
      console.log('First chunk preview:', {
        id: firstChunk.id,
        title: firstChunk.title,
        textPreview: firstChunk.text.substring(0, 100) + '...'
      });
    }
    break;
  } catch (error) {
    console.log(`✗ Failed to load from: ${path}`);
  }
}
