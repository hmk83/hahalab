/**
 * PlayLab Master Framework - Core Engine
 * 하하랩 게임 콘텐츠 공통 JavaScript 엔진
 * Version: 1.0
 */

const PlayLabCore = (() => {
    'use strict';

    // Private variables
    let audioContext = null;
    let gamepadIndex = null;
    let lastButtonState = {};
    let lastNavTime = 0;

    const SOUNDS = {
        PROBLEM: 'problem',
        CORRECT: 'correct',
        WRONG: 'wrong',
        FINISH: 'finish'
    };

    const BUTTONS = {
        RED: 0,
        YELLOW: 1,
        GREEN: 2,
        BLUE: 3,
        EXIT: 9,
        DPAD_UP: 12,
        DPAD_DOWN: 13,
        DPAD_LEFT: 14,
        DPAD_RIGHT: 15
    };

    /**
     * 입력 기기 타입 상수
     * 반응속도 측정 시 사용된 입력 기기를 식별
     */
    const INPUT_DEVICES = {
        TOUCH: 'TOUCH',
        MOUSE: 'MOUSE',
        GAMEPAD: 'GAMEPAD'
    };

    /**
     * 입력 기기별 반응속도(RT) 오프셋 (단위: ms)
     * 
     * 과학적 근거:
     * - TOUCH: 0ms (기준, 직접 터치이므로 추가 지연 없음)
     * - MOUSE: -120ms (피츠의 법칙 기반, 커서 이동 시간 보정)
     *   참고: Fitts's Law - MT = a + b * log2(2D/W)
     *   웹 기반 환경에서 평균 120ms의 마우스 이동 시간 보정
     * - GAMEPAD: -80ms (물리적 버튼 스트로크 및 촉각 피드백 지연)
     */
    const DEVICE_RT_OFFSETS = {
        TOUCH: 0,
        MOUSE: -120,
        GAMEPAD: -80
    };

    // ========== AUDIO MANAGER ==========
    const AudioManager = {
        init() {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            console.log('[PlayLab Audio] Initialized');
        },

        playSound(type) {
            if (!audioContext) this.init();
            if (audioContext.state === 'suspended') audioContext.resume();

            const now = audioContext.currentTime;
            const osc = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioContext.destination);

            switch (type) {
                case SOUNDS.PROBLEM:
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(659, now);
                    osc.frequency.exponentialRampToValueAtTime(1318, now + 0.1);
                    gainNode.gain.setValueAtTime(0.1, now);
                    gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
                    osc.start(now);
                    osc.stop(now + 0.3);
                    break;

                case SOUNDS.CORRECT:
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(880, now);
                    osc.frequency.setValueAtTime(1760, now + 0.1);
                    gainNode.gain.setValueAtTime(0.1, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                    osc.start(now);
                    osc.stop(now + 0.2);
                    break;

                case SOUNDS.WRONG:
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(150, now);
                    osc.frequency.linearRampToValueAtTime(100, now + 0.3);
                    gainNode.gain.setValueAtTime(0.1, now);
                    gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
                    osc.start(now);
                    osc.stop(now + 0.4);
                    break;

                case SOUNDS.FINISH:
                    this.playNote(523, now, 0.1);
                    this.playNote(659, now + 0.1, 0.1);
                    this.playNote(784, now + 0.2, 0.4);
                    break;
            }
        },

        playCorrect() { this.playSound(SOUNDS.CORRECT); },
        playWrong() { this.playSound(SOUNDS.WRONG); },
        playFinish() { this.playSound(SOUNDS.FINISH); },
        playProblem() { this.playSound(SOUNDS.PROBLEM); },

        playNote(freq, time, duration) {
            if (!audioContext) this.init();
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.linearRampToValueAtTime(0, time + duration);
            osc.start(time);
            osc.stop(time + duration);
        }
    };

    // ========== GAMEPAD MANAGER ==========
    const GamepadManager = {
        init() {
            window.addEventListener("gamepadconnected", (e) => {
                gamepadIndex = e.gamepad.index;
                this.updateUI(true);
                UIController.showToast("🎮 Gamepad Connected");
                console.log('[PlayLab Gamepad] Connected:', e.gamepad.id);
            });

            window.addEventListener("gamepaddisconnected", (e) => {
                if (gamepadIndex === e.gamepad.index) {
                    gamepadIndex = null;
                    this.updateUI(false);
                    console.log('[PlayLab Gamepad] Disconnected');
                }
            });

            // Initialize button states
            for (let key in BUTTONS) {
                lastButtonState[BUTTONS[key]] = false;
            }
        },

        poll() {
            if (gamepadIndex === null) return null;
            const gamepads = navigator.getGamepads();
            if (!gamepads || !gamepads[gamepadIndex]) return null;
            return gamepads[gamepadIndex];
        },

        isPressed(buttonIndex) {
            const gamepad = this.poll();
            if (!gamepad || buttonIndex >= gamepad.buttons.length) return false;
            return gamepad.buttons[buttonIndex].pressed;
        },

        wasJustPressed(buttonIndex) {
            const gamepad = this.poll();
            if (!gamepad || buttonIndex >= gamepad.buttons.length) return false;

            const isDown = gamepad.buttons[buttonIndex].pressed;
            const wasDown = lastButtonState[buttonIndex] || false;
            lastButtonState[buttonIndex] = isDown;

            return isDown && !wasDown;
        },

        getAxes() {
            const gamepad = this.poll();
            if (!gamepad) return { horizontal: 0, vertical: 0 };
            return {
                horizontal: gamepad.axes[0] || 0,
                vertical: gamepad.axes[1] || 0
            };
        },

        updateUI(connected) {
            const menuIndicator = document.getElementById('menu-gamepad-indicator');
            const gameIndicator = document.getElementById('game-gamepad-indicator');
            const introIcon = document.getElementById('intro-gamepad-icon');

            if (connected) {
                if (menuIndicator) menuIndicator.classList.add('visible');
                if (gameIndicator) gameIndicator.classList.remove('hidden');
                if (introIcon) {
                    introIcon.classList.remove('inactive-gray');
                    introIcon.classList.add('active-orange');
                }
            } else {
                if (menuIndicator) menuIndicator.classList.remove('visible');
                if (gameIndicator) gameIndicator.classList.add('hidden');
                if (introIcon) {
                    introIcon.classList.remove('active-orange');
                    introIcon.classList.add('inactive-gray');
                }
            }
        },

        updateIndicators(buttonStates) {
            // Button indicator UI updates (for visual feedback)
            const indicatorMap = {
                [BUTTONS.RED]: 'btn-red',
                [BUTTONS.YELLOW]: 'btn-yellow',
                [BUTTONS.GREEN]: 'btn-green',
                [BUTTONS.BLUE]: 'btn-blue'
            };

            for (let btnIdx in indicatorMap) {
                const elem = document.getElementById(indicatorMap[btnIdx]);
                if (elem) {
                    if (buttonStates[btnIdx]) {
                        elem.classList.add('active');
                    } else {
                        elem.classList.remove('active');
                    }
                }
            }
        }
    };

    // ========== UI CONTROLLER ==========
    const UIController = {
        showToast(message) {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = 'toast-msg';
            toast.textContent = message;
            container.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'fadeOut 0.3s forwards';
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        },

        updateHUD(level, round, totalRounds) {
            const levelEl = document.getElementById('display-level');
            const roundEl = document.getElementById('display-round');

            if (levelEl) levelEl.textContent = level;
            if (roundEl) roundEl.textContent = `${round}/${totalRounds}`;
        },

        showMessage(text, duration = 2000) {
            const msgEl = document.getElementById('msg-center');
            if (!msgEl) return;

            msgEl.textContent = text;
            msgEl.style.display = 'block';

            if (duration > 0) {
                setTimeout(() => {
                    msgEl.style.display = 'none';
                }, duration);
            }
        },

        hideMessage() {
            const msgEl = document.getElementById('msg-center');
            if (msgEl) msgEl.style.display = 'none';
        },

        showExitModal(onConfirm, onCancel) {
            const modal = document.getElementById('modal-confirm-home');
            const titleEl = document.getElementById('modal-title');
            const descEl = document.getElementById('modal-desc');

            if (titleEl) titleEl.textContent = '게임을 종료하시겠습니까?';
            if (descEl) descEl.textContent = '진행 중인 데이터는 저장되지 않습니다.';

            if (modal) {
                modal.classList.remove('hidden');

                // 모달 버튼 이벤트 설정 (실제 구현 필요)
                window._playLabModalCallbacks = { onConfirm, onCancel };
            }
        },

        hideModal() {
            const modal = document.getElementById('modal-confirm-home');
            if (modal) modal.classList.add('hidden');
        }
    };

    // ========== CLINICAL ANALYSIS ENGINE ==========
    /**
     * 임상신경심리 분석 엔진
     * 참고: 01-000.html L839-1046
     * - 9가지 핵심 인지 지표 계산
     * - 뇌 활성화 영역 분석
     * - 연령별 맞춤형 임상 피드백 생성
     * - 입력 기기별 RT 보정 (v1.1 추가)
     * - 4단계 임상 오류 분류 (v1.1 추가)
     */
    const ClinicalAnalysis = {
        sessionData: {
            rawRTs: [],
            validRTs: [],
            accuracies: [],
            errors: 0,
            lapses: 0,
            startTime: 0,
            blockData: []  // { rt, result, validity, level, round, timestamp }
        },

        /**
         * 4단계 임상 오류 분류 (Clinical Response Classification)
         * 
         * @param {number} rt - 반응 시간 (clinical_rt 사용 권장)
         * @param {string} result - 'CORRECT', 'WRONG', 'TIMEOUT'
         * @param {Object} timingContext - { maxTime, elapsedTime }
         * @returns {Object} - { type, label, description, isValid, penalty }
         * 
         * 분류 기준:
         * 1. Anticipatory (예측 오류): RT < 150ms
         *    - 인간의 시각 자극 최소 생리적 반응 시간 150-180ms 기준
         *    - 자극을 보고 반응한 것이 아닌 예측 반응
         * 2. Omission (누락 오류): 타임아웃 또는 무응답
         *    - 주의력 결핍(ADHD) 지표
         * 3. Commission (충동 오류): 오답 또는 No-Go 자극 반응
         *    - 억제 조절 능력 부족 지표
         * 4. Motor Delay (운동 지연): 제한 시간 마지막 10% 구간 반응
         *    - 순수 인지 vs 신체 조절 능력 구분
         * 5. Success (성공): 정상 범위 내 정답
         */
        classifyResponse(rt, result, timingContext = {}) {
            const { maxTime = 5000, elapsedTime = rt } = timingContext;

            // 1. Anticipatory (예측 오류): 150ms 미만
            if (rt < 150) {
                return {
                    type: 'ANTICIPATORY',
                    label: '예측 오류',
                    description: '자극을 보고 반응한 것이 아닌 예측 반응 (충동성 지표 상승)',
                    isValid: false,
                    penalty: 1.0, // 완전 무효
                    color: '#f59e0b'
                };
            }

            // 2. Omission (누락 오류): 타임아웃
            if (result === 'TIMEOUT' || rt >= maxTime) {
                return {
                    type: 'OMISSION',
                    label: '누락 오류',
                    description: '타겟 소멸 시까지 무응답 (주의력 결핍 지표)',
                    isValid: false,
                    penalty: 1.0, // 실패
                    color: '#64748b'
                };
            }

            // 3. Commission (충동 오류): 오답
            if (result === 'WRONG') {
                return {
                    type: 'COMMISSION',
                    label: '충동 오류',
                    description: '오답 또는 No-Go 자극에 반응 (억제 조절 능력 부족)',
                    isValid: false,
                    penalty: 1.0, // 실패
                    color: '#ef4444'
                };
            }

            // 4. Motor Delay (운동 지연): 마지막 10% 구간
            const motorDelayThreshold = maxTime * 0.9;
            if (elapsedTime >= motorDelayThreshold && result === 'CORRECT') {
                return {
                    type: 'MOTOR_DELAY',
                    label: '운동 지연',
                    description: '제한 시간 마지막 10% 구간에서 반응 (신체 조절 지연)',
                    isValid: true,
                    penalty: 0.3, // 70% 점수 부여
                    color: '#eab308'
                };
            }

            // 5. Success (성공): 정상 범위 내 정답
            return {
                type: 'SUCCESS',
                label: '성공',
                description: '정상 범위 내 정확한 반응',
                isValid: true,
                penalty: 0,
                color: '#10b981'
            };
        },

        /**
         * 입력 기기별 반응속도 오프셋 적용
         * 
         * @param {number} rawRT - 원시 반응 시간 (performance.now() 측정값)
         * @param {string} deviceType - 'TOUCH', 'MOUSE', 'GAMEPAD'
         * @returns {Object} - { raw_rt, offset_applied, clinical_rt, device }
         * 
         * 과학적 근거:
         * - 터치: 직접 접촉이므로 오프셋 없음 (0ms)
         * - 마우스: 피츠의 법칙 기반 커서 이동 시간 보정 (-120ms)
         * - 게임패드: 물리적 버튼 스트로크 지연 보정 (-80ms)
         */
        applyDeviceOffset(rawRT, deviceType) {
            const offset = DEVICE_RT_OFFSETS[deviceType] || 0;
            const clinicalRT = Math.max(0, rawRT + offset);

            return {
                raw_rt: Math.round(rawRT),
                offset_applied: offset,
                clinical_rt: Math.round(clinicalRT),
                device: deviceType || 'UNKNOWN'
            };
        },

        /**
         * Ceiling 효과 적용 (상한선 처리)
         * 
         * @param {number} clinicalRT - 보정된 임상 반응 시간
         * @param {number} ceilingValue - Ceiling 기준값 (기본 600ms)
         * @returns {Object} - { normalized_rt, is_ceiling, score }
         * 
         * 목적:
         * - 과도한 속도 경쟁으로 인한 부상 방지
         * - 600ms 이하는 모두 만점 처리 (더 빨라도 점수 증가 없음)
         * - 인지 능력 측정에 집중, 단순 반사신경 경쟁 방지
         */
        applyCeiling(clinicalRT, ceilingValue = 600) {
            // 600ms 이하는 모두 만점 처리
            if (clinicalRT <= ceilingValue) {
                return {
                    normalized_rt: 100,
                    is_ceiling: true,
                    score: 100,
                    message: `${ceilingValue}ms 이하는 모두 만점입니다`
                };
            }

            // 600ms 이상은 선형 감소
            const maxRT = 2000; // 최대 2초
            const score = Math.max(0, 100 - ((clinicalRT - ceilingValue) / (maxRT - ceilingValue)) * 100);

            return {
                normalized_rt: Math.round(score),
                is_ceiling: false,
                score: Math.round(score),
                message: '정상 범위'
            };
        },

        recordTrial(trialData) {
            // trialData: { rt, result, validity, level, round }
            this.sessionData.blockData.push({
                ...trialData,
                timestamp: Date.now()
            });

            if (trialData.validity === 'VALID') {
                this.sessionData.validRTs.push(trialData.rt);
            }
            if (trialData.validity === 'LAPSE') {
                this.sessionData.lapses++;
            }
            if (trialData.result === 'WRONG') {
                this.sessionData.errors++;
            }
        },

        filterData(rt) {
            if (rt < 100) return 'INVALID_TOO_FAST';
            if (rt < 200) return 'ANTICIPATORY';
            if (rt > 3000) return 'LAPSE';
            return 'VALID';
        },

        calculateStatistics(arr) {
            if (arr.length === 0) return { mean: 0, sd: 0 };
            const n = arr.length;
            const mean = arr.reduce((a, b) => a + b) / n;
            const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
            return { mean, sd: Math.sqrt(variance) };
        },

        /**
         * 9가지 핵심 인지 지표 계산
         * 참고: 인지 재활 게임 임상 계산식 설계.docx
         */
        calculateMetrics(level, totalAttempts) {
            const data = this.sessionData;
            const validTrials = data.blockData.filter(d => d.validity === 'VALID');
            const validRTs = validTrials.map(d => d.rt);
            const stats = this.calculateStatistics(validRTs);

            // 1. RT (Mean Reaction Time)
            const rtAvg = stats.mean;

            // 2. ACC (Accuracy)
            const totalInputs = data.blockData.length;
            const totalCorrect = data.blockData.filter(d => d.result === 'CORRECT').length;
            const accuracy = totalInputs === 0 ? 0 : (totalCorrect / totalInputs) * 100;

            // 3. IIV (Intra-Individual Variability - Standard Deviation of RT)
            const iiv = stats.sd;

            // 4. SUS (Sustained Attention) - 전반부 vs 후반부 정확도 비교
            const midpoint = Math.floor(data.blockData.length / 2);
            const firstHalf = data.blockData.slice(0, midpoint);
            const secondHalf = data.blockData.slice(midpoint);
            const acc1 = firstHalf.length === 0 ? 0 : firstHalf.filter(d => d.result === 'CORRECT').length / firstHalf.length;
            const acc2 = secondHalf.length === 0 ? 0 : secondHalf.filter(d => d.result === 'CORRECT').length / secondHalf.length;
            let sus = acc1 === 0 ? 0 : (acc2 / acc1) * 100;
            if (isNaN(sus)) sus = 0;
            if (sus > 100) sus = 100;

            // 5. Anticipatory Rate (RT < 150ms) - v1.1 임상 표준 적용
            const anticipatoryCount = data.blockData.filter(d =>
                d.rt < 150 && d.rt >= 0
            ).length;
            const anticipatoryRate = (anticipatoryCount / totalAttempts) * 100;

            // 6. Lapse Rate (RT > 3000ms)
            const lapseRate = (data.lapses / totalAttempts) * 100;

            // 7. Error Rate
            const errorRate = (data.errors / totalAttempts) * 100;

            // 8. Post-Error Slowing (오답 후 RT 변화율)
            const postErrorSlowing = this._calculatePostErrorSlowing();

            // 9. Fatigue Index (후반부/전반부 RT 비율)
            const fatigueIndex = this._calculateFatigueIndex();

            // === 정규화 (0-100점) Min-Max Normalization ===
            const normRT = Math.max(0, Math.min(100, (1500 - rtAvg) / (1500 - 200) * 100));
            const normACC = accuracy;
            const normIIV = Math.max(0, Math.min(100, (500 - iiv) / 500 * 100));
            const normSUS = sus;

            // 총점 계산 (가중치: RT 30%, ACC 30%, IIV 20%, SUS 20%)
            const totalScore = Math.round(
                (normRT * 0.3) +
                (normACC * 0.3) +
                (normIIV * 0.2) +
                (normSUS * 0.2)
            );

            return {
                // Raw Metrics
                rt: Math.round(rtAvg),
                acc: Math.round(accuracy),
                iiv: Math.round(iiv),
                sus: Math.round(sus),
                anticipatoryRate: Math.round(anticipatoryRate * 10) / 10,
                lapseRate: Math.round(lapseRate * 10) / 10,
                errorRate: Math.round(errorRate * 10) / 10,
                postErrorSlowing: Math.round(postErrorSlowing),
                fatigueIndex: Math.round(fatigueIndex),

                // Normalized Scores (0-100)
                normRT: Math.round(normRT),
                normACC: Math.round(normACC),
                normIIV: Math.round(normIIV),
                normSUS: Math.round(normSUS),
                totalScore,

                // Chart Data (9각 레이더 차트용)
                chartData: {
                    speed: Math.round(normRT),
                    accuracy: Math.round(normACC),
                    consistency: Math.round(normIIV),
                    attention: Math.round(normSUS),
                    execution: Math.round((normRT + normACC) / 2),
                    inhibition: Math.max(0, Math.round(100 - anticipatoryRate * 5)),
                    vigilance: Math.max(0, Math.round(100 - lapseRate * 10)),
                    errorMonitoring: Math.min(100, Math.round(postErrorSlowing)),
                    endurance: Math.max(0, Math.round(100 - fatigueIndex))
                }
            };
        },

        _calculatePostErrorSlowing() {
            const data = this.sessionData.blockData;
            let totalSlowing = 0;
            let errorCount = 0;

            for (let i = 0; i < data.length - 1; i++) {
                if (data[i].result === 'WRONG' && data[i + 1].validity === 'VALID') {
                    const rtBefore = data[i].rt;
                    const rtAfter = data[i + 1].rt;
                    if (rtBefore > 0) {
                        totalSlowing += ((rtAfter - rtBefore) / rtBefore) * 100;
                        errorCount++;
                    }
                }
            }

            return errorCount === 0 ? 0 : Math.max(0, totalSlowing / errorCount);
        },

        _calculateFatigueIndex() {
            const validTrials = this.sessionData.blockData.filter(d => d.validity === 'VALID');
            if (validTrials.length < 4) return 0;

            const midpoint = Math.floor(validTrials.length / 2);
            const firstHalf = validTrials.slice(0, midpoint).map(d => d.rt);
            const secondHalf = validTrials.slice(midpoint).map(d => d.rt);

            const stats1 = this.calculateStatistics(firstHalf);
            const stats2 = this.calculateStatistics(secondHalf);

            if (stats1.mean === 0) return 0;
            return Math.max(0, ((stats2.mean - stats1.mean) / stats1.mean) * 100);
        },

        /**
         * 뇌 활성화 영역 분석
         * 참고: 플레이랩_임상신경심리_마스터_프로토콜_v3.md.docx
         */
        analyzeBrainActivation(metrics, ageGroup, gameID) {
            const brainRegions = [];
            const { normRT, normACC, normIIV, anticipatoryRate, errorRate, postErrorSlowing } = metrics;

            // 게임 타입별 주요 훈련 영역 매핑
            const gameRegionMap = {
                '01-000': {
                    primary: 'DLPFC',
                    primaryKo: '배외측전전두피질',
                    secondary: ['Parietal Cortex', 'Visual Cortex'],
                    description: '순차적 작업 기억 및 실행 기능 훈련'
                },
                '01-001': {
                    primary: 'IFG',
                    primaryKo: '하전두회',
                    secondary: ['ACC', 'Motor Cortex'],
                    description: '반응 억제 및 주의 통제 훈련'
                }
            };

            const regionInfo = gameRegionMap[gameID] || gameRegionMap['01-000'];

            // DLPFC (Dorsolateral Prefrontal Cortex) - 작업 기억, 계획
            if (normRT > 70 && normACC > 85) {
                brainRegions.push({
                    region: '배외측전전두피질 (DLPFC)',
                    status: '활성화 우수',
                    description: '작업 기억 및 실행 기능이 효율적으로 작동'
                });
            } else if (normRT < 50 || normACC < 70) {
                brainRegions.push({
                    region: '배외측전전두피질 (DLPFC)',
                    status: '활성화 저하',
                    description: '작업 기억 용량 또는 주의 자원 부족 신호'
                });
            }

            // IFG (Inferior Frontal Gyrus) - 억제 통제
            if (anticipatoryRate < 10) {
                brainRegions.push({
                    region: '하전두회 (IFG)',
                    status: '억제 통제 양호',
                    description: '충동적 반응을 억제하는 브레이크 기능 원활'
                });
            } else if (anticipatoryRate > 25) {
                brainRegions.push({
                    region: '하전두회 (IFG)',
                    status: '억제 통제 미흡',
                    description: '충동적 행동 패턴, 브레이크 기능 훈련 필요'
                });
            }

            // VMPFC (Ventromedial Prefrontal Cortex) - 오류 모니터링
            if (errorRate < 15 && postErrorSlowing > 50) {
                brainRegions.push({
                    region: '복내측전전두피질 (VMPFC)',
                    status: '오류 인식 우수',
                    description: '실수를 감지하고 조절하는 자기 모니터링 능력 양호'
                });
            }

            return {
                primary: regionInfo.primaryKo,
                primaryEn: regionInfo.primary,
                secondary: regionInfo.secondary,
                gameDescription: regionInfo.description,
                activationAnalysis: brainRegions
            };
        },

        /**
         * 간단 모드 피드백 생성
         * 참고: 01-000.html L876-899
         */
        generateEasyFeedback(metrics, ageGroup) {
            const { score, acc } = metrics;
            let title = "참 잘했어요!";
            let icon = "emoji_events";
            let desc = "대단해요! 아주 훌륭한 실력입니다.";
            let advice = "지금처럼 꾸준히 하면 뇌가 튼튼해져요.";

            if (score >= 80) {
                const praises = {
                    'TODDLER': {
                        title: "우와! 정말 빨라요! 🚀",
                        desc: "눈과 손이 정말 빠르네요.\n번개맨 같아요!"
                    },
                    'ELEMENTARY': {
                        title: "집중력 최고! 🎓",
                        desc: "학교 공부도 문제없겠어요.\n아주 훌륭해요!"
                    },
                    'TEEN': {
                        title: "두뇌 회전 풀가동 ⚡",
                        desc: "학업 효율이 아주 좋은 상태입니다.\n이대로만 하세요!"
                    },
                    'ADULT': {
                        title: "업무 효율 굿! 💼",
                        desc: "복잡한 일도 척척 처리할 수 있는\n준비된 상태입니다."
                    },
                    'SENIOR': {
                        title: "뇌 나이 청춘! 🌳",
                        desc: "아주 건강하십니다.\n지금처럼만 즐겁게 하세요."
                    }
                };
                const praise = praises[ageGroup] || praises['TODDLER'];
                title = praise.title;
                desc = praise.desc;
            } else if (score >= 60) {
                title = "좋아요! 👍";
                icon = "thumb_up";
                desc = "조금만 더 연습하면\n훨씬 더 잘할 수 있어요.";
                advice = "정확하게 보고 누르는 연습을 해보세요.";
            } else {
                title = "화이팅! 💪";
                icon = "fitness_center";
                desc = "천천히 정확하게 하는 것이\n가장 중요해요.";
                advice = "매일 10분씩, 꾸준히 하는 것이 비결입니다.";
            }

            return {
                title,
                icon,
                desc,
                advice,
                score: Math.round(score),
                accuracy: Math.round(acc)
            };
        },

        /**
         * 전문가 모드 임상 피드백 생성
         * 참고: 01-000.html L901-1046
         */
        generateClinicalFeedback(metrics, ageGroup, level) {
            const { rt, acc, iiv, sus, anticipatoryRate } = metrics;
            const levelLabel = level <= 2 ? "저난이도(Low Load)" :
                level <= 4 ? "중난이도(Medium Load)" :
                    "고난이도(High Load)";

            let feedback = `<div class="mb-4"><span class="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold">검사 조건: ${levelLabel}</span></div>`;

            switch (ageGroup) {
                case 'TODDLER':
                    feedback += this._generateToddlerFeedback(anticipatoryRate, acc, level, levelLabel);
                    break;
                case 'ELEMENTARY':
                    feedback += this._generateElementaryFeedback(anticipatoryRate, level, acc, levelLabel);
                    break;
                case 'TEEN':
                    feedback += this._generateTeenFeedback(sus, levelLabel);
                    break;
                case 'ADULT':
                    feedback += this._generateAdultFeedback(sus, levelLabel);
                    break;
                case 'SENIOR':
                    feedback += this._generateSeniorFeedback(level, acc, iiv, levelLabel);
                    break;
                default:
                    feedback += '<div class="p-4 bg-slate-50 rounded-lg border border-slate-200"><p class="text-sm text-slate-600">연령 그룹 정보가 필요합니다.</p></div>';
            }

            return feedback;
        },

        // 연령별 피드백 헬퍼 함수들 (01-000.html L906-1046 참고)
        _generateToddlerFeedback(anticipatoryRate, acc, level, levelLabel) {
            if (anticipatoryRate > 20) {
                return `
                    <div class="mb-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
                        <h4 class="font-bold text-amber-800 text-base mb-2">[관찰] 감각 게이팅(Sensory Gating) 미성숙 패턴</h4>
                        <p class="text-sm text-slate-700 leading-relaxed">예측 반응 비율(${anticipatoryRate.toFixed(1)}%)이 기준치를 초과했습니다. 이는 시각 자극이 대뇌 피질에서 완전히 처리되기 이전에 운동 반응이 먼저 일어나는 현상입니다.</p>
                    </div>
                    <p class="mb-2 font-bold text-slate-800">[임상적 해석]</p>
                    <p class="text-sm text-slate-600 mb-4 leading-relaxed">아동의 인지 발달 과정에서 흔히 나타나는 '충동적 운동 제어' 현상이나, 지속될 경우 학습 상황에서의 주의 산만함으로 이어질 수 있습니다. '무엇'을 보았는지 명확히 인지한 후 행동하도록 유도하는 것이 필요합니다.</p>
                    <div class="bg-white p-3 rounded border border-slate-200">
                        <p class="text-sm font-medium text-slate-800">✅ <strong>처방:</strong> "화면이 바뀌면 '하나, 둘' 세고 누르기 놀이를 해보세요. 속도보다는 정확한 타이밍을 맞추는 것이 더 멋진 일이라고 알려주세요."</p>
                    </div>
                `;
            } else if (acc >= 90) {
                return `
                    <div class="mb-4 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg">
                        <h4 class="font-bold text-indigo-800 text-base mb-2">[관찰] 연령 대비 우수한 주의력 발달 (Superior Attention)</h4>
                        <p class="text-sm text-slate-700 leading-relaxed">${levelLabel} 과제임에도 불구하고 시각적 자극에 대해 안정적이고 정확하게 반응하고 있습니다. 특히 과제 수행 중 주의력이 분산되지 않고 꾸준히 유지되는 점(Sustained Attention)이 매우 고무적입니다.</p>
                    </div>
                    <p class="mb-2 font-bold text-slate-800">[임상적 해석]</p>
                    <p class="text-sm text-slate-600 mb-4 leading-relaxed">전두엽의 기초적인 실행 기능이 순조롭게 발달하고 있습니다. 규칙을 이해하고 이를 행동으로 옮기는 '규칙 준수성'이 또래 대비 상위 수준으로 판단됩니다.</p>
                    <div class="bg-white p-3 rounded border border-slate-200">
                        <p class="text-sm font-medium text-slate-800">✅ <strong>처방:</strong> "아이가 놀이의 규칙을 정확히 이해하고 있습니다. 난이도를 조금씩 높여 성취감을 느끼게 해주세요."</p>
                    </div>
                `;
            } else {
                return `<div class="p-4 bg-slate-50 rounded-lg border border-slate-200"><p class="text-sm text-slate-600">현재 발달 단계에 적합한 수행력을 보이고 있습니다. 규칙을 배우고 적응하는 과정이므로 결과보다는 과정에 칭찬해 주세요.</p></div>`;
            }
        },

        _generateElementaryFeedback(anticipatoryRate, level, acc, levelLabel) {
            if (anticipatoryRate > 30 || (level <= 2 && acc < 70)) {
                return `
                    <div class="mb-4 p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-lg" >
                        <h4 class="font-bold text-rose-800 text-base mb-2">[관찰] 충동적 반응(Impulsivity) 및 억제 실패</h4>
                        <p class="text-sm text-slate-700 leading-relaxed">전체 시행 중 ${anticipatoryRate.toFixed(1)}%가 자극 식별 전 반응으로 나타났습니다. 이는 오답 발생 후에도 반응 속도를 늦추지 않는 패턴(Lack of Post-error Slowing)과 결합되어 행동 억제 시스템의 미성숙을 시사합니다.</p>
                    </div>
                    <p class="mb-2 font-bold text-slate-800">[임상적 해석]</p>
                    <p class="text-sm text-slate-600 mb-4 leading-relaxed">전두엽의 '실행 제어 기능' 중 브레이크 역할(Response Inhibition) 훈련이 시급합니다. 과잉 행동이나 주의력 결핍 성향이 학습 효율을 저하시킬 가능성이 있습니다.</p>
                    <div class="bg-white p-3 rounded border border-slate-200">
                        <p class="text-sm font-medium text-slate-800">✅ <strong>처방:</strong> "빠른 것보다 틀리지 않는 것이 중요합니다. '멈춤-생각-행동'의 3단계 루틴을 연습시켜 주세요."</p>
                    </div>
                `;
            } else if (level >= 4 && acc > 85) {
                return `
                    <div class="mb-4 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg">
                        <h4 class="font-bold text-emerald-800 text-base mb-2">[관찰] 고차원적 인지 처리 능력</h4>
                        <p class="text-sm text-slate-700 leading-relaxed">높은 인지 부하가 요구되는 ${levelLabel} 상황에서도 정확도와 반응 속도의 균형을 잘 유지하고 있습니다.</p>
                    </div>
                    <p class="mb-2 font-bold text-slate-800">[임상적 해석]</p>
                    <p class="text-sm text-slate-600 mb-4 leading-relaxed">작업 기억(Working Memory) 용량이 충분하고 주의 전환 능력이 우수하여, 복잡한 학업 과제도 효율적으로 처리할 수 있는 인지적 준비가 되어 있습니다.</p>
                `;
            } else {
                return `<div class="p-4 bg-slate-50 rounded-lg border border-slate-200"><p class="text-sm text-slate-600">전반적으로 양호한 수행력을 보입니다. 다만 집중력이 흐트러지는 구간이 있으므로 지속적인 주의력 훈련이 권장됩니다.</p></div>`;
            }
        },

        _generateTeenFeedback(sus, levelLabel) {
            if (sus < 80) {
                return `
                    <div class="mb-4 p-4 bg-slate-100 border-l-4 border-slate-500 rounded-r-lg">
                        <h4 class="font-bold text-slate-800 text-base mb-2">[관찰] 주의력 감퇴(Vigilance Decrement) 현상</h4>
                        <p class="text-sm text-slate-700 leading-relaxed">검사 초반에 비해 후반부로 갈수록 반응 속도가 느려지거나 정확도가 급격히 하락하는 인지 피로(Cognitive Fatigue) 누적 현상이 뚜렷합니다.</p>
                    </div>
                    <p class="mb-2 font-bold text-slate-800">[임상적 해석]</p>
                    <p class="text-sm text-slate-600 mb-4 leading-relaxed">이는 만성적인 수면 부족이나 과도한 학업 스트레스로 인해 뇌의 각성 수준(Arousal Level)이 저하된 상태입니다. 현재 상태에서의 추가적인 학습은 효율이 떨어질 수 있습니다.</p>
                    <div class="bg-white p-3 rounded border border-slate-200">
                        <p class="text-sm font-medium text-slate-800">✅ <strong>처방:</strong> "지금 뇌에게 필요한 것은 훈련이 아니라 양질의 수면입니다. 뇌가 정보를 정리할 시간을 주세요."</p>
                    </div>
                `;
            } else {
                return `
                    <div class="mb-4 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg">
                        <h4 class="font-bold text-indigo-800 text-base mb-2">[관찰] 최적화된 실행 기능(Executive Function)</h4>
                        <p class="text-sm text-slate-700 leading-relaxed">불필요한 자극을 무시하고 목표 자극에만 반응하는 '선택적 주의력'과, 실수를 즉시 교정하는 '모니터링 능력'이 매우 우수합니다.</p>
                    </div>
                    <p class="mb-2 font-bold text-slate-800">[임상적 해석]</p>
                    <p class="text-sm text-slate-600 mb-4 leading-relaxed">고등 사고를 담당하는 전두엽 피질이 효율적으로 작동하고 있습니다. 복잡한 문제 해결이나 논리적 사고가 요구되는 과제에서도 높은 수행력이 기대됩니다.</p>
                `;
            }
        },

        _generateAdultFeedback(sus, levelLabel) {
            if (sus < 85) {
                return `
                    <div class="mb-4 p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-lg">
                        <h4 class="font-bold text-rose-800 text-base mb-2">[관찰] 번아웃(Burnout) 증후군 경고</h4>
                        <p class="text-sm text-slate-700 leading-relaxed">단순 과제임에도 불구하고 주의 유지력(${sus.toFixed(1)}%)이 현저히 떨어집니다. 이는 인지 자원이 고갈되어 정보 처리에 과도한 에너지가 소모되고 있음을 나타냅니다.</p>
                    </div>
                    <p class="mb-2 font-bold text-slate-800">[임상적 해석]</p>
                    <p class="text-sm text-slate-600 mb-4 leading-relaxed">교감신경계가 과항진되어 있어 휴식 상태에서도 뇌가 쉬지 못하고 있을 가능성이 큽니다. 업무 효율 저하 및 기억력 감퇴가 동반될 수 있습니다.</p>
                    <div class="bg-white p-3 rounded border border-slate-200">
                        <p class="text-sm font-medium text-slate-800">✅ <strong>처방:</strong> "스마트폰을 멀리하고 멍하게 있는 시간(DMN 활성화)을 가져보세요. 뇌의 휴식이 절실합니다."</p>
                    </div>
                `;
            } else {
                return `
                    <div class="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                        <h4 class="font-bold text-blue-800 text-base mb-2">[관찰] 안정적인 직무 수행 역량</h4>
                        <p class="text-sm text-slate-700 leading-relaxed">반응 속도(RT)와 정확도(ACC)의 변동 계수가 낮아 매우 일관성 있는 수행력을 보입니다. 이는 장시간 업무에도 집중력을 유지할 수 있는 뇌의 지구력이 우수함을 의미합니다.</p>
                    </div>
                    <p class="mb-2 font-bold text-slate-800">[임상적 해석]</p>
                    <p class="text-sm text-slate-600 mb-4 leading-relaxed">현재의 인지 기능 상태는 매우 양호합니다. 이를 유지하기 위해 주기적인 유산소 운동과 새로운 취미 활동을 병행하는 것이 좋습니다.</p>
                `;
            }
        },

        _generateSeniorFeedback(level, acc, iiv, levelLabel) {
            if ((level <= 2 && acc < 70) || iiv > 300) {
                return `
                    <div class="mb-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
                        <h4 class="font-bold text-amber-800 text-base mb-2">[관찰] 인지 예비능(Cognitive Reserve) 저하 징후</h4>
                        <p class="text-sm text-slate-700 leading-relaxed">반응 시간의 편차(IIV)가 매우 크고 정확도가 70% 미만으로 나타났습니다. 이는 신경 전달 과정에서의 '노이즈'가 증가하여 정보 처리 효율이 떨어진 상태입니다.</p>
                    </div>
                    <p class="mb-2 font-bold text-slate-800">[임상적 해석]</p>
                    <p class="text-sm text-slate-600 mb-4 leading-relaxed">경도인지장애(MCI)로 이행될 위험이 있는 단계로, 단순한 건망증과는 구별되는 '관리 신호'로 받아들여야 합니다. 적극적인 인지 중재가 필요합니다.</p>
                    <div class="bg-white p-3 rounded border border-slate-200">
                        <p class="text-sm font-medium text-slate-800">✅ <strong>처방:</strong> "지금이 골든타임입니다. 약을 챙겨 드시듯 매일 20분씩 뇌 훈련을 꾸준히 하시면 기능을 보존할 수 있습니다."</p>
                    </div>
                `;
            } else if (acc >= 90) {
                return `
                    <div class="mb-4 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg">
                        <h4 class="font-bold text-emerald-800 text-base mb-2">[관찰] 성공적인 노화(Successful Aging) 모델</h4>
                        <p class="text-sm text-slate-700 leading-relaxed">운동 반응 속도는 자연스러운 노화로 인해 다소 느려졌으나, 과제를 정확하게 수행하는 '결정적 지능'은 매우 훌륭하게 보존되어 있습니다.</p>
                    </div>
                    <p class="mb-2 font-bold text-slate-800">[임상적 해석]</p>
                    <p class="text-sm text-slate-600 mb-4 leading-relaxed">뇌의 보상 기제(Compensatory Mechanism)가 잘 작동하고 있어 일상생활 수행에 무리가 없는 건강한 상태입니다. 현재의 라이프스타일을 유지하십시오.</p>
                `;
            } else {
                return `<div class="p-4 bg-slate-50 rounded-lg border border-slate-200"><p class="text-sm text-slate-600">동년배와 유사한 인지 기능을 보유하고 계십니다. 규칙적인 운동과 사회 활동이 현재 기능을 유지하는 데 큰 도움이 됩니다.</p></div>`;
            }
        },

        /**
         * 기존 호환성을 위한 analyzeSession (deprecated)
         */
        analyzeSession(level, totalAttempts) {
            return this.calculateMetrics(level, totalAttempts);
        },

        reset() {
            this.sessionData = {
                rawRTs: [],
                validRTs: [],
                accuracies: [],
                errors: 0,
                lapses: 0,
                startTime: Date.now(),
                blockData: []
            };
        },

        /**
         * 기존 호환성을 위한 generateReport (deprecated)
         */
        generateReport(ageGroup, difficulty, metrics) {
            const baselineRT = 800;
            const baselineACC = 85;

            let performanceScore = 0;
            if (metrics.rtAvg < baselineRT) performanceScore += 30;
            if (metrics.accuracy > baselineACC) performanceScore += 40;
            if (metrics.iiv < 200) performanceScore += 20;
            if (metrics.susRate < 5) performanceScore += 10;

            let riskLevel = 'normal';
            if (performanceScore < 40) riskLevel = 'attention';
            else if (performanceScore >= 80) riskLevel = 'excellent';

            return {
                score: performanceScore,
                riskLevel,
                feedback: this._generateSimpleFeedback(metrics, ageGroup)
            };
        },

        _generateSimpleFeedback(metrics, ageGroup) {
            const { rtAvg, accuracy, iiv } = metrics;
            let feedback = '';

            if (accuracy >= 90) {
                feedback += '정확도가 매우 우수합니다. ';
            } else if (accuracy >= 75) {
                feedback += '정확도가 양호합니다. ';
            } else {
                feedback += '정확도 향상이 필요합니다. ';
            }

            if (rtAvg < 600) {
                feedback += '반응 속도가 빠릅니다. ';
            } else if (rtAvg < 1000) {
                feedback += '반응 속도가 적절합니다. ';
            } else {
                feedback += '반응 속도가 느린 편입니다. ';
            }

            return feedback;
        },

        /**
         * Chart.js 레이더 차트 렌더링
         */
        renderChart(canvasId, chartData) {
            const ctx = document.getElementById(canvasId);
            if (!ctx) return null;

            return new Chart(ctx, {
                type: 'radar',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: { stepSize: 20 }
                        }
                    }
                }
            });
        },

        /**
         * 연령별/난이도별 가중치 적용 점수 계산
         * 참고: 2.html L62-84 - 연령별 난이도별 가중치 매트릭스
         */
        calculateScoreByAge(metrics, ageGroup, level) {
            // 참고: 2.html L64-68 - 유아 가중치
            // 참고: 2.html L72-73 - 초등 가중치
            // 참고: 2.html L77-78 - 청소년/성인 가중치
            // 참고: 2.html L82-83 - 고령자 가중치

            const weights = {
                'TODDLER': {
                    low: { acc: 0.6, sus: 0.3, rt: 0.1 },
                    mid: { acc: 0.4, anticipatory: 0.4, iiv: 0.2 },
                    high: { acc: 0.4, rt: 0.3, iiv: 0.3 }
                },
                'ELEMENTARY': {
                    low: { acc: 0.3, sus: 0.4, rt: 0.3 },
                    high: { acc: 0.3, learning: 0.3, rt: 0.2, iiv: 0.2 }
                },
                'TEEN': {
                    low: { rt: 0.4, acc: 0.4, iiv: 0.2 },
                    high: { rt: 0.3, acc: 0.3, learning: 0.2, sus: 0.2 }
                },
                'ADULT': {
                    low: { rt: 0.4, acc: 0.4, iiv: 0.2 },
                    high: { rt: 0.3, acc: 0.3, learning: 0.2, sus: 0.2 }
                },
                'SENIOR': {
                    low: { acc: 0.4, lapse: 0.3, persistence: 0.3 },
                    high: { acc: 0.3, rt: 0.2, iiv: 0.2, sus: 0.3 }
                }
            };

            const levelKey = level <= 2 ? 'low' : 'high';
            const w = weights[ageGroup]?.[levelKey] || weights['ADULT'].low;

            let score = 0;
            const normalized = {
                acc: metrics.normACC || metrics.acc,
                rt: metrics.normRT || (100 - Math.min(100, metrics.rt / 15)),
                iiv: metrics.normIIV || (100 - Math.min(100, metrics.iiv / 5)),
                sus: metrics.normSUS || metrics.sus,
                anticipatory: Math.max(0, 100 - (metrics.anticipatoryRate || 0) * 5),
                lapse: Math.max(0, 100 - (metrics.lapseRate || 0) * 10),
                learning: 70, // 기본값 (종단 데이터 필요)
                persistence: metrics.sus || 70
            };

            for (const [key, weight] of Object.entries(w)) {
                score += (normalized[key] || 0) * weight;
            }

            return Math.round(score);
        },

        /**
         * 초정밀 전문가 상담 스크립트 생성
         * 참고: 1.html L68-86 - 점수별 임상 해석 및 상담 피드백
         */
        generateExpertScript(score, metrics, ageGroup) {
            // 참고: 1.html L69-71 - 98~100점 완벽형
            if (score >= 98) {
                return {
                    grade: '완벽형 - 유동성 지능 극상',
                    clinical: 'PFC 활성도 최상위. 정보 처리 속도와 정확성이 완벽한 균형을 이룸.',
                    script: `검사 결과, 반응 속도 평균 ${metrics.rt}ms, 오답률 ${(100 - metrics.acc).toFixed(1)}%로 동년배 상위 1% 이내의 완벽한 뇌 건강 상태를 증명하셨습니다. 최고 수준의 실행 기능을 유지하기 위해 고난도 멀티태스킹 훈련을 처방합니다.`,
                    color: '#1e40af'
                };
            }
            // 참고: 1.html L73-75 - 95~97점 초고속 편향형
            else if (score >= 95) {
                return {
                    grade: '초고속 편향형 - 미세 억제 실패',
                    clinical: '정신운동 속도는 한계치이나 기저핵 운동 억제 타이밍이 0.1초 빗나감.',
                    script: `뇌의 회전이 아주 민첩합니다! 다만 빠른 속도 탓에 '충동성 오류'가 ${metrics.anticipatoryRate?.toFixed(1)}% 발견되었습니다. 0.5초 브레이크 연습을 하시면 완벽한 만점이 예상됩니다.`,
                    color: '#f59e0b'
                };
            }
            // 참고: 1.html L78-80 - 78~84점 주의력 감쇠형
            else if (score >= 78) {
                return {
                    grade: '주의력 감쇠형 - Vigilance Decrement',
                    clinical: '후반부 집중력 표준편차(SD) 급증. 각성 유지 실패.',
                    script: `초반 인지 효율은 우수하나 후반부 반응 시간이 증가합니다 (주의 유지력: ${metrics.sus}%). 뇌의 인지적 체력이 떨어져 있으니 3분 단위로 짧게 훈련하세요.`,
                    color: '#3b82f6'
                };
            }
            // 참고: 2.html L115-120 - 점수 구간별 등급
            else if (score >= 70) {
                return {
                    grade: '양호',
                    clinical: '가벼운 주의 필요. 경미한 저하 가능성.',
                    script: `약간의 변화가 보입니다 (정확도: ${metrics.acc}%, 반응속도: ${metrics.rt}ms). 집중력 유지에 신경 쓰세요. 재훈련을 통해 개선 가능합니다.`,
                    color: '#22c55e'
                };
            }
            else if (score >= 60) {
                return {
                    grade: '주의',
                    clinical: '주의력 및 인지 능력 저하 가능성.',
                    script: `재훈련을 권장합니다. 현재 반응 일관성(IIV: ${metrics.iiv}ms)에 변동이 감지되었습니다.`,
                    color: '#eab308'
                };
            }
            // 참고: 1.html L83-85 - 60점 미만 정신운동 지연
            else {
                return {
                    grade: '정신운동 지연 및 위험군',
                    clinical: '자극 수용 후 운동 출력 경로 손상 의심. 일상생활 간섭 우려.',
                    script: `반응 속도가 동년배 평균보다 지연되었습니다 (${metrics.rt}ms). 뇌와 손의 연결고리를 다시 잇는 기초 감각 재활을 시작하겠습니다. 전문의 상담을 권장합니다.`,
                    color: '#dc2626'
                };
            }
        },

        /**
         * 뇌 영역 결함 패턴 매핑 및 처방 게임 추천
         * 참고: 1.html L96-112 - 뇌신경 영역별 게임 처방 매핑
         */
        mapBrainRegionDeficit(metrics, gameID) {
            const deficits = [];

            //  참고: 1.html L96-100 - DLPFC (작업 기억)
            if (metrics.errorRate > 20 || metrics.postErrorSlowing < 10) {
                deficits.push({
                    region: 'DLPFC',
                    regionKo: '등외측 전전두피질',
                    function: '작업 기억 (Working Memory)',
                    deficit: `오류율 ${metrics.errorRate.toFixed(1)}%, 오답 후 학습 실패`,
                    prescription: ['숫자 카운트', 'N-Back 게임', '무게 저울', '동전 계산기']
                });
            }

            // 참고: 1.html L101-104 - IFG (억제 제어)
            if (metrics.anticipatoryRate > 20) {
                deficits.push({
                    region: 'VMPFC',
                    regionKo: '복내측 전전두피질',
                    function: '억제 제어 (Response Inhibition)',
                    deficit: `과잉 반응 ${metrics.anticipatoryRate.toFixed(1)}%, 충동성 행동`,
                    prescription: ['신호등 지킴이', '색깔 사냥꾼', '감정 읽기', '에티켓 게임']
                });
            }

            // 참고: 1.html L105-106 - Parietal (시공간 처리)
            if (metrics.iiv > 300) {
                deficits.push({
                    region: 'Parietal',
                    regionKo: '두정얽',
                    function: '시공간 처리 (Visuospatial)',
                    deficit: '조작 실패, 위치 기억 누락',
                    prescription: ['위치 기억 게임', '선 따라가기', '요격 게임', '블록 쌓기']
                });
            }

            // 참고: 1.html L109-110 - Temporal/Hippocampus (기억)
            if (metrics.lapseRate > 15) {
                deficits.push({
                    region: 'Temporal/Hippocampus',
                    regionKo: '측두엽/해마',
                    function: '기억 형성 및 회상',
                    deficit: '소리 변별 실패, 단기 회상 폭락',
                    prescription: ['첫소리 찾기', '전화번호 누르기', '사라진 물건 찾기']
                });
            }

            return deficits;
        },

        /**
         * 각 인지 지표에 대한 간략한 설명 반환
         */
        getMetricDescriptions() {
            return {
                speed: "처리 속도 - 시각 자극을 인식하고 반응하는 속도입니다. 빠를수록 뇌의 정보 처리가 효율적입니다.",
                accuracy: "정확도 - 전체 시행에서 정답을 맞춘 비율입니다. 높을수록 집중력과 판단력이 우수합니다.",
                consistency: "일관성 - 반응 속도의 변동성입니다. 낮을수록 안정적이고 예측 가능한 뇌 활동을 의미합니다.",
                attention: "주의력 - 과제 수행 동안 집중력을 유지하는 능력입니다. 높을수록 장시간 집중력 유지가 가능합니다.",
                execution: "실행 기능 - 목표 지향적 행동을 계획하고 실행하는 능력입니다. 전두엽의 고차원 인지 기능을 반영합니다.",
                inhibition: "억제 통제 - 충동적 반응을 억제하는 능력입니다. 높을수록 자제력과 행동 통제력이 뛰어납니다.",
                vigilance: "경계 유지 - 지속적으로 주의를 기울이는 능력입니다. 높을수록 장기간 경계 상태를 유지할 수 있습니다.",
                errorMonitoring: "오류 모니터링 - 실수 후 적응하는 능력입니다. 높을수록 학습과 자기 교정 능력이 우수합니다.",
                endurance: "지구력 - 피로도에 저항하는 능력입니다. 높을수록 장시간 과제 수행 시에도 성능 유지가 가능합니다.",
                control: "억제력 - 부적절한 행동을 참는 능력입니다. GO/NOGO 과제의 핵심 지표로 충동성을 평가합니다."
            };
        },

        /**
         * Red Flag 경고 시스템
         * 참고: 1.html L119-121 - 임상 Red Flag 로직
         */
        checkRedFlags(metrics, sessionHistory = {}) {
            const flags = [];

            // 참고: 1.html L119 - Red Flag 1: 심각한 정신운동 지연
            if (metrics.rt > 2000 && metrics.acc < 50) {
                flags.push({
                    type: 'DANGER',
                    level: '심각',
                    title: '심각한 정신운동 지연 감지',
                    message: '3회 연속 Z-score > +3.0 이탈 시 난이도 강제 강등 및 보호자 위험 알림 발송.',
                    action: '난이도를 1단계로 낮추고, 기초 감각 재활을 시작하세요.',
                    color: '#dc2626'
                });
            }

            // 참고: 1.html L120 - Red Flag 2: 학습 곡선 역행
            if (sessionHistory.accuracyDrop >= 15) {
                flags.push({
                    type: 'WARNING',
                    level: '경고',
                    title: '학습 곡선 마이너스 역행',
                    message: `4주간 정확도 ${sessionHistory.accuracyDrop}% 하락. 치매 악화 의심.`,
                    action: '청각 위주 단순 훈련으로 강제 전환 권장.',
                    color: '#f59e0b'
                });
            }

            // 추가: 극심한 변동성 경고
            if (metrics.iiv > 500) {
                flags.push({
                    type: 'CAUTION',
                    level: '주의',
                    title: '반응 시간 극심한 변동성',
                    message: `IIV ${metrics.iiv}ms는 신경 전달 과정의 노이즈 증가 신호입니다.`,
                    action: '안정적인 환경에서 충분한 휴식 후 재시도하세요.',
                    color: '#eab308'
                });
            }

            return flags;
        }
    };

    // ========== GAME LOGGER ==========
    /**
     * Supabase 기반 게임 세션 로깅
     * histories 테이블에 게임 플레이 데이터 저장
     */
    const GameLogger = {
        async logGameSession(gameData) {
            if (!window.supabase) {
                console.error('[GameLogger] Supabase not available');
                return { success: false, error: 'Supabase not initialized' };
            }

            try {
                // 현재 시간 (YYYY-MM-DD HH:mm:ss)
                const now = new Date();
                const eventDatetime = now.toISOString().slice(0, 19).replace('T', ' ');

                const logData = {
                    client_id: gameData.clientId.toString(),
                    category: 'session_history',
                    action: '게임 완료',
                    event_datetime: eventDatetime,
                    details: JSON.stringify({
                        game_id: gameData.gameId,
                        game_name: gameData.gameName,
                        level: gameData.level,
                        total_rounds: gameData.totalRounds || 0,
                        metrics: gameData.metrics,
                        raw_data: gameData.rawData || null,
                        completed: true,
                        timestamp: now.toISOString()
                    }),
                    metadata: {
                        duration: gameData.duration || 0,
                        game_version: '1.0'
                    }
                };

                const { data, error } = await window.supabase
                    .from('histories')
                    .insert([logData])
                    .select();

                if (error) {
                    console.error('[GameLogger] Error:', error);
                    return { success: false, error: error.message };
                }

                console.log('[GameLogger] Session logged successfully:', data);
                return { success: true, data: data[0] };
            } catch (err) {
                console.error('[GameLogger] Exception:', err);
                return { success: false, error: err.message };
            }
        }
    };

    // ========== MOCK DATA GENERATOR ==========
    /**
     * 성장 리포트 테스트용 가상 데이터 생성기
     * 지난 6개월간 우상향 성장 곡선 데이터 생성
     */
    const MockDataGenerator = {
        generateGrowthData(config = {}) {
            const defaultConfig = {
                sessionCount: 50, // Changed from 15 to 50
                startMonthsAgo: 3, // Changed from 6 to 3
                clientId: 'mock_client',
                games: [
                    { id: '01-000', name: '색깔 맞추기' },
                    { id: '01-001', name: '신호등 지킴이' }
                ],
                ageGroup: 'elementary',
                improvementCurve: {
                    avgRT: { start: 800, end: 550, curve: 'exponential' },
                    accuracy: { start: 0.65, end: 0.92, curve: 'logarithmic' },
                    iiv: { start: 220, end: 140, curve: 'linear' },
                    sustainedAttention: { start: 0.70, end: 0.95, curve: 'logarithmic' },
                    anticipatoryRate: { start: 0.15, end: 0.07, curve: 'exponential' },
                    postErrorSlowing: { start: 180, end: 120, curve: 'linear' },
                    fatigueIndex: { start: 0.10, end: 0.05, curve: 'exponential' },
                    efficiency: { start: 0.65, end: 0.93, curve: 'logarithmic' },
                    lapseRate: { start: 0.12, end: 0.03, curve: 'exponential' }
                }
            };

            const mergedConfig = { ...defaultConfig, ...config };
            const sessions = [];

            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - mergedConfig.startMonthsAgo);
            const dateRange = endDate - startDate;

            for (let i = 0; i < mergedConfig.sessionCount; i++) {
                const progress = i / (mergedConfig.sessionCount - 1); // 0 to 1
                const sessionDate = new Date(startDate.getTime() + (dateRange * progress));
                const gameIndex = i % mergedConfig.games.length;
                const game = mergedConfig.games[gameIndex];

                // 레벨은 시간에 따라 1 -> 5로 증가
                const level = Math.min(1 + Math.floor(progress * 4), 5);

                sessions.push({
                    id: `mock_${Date.now()}_${i}`,
                    client_id: mergedConfig.clientId,
                    category: 'session_history',
                    action: '게임 완료',
                    event_datetime: sessionDate.toISOString().slice(0, 19).replace('T', ' '),
                    details: JSON.stringify({
                        game_id: game.id,
                        game_name: game.name,
                        level: level,
                        total_rounds: 10,
                        metrics: this._generateProgressiveMetrics(progress, mergedConfig.improvementCurve),
                        is_mock: true,
                        mock_progress: progress
                    }),
                    created_at: sessionDate.toISOString(),
                    metadata: {
                        duration: Math.floor(300 + Math.random() * 300), // 5-10분
                        game_version: '1.0'
                    }
                });
            }

            return sessions;
        },

        _generateProgressiveMetrics(progress, curves) {
            return {
                avgRT: this._interpolate(curves.avgRT.start, curves.avgRT.end, progress, curves.avgRT.curve),
                accuracy: this._interpolate(curves.accuracy.start, curves.accuracy.end, progress, curves.accuracy.curve),
                iiv: this._interpolate(curves.iiv.start, curves.iiv.end, progress, curves.iiv.curve),
                sustainedAttention: this._interpolate(curves.sustainedAttention.start, curves.sustainedAttention.end, progress, curves.sustainedAttention.curve),
                anticipatoryRate: this._interpolate(curves.anticipatoryRate.start, curves.anticipatoryRate.end, progress, curves.anticipatoryRate.curve),
                postErrorSlowing: this._interpolate(curves.postErrorSlowing.start, curves.postErrorSlowing.end, progress, curves.postErrorSlowing.curve),
                fatigueIndex: this._interpolate(curves.fatigueIndex.start, curves.fatigueIndex.end, progress, curves.fatigueIndex.curve),
                efficiency: this._interpolate(curves.efficiency.start, curves.efficiency.end, progress, curves.efficiency.curve),
                lapseRate: this._interpolate(curves.lapseRate.start, curves.lapseRate.end, progress, curves.lapseRate.curve)
            };
        },

        _interpolate(start, end, progress, curveType) {
            // 약간의 랜덤 노이즈 추가 (±5%)
            const noise = 1 + (Math.random() - 0.5) * 0.1;

            let value;
            switch (curveType) {
                case 'exponential':
                    // 초기에 빠르게 개선, 점차 완만
                    value = start + (end - start) * (1 - Math.exp(-3 * progress));
                    break;
                case 'logarithmic':
                    // 초기에 완만, 점차 개선
                    value = start + (end - start) * Math.log(1 + progress * 9) / Math.log(10);
                    break;
                case 'linear':
                default:
                    value = start + (end - start) * progress;
                    break;
            }

            return value * noise;
        },

        async insertMockDataToDatabase(clientId) {
            if (!window.supabase) {
                console.error('[MockData] Supabase not available');
                return { success: false, error: 'Supabase not initialized' };
            }

            const mockSessions = this.generateGrowthData({ clientId });

            try {
                const { data, error } = await window.supabase
                    .from('histories')
                    .insert(mockSessions);

                if (error) {
                    console.error('[MockData] Insert error:', error);
                    return { success: false, error: error.message };
                }

                console.log(`[MockData] ${mockSessions.length} mock sessions inserted for client ${clientId}`);
                return { success: true, count: mockSessions.length, data };
            } catch (err) {
                console.error('[MockData] Exception:', err);
                return { success: false, error: err.message };
            }
        }
    };

    // ========== HISTORY MANAGER (Supabase Integration) ==========
    /**
     * 게임 기록을 Supabase histories 테이블에 저장
     * teacher_id가 없으면 조용히 무시 (게스트 모드)
     */
    const HistoryManager = {
        /**
         * 세션 정보 가져오기 (localStorage 또는 URL 파라미터)
         */
        getSessionInfo() {
            try {
                let session = {};

                // 1. localStorage에서 선생님 세션 확인
                const stored = localStorage.getItem('haha_lab_session');
                if (stored) {
                    session = JSON.parse(stored);
                }

                // 2. URL 파라미터 확인 (우선순위 높음)
                const params = new URLSearchParams(window.location.search);
                const teacherIdParam = params.get('teacher_id');
                const clientIdParam = params.get('client_id');
                const scheduleIdParam = params.get('schedule_id');

                // 3. 병합 (URL 파라미터가 있으면 덮어쓰기)
                const teacherId = teacherIdParam || session.teacherId || session.teacher_id;
                const clientId = clientIdParam ? parseInt(clientIdParam) : (session.clientId || session.client_id || session.currentSession?.client?.id);
                const scheduleId = scheduleIdParam ? parseInt(scheduleIdParam) : (session.scheduleId || session.schedule_id || session.currentSession?.schedule?.id);

                // client_name 추출 (index.html에서 haha_lab_current_session 등 사용 가능)
                let clientName = null;
                const currentSessionStore = localStorage.getItem('haha_lab_current_session');
                if (currentSessionStore) {
                    try {
                        const parsedC = JSON.parse(currentSessionStore);
                        if (parsedC?.client?.name) clientName = parsedC.client.name;
                    } catch (e) { }
                }

                if (!clientName && session.currentSession?.client?.name) {
                    clientName = session.currentSession.client.name;
                }

                if (teacherId) {
                    return {
                        teacherId,
                        clientId: clientId || null,
                        scheduleId: scheduleId || null,
                        clientName: clientName || '알수없음'
                    };
                }

                return null;
            } catch (e) {
                console.warn('[PlayLab History] Session info parse error:', e);
                return null;
            }
        },

        /**
         * 게임 기록 저장
         * @param {Object} gameData - 게임 데이터
         * @param {string} gameData.gameId - 게임 ID (예: '01-002')
         * @param {string} gameData.gameName - 게임 이름
         * @param {string} gameData.group - 연령 그룹
         * @param {number} gameData.level - 난이도
         * @param {number} gameData.score - 점수
         * @param {number} gameData.duration - 플레이 시간 (초)
         * @param {Object} gameData.metrics - 게임 메트릭
         */
        async saveGameHistory(gameData) {
            // Supabase 확인
            if (!window.supabase) {
                console.warn('[PlayLab History] Supabase not available, skipping save');
                return { success: false, error: 'Supabase not initialized' };
            }

            // 세션 정보 확인
            const sessionInfo = this.getSessionInfo();
            if (!sessionInfo || !sessionInfo.teacherId) {
                console.log('[PlayLab History] No teacher session, playing in guest mode');
                return { success: false, error: 'Guest mode, no history saved' };
            }

            const { teacherId, clientId, scheduleId, clientName } = sessionInfo;

            try {
                // action_type 결정
                const actionTypeMap = {
                    '01-000': 'game_color',
                    '01-001': 'game_go_nogo',
                    '01-002': 'game_mole_whack',
                    '01-003': 'game_stroop',
                    '01-004': 'game_simon'
                };
                const actionType = actionTypeMap[gameData.gameId] || 'game_custom';

                // 기록 생성
                const historyRecord = {
                    teacher_id: teacherId,
                    client_id: clientId,
                    client_name: clientName,
                    schedule_id: scheduleId,
                    type: 'game_play',
                    category: 'session_history',
                    action: '게임 완료',
                    action_type: actionType,
                    title: gameData.gameName || '게임 훈련',
                    event_datetime: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    description: `그룹: ${gameData.group}, 레벨: ${gameData.level}, 점수: ${gameData.score}`,
                    duration: gameData.duration || 0,
                    details: JSON.stringify({
                        game_id: gameData.gameId,
                        game_name: gameData.gameName,
                        level: gameData.level,
                        metrics: gameData.metrics || {}
                    }),
                    metadata: {
                        group: gameData.group,
                        score: gameData.score,
                        timestamp: new Date().toISOString()
                    }
                };

                // Supabase에 저장
                const { data, error } = await window.supabase
                    .from('histories')
                    .insert([historyRecord])
                    .select();

                if (error) {
                    console.error('[PlayLab History] Save error:', error);
                    return { success: false, error: error.message };
                }

                console.log('[PlayLab History] ✅ Game history saved:', data);
                return { success: true, data };

            } catch (err) {
                console.error('[PlayLab History] Exception:', err);
                return { success: false, error: err.message };
            }
        }
    };


    // ========== PUBLIC API ==========
    return {
        // Constants
        SOUNDS,
        BUTTONS,
        INPUT_DEVICES,  // v1.1 추가: 입력 기기 타입 상수

        // Modules
        Audio: AudioManager,
        Gamepad: GamepadManager,
        UI: UIController,
        Analysis: ClinicalAnalysis,
        Logger: GameLogger,
        MockData: MockDataGenerator,
        History: HistoryManager,

        // Initialization
        init(config) {
            console.log(`[PlayLab Core] Initializing ${config.gameName || 'Game'}...`);
            AudioManager.init();
            GamepadManager.init();
            ClinicalAnalysis.reset();
            console.log('[PlayLab Core] Ready!');
        },

        // Helper functions
        getVersion() {
            return '1.1';  // 임상 표준 RT 측정 시스템 추가
        }
    };
})();

// Make it globally available
window.PlayLabCore = PlayLabCore;
