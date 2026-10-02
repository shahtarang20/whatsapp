


async function test() {
  const PHONE_ID = process.env.META_PHONE_ID;
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
  
  if (!PHONE_ID || !ACCESS_TOKEN) {
    console.error("Missing credentials in .env.local");
    return;
  }

  const payload = {
    messaging_product: "whatsapp",
    to: "918000433902",
    type: "template",
    template: {
      name: "hello_world",
      language: { code: "en_US" }
    }
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log("META RESPONSE:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

test();
