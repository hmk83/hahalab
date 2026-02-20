-- ============================================================
-- [HAHA LAB] Database Schema v1.0.5
-- Migration from v1.0.4 to v1.0.5
-- Date: 2026-02-14
-- 
-- Changes:
-- 1. teachers 테이블에 max_client_limit 컬럼 추가 (기본값: 40)
-- 2. 회원등급/요금제 관련 컬럼 삭제 (plan, plan_type, plan_expired_at, plan_started_at)
-- 3. 요금제 자동 강등 트리거 및 함수 삭제
-- ============================================================

-- ============================================================
-- STEP 1: max_client_limit 컬럼 추가
-- ============================================================

-- 최대 내담자 등록 허용 수 컬럼 추가 (기본값: 40명)
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS max_client_limit INTEGER DEFAULT 40;

-- NOT NULL 제약조건 추가 및 기본값 40 설정
ALTER TABLE teachers 
ALTER COLUMN max_client_limit SET DEFAULT 40,
ALTER COLUMN max_client_limit SET NOT NULL;

-- 기존 행에 기본값 적용 (혹시 NULL인 경우를 대비)
UPDATE teachers 
SET max_client_limit = 40 
WHERE max_client_limit IS NULL;

-- 인덱스 추가 (선택 사항: 빠른 조회를 위해)
CREATE INDEX IF NOT EXISTS idx_teachers_max_client_limit ON teachers(max_client_limit);

COMMENT ON COLUMN teachers.max_client_limit IS '최대 내담자 등록 허용 수 (기본값: 40명)';


-- ============================================================
-- STEP 2: 요금제 관련 트리거 및 함수 삭제
-- ============================================================

-- 요금제 자동 강등 트리거 삭제
DROP TRIGGER IF EXISTS trigger_auto_downgrade_plan ON teachers;
DROP TRIGGER IF EXISTS check_expiry_trigger ON teachers;

-- 요금제 자동 강등 함수 삭제
DROP FUNCTION IF EXISTS fn_auto_downgrade_expired_plans();
DROP FUNCTION IF EXISTS check_plan_expiry();


-- ============================================================
-- STEP 3: 회원등급/요금제 관련 컬럼 삭제
-- ============================================================

-- plan 컬럼 삭제 (요금제 이름)
ALTER TABLE teachers DROP COLUMN IF EXISTS plan CASCADE;

-- plan_type 컬럼 삭제 (요금제 타입: normal, bronze, silver, gold)
ALTER TABLE teachers DROP COLUMN IF EXISTS plan_type CASCADE;

-- plan_expired_at 컬럼 삭제 (요금제 만료일)
ALTER TABLE teachers DROP COLUMN IF EXISTS plan_expired_at CASCADE;

-- plan_started_at 컬럼 삭제 (요금제 시작일)
ALTER TABLE teachers DROP COLUMN IF EXISTS plan_started_at CASCADE;


-- ============================================================
-- STEP 4: Verification Queries (테스트용)
-- ============================================================

-- teachers 테이블 컬럼 확인
-- SELECT column_name, data_type, column_default, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'teachers' 
-- ORDER BY ordinal_position;

-- max_client_limit 컬럼 확인
-- SELECT column_name, data_type, column_default, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'teachers' AND column_name = 'max_client_limit';

-- 삭제된 컬럼 확인 (결과가 비어있어야 함)
-- SELECT column_name 
-- FROM information_schema.columns 
-- WHERE table_name = 'teachers' 
-- AND column_name IN ('plan', 'plan_type', 'plan_expired_at', 'plan_started_at');

-- 트리거 확인 (결과가 비어있어야 함)
-- SELECT trigger_name 
-- FROM information_schema.triggers 
-- WHERE trigger_schema = 'public'
-- AND trigger_name IN ('trigger_auto_downgrade_plan', 'check_expiry_trigger');

-- 함수 확인 (결과가 비어있어야 함)
-- SELECT routine_name 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public'
-- AND routine_name IN ('fn_auto_downgrade_expired_plans', 'check_plan_expiry');


-- ============================================================
-- COMPLETION
-- ============================================================

-- Add schema version comment
COMMENT ON SCHEMA public IS 'HAHA LAB Database Schema v1.0.5 - Removed plan/tier system, added max_client_limit - 2026-02-14';

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '==================================================================';
    RAISE NOTICE 'HAHA LAB Database Schema v1.0.5 - Migration Complete!';
    RAISE NOTICE '==================================================================';
    RAISE NOTICE 'Changes Applied:';
    RAISE NOTICE '1. max_client_limit 컬럼 추가:';
    RAISE NOTICE '   - teachers 테이블에 max_client_limit INTEGER DEFAULT 40 추가';
    RAISE NOTICE '   - 모든 기존 선생님에게 기본값 40 자동 적용';
    RAISE NOTICE '';
    RAISE NOTICE '2. 회원등급/요금제 관련 컬럼 삭제:';
    RAISE NOTICE '   - plan (요금제 이름) 삭제';
    RAISE NOTICE '   - plan_type (요금제 타입) 삭제';
    RAISE NOTICE '   - plan_expired_at (만료일) 삭제';
    RAISE NOTICE '   - plan_started_at (시작일) 삭제';
    RAISE NOTICE '';
    RAISE NOTICE '3. 요금제 자동 강등 시스템 삭제:';
    RAISE NOTICE '   - trigger_auto_downgrade_plan 트리거 삭제';
    RAISE NOTICE '   - fn_auto_downgrade_expired_plans() 함수 삭제';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for QA testing!';
    RAISE NOTICE '==================================================================';
END $$;
