const fs = require('fs');
const path = require('path');

const targetDir = 'public/images/onboarding';
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

fs.copyFileSync(
    'screencode/premium_abstract_social_commerce_background._interconnected_glowing_nodes_and/screen.png',
    path.join(targetDir, 'bg-1.png')
);

fs.copyFileSync(
    'screencode/premium_abstract_financial_background_representing_a_virtual_bank_account/screen.png',
    path.join(targetDir, 'bg-2.png')
);

fs.copyFileSync(
    'screencode/premium_abstract_fintech_background_for_an_escrow_app._ethereal_glowing_fiber/screen.png',
    path.join(targetDir, 'bg-3.png')
);

console.log('Images copied successfully.');
