import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

import datetime
import json

now = datetime.datetime.now()

# 01-000 payload style (real play style) vs Growth Report expected style
test_record = {
    "client_id": 1,
    "teacher_id": "testuser1", # assuming there's a testuser1 or just leave it
    "category": "session_history",
    "action": "게임 완료",
    "event_datetime": now.strftime('%Y-%m-%d %H:%M:%S'),
    # Note: HistoryManager saves gameData payload in `metadata` and some in `details`?
    # Actually playlab-core.js GameLogger uses `details` but HistoryManager uses `metadata`!
    
    "details": json.dumps({
        "game_id": "01-000",
        "game_name": "Color Matching",
        "level": 2,
        "metrics": {
            "avgRT": 450,
            "accuracy": 0.95,
            "sustainedAttention": 0.90,
            "iiv": 120,
            "anticipatoryRate": 0.05,
            "postErrorSlowing": 150,
            "fatigueIndex": 0.02,
            "efficiency": 0.92,
            "lapseRate": 0.01
        }
    }),
    "metadata": {
        "game_version": "1.0",
        "test": True
    }
}

res = supabase.table('histories').insert([test_record]).execute()
print("Insert 1 result:", res)

# Real play data structure from 01-001 (using HistoryManager)
test_record_2 = {
    "client_id": 1,
    "teacher_id": "testuser1", 
    "category": "session_history", # Actually HistoryManager does not set category properly in 01-001, let's see playlab-core.js
    "action": "게임 완료", # HistoryManager sets action_type? Let's check.
    "event_datetime": now.strftime('%Y-%m-%d %H:%M:%S'),
    "action_type": "game_custom",
    "title": "Signal Light Guardian",
    "description": "그룹: SENIOR, 레벨: 1, 점수: 80",
    "metadata": {
        "game_id": "01-001",
        "game_name": "Signal Light Guardian",
        "group": "SENIOR",
        "level": 1,
        "score": 80,
        "metrics": {
            "rt": 550,
            "acc": 85,
            "iiv": 180,
            "comm": 2,
            "omiss": 1
        }
    }
}

res = supabase.table('histories').insert([test_record_2]).execute()
print("Insert 2 result:", res)
