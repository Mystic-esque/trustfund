const fs = require('fs');
const file = 'supabase/migrations/00000_schema_and_rpc.sql';
let content = fs.readFileSync(file, 'utf8');

// Clean up markdown artifacts
content = content.replace(/\\_/g, '_');
content = content.replace(/\\=/g, '=');
content = content.replace(/\\\+/g, '+');
content = content.replace(/\\-/g, '-');
content = content.replace(/\\\*/g, '*');
content = content.replace(/4\.1 Users Table\*\*/g, '-- 4.1 Users Table');
content = content.replace(/\*\*4\.2 Orders Table\*\*/g, '-- 4.2 Orders Table');
content = content.replace(/\*\*4\.3 Ledger Entries Table \(Immutable Audit Log\)\*\*/g, '-- 4.3 Ledger Entries Table');
content = content.replace(/\*\*4\.4 Webhook Events Table \(Idempotency Store\)\*\*/g, '-- 4.4 Webhook Events Table');
content = content.replace(/\*\*4\.5 Messages Table \(Deal Chat\)\*\*/g, '-- 4.5 Messages Table');
content = content.replace(/\*\*4\.6 Indexes\*\*/g, '-- 4.6 Indexes');
content = content.replace(/\*\*5\\\. Order State Machine\*\*/g, '-- 5. Order State Machine');
content = content.replace(/\*\*/g, '--');
content = content.replace(/\\--/g, '--');

// Make Create Table idempotent
content = content.replace(/create table public\.(\w+)/g, 'create table if not exists public.$1');
content = content.replace(/CREATE TABLE public\.(\w+)/g, 'CREATE TABLE IF NOT EXISTS public.$1');

// Make Create Index idempotent
content = content.replace(/create index (\w+)/g, 'create index if not exists $1');
content = content.replace(/CREATE INDEX (\w+)/g, 'CREATE INDEX IF NOT EXISTS $1');

// Make Create Policy idempotent
// We need to inject a DROP POLICY before each CREATE POLICY
content = content.replace(/create policy "([^"]+)" on public\.(\w+)/g, 'DROP POLICY IF EXISTS "$1" ON public.$2;\ncreate policy "$1" on public.$2');
content = content.replace(/CREATE POLICY "([^"]+)"\s*ON public\.(\w+)/g, 'DROP POLICY IF EXISTS "$1" ON public.$2;\nCREATE POLICY "$1" ON public.$2');

// Make ENUM creation idempotent (wrap in DO block)
// e.g. create type order_status as enum
// This is harder. For now, let's just do a blanket replacement for the 3 enums we have:
const enums = ['order_status', 'ledger_entry_type', 'ledger_entry_status', 'message_sender_type'];
for (const e of enums) {
    const regex = new RegExp(`create type ${e} as enum \\([^)]+\\);`, 'i');
    const match = content.match(regex);
    if (match) {
        content = content.replace(regex, `
DO $$ BEGIN
    CREATE TYPE ${e} AS ENUM ${match[0].substring(match[0].indexOf('('))};
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
        `.trim());
    }
}

fs.writeFileSync(file, content);
console.log('Sanitized and made SQL file idempotent');
