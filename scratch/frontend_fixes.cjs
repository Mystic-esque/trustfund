const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/pages/Home.tsx',
  'src/pages/Orders.tsx',
  'src/pages/CompactAuth.tsx',
  'src/pages/LockFunds.tsx',
  'src/pages/DealChat.tsx',
  'src/pages/Profile.tsx',
  'src/pages/AdminDisputes.tsx',
  'src/pages/DealTimeline.tsx',
  'src/pages/EscrowReceipt.tsx',
  'src/pages/ShareDeal.tsx',
  'src/hooks/useInbox.ts'
];

filesToFix.forEach(relPath => {
  const fullPath = path.join(process.cwd(), relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');

    // Remove any .select that includes vendor:users or buyer:users, whether in single quotes or backticks
    // Replace the entire .select(...) with .select('*')
    content = content.replace(/\.select\(\s*[`'][^`']*vendor:users[^`']*[`']\s*\)/g, `.select('*')`);
    content = content.replace(/\.select\(\s*[`'][^`']*buyer:users[^`']*[`']\s*\)/g, `.select('*')`);
    
    // Sometimes the select is like: .select('*, vendor:users(...), buyer:users(...)')
    content = content.replace(/\.select\(\s*[`']\s*\*\s*,\s*vendor:users[^`']*[`']\s*\)/g, `.select('*')`);

    // In LockFunds.tsx specifically, we see: .select('*, vendor:users!orders_vendor_id_fkey(full_name, completed_deals_count)')
    content = content.replace(/\.select\('[^']*vendor:users[^']*'\)/g, ".select('*')");
    content = content.replace(/\.select\(`[^`]*vendor:users[^`]*`\)/g, ".select('*')");

    fs.writeFileSync(fullPath, content);
  }
});
