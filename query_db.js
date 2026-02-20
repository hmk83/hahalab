const URL = 'https://gxungzlecmibgvykoiib.supabase.co';
const KEY = 'sb_publishable_hzQriBXTJeAwATA2NjnV7A_Tr9E1hfE';

async function queryTable() {
    const res = await fetch(`${URL}/rest/v1/histories?select=*&limit=1`, {
        method: 'GET',
        headers: {
            'apikey': KEY,
            'Authorization': `Bearer ${KEY}`,
            'Content-Type': 'application/json'
        }
    });
    console.log("DB Row:", JSON.stringify(await res.json(), null, 2));
}

queryTable().catch(console.error);
