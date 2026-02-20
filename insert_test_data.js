const URL = 'https://gxungzlecmibgvykoiib.supabase.co';
const KEY = 'sb_publishable_hzQriBXTJeAwATA2NjnV7A_Tr9E1hfE';

async function insertData() {
    const now = new Date();
    const eventTime = now.toISOString().slice(0, 19).replace('T', ' ');

    // We will build a test record that aligns with a FIX we plan to do
    const testRecord1 = {
        client_id: "1",
        client_name: "TestClient",
        teacher_id: "testuser1",
        type: "game_play",
        category: "session_history",
        action: "게임 완료",
        event_datetime: eventTime,
        action_type: "game_color",
        // The fixed schema: we will store everything in `details` or `metadata`. 
        // GrowthReportTab in index.html currently uses `details`. We will just use `details` for simplicity, 
        // OR we can make `index.html` fallback to `metadata`. 
        // Let's use `details` for metrics, and `metadata` for other things.
        details: JSON.stringify({
            game_id: "01-000",
            game_name: "Color Matching",
            level: 2,
            metrics: {
                rtAvg: 450,
                accuracy: 0.95,
                iiv: 120,
                susRate: 0.90,
                anticipatoryRate: 0.05,
                postErrorSlowing: 150,
                fatigueIndex: 0.02,
                efficiency: 0.92,
                lapseRate: 0.01
            }
        })
    };

    const res1 = await fetch(`${URL}/rest/v1/histories`, {
        method: 'POST',
        headers: {
            'apikey': KEY,
            'Authorization': `Bearer ${KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(testRecord1)
    });
    console.log("Insert 1 Result:", await res1.json());
}

insertData().catch(console.error);
