const URL = 'https://gxungzlecmibgvykoiib.supabase.co';
const KEY = 'sb_publishable_hzQriBXTJeAwATA2NjnV7A_Tr9E1hfE';

async function insertFakeData() {
    console.log("Fetching client...");
    const clientRes = await fetch(`${URL}/rest/v1/clients?name=eq.TestClient`, {
        headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
    });
    const clients = await clientRes.json();

    if (!clients || clients.length === 0) {
        console.log("No TestClient found");
        return;
    }
    const testClient = clients[0];
    const now = new Date();

    const testRecord1 = {
        client_id: testClient.id,
        client_name: testClient.name,
        teacher_id: testClient.teacher_id,
        type: "game_play",
        category: "session_history",
        action: "게임 완료",
        event_datetime: now.toISOString().slice(0, 19).replace('T', ' '),
        action_type: "game_color",
        details: JSON.stringify({
            game_id: "01-000",
            game_name: "Color Matching",
            level: 2,
            metrics: {
                rt: 450, accuracy: 0.95, iiv: 120, sustainedAttention: 0.90,
                anticipatoryRate: 0.05, postErrorSlowing: 150, fatigueIndex: 0.02,
                efficiency: 0.92, lapseRate: 0.01
            }
        }),
        metadata: {
            game_id: "01-000", game_name: "Color Matching", level: 2, score: 100,
            metrics: { rt: 450, accuracy: 0.95 }
        }
    };

    const res1 = await fetch(`${URL}/rest/v1/histories`, {
        method: 'POST',
        headers: {
            'apikey': KEY, 'Authorization': `Bearer ${KEY}`,
            'Content-Type': 'application/json', 'Prefer': 'return=representation'
        },
        body: JSON.stringify(testRecord1)
    });
    console.log("Insert 1 Result:", await res1.json());

    const testRecord2 = {
        client_id: testClient.id,
        client_name: testClient.name,
        teacher_id: testClient.teacher_id,
        type: "game_play",
        category: "session_history",
        action: "게임 완료",
        event_datetime: new Date(now.getTime() + 60000).toISOString().slice(0, 19).replace('T', ' '),
        action_type: "game_simon",
        details: JSON.stringify({
            game_id: "01-004",
            game_name: "도형 짝꿍",
            level: 1,
            metrics: {
                rt: 520, accuracy: 0.85, iiv: 110, sustainedAttention: 0.88,
                anticipatoryRate: 0.02, postErrorSlowing: 100, fatigueIndex: 0.05,
                efficiency: 0.82, lapseRate: 0.04
            }
        }),
        metadata: {
            game_id: "01-004", game_name: "도형 짝꿍", level: 1, score: 80,
            metrics: { rt: 520, accuracy: 0.85 }
        }
    };

    const res2 = await fetch(`${URL}/rest/v1/histories`, {
        method: 'POST',
        headers: {
            'apikey': KEY, 'Authorization': `Bearer ${KEY}`,
            'Content-Type': 'application/json', 'Prefer': 'return=representation'
        },
        body: JSON.stringify(testRecord2)
    });
    console.log("Insert 2 Result:", await res2.json());
}

insertFakeData().catch(console.error);
