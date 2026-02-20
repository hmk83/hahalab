const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gxungzlecmibgvykoiib.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hzQriBXTJeAwATA2NjnV7A_Tr9E1hfE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const { data: logs, error: lErr } = await supabase.from('histories').select('teacher_id').limit(5);
    if (lErr) console.error('Logs Error:', lErr);
    else console.log('Logs teacher_ids:', logs);

    const { data: teachers, error: tErr } = await supabase.from('teachers').select('id, teacher_id, name').limit(5);
    if (tErr) console.error('Teachers Error:', tErr);
    else console.log('Teachers:', teachers);
}

check();
