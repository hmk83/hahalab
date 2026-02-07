import { Category, CategoryId, ContentItem } from './types';

// Using a generative image service to create illustrations matching the specific descriptions.
// Updated style to match the vibrant flat vector art from the user's reference images.

const STYLE_SUFFIX = "flat vector illustration, vibrant colors, cute characters, white background, high quality";

export const CATEGORIES: Category[] = [
  {
    id: CategoryId.THINKING,
    title: '생각 플레이',
    subtitle: '인지 학습',
    description: '기억력, 주의력, 문제해결력을 향상시키는 인지 재활 훈련 프로그램입니다.',
    // Description: Matches Image 1 (Lightbulb, Puzzle, Target)
    // Updated prompt to be extremely specific to the user's image 01
    imageUrl: `https://image.pollinations.ai/prompt/flat%20vector%20art%20group%20study%20three%20characters%20man%20blue%20hair%20pink%20jacket%20pointing%20at%20lightbulb%20idea%20woman%20looking%20at%20target%20man%20orange%20shirt%20solving%20puzzle%20pieces%20${encodeURIComponent(STYLE_SUFFIX)}?width=800&height=600&nologo=true&seed=120`,
    color: 'bg-orange-100',
  },
  {
    id: CategoryId.SOUND,
    title: '소리 플레이',
    subtitle: '음소 학습',
    description: '음소 인식 및 조음 능력 개선을 위한 청각·언어 기초 훈련을 제공합니다.',
    // Description: Matches Image 2 (Mouth articulation, Listening, Speaking)
    // Updated prompt to be extremely specific to the user's image 02
    imageUrl: `https://image.pollinations.ai/prompt/flat%20vector%20speech%20therapy%20three%20elements%20girl%20pink%20hair%20listening%20to%20sounds%20big%20red%20mouth%20showing%20tongue%20articulation%20man%20holding%20letter%20card%20speaking%20${encodeURIComponent(STYLE_SUFFIX)}?width=800&height=600&nologo=true&seed=121`,
    color: 'bg-blue-100',
  },
  {
    id: CategoryId.LISTENING,
    title: '듣기 플레이',
    subtitle: '청각 학습',
    description: '청각적 주의력 집중과 말소리 변별력을 기르는 전문 청능 훈련입니다.',
    // Description: Child with headphones
    imageUrl: `https://image.pollinations.ai/prompt/cute%20child%20wearing%20big%20headphones%20listening%20music%20${encodeURIComponent(STYLE_SUFFIX)}?width=800&height=600&nologo=true&seed=103`,
    color: 'bg-green-100',
  },
  {
    id: CategoryId.VISUAL,
    title: '보기 플레이',
    subtitle: '시지각 학습',
    description: '시각 정보 처리 속도와 정확성을 높이는 시지각 발달 및 재활 훈련입니다.',
    // Description: Child looking at blocks
    imageUrl: `https://image.pollinations.ai/prompt/child%20playing%20with%20colorful%20building%20blocks%20toys%20${encodeURIComponent(STYLE_SUFFIX)}?width=800&height=600&nologo=true&seed=104`,
    color: 'bg-purple-100',
  },
  {
    id: CategoryId.SPEAKING,
    title: '말하기 플레이',
    subtitle: '어휘/표현',
    description: '어휘력 확장과 문장 구성 능력 증진을 돕는 언어 표현 치료 프로그램입니다.',
    // Description: Teacher and child conversation
    imageUrl: `https://image.pollinations.ai/prompt/teacher%20and%20child%20having%20a%20happy%20conversation%20talking%20${encodeURIComponent(STYLE_SUFFIX)}?width=800&height=600&nologo=true&seed=105`,
    color: 'bg-yellow-100',
  },
  {
    id: CategoryId.LIFE,
    title: '생활 플레이',
    subtitle: '일상/사회',
    description: '일상생활 동작 수행(ADL)과 사회적 상호작용 기술 습득을 위한 적응 훈련입니다.',
    // Description: House illustration
    imageUrl: `https://image.pollinations.ai/prompt/cute%20simple%20house%20home%20exterior%20${encodeURIComponent(STYLE_SUFFIX)}?width=800&height=600&nologo=true&seed=106`,
    color: 'bg-red-100',
  },
  {
    id: CategoryId.ART,
    title: '아트 플레이',
    subtitle: '미술',
    description: '소근육 운동 조절 능력 향상과 심리적 정서 안정을 유도하는 창의 미술 활동입니다.',
    // Description: Art supplies
    imageUrl: `https://image.pollinations.ai/prompt/art%20supplies%20paintbrush%20palette%20sketchbook%20${encodeURIComponent(STYLE_SUFFIX)}?width=800&height=600&nologo=true&seed=107`,
    color: 'bg-pink-100',
  },
];

export const INITIAL_CONTENTS: ContentItem[] = [
  {
    id: 'cm-1',
    categoryId: CategoryId.THINKING,
    title: '색깔 맞추기 (인지 훈련)',
    thumbnailUrl: `https://image.pollinations.ai/prompt/memory%20game%20color%20buttons%20brain%20training%20${encodeURIComponent(STYLE_SUFFIX)}?width=300&height=300&nologo=true`,
    tags: ['기억력', '순발력', '인지재활', '색깔'],
    targetUrl: './color-matching.html',
    createdAt: Date.now(),
  },
  {
    id: '1',
    categoryId: CategoryId.THINKING,
    title: '숫자 세기 놀이',
    thumbnailUrl: `https://image.pollinations.ai/prompt/colorful%20numbers%201%202%203%20educational%20${encodeURIComponent(STYLE_SUFFIX)}?width=300&height=300&nologo=true`,
    tags: ['숫자', '기초', '수학'],
    targetUrl: 'https://example.com/math',
    createdAt: Date.now(),
  },
  {
    id: '2',
    categoryId: CategoryId.ART,
    title: '종이 접기 교실',
    thumbnailUrl: `https://image.pollinations.ai/prompt/origami%20paper%20crane%20crafts%20${encodeURIComponent(STYLE_SUFFIX)}?width=300&height=300&nologo=true`,
    tags: ['종이접기', '창의력', '소근육'],
    targetUrl: 'https://example.com/art',
    createdAt: Date.now(),
  },
  {
    id: '3',
    categoryId: CategoryId.SPEAKING,
    title: '동물 이름 맞추기',
    thumbnailUrl: `https://image.pollinations.ai/prompt/cute%20cartoon%20animals%20lion%20cat%20dog%20${encodeURIComponent(STYLE_SUFFIX)}?width=300&height=300&nologo=true`,
    tags: ['동물', '단어', '말하기'],
    targetUrl: 'https://example.com/animals',
    createdAt: Date.now(),
  },
  {
    id: '4',
    categoryId: CategoryId.VISUAL,
    title: '같은 그림 찾기',
    thumbnailUrl: `https://image.pollinations.ai/prompt/matching%20game%20puzzle%20pieces%20${encodeURIComponent(STYLE_SUFFIX)}?width=300&height=300&nologo=true`,
    tags: ['관찰력', '집중력'],
    targetUrl: 'https://example.com/visual',
    createdAt: Date.now(),
  },
];