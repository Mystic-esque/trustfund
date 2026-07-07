async function getBalance() {
  const authUrl = "https://sandbox.nomba.com/v1/auth/token/issue";
  const parentAccountId = "f666ef9b-888e-4799-85ce-acb505b28023";
  const subAccountId = "85972410-bc12-4928-b690-f0b60b32a951";

  const authRes = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "accountId": parentAccountId
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: "706df6c4-b8bb-4130-88c4-d21b052f8631",
      client_secret: "k8UobYk3APgOoxUnNL7VpuxzwTsH4LsXtydfjcHs8RH0YISBB4OMqJsaafG+U8fWETu9YZ96bNXE+DelCDuMPw=="
    })
  });

  const authJson = await authRes.json();
  const token = authJson.data.access_token;

  const balanceUrl = "https://sandbox.nomba.com/v1/accounts/balance";
  const balanceRes = await fetch(balanceUrl, {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token,
      "accountId": subAccountId
    }
  });

  const balanceJson = await balanceRes.json();
  console.log("SubAccount Balance Response:", JSON.stringify(balanceJson, null, 2));
}

getBalance();
