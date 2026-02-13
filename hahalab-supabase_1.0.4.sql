-- ============================================================
-- [HAHA LAB] Database Schema v1.0.4
-- Migration from v1.0.3 to v1.0.4
-- Date: 2026-02-12
-- 
-- Changes:
-- 1. histories 테이블 확장 (action_type, duration, metadata 컬럼 추가)
-- 2. 요금제 자동 강등 트리거 고도화 (activity_logs 연동)
-- ============================================================

-- ============================================================
-- STEP 1: histories 테이블 확장
-- ============================================================

-- 세부 액션 타입 추가 (action 필드의 보조 분류)
-- 예: action='수업완료', action_type='정상완료' | '조기종료' | '연장완료'
ALTER TABLE histories ADD COLUMN IF NOT EXISTS action_type TEXT;

-- 실제 지속 시간 (INTERVAL 타입으로 더 정확한 시간 계산)
-- duration_minutes는 계획된 시간, duration은 실제 소요 시간
ALTER TABLE histories ADD COLUMN IF NOT EXISTS duration INTERVAL;

-- 확장 가능한 메타데이터 (JSON으로 추가 정보 저장)
-- 예: {"mood": "good", "participation": "active", "materials": ["book1", "toy2"]}
ALTER TABLE histories ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_histories_action_type ON histories(action_type);
CREATE INDEX IF NOT EXISTS idx_histories_metadata ON histories USING GIN(metadata);

COMMENT ON COLUMN histories.action_type IS '세부 액션 타입 (action 필드의 추가 분류)';
COMMENT ON COLUMN histories.duration IS '실제 소요 시간 (INTERVAL 타입)';
COMMENT ON COLUMN histories.metadata IS '확장 가능한 메타데이터 (JSONB)';


-- ============================================================
-- STEP 2: 요금제 자동 강등 트리거 고도화
-- ============================================================

-- 기존 check_plan_expiry 함수를 fn_auto_downgrade_expired_plans로 개선
-- - 로깅 기능 추가 (activity_logs 자동 기록)
-- - 더 명확한 함수명
CREATE OR REPLACE FUNCTION fn_auto_downgrade_expired_plans()
RETURNS TRIGGER AS $$
DECLARE
  old_plan_type TEXT;
BEGIN
  -- 플랜이 만료되었고 basic이 아닌 경우
  IF NEW.plan_expired_at IS NOT NULL 
     AND NEW.plan_expired_at < NOW() 
     AND NEW.plan_type != 'basic' THEN
    
    -- 기존 플랜 타입 저장
    old_plan_type := NEW.plan_type;
    
    -- Activity Log 기록
    INSERT INTO activity_logs (teacher_name, center_name, type, action, details)
    VALUES (
      NEW.name,
      COALESCE(NEW.center, '미지정'),
      '시스템',
      '요금제 자동 강등',
      old_plan_type || ' → basic (만료일: ' || TO_CHAR(NEW.plan_expired_at, 'YYYY-MM-DD HH24:MI') || ')'
    );
    
    -- 플랜 강등
    NEW.plan_type := 'basic';
    NEW.plan := 'Basic Plan';
    
    RAISE NOTICE '요금제 자동 강등: % (%) - % → basic', NEW.name, NEW.teacher_id, old_plan_type;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_auto_downgrade_expired_plans IS '만료된 요금제를 자동으로 Basic으로 강등하고 activity_logs에 기록';

-- 기존 트리거 제거 및 재생성
DROP TRIGGER IF EXISTS check_expiry_trigger ON teachers;
DROP TRIGGER IF EXISTS trigger_auto_downgrade_plan ON teachers;

CREATE TRIGGER trigger_auto_downgrade_plan
BEFORE UPDATE ON teachers
FOR EACH ROW
EXECUTE FUNCTION fn_auto_downgrade_expired_plans();


-- ============================================================
-- STEP 3: Verification Queries (테스트용)
-- ============================================================

-- histories 테이블 새 컬럼 확인
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'histories' 
-- ORDER BY ordinal_position;

-- 트리거 확인
-- SELECT trigger_name, event_object_table, action_statement 
-- FROM information_schema.triggers 
-- WHERE trigger_schema = 'public' 
-- AND (trigger_name LIKE '%downgrade%' OR trigger_name LIKE '%expiry%');

-- 인덱스 확인
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE schemaname = 'public' AND tablename = 'histories'
-- ORDER BY indexname;


-- ============================================================
-- COMPLETION
-- ============================================================

-- Add schema version comment
COMMENT ON SCHEMA public IS 'HAHA LAB Database Schema v1.0.4 - Extended histories and improved plan management - 2026-02-12';

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '==================================================================';
    RAISE NOTICE 'HAHA LAB Database Schema v1.0.4 - Migration Complete!';
    RAISE NOTICE '==================================================================';
    RAISE NOTICE 'Changes Applied:';
    RAISE NOTICE '1. histories 테이블 확장:';
    RAISE NOTICE '   - action_type TEXT (세부 액션 타입)';
    RAISE NOTICE '   - duration INTERVAL (실제 소요 시간)';
    RAISE NOTICE '   - metadata JSONB (확장 메타데이터)';
    RAISE NOTICE '';
    RAISE NOTICE '2. 요금제 자동 강등 트리거 고도화:';
    RAISE NOTICE '   - fn_auto_downgrade_expired_plans() 함수 생성';
    RAISE NOTICE '   - activity_logs 자동 기록 기능 추가';
    RAISE NOTICE '   - trigger_auto_downgrade_plan 트리거 생성';
    RAISE NOTICE '';
    RAISE NOTICE '3. 인덱스 추가:';
    RAISE NOTICE '   - idx_histories_action_type (B-tree)';
    RAISE NOTICE '   - idx_histories_metadata (GIN)';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for QA testing!';
    RAISE NOTICE '==================================================================';
END $$;
