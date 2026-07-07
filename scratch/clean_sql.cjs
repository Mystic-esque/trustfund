const fs = require('fs');
const file = 'supabase/migrations/00000_schema_and_rpc.sql';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\\_/g, '_');
content = content.replace(/\\=/g, '=');
content = content.replace(/4\.1 Users Table\*\*/g, '-- 4.1 Users Table');
content = content.replace(/\*\*4\.2 Orders Table\*\*/g, '-- 4.2 Orders Table');
content = content.replace(/\*\*4\.3 Ledger Entries Table \(Immutable Audit Log\)\*\*/g, '-- 4.3 Ledger Entries Table');
content = content.replace(/\*\*4\.4 Webhook Events Table \(Idempotency Store\)\*\*/g, '-- 4.4 Webhook Events Table');
content = content.replace(/\*\*4\.5 Messages Table \(Deal Chat\)\*\*/g, '-- 4.5 Messages Table');
content = content.replace(/\*\*4\.6 Indexes\*\*/g, '-- 4.6 Indexes');
content = content.replace(/\*\*5\\\. Order State Machine\*\*/g, '-- 5. Order State Machine');
content = content.replace(/\*\*/g, '--');
content = content.replace(/\\--/g, '--');

fs.writeFileSync(file, content);
console.log('Sanitized SQL file');
