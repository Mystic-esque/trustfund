const fetch = globalThis.fetch || (await import('node-fetch')).default;

async function listVirtualAccounts(subAccountId) {
  const authUrl = "https://api.nomba.com/v1/auth/token/issue";
  const parentAccountId = "f666ef9b-888e-4799-85ce-acb505b28023";
  const clientId = "e5e85b13-f560-4643-814e-c87435dbbc15";
  const clientSecret = "8/doS7Q3w77EANpk3vpgSrc05hhOiRWp3eBs01sXyZ1AmovtZUXlmrxie+xnEF2tR4q79t0IFufMD1d4JrkT8g==";

  // Use the provided subAccountId, or default to the parentAccountId if none provided
  const targetAccountId = subAccountId || parentAccountId;

  // 1. Get Access Token
  const authRes = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "accountId": parentAccountId
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret
    })
  });

  const authData = await authRes.json();
  if (!authRes.ok) {
    console.error("Auth Failed:", authData);
    return;
  }
  
  const token = authData.data.access_token;
  
  // 2. Fetch Virtual Accounts
  console.log(`Fetching virtual accounts for account: ${targetAccountId}...`);
  const url = `https://api.nomba.com/v1/accounts/${targetAccountId}/virtual`;
  
  const virtualAccRes = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "accountId": parentAccountId
    }
  });

  const virtualAccData = await virtualAccRes.json();
  console.log("Response Status:", virtualAccRes.status);
  console.log("Virtual Accounts Data:", JSON.stringify(virtualAccData, null, 2));
}

// Check for command line argument for subAccountId
const subAccountIdArg = process.argv[2];
listVirtualAccounts(subAccountIdArg);
