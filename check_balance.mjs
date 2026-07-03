const fetch = globalThis.fetch || (await import('node-fetch')).default;

async function checkBalance() {
  const authUrl = "https://api.nomba.com/v1/auth/token/issue";
  const parentAccountId = "f666ef9b-888e-4799-85ce-acb505b28023";
  const clientId = "e5e85b13-f560-4643-814e-c87435dbbc15";
  const clientSecret = "8/doS7Q3w77EANpk3vpgSrc05hhOiRWp3eBs01sXyZ1AmovtZUXlmrxie+xnEF2tR4q79t0IFufMD1d4JrkT8g==";

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
  
  // Try fetching all accounts to find the balance, or just the parent account if subaccount is unknown
  console.log("Fetching account balance...");
  const accountRes = await fetch("https://api.nomba.com/v1/accounts/balance", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "accountId": parentAccountId
    }
  });
  console.log("Balance Data:", JSON.stringify(await accountRes.json(), null, 2));

  console.log("Fetching recent transactions...");
  const txRes = await fetch("https://api.nomba.com/v1/transactions/accounts?limit=10", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "accountId": parentAccountId
    }
  });
  console.log("Transactions Status:", txRes.status);
  const txData = await txRes.json();
  
  // Just print the most recent 3 transactions for brevity
  if (txData.data && txData.data.results) {
    console.log("Recent Transactions:", JSON.stringify(txData.data.results.slice(0, 3), null, 2));
  } else {
    console.log("Transactions Data:", JSON.stringify(txData, null, 2));
  }
}

checkBalance();
