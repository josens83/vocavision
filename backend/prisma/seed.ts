import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// VV-CSAT: 수능 영어단어 (교육과정 기반)
// L1: Core Basic (기본+빈출)
// L2: Reading Core (추상·논리·태도)
// L3: Advanced (고난도·상위권)
// ============================================

const csatWordsL1 = [
  // VV-CSAT-L1: Core Basic (40개)
  { word: 'maintain', partOfSpeech: 'VERB', definitionKo: '유지하다', definition: 'to keep something in existence or continuance', level: 'L1', tags: ['일반', '과학'], frequency: 101 },
  { word: 'increase', partOfSpeech: 'VERB', definitionKo: '증가하다', definition: 'to become or make greater in size, amount, or degree', level: 'L1', tags: ['데이터', '변화'], frequency: 102 },
  { word: 'decrease', partOfSpeech: 'VERB', definitionKo: '감소하다', definition: 'to become or make smaller or fewer in size, amount, or degree', level: 'L1', tags: ['데이터', '변화'], frequency: 103 },
  { word: 'require', partOfSpeech: 'VERB', definitionKo: '요구하다', definition: 'to need something or make something necessary', level: 'L1', tags: ['조건', '규칙'], frequency: 104 },
  { word: 'provide', partOfSpeech: 'VERB', definitionKo: '제공하다', definition: 'to give something to someone or make it available', level: 'L1', tags: ['일반'], frequency: 105 },
  { word: 'allow', partOfSpeech: 'VERB', definitionKo: '허락하다', definition: 'to give permission for something to happen', level: 'L1', tags: ['규칙'], frequency: 106 },
  { word: 'prevent', partOfSpeech: 'VERB', definitionKo: '막다, 예방하다', definition: 'to stop something from happening', level: 'L1', tags: ['원인·결과'], frequency: 107 },
  { word: 'reduce', partOfSpeech: 'VERB', definitionKo: '줄이다', definition: 'to make something smaller or less', level: 'L1', tags: ['환경', '경제'], frequency: 108 },
  { word: 'affect', partOfSpeech: 'VERB', definitionKo: '영향을 미치다', definition: 'to have an influence on someone or something', level: 'L1', tags: ['원인·결과'], frequency: 109 },
  { word: 'effect', partOfSpeech: 'NOUN', definitionKo: '효과, 영향', definition: 'a change that results from an action or cause', level: 'L1', tags: ['원인·결과'], frequency: 110, tips: 'affect(동사)와 effect(명사)의 차이 주의!' },
  { word: 'include', partOfSpeech: 'VERB', definitionKo: '포함하다', definition: 'to contain as a part of something else', level: 'L1', tags: ['구성'], frequency: 111 },
  { word: 'involve', partOfSpeech: 'VERB', definitionKo: '포함하다, 관련시키다', definition: 'to include or affect someone or something', level: 'L1', tags: ['구성', '관계'], frequency: 112 },
  { word: 'consist', partOfSpeech: 'VERB', definitionKo: '~으로 이루어지다', definition: 'to be composed or made up of', level: 'L1', tags: ['구성'], frequency: 113, tips: 'consist of + 명사 형태로 사용' },
  { word: 'depend', partOfSpeech: 'VERB', definitionKo: '~에 의존하다', definition: 'to rely on someone or something for support', level: 'L1', tags: ['관계'], frequency: 114, tips: 'depend on + 명사 형태로 사용' },
  { word: 'describe', partOfSpeech: 'VERB', definitionKo: '묘사하다', definition: 'to give details about what someone or something is like', level: 'L1', tags: ['글쓰기'], frequency: 115 },
  { word: 'compare', partOfSpeech: 'VERB', definitionKo: '비교하다', definition: 'to examine things to find similarities and differences', level: 'L1', tags: ['사고', '글구조'], frequency: 116 },
  { word: 'contrast', partOfSpeech: 'VERB', definitionKo: '대조하다', definition: 'to compare in order to show differences', level: 'L1', tags: ['사고', '글구조'], frequency: 117 },
  { word: 'prefer', partOfSpeech: 'VERB', definitionKo: '선호하다', definition: 'to like one thing or person better than another', level: 'L1', tags: ['감정', '선택'], frequency: 118 },
  { word: 'avoid', partOfSpeech: 'VERB', definitionKo: '피하다', definition: 'to stay away from or prevent something', level: 'L1', tags: ['행동'], frequency: 119 },
  { word: 'achieve', partOfSpeech: 'VERB', definitionKo: '달성하다', definition: 'to successfully complete or accomplish something', level: 'L1', tags: ['목표', '교육'], frequency: 120 },
  { word: 'environment', partOfSpeech: 'NOUN', definitionKo: '환경', definition: 'the surroundings or conditions in which a person lives', level: 'L1', tags: ['환경', '사회'], frequency: 121 },
  { word: 'behavior', partOfSpeech: 'NOUN', definitionKo: '행동', definition: 'the way a person or animal acts or conducts oneself', level: 'L1', tags: ['심리', '사회'], frequency: 122 },
  { word: 'relationship', partOfSpeech: 'NOUN', definitionKo: '관계', definition: 'the way in which two or more things are connected', level: 'L1', tags: ['사회', '심리'], frequency: 123 },
  { word: 'attitude', partOfSpeech: 'NOUN', definitionKo: '태도', definition: 'a way of thinking or feeling about something', level: 'L1', tags: ['심리', '감정'], frequency: 124 },
  { word: 'opportunity', partOfSpeech: 'NOUN', definitionKo: '기회', definition: 'a chance or possibility for advancement or progress', level: 'L1', tags: ['사회', '교육'], frequency: 125 },
  { word: 'advantage', partOfSpeech: 'NOUN', definitionKo: '이점', definition: 'a condition that puts one in a favorable position', level: 'L1', tags: ['비교'], frequency: 126 },
  { word: 'disadvantage', partOfSpeech: 'NOUN', definitionKo: '단점', definition: 'an unfavorable circumstance or condition', level: 'L1', tags: ['비교'], frequency: 127 },
  { word: 'challenge', partOfSpeech: 'NOUN', definitionKo: '도전, 어려움', definition: 'a difficult task or problem to overcome', level: 'L1', tags: ['교육', '성장'], frequency: 128 },
  { word: 'familiar', partOfSpeech: 'ADJECTIVE', definitionKo: '익숙한', definition: 'well known from long or close association', level: 'L1', tags: ['경험'], frequency: 129, tips: 'be familiar with ~에 익숙하다' },
  { word: 'lack', partOfSpeech: 'NOUN', definitionKo: '부족, 부족하다', definition: 'the state of not having enough of something', level: 'L1', tags: ['원인·결과'], frequency: 130 },
  { word: 'various', partOfSpeech: 'ADJECTIVE', definitionKo: '다양한', definition: 'different from each other; of different kinds', level: 'L1', tags: ['일반'], frequency: 131 },
  { word: 'recent', partOfSpeech: 'ADJECTIVE', definitionKo: '최근의', definition: 'having happened or been done not long ago', level: 'L1', tags: ['시점'], frequency: 132 },
  { word: 'likely', partOfSpeech: 'ADJECTIVE', definitionKo: '~할 것 같은', definition: 'probable; expected to happen', level: 'L1', tags: ['추론'], frequency: 133, tips: 'be likely to + 동사원형' },
  { word: 'instead', partOfSpeech: 'ADVERB', definitionKo: '대신에', definition: 'as an alternative or substitute', level: 'L1', tags: ['연결어'], frequency: 134 },
  { word: 'therefore', partOfSpeech: 'ADVERB', definitionKo: '그러므로', definition: 'for that reason; consequently', level: 'L1', tags: ['논리'], frequency: 135 },
  { word: 'however', partOfSpeech: 'ADVERB', definitionKo: '그러나', definition: 'used to introduce a statement that contrasts with something', level: 'L1', tags: ['논리'], frequency: 136 },
  { word: 'although', partOfSpeech: 'CONJUNCTION', definitionKo: '비록 ~일지라도', definition: 'in spite of the fact that', level: 'L1', tags: ['대비'], frequency: 137 },
  { word: 'despite', partOfSpeech: 'PREPOSITION', definitionKo: '~에도 불구하고', definition: 'without being affected by', level: 'L1', tags: ['대비'], frequency: 138, tips: 'despite + 명사/동명사' },
  { word: 'due to', partOfSpeech: 'PREPOSITION', definitionKo: '~ 때문에', definition: 'because of; caused by', level: 'L1', tags: ['원인'], frequency: 139 },
  { word: 'according to', partOfSpeech: 'PREPOSITION', definitionKo: '~에 따르면', definition: 'as stated or reported by', level: 'L1', tags: ['인용'], frequency: 140 },
];

const csatWordsL2 = [
  // VV-CSAT-L2: Reading Core (40개)
  { word: 'concept', partOfSpeech: 'NOUN', definitionKo: '개념', definition: 'an abstract idea or general notion', level: 'L2', tags: ['추상', '철학'], frequency: 201 },
  { word: 'abstract', partOfSpeech: 'ADJECTIVE', definitionKo: '추상적인', definition: 'existing in thought or as an idea but not having physical existence', level: 'L2', tags: ['추상'], frequency: 202 },
  { word: 'assume', partOfSpeech: 'VERB', definitionKo: '가정하다', definition: 'to suppose to be the case without proof', level: 'L2', tags: ['논리', '추론'], frequency: 203 },
  { word: 'determine', partOfSpeech: 'VERB', definitionKo: '결정하다, 규명하다', definition: 'to establish or ascertain exactly', level: 'L2', tags: ['연구', '과학'], frequency: 204 },
  { word: 'indicate', partOfSpeech: 'VERB', definitionKo: '나타내다, 보여주다', definition: 'to point out or show', level: 'L2', tags: ['데이터', '글'], frequency: 205 },
  { word: 'imply', partOfSpeech: 'VERB', definitionKo: '암시하다', definition: 'to suggest without being explicitly stated', level: 'L2', tags: ['추론', '독해'], frequency: 206, tips: '직접 말하지 않고 암시! 추론 문제 핵심' },
  { word: 'infer', partOfSpeech: 'VERB', definitionKo: '추론하다', definition: 'to deduce from evidence and reasoning', level: 'L2', tags: ['독해'], frequency: 207 },
  { word: 'interpret', partOfSpeech: 'VERB', definitionKo: '해석하다', definition: 'to explain the meaning of information', level: 'L2', tags: ['독해', '예술'], frequency: 208 },
  { word: 'predict', partOfSpeech: 'VERB', definitionKo: '예측하다', definition: 'to say what will happen in the future', level: 'L2', tags: ['과학', '사회'], frequency: 209 },
  { word: 'evaluate', partOfSpeech: 'VERB', definitionKo: '평가하다', definition: 'to assess the value or quality of something', level: 'L2', tags: ['교육', '연구'], frequency: 210 },
  { word: 'significant', partOfSpeech: 'ADJECTIVE', definitionKo: '중요한, 상당한', definition: 'sufficiently great or important to be worthy of attention', level: 'L2', tags: ['통계', '논리'], frequency: 211 },
  { word: 'considerable', partOfSpeech: 'ADJECTIVE', definitionKo: '상당한', definition: 'notably large in size, amount, or extent', level: 'L2', tags: ['양', '정도'], frequency: 212 },
  { word: 'complex', partOfSpeech: 'ADJECTIVE', definitionKo: '복잡한', definition: 'consisting of many different parts; complicated', level: 'L2', tags: ['구조', '문제'], frequency: 213 },
  { word: 'efficient', partOfSpeech: 'ADJECTIVE', definitionKo: '효율적인', definition: 'achieving maximum productivity with minimum effort', level: 'L2', tags: ['경제', '기술'], frequency: 214 },
  { word: 'sufficient', partOfSpeech: 'ADJECTIVE', definitionKo: '충분한', definition: 'enough; adequate for the purpose', level: 'L2', tags: ['조건'], frequency: 215 },
  { word: 'relative', partOfSpeech: 'ADJECTIVE', definitionKo: '상대적인', definition: 'considered in relation to something else', level: 'L2', tags: ['비교'], frequency: 216 },
  { word: 'consistent', partOfSpeech: 'ADJECTIVE', definitionKo: '일관된', definition: 'unchanging in behavior or quality', level: 'L2', tags: ['태도', '데이터'], frequency: 217 },
  { word: 'potential', partOfSpeech: 'ADJECTIVE', definitionKo: '잠재적인, 잠재력', definition: 'having the capacity to develop into something', level: 'L2', tags: ['능력'], frequency: 218 },
  { word: 'tendency', partOfSpeech: 'NOUN', definitionKo: '경향', definition: 'an inclination toward a particular way of behaving', level: 'L2', tags: ['통계', '심리'], frequency: 219 },
  { word: 'phenomenon', partOfSpeech: 'NOUN', definitionKo: '현상', definition: 'a fact or situation that is observed to exist', level: 'L2', tags: ['과학', '사회'], frequency: 220, tips: '복수형: phenomena' },
  { word: 'factor', partOfSpeech: 'NOUN', definitionKo: '요인', definition: 'a circumstance that contributes to a result', level: 'L2', tags: ['분석'], frequency: 221 },
  { word: 'function', partOfSpeech: 'NOUN', definitionKo: '기능, 작용하다', definition: 'the purpose or role that something has', level: 'L2', tags: ['과학', '기술'], frequency: 222 },
  { word: 'perspective', partOfSpeech: 'NOUN', definitionKo: '관점', definition: 'a particular way of viewing things', level: 'L2', tags: ['심리', '철학'], frequency: 223 },
  { word: 'context', partOfSpeech: 'NOUN', definitionKo: '문맥, 상황', definition: 'the circumstances that form the setting for an event', level: 'L2', tags: ['독해'], frequency: 224 },
  { word: 'circumstance', partOfSpeech: 'NOUN', definitionKo: '상황, 환경', definition: 'a fact or condition connected with an event', level: 'L2', tags: ['사회'], frequency: 225 },
  { word: 'consequence', partOfSpeech: 'NOUN', definitionKo: '결과', definition: 'a result or effect of an action', level: 'L2', tags: ['원인·결과'], frequency: 226 },
  { word: 'preference', partOfSpeech: 'NOUN', definitionKo: '선호', definition: 'a greater liking for one alternative over others', level: 'L2', tags: ['심리', '소비'], frequency: 227 },
  { word: 'motivation', partOfSpeech: 'NOUN', definitionKo: '동기', definition: 'the reason for acting or behaving in a particular way', level: 'L2', tags: ['심리', '교육'], frequency: 228 },
  { word: 'emotion', partOfSpeech: 'NOUN', definitionKo: '감정', definition: 'a strong feeling such as love, fear, or anger', level: 'L2', tags: ['심리'], frequency: 229 },
  { word: 'empathy', partOfSpeech: 'NOUN', definitionKo: '공감', definition: 'the ability to understand and share others feelings', level: 'L2', tags: ['심리', '관계'], frequency: 230 },
  { word: 'stereotype', partOfSpeech: 'NOUN', definitionKo: '고정관념', definition: 'a widely held but oversimplified image of a type of person', level: 'L2', tags: ['사회', '편견'], frequency: 231 },
  { word: 'bias', partOfSpeech: 'NOUN', definitionKo: '편견, 편향', definition: 'prejudice in favor of or against something', level: 'L2', tags: ['사회', '통계'], frequency: 232 },
  { word: 'diversity', partOfSpeech: 'NOUN', definitionKo: '다양성', definition: 'the state of being diverse; variety', level: 'L2', tags: ['사회', '문화'], frequency: 233 },
  { word: 'creativity', partOfSpeech: 'NOUN', definitionKo: '창의성', definition: 'the ability to produce original and unusual ideas', level: 'L2', tags: ['교육', '예술'], frequency: 234 },
  { word: 'innovation', partOfSpeech: 'NOUN', definitionKo: '혁신', definition: 'a new method, idea, or product', level: 'L2', tags: ['기술', '경제'], frequency: 235 },
  { word: 'interaction', partOfSpeech: 'NOUN', definitionKo: '상호작용', definition: 'reciprocal action or influence', level: 'L2', tags: ['사회', '과학'], frequency: 236 },
  { word: 'cooperation', partOfSpeech: 'NOUN', definitionKo: '협력', definition: 'the action of working together toward the same goal', level: 'L2', tags: ['사회'], frequency: 237 },
  { word: 'competition', partOfSpeech: 'NOUN', definitionKo: '경쟁', definition: 'the activity of striving to gain something', level: 'L2', tags: ['경제', '사회'], frequency: 238 },
  { word: 'manage', partOfSpeech: 'VERB', definitionKo: '관리하다, 다루다', definition: 'to be in charge of or handle something', level: 'L2', tags: ['경영', '생활'], frequency: 239 },
  { word: 'adapt', partOfSpeech: 'VERB', definitionKo: '적응하다', definition: 'to adjust to new conditions', level: 'L2', tags: ['환경', '진화'], frequency: 240, tips: 'adapt to + 환경/상황' },
];

const csatWordsL3 = [
  // VV-CSAT-L3: Advanced (40개)
  { word: 'inevitable', partOfSpeech: 'ADJECTIVE', definitionKo: '피할 수 없는', definition: 'certain to happen; unavoidable', level: 'L3', tags: ['논리', '역사'], frequency: 301 },
  { word: 'vulnerable', partOfSpeech: 'ADJECTIVE', definitionKo: '취약한', definition: 'susceptible to physical or emotional attack', level: 'L3', tags: ['사회', '환경'], frequency: 302 },
  { word: 'skeptical', partOfSpeech: 'ADJECTIVE', definitionKo: '회의적인', definition: 'not easily convinced; having doubts', level: 'L3', tags: ['태도'], frequency: 303 },
  { word: 'authentic', partOfSpeech: 'ADJECTIVE', definitionKo: '진짜의, 진정한', definition: 'genuine; not a copy', level: 'L3', tags: ['문화', '예술'], frequency: 304 },
  { word: 'arbitrary', partOfSpeech: 'ADJECTIVE', definitionKo: '임의의, 제멋대로인', definition: 'based on random choice rather than reason', level: 'L3', tags: ['법', '통계'], frequency: 305 },
  { word: 'spontaneous', partOfSpeech: 'ADJECTIVE', definitionKo: '자발적인, 즉흥적인', definition: 'performed without planning', level: 'L3', tags: ['심리'], frequency: 306 },
  { word: 'deliberate', partOfSpeech: 'ADJECTIVE', definitionKo: '의도적인, 신중한', definition: 'done consciously and intentionally', level: 'L3', tags: ['태도', '법'], frequency: 307 },
  { word: 'empirical', partOfSpeech: 'ADJECTIVE', definitionKo: '경험적인, 실증적인', definition: 'based on observation or experience rather than theory', level: 'L3', tags: ['과학', '연구'], frequency: 308 },
  { word: 'hypothetical', partOfSpeech: 'ADJECTIVE', definitionKo: '가설의', definition: 'based on a hypothesis rather than known facts', level: 'L3', tags: ['과학', '논리'], frequency: 309 },
  { word: 'paradox', partOfSpeech: 'NOUN', definitionKo: '역설', definition: 'a statement that seems contradictory but may be true', level: 'L3', tags: ['철학', '논리'], frequency: 310 },
  { word: 'contradiction', partOfSpeech: 'NOUN', definitionKo: '모순', definition: 'a combination of statements that are opposed to each other', level: 'L3', tags: ['논리'], frequency: 311 },
  { word: 'illusion', partOfSpeech: 'NOUN', definitionKo: '착각, 환상', definition: 'a false idea or belief; something that deceives the senses', level: 'L3', tags: ['심리', '예술'], frequency: 312 },
  { word: 'hierarchy', partOfSpeech: 'NOUN', definitionKo: '계층 구조', definition: 'a system in which people are ranked one above another', level: 'L3', tags: ['조직', '사회'], frequency: 313 },
  { word: 'sustainability', partOfSpeech: 'NOUN', definitionKo: '지속 가능성', definition: 'the ability to be maintained at a certain rate', level: 'L3', tags: ['환경', '경제'], frequency: 314 },
  { word: 'ecosystem', partOfSpeech: 'NOUN', definitionKo: '생태계', definition: 'a biological community of interacting organisms', level: 'L3', tags: ['환경', '과학'], frequency: 315 },
  { word: 'genetics', partOfSpeech: 'NOUN', definitionKo: '유전학', definition: 'the study of heredity and variation in organisms', level: 'L3', tags: ['과학'], frequency: 316 },
  { word: 'evolution', partOfSpeech: 'NOUN', definitionKo: '진화', definition: 'gradual development over time', level: 'L3', tags: ['과학'], frequency: 317 },
  { word: 'modify', partOfSpeech: 'VERB', definitionKo: '수정하다, 변형하다', definition: 'to make partial changes to something', level: 'L3', tags: ['과학', '기술'], frequency: 318 },
  { word: 'allocate', partOfSpeech: 'VERB', definitionKo: '할당하다', definition: 'to distribute resources for a particular purpose', level: 'L3', tags: ['경제', '자원'], frequency: 319 },
  { word: 'compensate', partOfSpeech: 'VERB', definitionKo: '보상하다, 상쇄하다', definition: 'to give something in return for loss or suffering', level: 'L3', tags: ['경제', '심리'], frequency: 320 },
  { word: 'undermine', partOfSpeech: 'VERB', definitionKo: '약화시키다', definition: 'to damage or weaken gradually', level: 'L3', tags: ['사회', '관계'], frequency: 321 },
  { word: 'reinforce', partOfSpeech: 'VERB', definitionKo: '강화하다', definition: 'to strengthen or support', level: 'L3', tags: ['심리', '교육'], frequency: 322 },
  { word: 'facilitate', partOfSpeech: 'VERB', definitionKo: '촉진하다', definition: 'to make an action or process easier', level: 'L3', tags: ['교육', '기술'], frequency: 323 },
  { word: 'inhibit', partOfSpeech: 'VERB', definitionKo: '억제하다', definition: 'to prevent or restrain an action', level: 'L3', tags: ['심리', '과학'], frequency: 324 },
  { word: 'trigger', partOfSpeech: 'VERB', definitionKo: '유발하다', definition: 'to cause an event or situation to happen', level: 'L3', tags: ['심리', '과학'], frequency: 325 },
  { word: 'perceive', partOfSpeech: 'VERB', definitionKo: '인식하다, 지각하다', definition: 'to become aware of through the senses', level: 'L3', tags: ['심리'], frequency: 326 },
  { word: 'manipulate', partOfSpeech: 'VERB', definitionKo: '조종하다, 다루다', definition: 'to control or influence something in a skillful way', level: 'L3', tags: ['심리', '미디어'], frequency: 327 },
  { word: 'exaggerate', partOfSpeech: 'VERB', definitionKo: '과장하다', definition: 'to represent something as larger than it really is', level: 'L3', tags: ['태도', '글'], frequency: 328 },
  { word: 'resemble', partOfSpeech: 'VERB', definitionKo: '닮다', definition: 'to look or seem like', level: 'L3', tags: ['비교'], frequency: 329 },
  { word: 'distort', partOfSpeech: 'VERB', definitionKo: '왜곡하다', definition: 'to pull out of shape; misrepresent', level: 'L3', tags: ['미디어', '인식'], frequency: 330 },
  { word: 'overwhelm', partOfSpeech: 'VERB', definitionKo: '압도하다', definition: 'to have a strong emotional effect on', level: 'L3', tags: ['감정', '상황'], frequency: 331 },
  { word: 'pursue', partOfSpeech: 'VERB', definitionKo: '추구하다', definition: 'to follow in order to catch or attack', level: 'L3', tags: ['목표', '진로'], frequency: 332 },
  { word: 'acquire', partOfSpeech: 'VERB', definitionKo: '습득하다, 얻다', definition: 'to buy or obtain something', level: 'L3', tags: ['학습', '경제'], frequency: 333 },
  { word: 'retain', partOfSpeech: 'VERB', definitionKo: '유지하다, 보유하다', definition: 'to continue to have or hold', level: 'L3', tags: ['기억', '조직'], frequency: 334 },
  { word: 'revise', partOfSpeech: 'VERB', definitionKo: '수정하다, 복습하다', definition: 'to reconsider and alter in the light of further evidence', level: 'L3', tags: ['학습', '글'], frequency: 335 },
  { word: 'substitute', partOfSpeech: 'VERB', definitionKo: '대체하다, 대체물', definition: 'to use or add in place of something else', level: 'L3', tags: ['경제', '과학'], frequency: 336 },
  { word: 'simulate', partOfSpeech: 'VERB', definitionKo: '모의 실험하다, 흉내 내다', definition: 'to imitate the appearance or character of', level: 'L3', tags: ['과학', '기술'], frequency: 337 },
  { word: 'integrate', partOfSpeech: 'VERB', definitionKo: '통합하다', definition: 'to combine two or more things to become whole', level: 'L3', tags: ['교육', '사회'], frequency: 338 },
  { word: 'coordinate', partOfSpeech: 'VERB', definitionKo: '조정하다, 조직하다', definition: 'to bring the different elements into a harmonious relationship', level: 'L3', tags: ['프로젝트'], frequency: 339 },
  { word: 'emerge', partOfSpeech: 'VERB', definitionKo: '나타나다, 부상하다', definition: 'to move out of or away from something', level: 'L3', tags: ['사회', '과학'], frequency: 340 },
];

// 다른 시험용 단어 (TEPS, TOEIC, TOEFL, SAT) - 간략 버전
const tepsWords = [
  { word: 'astute', partOfSpeech: 'ADJECTIVE', definitionKo: '기민한, 명민한', definition: 'having an ability to notice and understand things clearly', level: 'L2', tags: ['태도'], frequency: 401 },
  { word: 'discern', partOfSpeech: 'VERB', definitionKo: '분별하다, 알아차리다', definition: 'to see, recognize, or understand something', level: 'L2', tags: ['인식'], frequency: 402 },
  { word: 'substantiate', partOfSpeech: 'VERB', definitionKo: '입증하다', definition: 'to provide evidence to support or prove', level: 'L3', tags: ['연구'], frequency: 403 },
  { word: 'pervasive', partOfSpeech: 'ADJECTIVE', definitionKo: '만연한', definition: 'existing in all parts of something', level: 'L3', tags: ['사회'], frequency: 404 },
  { word: 'unprecedented', partOfSpeech: 'ADJECTIVE', definitionKo: '전례 없는', definition: 'never having happened before', level: 'L3', tags: ['역사'], frequency: 405 },
  { word: 'alleviate', partOfSpeech: 'VERB', definitionKo: '완화하다', definition: 'to make something less severe', level: 'L3', tags: ['의료'], frequency: 406 },
  { word: 'exacerbate', partOfSpeech: 'VERB', definitionKo: '악화시키다', definition: 'to make a problem worse', level: 'L3', tags: ['의료'], frequency: 407 },
  { word: 'mitigate', partOfSpeech: 'VERB', definitionKo: '완화하다', definition: 'to make something less harmful', level: 'L3', tags: ['환경'], frequency: 408 },
];

const toeicWords = [
  { word: 'comply', partOfSpeech: 'VERB', definitionKo: '준수하다', definition: 'to act in accordance with rules', level: 'L1', tags: ['규정'], frequency: 501, tips: 'comply with regulations (규정 준수)' },
  { word: 'expedite', partOfSpeech: 'VERB', definitionKo: '신속히 처리하다', definition: 'to make an action happen faster', level: 'L2', tags: ['업무'], frequency: 502 },
  { word: 'reimburse', partOfSpeech: 'VERB', definitionKo: '환급하다', definition: 'to pay back money spent', level: 'L2', tags: ['회계'], frequency: 503 },
  { word: 'invoice', partOfSpeech: 'NOUN', definitionKo: '송장', definition: 'a list of goods with costs', level: 'L1', tags: ['회계'], frequency: 504 },
  { word: 'quarterly', partOfSpeech: 'ADJECTIVE', definitionKo: '분기별의', definition: 'happening every three months', level: 'L1', tags: ['일정'], frequency: 505 },
  { word: 'tentative', partOfSpeech: 'ADJECTIVE', definitionKo: '잠정적인', definition: 'not certain or fixed', level: 'L2', tags: ['일정'], frequency: 506 },
  { word: 'adjacent', partOfSpeech: 'ADJECTIVE', definitionKo: '인접한', definition: 'next to or near something', level: 'L2', tags: ['위치'], frequency: 507 },
  { word: 'mandatory', partOfSpeech: 'ADJECTIVE', definitionKo: '의무적인', definition: 'required by law or rules', level: 'L2', tags: ['규정'], frequency: 508 },
];

const toeflWords = [
  { word: 'paradigm', partOfSpeech: 'NOUN', definitionKo: '패러다임', definition: 'a typical example or pattern', level: 'L3', tags: ['학술'], frequency: 601 },
  { word: 'proliferate', partOfSpeech: 'VERB', definitionKo: '급증하다', definition: 'to increase rapidly in number', level: 'L3', tags: ['과학'], frequency: 602 },
  { word: 'inherent', partOfSpeech: 'ADJECTIVE', definitionKo: '내재하는', definition: 'existing as a natural part', level: 'L3', tags: ['철학'], frequency: 603 },
  { word: 'catalyst', partOfSpeech: 'NOUN', definitionKo: '촉매', definition: 'something that causes change', level: 'L3', tags: ['과학'], frequency: 604 },
  { word: 'synthesis', partOfSpeech: 'NOUN', definitionKo: '종합', definition: 'the combination of ideas', level: 'L3', tags: ['학술'], frequency: 605 },
  { word: 'hypothesis', partOfSpeech: 'NOUN', definitionKo: '가설', definition: 'an idea not yet proved', level: 'L2', tags: ['연구'], frequency: 606 },
  { word: 'analogous', partOfSpeech: 'ADJECTIVE', definitionKo: '유사한', definition: 'similar in certain respects', level: 'L3', tags: ['비교'], frequency: 607 },
  { word: 'prevalent', partOfSpeech: 'ADJECTIVE', definitionKo: '널리 퍼진', definition: 'widespread at a particular time', level: 'L3', tags: ['사회'], frequency: 608 },
];

const satWords = [
  { word: 'ubiquitous', partOfSpeech: 'ADJECTIVE', definitionKo: '어디에나 있는', definition: 'present everywhere', level: 'L3', tags: ['일반'], frequency: 701 },
  { word: 'ephemeral', partOfSpeech: 'ADJECTIVE', definitionKo: '일시적인', definition: 'lasting for a very short time', level: 'L3', tags: ['시간'], frequency: 702 },
  { word: 'pragmatic', partOfSpeech: 'ADJECTIVE', definitionKo: '실용적인', definition: 'dealing with things realistically', level: 'L3', tags: ['철학'], frequency: 703 },
  { word: 'superfluous', partOfSpeech: 'ADJECTIVE', definitionKo: '불필요한', definition: 'unnecessary, more than needed', level: 'L3', tags: ['양'], frequency: 704 },
  { word: 'verbose', partOfSpeech: 'ADJECTIVE', definitionKo: '장황한', definition: 'using more words than needed', level: 'L3', tags: ['글'], frequency: 705 },
  { word: 'laconic', partOfSpeech: 'ADJECTIVE', definitionKo: '간결한', definition: 'using very few words', level: 'L3', tags: ['글'], frequency: 706 },
  { word: 'candid', partOfSpeech: 'ADJECTIVE', definitionKo: '솔직한', definition: 'truthful and straightforward', level: 'L2', tags: ['태도'], frequency: 707 },
  { word: 'ameliorate', partOfSpeech: 'VERB', definitionKo: '개선하다', definition: 'to make something better', level: 'L3', tags: ['변화'], frequency: 708 },
];

// 모든 단어 합치기
function prepareWordsWithCategory(words: any[], examCategory: string) {
  return words.map(w => ({
    ...w,
    examCategory,
    difficulty: w.level === 'L1' ? 'BASIC' : w.level === 'L2' ? 'INTERMEDIATE' : 'ADVANCED',
  }));
}

const allWords = [
  ...prepareWordsWithCategory([...csatWordsL1, ...csatWordsL2, ...csatWordsL3], 'CSAT'),
  ...prepareWordsWithCategory(tepsWords, 'TEPS'),
  ...prepareWordsWithCategory(toeicWords, 'TOEIC'),
  ...prepareWordsWithCategory(toeflWords, 'TOEFL'),
  ...prepareWordsWithCategory(satWords, 'SAT'),
];

// 업적
const achievements = [
  { name: '첫 발자국', description: '첫 번째 단어를 학습하세요', icon: '🎯', requirement: 1, type: 'WORDS_LEARNED' },
  { name: '열정적인 학습자', description: '10개의 단어를 학습하세요', icon: '📚', requirement: 10, type: 'WORDS_LEARNED' },
  { name: '단어 마스터', description: '50개의 단어를 학습하세요', icon: '🏆', requirement: 50, type: 'WORDS_LEARNED' },
  { name: '일주일 연속', description: '7일 연속 학습하세요', icon: '🔥', requirement: 7, type: 'DAILY_STREAK' },
  { name: '한 달 챌린지', description: '30일 연속 학습하세요', icon: '💪', requirement: 30, type: 'DAILY_STREAK' },
  { name: '백 일의 기적', description: '100일 연속 학습하세요', icon: '👑', requirement: 100, type: 'DAILY_STREAK' },
];

// 컬렉션
const collections = [
  // 수능 레벨별 컬렉션
  { name: '수능 L1: 기본 필수', description: '수능 영어 기본 빈출 어휘 (3등급 목표)', icon: '📝', category: 'CSAT', difficulty: 'BASIC', level: 'L1' },
  { name: '수능 L2: 독해 핵심', description: '추상/논리/태도 관련 어휘 (2등급 목표)', icon: '📖', category: 'CSAT', difficulty: 'INTERMEDIATE', level: 'L2' },
  { name: '수능 L3: 고난도', description: '상위권 목표 심화 어휘 (1등급 목표)', icon: '🎯', category: 'CSAT', difficulty: 'ADVANCED', level: 'L3' },
  // 다른 시험
  { name: 'TEPS 핵심 어휘', description: '서울대 TEPS 고급 어휘', icon: '🎓', category: 'TEPS', difficulty: 'ADVANCED', level: null },
  { name: 'TOEIC 비즈니스 어휘', description: '비즈니스 영어 필수 단어', icon: '💼', category: 'TOEIC', difficulty: 'INTERMEDIATE', level: null },
  { name: 'TOEFL 학술 어휘', description: '학술 영어 및 유학 준비', icon: '🌍', category: 'TOEFL', difficulty: 'ADVANCED', level: null },
  { name: 'SAT 고급 어휘', description: '미국 SAT 고빈출 단어', icon: '🇺🇸', category: 'SAT', difficulty: 'ADVANCED', level: null },
];

async function main() {
  console.log('🌱 VocaVision 데이터베이스 시딩 시작...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 기존 데이터 정리
  console.log('\n🧹 기존 데이터 정리 중...');
  await prisma.review.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.studySession.deleteMany();
  await prisma.customMnemonic.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.interactiveDocProgress.deleteMany();
  await prisma.interactiveDocCompletion.deleteMany();
  await prisma.example.deleteMany();
  await prisma.wordImage.deleteMany();
  await prisma.wordVideo.deleteMany();
  await prisma.rhyme.deleteMany();
  await prisma.mnemonic.deleteMany();
  await prisma.etymology.deleteMany();
  await prisma.synonym.deleteMany();
  await prisma.antonym.deleteMany();
  await prisma.word.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.achievement.deleteMany();

  // 단어 생성
  console.log('\n📚 단어 생성 중...');
  let wordCount = 0;
  const wordIdsByCategory: Record<string, string[]> = { CSAT: [], TEPS: [], TOEIC: [], TOEFL: [], SAT: [] };
  const wordIdsByLevel: Record<string, string[]> = { L1: [], L2: [], L3: [] };

  for (const wordData of allWords) {
    try {
      const word = await prisma.word.create({
        data: {
          word: wordData.word,
          definition: wordData.definition,
          definitionKo: wordData.definitionKo,
          partOfSpeech: wordData.partOfSpeech as any,
          difficulty: wordData.difficulty as any,
          examCategory: wordData.examCategory as any,
          level: wordData.level,
          frequency: wordData.frequency,
          tags: wordData.tags || [],
          tips: wordData.tips,
        },
      });
      wordIdsByCategory[wordData.examCategory].push(word.id);
      if (wordData.level && wordData.examCategory === 'CSAT') {
        wordIdsByLevel[wordData.level].push(word.id);
      }
      wordCount++;

      if (wordCount % 20 === 0) {
        console.log(`  ✅ ${wordCount}/${allWords.length} 단어 생성됨`);
      }
    } catch (error: any) {
      console.log(`  ⚠️ 중복 단어 스킵: ${wordData.word}`);
    }
  }

  // 컬렉션 생성
  console.log('\n📁 컬렉션 생성 중...');
  for (const collection of collections) {
    let wordIds: string[] = [];
    if (collection.level && collection.category === 'CSAT') {
      wordIds = wordIdsByLevel[collection.level] || [];
    } else {
      wordIds = wordIdsByCategory[collection.category] || [];
    }

    await prisma.collection.create({
      data: {
        name: collection.name,
        description: collection.description,
        icon: collection.icon,
        category: collection.category,
        difficulty: collection.difficulty as any,
        isPublic: true,
        wordIds: wordIds,
      },
    });
    console.log(`  ✅ ${collection.name} (${wordIds.length}개 단어)`);
  }

  // 업적 생성
  console.log('\n🏆 업적 생성 중...');
  for (const achievement of achievements) {
    await prisma.achievement.create({ data: achievement as any });
    console.log(`  ✅ ${achievement.name}`);
  }

  // 결과 출력
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ 데이터베이스 시딩 완료!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 총 단어: ${wordCount}개`);
  console.log(`   - 수능 (CSAT): ${wordIdsByCategory.CSAT.length}개`);
  console.log(`     ├ L1 기본: ${wordIdsByLevel.L1.length}개`);
  console.log(`     ├ L2 독해: ${wordIdsByLevel.L2.length}개`);
  console.log(`     └ L3 고급: ${wordIdsByLevel.L3.length}개`);
  console.log(`   - TEPS: ${wordIdsByCategory.TEPS.length}개`);
  console.log(`   - TOEIC: ${wordIdsByCategory.TOEIC.length}개`);
  console.log(`   - TOEFL: ${wordIdsByCategory.TOEFL.length}개`);
  console.log(`   - SAT: ${wordIdsByCategory.SAT.length}개`);
  console.log(`📁 컬렉션: ${collections.length}개`);
  console.log(`🏆 업적: ${achievements.length}개`);
}

main()
  .catch((e) => {
    console.error('❌ 시딩 에러:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
