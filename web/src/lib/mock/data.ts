/**
 * Mock Data for Development/Demo
 * 백엔드 없이 프론트엔드 테스트용 데이터
 */

// Mock Words - CSAT 수능 필수 어휘
export const mockWords = [
  {
    id: '1',
    word: 'abundant',
    definition: 'existing in large quantities; more than enough',
    definitionKo: '풍부한, 많은',
    pronunciation: '어번던트',
    ipaUs: '/əˈbʌndənt/',
    ipaUk: '/əˈbʌndənt/',
    partOfSpeech: 'adjective',
    difficulty: 'INTERMEDIATE',
    examCategory: 'CSAT',
    level: 'L1',
    examples: [
      { sentence: 'The region has abundant natural resources.', translation: '그 지역은 풍부한 천연자원을 가지고 있다.' }
    ],
    mnemonics: [
      { content: '"어! 번뜩" 아이디어가 풍부하게 떠오른다', koreanHint: '어번던트 → 어! 번뜩' }
    ],
    collocations: [
      { phrase: 'abundant resources' },
      { phrase: 'abundant evidence' }
    ]
  },
  {
    id: '2',
    word: 'comprehend',
    definition: 'to understand something fully',
    definitionKo: '이해하다, 파악하다',
    pronunciation: '컴프리헨드',
    ipaUs: '/ˌkɑːmprɪˈhend/',
    ipaUk: '/ˌkɒmprɪˈhend/',
    partOfSpeech: 'verb',
    difficulty: 'INTERMEDIATE',
    examCategory: 'CSAT',
    level: 'L1',
    examples: [
      { sentence: 'I cannot comprehend why she did that.', translation: '나는 그녀가 왜 그랬는지 이해할 수 없다.' }
    ],
    mnemonics: [
      { content: '"컴"퓨터가 모든 것을 "프리"하게 "헨"들링해서 이해한다', koreanHint: '컴프리헨드' }
    ],
    collocations: [
      { phrase: 'fully comprehend' },
      { phrase: 'comprehend the meaning' }
    ]
  },
  {
    id: '3',
    word: 'diminish',
    definition: 'to make or become less',
    definitionKo: '줄이다, 감소하다',
    pronunciation: '디미니쉬',
    ipaUs: '/dɪˈmɪnɪʃ/',
    ipaUk: '/dɪˈmɪnɪʃ/',
    partOfSpeech: 'verb',
    difficulty: 'INTERMEDIATE',
    examCategory: 'CSAT',
    level: 'L1',
    examples: [
      { sentence: 'The pain will gradually diminish.', translation: '통증이 점차 줄어들 것이다.' }
    ],
    mnemonics: [
      { content: '"디"스크가 "미니"해져서 줄어든다', koreanHint: '디미니쉬 → 디스크 미니' }
    ],
    collocations: [
      { phrase: 'diminish in size' },
      { phrase: 'diminish the impact' }
    ]
  },
  {
    id: '4',
    word: 'elaborate',
    definition: 'detailed and complicated; to explain in detail',
    definitionKo: '정교한; 상세히 설명하다',
    pronunciation: '일래버릿',
    ipaUs: '/ɪˈlæbərət/',
    ipaUk: '/ɪˈlæbərət/',
    partOfSpeech: 'adjective/verb',
    difficulty: 'INTERMEDIATE',
    examCategory: 'CSAT',
    level: 'L1',
    examples: [
      { sentence: 'She gave an elaborate explanation.', translation: '그녀는 상세한 설명을 했다.' }
    ],
    mnemonics: [
      { content: '"일"을 "래"퍼처럼 "버"라이어티하게 설명한다', koreanHint: '일래버릿' }
    ],
    collocations: [
      { phrase: 'elaborate plan' },
      { phrase: 'elaborate on' }
    ]
  },
  {
    id: '5',
    word: 'feasible',
    definition: 'possible and practical to do easily',
    definitionKo: '실현 가능한, 실행할 수 있는',
    pronunciation: '피저블',
    ipaUs: '/ˈfiːzəbl/',
    ipaUk: '/ˈfiːzəbl/',
    partOfSpeech: 'adjective',
    difficulty: 'ADVANCED',
    examCategory: 'CSAT',
    level: 'L2',
    examples: [
      { sentence: 'Is this plan feasible?', translation: '이 계획은 실현 가능한가요?' }
    ],
    mnemonics: [
      { content: '"피"자를 만들기 "저"렴하고 "블"가능하지 않다', koreanHint: '피저블' }
    ],
    collocations: [
      { phrase: 'feasible solution' },
      { phrase: 'economically feasible' }
    ]
  },
  {
    id: '6',
    word: 'gratitude',
    definition: 'the quality of being thankful',
    definitionKo: '감사, 고마움',
    pronunciation: '그래티튜드',
    ipaUs: '/ˈɡrætɪtuːd/',
    ipaUk: '/ˈɡrætɪtjuːd/',
    partOfSpeech: 'noun',
    difficulty: 'INTERMEDIATE',
    examCategory: 'CSAT',
    level: 'L1',
    examples: [
      { sentence: 'I want to express my gratitude.', translation: '저의 감사를 표현하고 싶습니다.' }
    ],
    mnemonics: [
      { content: '"그래" "티"처에게 감사의 "튜"드(태도)를 보여라', koreanHint: '그래티튜드' }
    ],
    collocations: [
      { phrase: 'express gratitude' },
      { phrase: 'deep gratitude' }
    ]
  },
  {
    id: '7',
    word: 'hesitate',
    definition: 'to pause before doing something',
    definitionKo: '망설이다, 주저하다',
    pronunciation: '헤지테이트',
    ipaUs: '/ˈhezɪteɪt/',
    ipaUk: '/ˈhezɪteɪt/',
    partOfSpeech: 'verb',
    difficulty: 'BEGINNER',
    examCategory: 'CSAT',
    level: 'L1',
    examples: [
      { sentence: "Don't hesitate to ask questions.", translation: '질문하는 것을 망설이지 마세요.' }
    ],
    mnemonics: [
      { content: '"헤"매다가 "지"쳐서 "테"이크아웃을 망설인다', koreanHint: '헤지테이트' }
    ],
    collocations: [
      { phrase: 'hesitate to do' },
      { phrase: 'without hesitation' }
    ]
  },
  {
    id: '8',
    word: 'inevitable',
    definition: 'certain to happen; unavoidable',
    definitionKo: '불가피한, 피할 수 없는',
    pronunciation: '이네비터블',
    ipaUs: '/ɪnˈevɪtəbl/',
    ipaUk: '/ɪnˈevɪtəbl/',
    partOfSpeech: 'adjective',
    difficulty: 'ADVANCED',
    examCategory: 'CSAT',
    level: 'L2',
    examples: [
      { sentence: 'Change is inevitable.', translation: '변화는 불가피하다.' }
    ],
    mnemonics: [
      { content: '"인"생에서 "에"러는 "비"켜갈 수 없는 "터"블', koreanHint: '이네비터블' }
    ],
    collocations: [
      { phrase: 'inevitable consequence' },
      { phrase: 'seem inevitable' }
    ]
  },
  {
    id: '9',
    word: 'justify',
    definition: 'to show that something is right or reasonable',
    definitionKo: '정당화하다, 옳다고 증명하다',
    pronunciation: '저스티파이',
    ipaUs: '/ˈdʒʌstɪfaɪ/',
    ipaUk: '/ˈdʒʌstɪfaɪ/',
    partOfSpeech: 'verb',
    difficulty: 'INTERMEDIATE',
    examCategory: 'CSAT',
    level: 'L1',
    examples: [
      { sentence: 'How can you justify your actions?', translation: '당신의 행동을 어떻게 정당화할 수 있나요?' }
    ],
    mnemonics: [
      { content: '"저스"트(정의) "파이"팅! 정당화한다', koreanHint: '저스티파이' }
    ],
    collocations: [
      { phrase: 'justify the cost' },
      { phrase: 'fully justified' }
    ]
  },
  {
    id: '10',
    word: 'legitimate',
    definition: 'conforming to the law or rules; valid',
    definitionKo: '합법적인, 정당한',
    pronunciation: '리지티밋',
    ipaUs: '/lɪˈdʒɪtɪmət/',
    ipaUk: '/lɪˈdʒɪtɪmət/',
    partOfSpeech: 'adjective',
    difficulty: 'ADVANCED',
    examCategory: 'CSAT',
    level: 'L2',
    examples: [
      { sentence: 'Is this a legitimate business?', translation: '이것은 합법적인 사업인가요?' }
    ],
    mnemonics: [
      { content: '"리"걸하게 "지"켜서 "티"나게 "밋"팅하면 합법', koreanHint: '리지티밋' }
    ],
    collocations: [
      { phrase: 'legitimate concern' },
      { phrase: 'legitimate reason' }
    ]
  },
  {
    id: '11',
    word: 'magnificent',
    definition: 'extremely beautiful, elaborate, or impressive',
    definitionKo: '장엄한, 훌륭한',
    pronunciation: '매그니피센트',
    ipaUs: '/mæɡˈnɪfɪsnt/',
    ipaUk: '/mæɡˈnɪfɪsnt/',
    partOfSpeech: 'adjective',
    difficulty: 'INTERMEDIATE',
    examCategory: 'CSAT',
    level: 'L1',
    examples: [
      { sentence: 'The view was magnificent.', translation: '그 경치는 장엄했다.' }
    ],
    mnemonics: [
      { content: '"매그"넘 아이스크림처럼 "니"스하고 "피"센트(완벽)한', koreanHint: '매그니피센트' }
    ],
    collocations: [
      { phrase: 'magnificent view' },
      { phrase: 'truly magnificent' }
    ]
  },
  {
    id: '12',
    word: 'negotiate',
    definition: 'to discuss something to reach an agreement',
    definitionKo: '협상하다, 교섭하다',
    pronunciation: '니고시에이트',
    ipaUs: '/nɪˈɡoʊʃieɪt/',
    ipaUk: '/nɪˈɡəʊʃieɪt/',
    partOfSpeech: 'verb',
    difficulty: 'INTERMEDIATE',
    examCategory: 'CSAT',
    level: 'L1',
    examples: [
      { sentence: 'We need to negotiate the terms.', translation: '우리는 조건을 협상해야 합니다.' }
    ],
    mnemonics: [
      { content: '"니"가 "고"민하며 "시"작해서 "에이"스처럼 협상', koreanHint: '니고시에이트' }
    ],
    collocations: [
      { phrase: 'negotiate a deal' },
      { phrase: 'negotiate with' }
    ]
  },
];

// Mock User Stats
export const mockUserStats = {
  totalWordsLearned: 127,
  currentStreak: 5,
  longestStreak: 12,
  averageAccuracy: 78,
  lastActiveDate: new Date().toISOString(),
};

// Mock Due Reviews
export const mockDueReviews = {
  count: 8,
  reviews: mockWords.slice(0, 8).map(word => ({ word })),
};

// Mock User
export const mockUser = {
  id: 'mock-user-1',
  email: 'demo@vocavision.com',
  name: '학습자',
  role: 'USER',
  subscriptionStatus: 'TRIAL',
};

// Mock Session
export const mockSession = {
  id: 'mock-session-' + Date.now(),
  startTime: new Date().toISOString(),
};

// Helper: Get words by exam category
export const getWordsByExam = (examCategory?: string, level?: string, limit = 20) => {
  let filtered = mockWords;

  if (examCategory) {
    filtered = filtered.filter(w => w.examCategory === examCategory);
  }

  if (level) {
    filtered = filtered.filter(w => w.level === level);
  }

  return filtered.slice(0, limit);
};

// Helper: Get random words
export const getRandomWords = (count = 10) => {
  const shuffled = [...mockWords].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
