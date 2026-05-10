#!/usr/bin/env node
// Run: node scripts/generate-vapid.mjs
// Copy output into Coolify environment variables
import webpush from 'web-push';
const keys = webpush.generateVAPIDKeys();
console.log('VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
