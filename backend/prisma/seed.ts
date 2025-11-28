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
  // L1 추가 단어 (41-100)
  { word: 'consider', partOfSpeech: 'VERB', definitionKo: '고려하다', definition: 'to think carefully about something', level: 'L1', tags: ['사고'], frequency: 141 },
  { word: 'suggest', partOfSpeech: 'VERB', definitionKo: '제안하다', definition: 'to put forward for consideration', level: 'L1', tags: ['의사소통'], frequency: 142 },
  { word: 'support', partOfSpeech: 'VERB', definitionKo: '지지하다, 뒷받침하다', definition: 'to give assistance or approval to', level: 'L1', tags: ['논리'], frequency: 143 },
  { word: 'develop', partOfSpeech: 'VERB', definitionKo: '발전시키다', definition: 'to grow or cause to grow more advanced', level: 'L1', tags: ['성장'], frequency: 144 },
  { word: 'improve', partOfSpeech: 'VERB', definitionKo: '개선하다', definition: 'to make or become better', level: 'L1', tags: ['변화'], frequency: 145 },
  { word: 'create', partOfSpeech: 'VERB', definitionKo: '창조하다', definition: 'to bring something into existence', level: 'L1', tags: ['창작'], frequency: 146 },
  { word: 'produce', partOfSpeech: 'VERB', definitionKo: '생산하다', definition: 'to make or manufacture', level: 'L1', tags: ['경제'], frequency: 147 },
  { word: 'recognize', partOfSpeech: 'VERB', definitionKo: '인식하다, 알아보다', definition: 'to identify from previous experience', level: 'L1', tags: ['인지'], frequency: 148 },
  { word: 'realize', partOfSpeech: 'VERB', definitionKo: '깨닫다', definition: 'to become fully aware of', level: 'L1', tags: ['인지'], frequency: 149 },
  { word: 'represent', partOfSpeech: 'VERB', definitionKo: '나타내다, 대표하다', definition: 'to stand for or symbolize', level: 'L1', tags: ['표현'], frequency: 150 },
  { word: 'express', partOfSpeech: 'VERB', definitionKo: '표현하다', definition: 'to convey a thought or feeling', level: 'L1', tags: ['의사소통'], frequency: 151 },
  { word: 'occur', partOfSpeech: 'VERB', definitionKo: '발생하다', definition: 'to happen or take place', level: 'L1', tags: ['사건'], frequency: 152 },
  { word: 'exist', partOfSpeech: 'VERB', definitionKo: '존재하다', definition: 'to have real being', level: 'L1', tags: ['철학'], frequency: 153 },
  { word: 'remain', partOfSpeech: 'VERB', definitionKo: '남다, 유지되다', definition: 'to continue to exist or stay', level: 'L1', tags: ['상태'], frequency: 154 },
  { word: 'continue', partOfSpeech: 'VERB', definitionKo: '계속하다', definition: 'to persist in an activity', level: 'L1', tags: ['시간'], frequency: 155 },
  { word: 'appear', partOfSpeech: 'VERB', definitionKo: '나타나다, ~처럼 보이다', definition: 'to become visible or seem', level: 'L1', tags: ['인식'], frequency: 156 },
  { word: 'seem', partOfSpeech: 'VERB', definitionKo: '~처럼 보이다', definition: 'to give the impression of being', level: 'L1', tags: ['인식'], frequency: 157 },
  { word: 'claim', partOfSpeech: 'VERB', definitionKo: '주장하다', definition: 'to state something as a fact', level: 'L1', tags: ['논쟁'], frequency: 158 },
  { word: 'argue', partOfSpeech: 'VERB', definitionKo: '주장하다, 논쟁하다', definition: 'to give reasons for or against', level: 'L1', tags: ['논쟁'], frequency: 159 },
  { word: 'lead', partOfSpeech: 'VERB', definitionKo: '이끌다, 야기하다', definition: 'to guide or result in', level: 'L1', tags: ['원인·결과'], frequency: 160, tips: 'lead to ~로 이어지다' },
  { word: 'cause', partOfSpeech: 'VERB', definitionKo: '야기하다, 원인', definition: 'to make something happen', level: 'L1', tags: ['원인·결과'], frequency: 161 },
  { word: 'result', partOfSpeech: 'NOUN', definitionKo: '결과', definition: 'an outcome or consequence', level: 'L1', tags: ['원인·결과'], frequency: 162, tips: 'result in/from 구분 주의' },
  { word: 'respond', partOfSpeech: 'VERB', definitionKo: '응답하다', definition: 'to say or act in reply', level: 'L1', tags: ['반응'], frequency: 163 },
  { word: 'accept', partOfSpeech: 'VERB', definitionKo: '받아들이다', definition: 'to agree to receive or do', level: 'L1', tags: ['태도'], frequency: 164 },
  { word: 'reject', partOfSpeech: 'VERB', definitionKo: '거부하다', definition: 'to refuse to accept or consider', level: 'L1', tags: ['태도'], frequency: 165 },
  { word: 'approach', partOfSpeech: 'NOUN', definitionKo: '접근법', definition: 'a way of dealing with something', level: 'L1', tags: ['방법'], frequency: 166 },
  { word: 'method', partOfSpeech: 'NOUN', definitionKo: '방법', definition: 'a particular procedure for accomplishing', level: 'L1', tags: ['방법'], frequency: 167 },
  { word: 'process', partOfSpeech: 'NOUN', definitionKo: '과정', definition: 'a series of actions to achieve a result', level: 'L1', tags: ['절차'], frequency: 168 },
  { word: 'purpose', partOfSpeech: 'NOUN', definitionKo: '목적', definition: 'the reason for which something is done', level: 'L1', tags: ['목표'], frequency: 169 },
  { word: 'reason', partOfSpeech: 'NOUN', definitionKo: '이유', definition: 'a cause or explanation', level: 'L1', tags: ['논리'], frequency: 170 },
  { word: 'example', partOfSpeech: 'NOUN', definitionKo: '예시', definition: 'a thing characteristic of its kind', level: 'L1', tags: ['설명'], frequency: 171 },
  { word: 'issue', partOfSpeech: 'NOUN', definitionKo: '문제, 쟁점', definition: 'an important topic or problem', level: 'L1', tags: ['사회'], frequency: 172 },
  { word: 'situation', partOfSpeech: 'NOUN', definitionKo: '상황', definition: 'the set of circumstances at a moment', level: 'L1', tags: ['상황'], frequency: 173 },
  { word: 'condition', partOfSpeech: 'NOUN', definitionKo: '조건, 상태', definition: 'the state of something or circumstances', level: 'L1', tags: ['상태'], frequency: 174 },
  { word: 'source', partOfSpeech: 'NOUN', definitionKo: '출처, 원천', definition: 'a place from which something comes', level: 'L1', tags: ['정보'], frequency: 175 },
  { word: 'resource', partOfSpeech: 'NOUN', definitionKo: '자원', definition: 'a supply that can be drawn on', level: 'L1', tags: ['경제'], frequency: 176 },
  { word: 'evidence', partOfSpeech: 'NOUN', definitionKo: '증거', definition: 'facts indicating truth or validity', level: 'L1', tags: ['논리'], frequency: 177 },
  { word: 'research', partOfSpeech: 'NOUN', definitionKo: '연구', definition: 'systematic investigation', level: 'L1', tags: ['학술'], frequency: 178 },
  { word: 'study', partOfSpeech: 'NOUN', definitionKo: '연구, 학습', definition: 'detailed investigation or examination', level: 'L1', tags: ['학술'], frequency: 179 },
  { word: 'experience', partOfSpeech: 'NOUN', definitionKo: '경험', definition: 'practical contact and observation', level: 'L1', tags: ['삶'], frequency: 180 },
  { word: 'knowledge', partOfSpeech: 'NOUN', definitionKo: '지식', definition: 'facts and information acquired', level: 'L1', tags: ['교육'], frequency: 181 },
  { word: 'skill', partOfSpeech: 'NOUN', definitionKo: '기술, 능력', definition: 'the ability to do something well', level: 'L1', tags: ['능력'], frequency: 182 },
  { word: 'ability', partOfSpeech: 'NOUN', definitionKo: '능력', definition: 'possession of means or skill', level: 'L1', tags: ['능력'], frequency: 183 },
  { word: 'effort', partOfSpeech: 'NOUN', definitionKo: '노력', definition: 'a vigorous attempt', level: 'L1', tags: ['행동'], frequency: 184 },
  { word: 'attention', partOfSpeech: 'NOUN', definitionKo: '주의, 관심', definition: 'notice taken of something', level: 'L1', tags: ['인지'], frequency: 185 },
  { word: 'focus', partOfSpeech: 'NOUN', definitionKo: '초점, 집중', definition: 'the center of interest or activity', level: 'L1', tags: ['인지'], frequency: 186 },
  { word: 'influence', partOfSpeech: 'NOUN', definitionKo: '영향', definition: 'the power to affect others', level: 'L1', tags: ['관계'], frequency: 187 },
  { word: 'impact', partOfSpeech: 'NOUN', definitionKo: '영향, 충격', definition: 'a marked effect or influence', level: 'L1', tags: ['원인·결과'], frequency: 188 },
  { word: 'benefit', partOfSpeech: 'NOUN', definitionKo: '이익, 혜택', definition: 'an advantage or profit gained', level: 'L1', tags: ['가치'], frequency: 189 },
  { word: 'value', partOfSpeech: 'NOUN', definitionKo: '가치', definition: 'the worth or importance of something', level: 'L1', tags: ['가치'], frequency: 190 },
  { word: 'feature', partOfSpeech: 'NOUN', definitionKo: '특징', definition: 'a distinctive attribute or aspect', level: 'L1', tags: ['특성'], frequency: 191 },
  { word: 'aspect', partOfSpeech: 'NOUN', definitionKo: '측면', definition: 'a particular part or feature', level: 'L1', tags: ['특성'], frequency: 192 },
  { word: 'role', partOfSpeech: 'NOUN', definitionKo: '역할', definition: 'the function assumed by a person', level: 'L1', tags: ['사회'], frequency: 193 },
  { word: 'common', partOfSpeech: 'ADJECTIVE', definitionKo: '흔한, 공통의', definition: 'occurring frequently or shared', level: 'L1', tags: ['일반'], frequency: 194 },
  { word: 'similar', partOfSpeech: 'ADJECTIVE', definitionKo: '비슷한', definition: 'resembling without being identical', level: 'L1', tags: ['비교'], frequency: 195 },
  { word: 'different', partOfSpeech: 'ADJECTIVE', definitionKo: '다른', definition: 'not the same as another', level: 'L1', tags: ['비교'], frequency: 196 },
  { word: 'specific', partOfSpeech: 'ADJECTIVE', definitionKo: '구체적인', definition: 'clearly defined or identified', level: 'L1', tags: ['특성'], frequency: 197 },
  { word: 'particular', partOfSpeech: 'ADJECTIVE', definitionKo: '특정한', definition: 'used to single out an individual', level: 'L1', tags: ['특성'], frequency: 198 },
  { word: 'especially', partOfSpeech: 'ADVERB', definitionKo: '특히', definition: 'to a great extent; particularly', level: 'L1', tags: ['강조'], frequency: 199 },
  { word: 'actually', partOfSpeech: 'ADVERB', definitionKo: '실제로', definition: 'in fact; really', level: 'L1', tags: ['강조'], frequency: 200 },
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
  // L2 추가 단어 (41-100)
  { word: 'analyze', partOfSpeech: 'VERB', definitionKo: '분석하다', definition: 'to examine methodically', level: 'L2', tags: ['연구', '사고'], frequency: 241 },
  { word: 'assess', partOfSpeech: 'VERB', definitionKo: '평가하다', definition: 'to evaluate or estimate', level: 'L2', tags: ['연구'], frequency: 242 },
  { word: 'establish', partOfSpeech: 'VERB', definitionKo: '확립하다', definition: 'to set up or found', level: 'L2', tags: ['조직'], frequency: 243 },
  { word: 'generate', partOfSpeech: 'VERB', definitionKo: '생성하다', definition: 'to produce or create', level: 'L2', tags: ['생산'], frequency: 244 },
  { word: 'demonstrate', partOfSpeech: 'VERB', definitionKo: '입증하다, 시연하다', definition: 'to show clearly', level: 'L2', tags: ['증명'], frequency: 245 },
  { word: 'distinguish', partOfSpeech: 'VERB', definitionKo: '구별하다', definition: 'to recognize as different', level: 'L2', tags: ['비교'], frequency: 246 },
  { word: 'identify', partOfSpeech: 'VERB', definitionKo: '확인하다, 식별하다', definition: 'to recognize or establish', level: 'L2', tags: ['인식'], frequency: 247 },
  { word: 'reveal', partOfSpeech: 'VERB', definitionKo: '드러내다', definition: 'to make known', level: 'L2', tags: ['정보'], frequency: 248 },
  { word: 'conclude', partOfSpeech: 'VERB', definitionKo: '결론짓다', definition: 'to bring to an end or reach a judgment', level: 'L2', tags: ['논리'], frequency: 249 },
  { word: 'convince', partOfSpeech: 'VERB', definitionKo: '확신시키다', definition: 'to persuade someone', level: 'L2', tags: ['설득'], frequency: 250 },
  { word: 'emphasize', partOfSpeech: 'VERB', definitionKo: '강조하다', definition: 'to give special importance to', level: 'L2', tags: ['글쓰기'], frequency: 251 },
  { word: 'enhance', partOfSpeech: 'VERB', definitionKo: '향상시키다', definition: 'to improve quality or value', level: 'L2', tags: ['개선'], frequency: 252 },
  { word: 'expand', partOfSpeech: 'VERB', definitionKo: '확장하다', definition: 'to increase in size or scope', level: 'L2', tags: ['성장'], frequency: 253 },
  { word: 'illustrate', partOfSpeech: 'VERB', definitionKo: '설명하다, 예시하다', definition: 'to explain by example', level: 'L2', tags: ['설명'], frequency: 254 },
  { word: 'observe', partOfSpeech: 'VERB', definitionKo: '관찰하다', definition: 'to watch carefully', level: 'L2', tags: ['과학'], frequency: 255 },
  { word: 'obtain', partOfSpeech: 'VERB', definitionKo: '얻다', definition: 'to get or acquire', level: 'L2', tags: ['획득'], frequency: 256 },
  { word: 'promote', partOfSpeech: 'VERB', definitionKo: '촉진하다, 홍보하다', definition: 'to support or encourage', level: 'L2', tags: ['경제'], frequency: 257 },
  { word: 'regulate', partOfSpeech: 'VERB', definitionKo: '규제하다', definition: 'to control by rules', level: 'L2', tags: ['법', '정책'], frequency: 258 },
  { word: 'stimulate', partOfSpeech: 'VERB', definitionKo: '자극하다', definition: 'to encourage activity', level: 'L2', tags: ['과학', '경제'], frequency: 259 },
  { word: 'transform', partOfSpeech: 'VERB', definitionKo: '변형하다', definition: 'to change completely', level: 'L2', tags: ['변화'], frequency: 260 },
  { word: 'acknowledge', partOfSpeech: 'VERB', definitionKo: '인정하다', definition: 'to accept or admit the truth', level: 'L2', tags: ['태도'], frequency: 261 },
  { word: 'associate', partOfSpeech: 'VERB', definitionKo: '연관시키다', definition: 'to connect in the mind', level: 'L2', tags: ['관계'], frequency: 262 },
  { word: 'attribute', partOfSpeech: 'VERB', definitionKo: '~의 탓으로 돌리다', definition: 'to regard as caused by', level: 'L2', tags: ['원인'], frequency: 263, tips: 'attribute A to B: A를 B 탓으로 돌리다' },
  { word: 'contribute', partOfSpeech: 'VERB', definitionKo: '기여하다', definition: 'to give for a common purpose', level: 'L2', tags: ['협력'], frequency: 264, tips: 'contribute to ~에 기여하다' },
  { word: 'derive', partOfSpeech: 'VERB', definitionKo: '유래하다, 얻다', definition: 'to obtain from a source', level: 'L2', tags: ['어원'], frequency: 265, tips: 'derive from ~에서 유래하다' },
  { word: 'fundamental', partOfSpeech: 'ADJECTIVE', definitionKo: '근본적인', definition: 'forming a necessary base', level: 'L2', tags: ['중요성'], frequency: 266 },
  { word: 'essential', partOfSpeech: 'ADJECTIVE', definitionKo: '필수적인', definition: 'absolutely necessary', level: 'L2', tags: ['중요성'], frequency: 267 },
  { word: 'crucial', partOfSpeech: 'ADJECTIVE', definitionKo: '결정적인', definition: 'of great importance', level: 'L2', tags: ['중요성'], frequency: 268 },
  { word: 'relevant', partOfSpeech: 'ADJECTIVE', definitionKo: '관련 있는', definition: 'closely connected', level: 'L2', tags: ['관계'], frequency: 269 },
  { word: 'apparent', partOfSpeech: 'ADJECTIVE', definitionKo: '명백한', definition: 'clearly visible or understood', level: 'L2', tags: ['인식'], frequency: 270 },
  { word: 'obvious', partOfSpeech: 'ADJECTIVE', definitionKo: '명백한', definition: 'easily perceived or understood', level: 'L2', tags: ['인식'], frequency: 271 },
  { word: 'accurate', partOfSpeech: 'ADJECTIVE', definitionKo: '정확한', definition: 'free from error', level: 'L2', tags: ['정확성'], frequency: 272 },
  { word: 'precise', partOfSpeech: 'ADJECTIVE', definitionKo: '정밀한', definition: 'exact in measurement', level: 'L2', tags: ['정확성'], frequency: 273 },
  { word: 'appropriate', partOfSpeech: 'ADJECTIVE', definitionKo: '적절한', definition: 'suitable for a particular purpose', level: 'L2', tags: ['적합성'], frequency: 274 },
  { word: 'adequate', partOfSpeech: 'ADJECTIVE', definitionKo: '충분한', definition: 'satisfactory or acceptable', level: 'L2', tags: ['양'], frequency: 275 },
  { word: 'extensive', partOfSpeech: 'ADJECTIVE', definitionKo: '광범위한', definition: 'covering a large area', level: 'L2', tags: ['범위'], frequency: 276 },
  { word: 'intense', partOfSpeech: 'ADJECTIVE', definitionKo: '강렬한', definition: 'of extreme force or degree', level: 'L2', tags: ['정도'], frequency: 277 },
  { word: 'distinct', partOfSpeech: 'ADJECTIVE', definitionKo: '뚜렷한, 별개의', definition: 'clearly different', level: 'L2', tags: ['차이'], frequency: 278 },
  { word: 'dominant', partOfSpeech: 'ADJECTIVE', definitionKo: '지배적인', definition: 'most important or powerful', level: 'L2', tags: ['권력'], frequency: 279 },
  { word: 'enormous', partOfSpeech: 'ADJECTIVE', definitionKo: '막대한', definition: 'very large in size', level: 'L2', tags: ['크기'], frequency: 280 },
  { word: 'rapid', partOfSpeech: 'ADJECTIVE', definitionKo: '빠른', definition: 'happening quickly', level: 'L2', tags: ['속도'], frequency: 281 },
  { word: 'gradual', partOfSpeech: 'ADJECTIVE', definitionKo: '점진적인', definition: 'taking place slowly', level: 'L2', tags: ['속도'], frequency: 282 },
  { word: 'permanent', partOfSpeech: 'ADJECTIVE', definitionKo: '영구적인', definition: 'lasting indefinitely', level: 'L2', tags: ['시간'], frequency: 283 },
  { word: 'temporary', partOfSpeech: 'ADJECTIVE', definitionKo: '일시적인', definition: 'lasting for a limited time', level: 'L2', tags: ['시간'], frequency: 284 },
  { word: 'principle', partOfSpeech: 'NOUN', definitionKo: '원리, 원칙', definition: 'a fundamental truth or proposition', level: 'L2', tags: ['철학'], frequency: 285 },
  { word: 'theory', partOfSpeech: 'NOUN', definitionKo: '이론', definition: 'a system of ideas to explain something', level: 'L2', tags: ['학술'], frequency: 286 },
  { word: 'hypothesis', partOfSpeech: 'NOUN', definitionKo: '가설', definition: 'a proposed explanation', level: 'L2', tags: ['과학'], frequency: 287 },
  { word: 'assumption', partOfSpeech: 'NOUN', definitionKo: '가정', definition: 'something taken for granted', level: 'L2', tags: ['논리'], frequency: 288 },
  { word: 'perception', partOfSpeech: 'NOUN', definitionKo: '인식', definition: 'the ability to see or understand', level: 'L2', tags: ['심리'], frequency: 289 },
  { word: 'awareness', partOfSpeech: 'NOUN', definitionKo: '인식, 자각', definition: 'knowledge of a situation', level: 'L2', tags: ['심리'], frequency: 290 },
  { word: 'insight', partOfSpeech: 'NOUN', definitionKo: '통찰력', definition: 'an accurate understanding', level: 'L2', tags: ['사고'], frequency: 291 },
  { word: 'dimension', partOfSpeech: 'NOUN', definitionKo: '차원, 측면', definition: 'a measurable extent or aspect', level: 'L2', tags: ['분석'], frequency: 292 },
  { word: 'mechanism', partOfSpeech: 'NOUN', definitionKo: '메커니즘, 기제', definition: 'a system of parts working together', level: 'L2', tags: ['과학'], frequency: 293 },
  { word: 'strategy', partOfSpeech: 'NOUN', definitionKo: '전략', definition: 'a plan of action', level: 'L2', tags: ['계획'], frequency: 294 },
  { word: 'structure', partOfSpeech: 'NOUN', definitionKo: '구조', definition: 'the arrangement of parts', level: 'L2', tags: ['조직'], frequency: 295 },
  { word: 'capacity', partOfSpeech: 'NOUN', definitionKo: '능력, 용량', definition: 'the maximum amount or ability', level: 'L2', tags: ['능력'], frequency: 296 },
  { word: 'emphasis', partOfSpeech: 'NOUN', definitionKo: '강조', definition: 'special importance given to something', level: 'L2', tags: ['표현'], frequency: 297 },
  { word: 'characteristic', partOfSpeech: 'NOUN', definitionKo: '특성', definition: 'a typical feature or quality', level: 'L2', tags: ['특성'], frequency: 298 },
  { word: 'constraint', partOfSpeech: 'NOUN', definitionKo: '제약', definition: 'a limitation or restriction', level: 'L2', tags: ['제한'], frequency: 299 },
  { word: 'furthermore', partOfSpeech: 'ADVERB', definitionKo: '게다가', definition: 'in addition; moreover', level: 'L2', tags: ['연결어'], frequency: 300 },
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
  // L3 추가 단어 (41-100)
  { word: 'comprehensive', partOfSpeech: 'ADJECTIVE', definitionKo: '포괄적인', definition: 'complete and including everything', level: 'L3', tags: ['범위'], frequency: 341 },
  { word: 'sophisticated', partOfSpeech: 'ADJECTIVE', definitionKo: '정교한, 세련된', definition: 'highly developed and complex', level: 'L3', tags: ['수준'], frequency: 342 },
  { word: 'subtle', partOfSpeech: 'ADJECTIVE', definitionKo: '미묘한', definition: 'not immediately obvious', level: 'L3', tags: ['인식'], frequency: 343 },
  { word: 'profound', partOfSpeech: 'ADJECTIVE', definitionKo: '심오한', definition: 'very great or intense', level: 'L3', tags: ['정도'], frequency: 344 },
  { word: 'ambiguous', partOfSpeech: 'ADJECTIVE', definitionKo: '모호한', definition: 'open to more than one interpretation', level: 'L3', tags: ['의미'], frequency: 345 },
  { word: 'explicit', partOfSpeech: 'ADJECTIVE', definitionKo: '명시적인', definition: 'stated clearly and in detail', level: 'L3', tags: ['표현'], frequency: 346 },
  { word: 'implicit', partOfSpeech: 'ADJECTIVE', definitionKo: '암묵적인', definition: 'implied but not directly expressed', level: 'L3', tags: ['표현'], frequency: 347 },
  { word: 'inherent', partOfSpeech: 'ADJECTIVE', definitionKo: '내재된', definition: 'existing as a permanent quality', level: 'L3', tags: ['특성'], frequency: 348 },
  { word: 'intrinsic', partOfSpeech: 'ADJECTIVE', definitionKo: '본질적인', definition: 'belonging naturally; essential', level: 'L3', tags: ['특성'], frequency: 349 },
  { word: 'prevalent', partOfSpeech: 'ADJECTIVE', definitionKo: '널리 퍼진', definition: 'widespread in a particular area', level: 'L3', tags: ['사회'], frequency: 350 },
  { word: 'detrimental', partOfSpeech: 'ADJECTIVE', definitionKo: '해로운', definition: 'tending to cause harm', level: 'L3', tags: ['영향'], frequency: 351 },
  { word: 'beneficial', partOfSpeech: 'ADJECTIVE', definitionKo: '유익한', definition: 'favorable or advantageous', level: 'L3', tags: ['영향'], frequency: 352 },
  { word: 'adverse', partOfSpeech: 'ADJECTIVE', definitionKo: '불리한', definition: 'preventing success or development', level: 'L3', tags: ['상황'], frequency: 353 },
  { word: 'redundant', partOfSpeech: 'ADJECTIVE', definitionKo: '불필요한, 중복된', definition: 'no longer needed or useful', level: 'L3', tags: ['효율'], frequency: 354 },
  { word: 'plausible', partOfSpeech: 'ADJECTIVE', definitionKo: '그럴듯한', definition: 'seeming reasonable or probable', level: 'L3', tags: ['논리'], frequency: 355 },
  { word: 'coherent', partOfSpeech: 'ADJECTIVE', definitionKo: '일관된', definition: 'logical and consistent', level: 'L3', tags: ['논리'], frequency: 356 },
  { word: 'tangible', partOfSpeech: 'ADJECTIVE', definitionKo: '실체가 있는', definition: 'perceptible by touch; real', level: 'L3', tags: ['실재'], frequency: 357 },
  { word: 'elusive', partOfSpeech: 'ADJECTIVE', definitionKo: '파악하기 어려운', definition: 'difficult to find or achieve', level: 'L3', tags: ['어려움'], frequency: 358 },
  { word: 'rigorous', partOfSpeech: 'ADJECTIVE', definitionKo: '엄격한', definition: 'extremely thorough and careful', level: 'L3', tags: ['기준'], frequency: 359 },
  { word: 'autonomous', partOfSpeech: 'ADJECTIVE', definitionKo: '자율적인', definition: 'having self-government', level: 'L3', tags: ['독립'], frequency: 360 },
  { word: 'diminish', partOfSpeech: 'VERB', definitionKo: '줄이다, 감소하다', definition: 'to make or become less', level: 'L3', tags: ['변화'], frequency: 361 },
  { word: 'consolidate', partOfSpeech: 'VERB', definitionKo: '통합하다', definition: 'to combine into a single more effective whole', level: 'L3', tags: ['조직'], frequency: 362 },
  { word: 'deteriorate', partOfSpeech: 'VERB', definitionKo: '악화되다', definition: 'to become progressively worse', level: 'L3', tags: ['변화'], frequency: 363 },
  { word: 'perpetuate', partOfSpeech: 'VERB', definitionKo: '영속시키다', definition: 'to make something continue indefinitely', level: 'L3', tags: ['지속'], frequency: 364 },
  { word: 'scrutinize', partOfSpeech: 'VERB', definitionKo: '면밀히 조사하다', definition: 'to examine or inspect closely', level: 'L3', tags: ['분석'], frequency: 365 },
  { word: 'transcend', partOfSpeech: 'VERB', definitionKo: '초월하다', definition: 'to go beyond the limits of', level: 'L3', tags: ['철학'], frequency: 366 },
  { word: 'advocate', partOfSpeech: 'VERB', definitionKo: '옹호하다', definition: 'to publicly recommend or support', level: 'L3', tags: ['사회'], frequency: 367 },
  { word: 'assert', partOfSpeech: 'VERB', definitionKo: '단언하다', definition: 'to state a fact confidently', level: 'L3', tags: ['주장'], frequency: 368 },
  { word: 'contradict', partOfSpeech: 'VERB', definitionKo: '모순되다', definition: 'to be in conflict with', level: 'L3', tags: ['논리'], frequency: 369 },
  { word: 'deviate', partOfSpeech: 'VERB', definitionKo: '벗어나다', definition: 'to depart from an established course', level: 'L3', tags: ['변화'], frequency: 370 },
  { word: 'encompass', partOfSpeech: 'VERB', definitionKo: '포함하다', definition: 'to surround and have within', level: 'L3', tags: ['범위'], frequency: 371 },
  { word: 'fluctuate', partOfSpeech: 'VERB', definitionKo: '변동하다', definition: 'to rise and fall irregularly', level: 'L3', tags: ['변화'], frequency: 372 },
  { word: 'hinder', partOfSpeech: 'VERB', definitionKo: '방해하다', definition: 'to create difficulties for', level: 'L3', tags: ['장애'], frequency: 373 },
  { word: 'illuminate', partOfSpeech: 'VERB', definitionKo: '밝히다, 설명하다', definition: 'to light up or clarify', level: 'L3', tags: ['설명'], frequency: 374 },
  { word: 'jeopardize', partOfSpeech: 'VERB', definitionKo: '위태롭게 하다', definition: 'to put at risk of loss or harm', level: 'L3', tags: ['위험'], frequency: 375 },
  { word: 'manifest', partOfSpeech: 'VERB', definitionKo: '나타내다', definition: 'to display or show clearly', level: 'L3', tags: ['표현'], frequency: 376 },
  { word: 'nurture', partOfSpeech: 'VERB', definitionKo: '양육하다, 기르다', definition: 'to care for and encourage growth', level: 'L3', tags: ['발달'], frequency: 377 },
  { word: 'precede', partOfSpeech: 'VERB', definitionKo: '선행하다', definition: 'to come before in time', level: 'L3', tags: ['순서'], frequency: 378 },
  { word: 'reconcile', partOfSpeech: 'VERB', definitionKo: '조화시키다', definition: 'to restore friendly relations', level: 'L3', tags: ['관계'], frequency: 379 },
  { word: 'speculate', partOfSpeech: 'VERB', definitionKo: '추측하다', definition: 'to form a theory without firm evidence', level: 'L3', tags: ['사고'], frequency: 380 },
  { word: 'paradigm', partOfSpeech: 'NOUN', definitionKo: '패러다임', definition: 'a typical example or pattern', level: 'L3', tags: ['학술'], frequency: 381 },
  { word: 'dichotomy', partOfSpeech: 'NOUN', definitionKo: '이분법', definition: 'a division into two contrasting things', level: 'L3', tags: ['논리'], frequency: 382 },
  { word: 'discourse', partOfSpeech: 'NOUN', definitionKo: '담론', definition: 'written or spoken communication', level: 'L3', tags: ['언어'], frequency: 383 },
  { word: 'inference', partOfSpeech: 'NOUN', definitionKo: '추론', definition: 'a conclusion reached on basis of evidence', level: 'L3', tags: ['사고'], frequency: 384 },
  { word: 'analogy', partOfSpeech: 'NOUN', definitionKo: '유추', definition: 'a comparison between two things', level: 'L3', tags: ['사고'], frequency: 385 },
  { word: 'correlation', partOfSpeech: 'NOUN', definitionKo: '상관관계', definition: 'a mutual relationship between things', level: 'L3', tags: ['통계'], frequency: 386 },
  { word: 'disparity', partOfSpeech: 'NOUN', definitionKo: '격차', definition: 'a great difference', level: 'L3', tags: ['사회'], frequency: 387 },
  { word: 'equilibrium', partOfSpeech: 'NOUN', definitionKo: '평형', definition: 'a state of balance', level: 'L3', tags: ['과학'], frequency: 388 },
  { word: 'dilemma', partOfSpeech: 'NOUN', definitionKo: '딜레마', definition: 'a difficult situation requiring choice', level: 'L3', tags: ['결정'], frequency: 389 },
  { word: 'integrity', partOfSpeech: 'NOUN', definitionKo: '무결성, 성실성', definition: 'the quality of being honest and moral', level: 'L3', tags: ['윤리'], frequency: 390 },
  { word: 'rationale', partOfSpeech: 'NOUN', definitionKo: '근거, 이유', definition: 'a set of reasons for a course of action', level: 'L3', tags: ['논리'], frequency: 391 },
  { word: 'rhetoric', partOfSpeech: 'NOUN', definitionKo: '수사학', definition: 'the art of effective speaking or writing', level: 'L3', tags: ['언어'], frequency: 392 },
  { word: 'notion', partOfSpeech: 'NOUN', definitionKo: '개념, 생각', definition: 'a conception or belief about something', level: 'L3', tags: ['사고'], frequency: 393 },
  { word: 'premise', partOfSpeech: 'NOUN', definitionKo: '전제', definition: 'a previous statement from which another is inferred', level: 'L3', tags: ['논리'], frequency: 394 },
  { word: 'skepticism', partOfSpeech: 'NOUN', definitionKo: '회의주의', definition: 'a skeptical attitude or doubt', level: 'L3', tags: ['철학'], frequency: 395 },
  { word: 'criterion', partOfSpeech: 'NOUN', definitionKo: '기준', definition: 'a principle for judging', level: 'L3', tags: ['평가'], frequency: 396, tips: '복수형: criteria' },
  { word: 'consensus', partOfSpeech: 'NOUN', definitionKo: '합의', definition: 'general agreement', level: 'L3', tags: ['사회'], frequency: 397 },
  { word: 'autonomy', partOfSpeech: 'NOUN', definitionKo: '자율성', definition: 'the right of self-government', level: 'L3', tags: ['독립'], frequency: 398 },
  { word: 'paradoxically', partOfSpeech: 'ADVERB', definitionKo: '역설적으로', definition: 'in a way that seems contradictory', level: 'L3', tags: ['논리'], frequency: 399 },
  { word: 'inherently', partOfSpeech: 'ADVERB', definitionKo: '본질적으로', definition: 'in a permanent or essential manner', level: 'L3', tags: ['특성'], frequency: 400 },
];

// 다른 시험용 단어 (TEPS, TOEIC, TOEFL, SAT) - 간략 버전
const tepsWords = [
  // TEPS 고급 어휘 (80개)
  { word: 'astute', partOfSpeech: 'ADJECTIVE', definitionKo: '기민한, 명민한', definition: 'having an ability to notice and understand things clearly', level: 'L2', tags: ['태도'], frequency: 401 },
  { word: 'discern', partOfSpeech: 'VERB', definitionKo: '분별하다, 알아차리다', definition: 'to see, recognize, or understand something', level: 'L2', tags: ['인식'], frequency: 402 },
  { word: 'substantiate', partOfSpeech: 'VERB', definitionKo: '입증하다', definition: 'to provide evidence to support or prove', level: 'L3', tags: ['연구'], frequency: 403 },
  { word: 'pervasive', partOfSpeech: 'ADJECTIVE', definitionKo: '만연한', definition: 'existing in all parts of something', level: 'L3', tags: ['사회'], frequency: 404 },
  { word: 'unprecedented', partOfSpeech: 'ADJECTIVE', definitionKo: '전례 없는', definition: 'never having happened before', level: 'L3', tags: ['역사'], frequency: 405 },
  { word: 'alleviate', partOfSpeech: 'VERB', definitionKo: '완화하다', definition: 'to make something less severe', level: 'L3', tags: ['의료'], frequency: 406 },
  { word: 'exacerbate', partOfSpeech: 'VERB', definitionKo: '악화시키다', definition: 'to make a problem worse', level: 'L3', tags: ['의료'], frequency: 407 },
  { word: 'mitigate', partOfSpeech: 'VERB', definitionKo: '완화하다', definition: 'to make something less harmful', level: 'L3', tags: ['환경'], frequency: 408 },
  // TEPS 추가 단어 (9-80)
  { word: 'ameliorate', partOfSpeech: 'VERB', definitionKo: '개선하다', definition: 'to make something better', level: 'L3', tags: ['변화'], frequency: 409 },
  { word: 'circumvent', partOfSpeech: 'VERB', definitionKo: '회피하다, 우회하다', definition: 'to find a way around an obstacle', level: 'L3', tags: ['전략'], frequency: 410 },
  { word: 'corroborate', partOfSpeech: 'VERB', definitionKo: '뒷받침하다', definition: 'to confirm or support with evidence', level: 'L3', tags: ['증명'], frequency: 411 },
  { word: 'disseminate', partOfSpeech: 'VERB', definitionKo: '보급하다, 퍼뜨리다', definition: 'to spread widely', level: 'L3', tags: ['정보'], frequency: 412 },
  { word: 'elucidate', partOfSpeech: 'VERB', definitionKo: '명확히 하다', definition: 'to make clear; explain', level: 'L3', tags: ['설명'], frequency: 413 },
  { word: 'extricate', partOfSpeech: 'VERB', definitionKo: '구출하다, 빠져나가다', definition: 'to free from difficulty', level: 'L3', tags: ['상황'], frequency: 414 },
  { word: 'impede', partOfSpeech: 'VERB', definitionKo: '방해하다', definition: 'to delay or prevent progress', level: 'L3', tags: ['장애'], frequency: 415 },
  { word: 'inundate', partOfSpeech: 'VERB', definitionKo: '범람시키다, 넘치게 하다', definition: 'to overwhelm with things', level: 'L3', tags: ['양'], frequency: 416 },
  { word: 'juxtapose', partOfSpeech: 'VERB', definitionKo: '나란히 놓다', definition: 'to place side by side for comparison', level: 'L3', tags: ['비교'], frequency: 417 },
  { word: 'obliterate', partOfSpeech: 'VERB', definitionKo: '완전히 파괴하다', definition: 'to destroy utterly', level: 'L3', tags: ['파괴'], frequency: 418 },
  { word: 'precipitate', partOfSpeech: 'VERB', definitionKo: '촉발시키다', definition: 'to cause to happen suddenly', level: 'L3', tags: ['원인'], frequency: 419 },
  { word: 'proliferate', partOfSpeech: 'VERB', definitionKo: '급증하다', definition: 'to increase rapidly', level: 'L3', tags: ['성장'], frequency: 420 },
  { word: 'repudiate', partOfSpeech: 'VERB', definitionKo: '부인하다, 거부하다', definition: 'to refuse to accept', level: 'L3', tags: ['거부'], frequency: 421 },
  { word: 'supplant', partOfSpeech: 'VERB', definitionKo: '대신하다', definition: 'to replace by force', level: 'L3', tags: ['교체'], frequency: 422 },
  { word: 'vindicate', partOfSpeech: 'VERB', definitionKo: '입증하다, 정당화하다', definition: 'to clear of blame', level: 'L3', tags: ['증명'], frequency: 423 },
  { word: 'aberrant', partOfSpeech: 'ADJECTIVE', definitionKo: '일탈적인', definition: 'departing from normal', level: 'L3', tags: ['행동'], frequency: 424 },
  { word: 'arduous', partOfSpeech: 'ADJECTIVE', definitionKo: '힘든, 어려운', definition: 'requiring great effort', level: 'L3', tags: ['난이도'], frequency: 425 },
  { word: 'cogent', partOfSpeech: 'ADJECTIVE', definitionKo: '설득력 있는', definition: 'clear, logical, and convincing', level: 'L3', tags: ['논리'], frequency: 426 },
  { word: 'convoluted', partOfSpeech: 'ADJECTIVE', definitionKo: '복잡한', definition: 'extremely complex', level: 'L3', tags: ['구조'], frequency: 427 },
  { word: 'cursory', partOfSpeech: 'ADJECTIVE', definitionKo: '피상적인', definition: 'hasty and superficial', level: 'L3', tags: ['방식'], frequency: 428 },
  { word: 'disparate', partOfSpeech: 'ADJECTIVE', definitionKo: '이질적인', definition: 'essentially different', level: 'L3', tags: ['차이'], frequency: 429 },
  { word: 'erudite', partOfSpeech: 'ADJECTIVE', definitionKo: '박식한', definition: 'having great knowledge', level: 'L3', tags: ['지식'], frequency: 430 },
  { word: 'futile', partOfSpeech: 'ADJECTIVE', definitionKo: '헛된', definition: 'incapable of producing results', level: 'L2', tags: ['결과'], frequency: 431 },
  { word: 'incongruous', partOfSpeech: 'ADJECTIVE', definitionKo: '어울리지 않는', definition: 'not in harmony', level: 'L3', tags: ['조화'], frequency: 432 },
  { word: 'innocuous', partOfSpeech: 'ADJECTIVE', definitionKo: '무해한', definition: 'not harmful', level: 'L3', tags: ['위험'], frequency: 433 },
  { word: 'insidious', partOfSpeech: 'ADJECTIVE', definitionKo: '교활한, 서서히 퍼지는', definition: 'proceeding gradually and harmfully', level: 'L3', tags: ['위험'], frequency: 434 },
  { word: 'meticulous', partOfSpeech: 'ADJECTIVE', definitionKo: '꼼꼼한', definition: 'showing great attention to detail', level: 'L2', tags: ['태도'], frequency: 435 },
  { word: 'mundane', partOfSpeech: 'ADJECTIVE', definitionKo: '일상적인, 평범한', definition: 'lacking interest or excitement', level: 'L2', tags: ['일상'], frequency: 436 },
  { word: 'nascent', partOfSpeech: 'ADJECTIVE', definitionKo: '초기의', definition: 'just beginning to develop', level: 'L3', tags: ['발전'], frequency: 437 },
  { word: 'nefarious', partOfSpeech: 'ADJECTIVE', definitionKo: '사악한', definition: 'wicked or criminal', level: 'L3', tags: ['도덕'], frequency: 438 },
  { word: 'obsolete', partOfSpeech: 'ADJECTIVE', definitionKo: '구식의', definition: 'no longer in use', level: 'L2', tags: ['시대'], frequency: 439 },
  { word: 'onerous', partOfSpeech: 'ADJECTIVE', definitionKo: '부담스러운', definition: 'involving heavy obligation', level: 'L3', tags: ['책임'], frequency: 440 },
  { word: 'ostensible', partOfSpeech: 'ADJECTIVE', definitionKo: '표면상의', definition: 'stated but not necessarily true', level: 'L3', tags: ['외관'], frequency: 441 },
  { word: 'palpable', partOfSpeech: 'ADJECTIVE', definitionKo: '명백한, 만질 수 있는', definition: 'able to be touched or felt', level: 'L3', tags: ['감각'], frequency: 442 },
  { word: 'pedantic', partOfSpeech: 'ADJECTIVE', definitionKo: '현학적인', definition: 'excessively concerned with minor details', level: 'L3', tags: ['태도'], frequency: 443 },
  { word: 'perfunctory', partOfSpeech: 'ADJECTIVE', definitionKo: '형식적인', definition: 'done without care or interest', level: 'L3', tags: ['태도'], frequency: 444 },
  { word: 'precarious', partOfSpeech: 'ADJECTIVE', definitionKo: '불안정한', definition: 'not secure; dangerously uncertain', level: 'L3', tags: ['상황'], frequency: 445 },
  { word: 'prolific', partOfSpeech: 'ADJECTIVE', definitionKo: '다작하는', definition: 'producing much', level: 'L3', tags: ['생산'], frequency: 446 },
  { word: 'recalcitrant', partOfSpeech: 'ADJECTIVE', definitionKo: '완강히 저항하는', definition: 'stubbornly resistant', level: 'L3', tags: ['태도'], frequency: 447 },
  { word: 'salient', partOfSpeech: 'ADJECTIVE', definitionKo: '두드러진', definition: 'most noticeable or important', level: 'L3', tags: ['중요성'], frequency: 448 },
  { word: 'spurious', partOfSpeech: 'ADJECTIVE', definitionKo: '가짜의', definition: 'not genuine; false', level: 'L3', tags: ['진위'], frequency: 449 },
  { word: 'stringent', partOfSpeech: 'ADJECTIVE', definitionKo: '엄격한', definition: 'strict and demanding', level: 'L3', tags: ['규칙'], frequency: 450 },
  { word: 'tenuous', partOfSpeech: 'ADJECTIVE', definitionKo: '희박한', definition: 'very weak or slight', level: 'L3', tags: ['정도'], frequency: 451 },
  { word: 'ubiquitous', partOfSpeech: 'ADJECTIVE', definitionKo: '어디에나 있는', definition: 'present everywhere', level: 'L3', tags: ['분포'], frequency: 452 },
  { word: 'vacillate', partOfSpeech: 'VERB', definitionKo: '동요하다', definition: 'to waver between different opinions', level: 'L3', tags: ['결정'], frequency: 453 },
  { word: 'veracious', partOfSpeech: 'ADJECTIVE', definitionKo: '진실한', definition: 'speaking the truth', level: 'L3', tags: ['진실'], frequency: 454 },
  { word: 'anomaly', partOfSpeech: 'NOUN', definitionKo: '이례적인 것', definition: 'something that deviates from normal', level: 'L3', tags: ['예외'], frequency: 455 },
  { word: 'antipathy', partOfSpeech: 'NOUN', definitionKo: '반감', definition: 'a deep feeling of dislike', level: 'L3', tags: ['감정'], frequency: 456 },
  { word: 'apprehension', partOfSpeech: 'NOUN', definitionKo: '불안, 이해', definition: 'anxiety or understanding', level: 'L2', tags: ['감정'], frequency: 457 },
  { word: 'aversion', partOfSpeech: 'NOUN', definitionKo: '혐오', definition: 'a strong dislike', level: 'L3', tags: ['감정'], frequency: 458 },
  { word: 'brevity', partOfSpeech: 'NOUN', definitionKo: '간결함', definition: 'shortness of time or expression', level: 'L3', tags: ['특성'], frequency: 459 },
  { word: 'conundrum', partOfSpeech: 'NOUN', definitionKo: '수수께끼', definition: 'a confusing problem', level: 'L3', tags: ['문제'], frequency: 460 },
  { word: 'discrepancy', partOfSpeech: 'NOUN', definitionKo: '불일치', definition: 'a difference between things', level: 'L2', tags: ['차이'], frequency: 461 },
  { word: 'eloquence', partOfSpeech: 'NOUN', definitionKo: '웅변', definition: 'fluent and persuasive speaking', level: 'L3', tags: ['언어'], frequency: 462 },
  { word: 'enigma', partOfSpeech: 'NOUN', definitionKo: '수수께끼', definition: 'something mysterious', level: 'L3', tags: ['미스터리'], frequency: 463 },
  { word: 'fallacy', partOfSpeech: 'NOUN', definitionKo: '오류', definition: 'a mistaken belief', level: 'L3', tags: ['논리'], frequency: 464 },
  { word: 'hegemony', partOfSpeech: 'NOUN', definitionKo: '패권', definition: 'leadership or dominance', level: 'L3', tags: ['권력'], frequency: 465 },
  { word: 'impetus', partOfSpeech: 'NOUN', definitionKo: '자극, 추진력', definition: 'the force that makes something happen', level: 'L3', tags: ['동력'], frequency: 466 },
  { word: 'juxtaposition', partOfSpeech: 'NOUN', definitionKo: '병치', definition: 'placing things side by side', level: 'L3', tags: ['비교'], frequency: 467 },
  { word: 'lethargy', partOfSpeech: 'NOUN', definitionKo: '무기력', definition: 'a lack of energy', level: 'L3', tags: ['상태'], frequency: 468 },
  { word: 'magnitude', partOfSpeech: 'NOUN', definitionKo: '규모', definition: 'the great size or importance', level: 'L2', tags: ['크기'], frequency: 469 },
  { word: 'nuance', partOfSpeech: 'NOUN', definitionKo: '뉘앙스', definition: 'a subtle difference in meaning', level: 'L2', tags: ['의미'], frequency: 470 },
  { word: 'paradox', partOfSpeech: 'NOUN', definitionKo: '역설', definition: 'a contradictory but true statement', level: 'L3', tags: ['논리'], frequency: 471 },
  { word: 'pragmatism', partOfSpeech: 'NOUN', definitionKo: '실용주의', definition: 'a practical approach', level: 'L3', tags: ['철학'], frequency: 472 },
  { word: 'predilection', partOfSpeech: 'NOUN', definitionKo: '편애, 선호', definition: 'a preference or special liking', level: 'L3', tags: ['선호'], frequency: 473 },
  { word: 'quandary', partOfSpeech: 'NOUN', definitionKo: '곤경', definition: 'a state of perplexity', level: 'L3', tags: ['상황'], frequency: 474 },
  { word: 'ramification', partOfSpeech: 'NOUN', definitionKo: '파급효과', definition: 'a consequence of an action', level: 'L3', tags: ['결과'], frequency: 475 },
  { word: 'scrutiny', partOfSpeech: 'NOUN', definitionKo: '정밀 조사', definition: 'critical observation', level: 'L3', tags: ['분석'], frequency: 476 },
  { word: 'stigma', partOfSpeech: 'NOUN', definitionKo: '오명', definition: 'a mark of disgrace', level: 'L3', tags: ['사회'], frequency: 477 },
  { word: 'vicissitude', partOfSpeech: 'NOUN', definitionKo: '변천', definition: 'a change of circumstances', level: 'L3', tags: ['변화'], frequency: 478 },
  { word: 'zenith', partOfSpeech: 'NOUN', definitionKo: '정점', definition: 'the highest point', level: 'L3', tags: ['정도'], frequency: 479 },
  { word: 'albeit', partOfSpeech: 'CONJUNCTION', definitionKo: '비록 ~일지라도', definition: 'although', level: 'L2', tags: ['연결어'], frequency: 480 },
];

const toeicWords = [
  // TOEIC 비즈니스 영어 (80개)
  { word: 'comply', partOfSpeech: 'VERB', definitionKo: '준수하다', definition: 'to act in accordance with rules', level: 'L1', tags: ['규정'], frequency: 501, tips: 'comply with regulations (규정 준수)' },
  { word: 'expedite', partOfSpeech: 'VERB', definitionKo: '신속히 처리하다', definition: 'to make an action happen faster', level: 'L2', tags: ['업무'], frequency: 502 },
  { word: 'reimburse', partOfSpeech: 'VERB', definitionKo: '환급하다', definition: 'to pay back money spent', level: 'L2', tags: ['회계'], frequency: 503 },
  { word: 'invoice', partOfSpeech: 'NOUN', definitionKo: '송장', definition: 'a list of goods with costs', level: 'L1', tags: ['회계'], frequency: 504 },
  { word: 'quarterly', partOfSpeech: 'ADJECTIVE', definitionKo: '분기별의', definition: 'happening every three months', level: 'L1', tags: ['일정'], frequency: 505 },
  { word: 'tentative', partOfSpeech: 'ADJECTIVE', definitionKo: '잠정적인', definition: 'not certain or fixed', level: 'L2', tags: ['일정'], frequency: 506 },
  { word: 'adjacent', partOfSpeech: 'ADJECTIVE', definitionKo: '인접한', definition: 'next to or near something', level: 'L2', tags: ['위치'], frequency: 507 },
  { word: 'mandatory', partOfSpeech: 'ADJECTIVE', definitionKo: '의무적인', definition: 'required by law or rules', level: 'L2', tags: ['규정'], frequency: 508 },
  // TOEIC 추가 단어 (9-80)
  { word: 'allocate', partOfSpeech: 'VERB', definitionKo: '할당하다', definition: 'to distribute for a particular purpose', level: 'L2', tags: ['업무'], frequency: 509 },
  { word: 'authorize', partOfSpeech: 'VERB', definitionKo: '승인하다', definition: 'to give official permission', level: 'L1', tags: ['권한'], frequency: 510 },
  { word: 'consolidate', partOfSpeech: 'VERB', definitionKo: '통합하다', definition: 'to combine into a single unit', level: 'L2', tags: ['조직'], frequency: 511 },
  { word: 'delegate', partOfSpeech: 'VERB', definitionKo: '위임하다', definition: 'to entrust to another', level: 'L2', tags: ['업무'], frequency: 512 },
  { word: 'endorse', partOfSpeech: 'VERB', definitionKo: '지지하다, 배서하다', definition: 'to approve or support', level: 'L2', tags: ['금융'], frequency: 513 },
  { word: 'facilitate', partOfSpeech: 'VERB', definitionKo: '용이하게 하다', definition: 'to make easier', level: 'L2', tags: ['업무'], frequency: 514 },
  { word: 'implement', partOfSpeech: 'VERB', definitionKo: '시행하다', definition: 'to put into effect', level: 'L2', tags: ['경영'], frequency: 515 },
  { word: 'negotiate', partOfSpeech: 'VERB', definitionKo: '협상하다', definition: 'to discuss to reach agreement', level: 'L1', tags: ['협상'], frequency: 516 },
  { word: 'outsource', partOfSpeech: 'VERB', definitionKo: '외주를 주다', definition: 'to contract out work', level: 'L2', tags: ['경영'], frequency: 517 },
  { word: 'prioritize', partOfSpeech: 'VERB', definitionKo: '우선순위를 정하다', definition: 'to arrange in order of importance', level: 'L2', tags: ['업무'], frequency: 518 },
  { word: 'reimburse', partOfSpeech: 'VERB', definitionKo: '상환하다', definition: 'to repay money', level: 'L2', tags: ['회계'], frequency: 519 },
  { word: 'streamline', partOfSpeech: 'VERB', definitionKo: '간소화하다', definition: 'to make more efficient', level: 'L2', tags: ['경영'], frequency: 520 },
  { word: 'terminate', partOfSpeech: 'VERB', definitionKo: '종료하다', definition: 'to bring to an end', level: 'L2', tags: ['계약'], frequency: 521 },
  { word: 'verify', partOfSpeech: 'VERB', definitionKo: '확인하다', definition: 'to make sure something is true', level: 'L1', tags: ['확인'], frequency: 522 },
  { word: 'waive', partOfSpeech: 'VERB', definitionKo: '포기하다', definition: 'to refrain from claiming', level: 'L2', tags: ['법률'], frequency: 523 },
  { word: 'affordable', partOfSpeech: 'ADJECTIVE', definitionKo: '저렴한', definition: 'reasonably priced', level: 'L1', tags: ['가격'], frequency: 524 },
  { word: 'authentic', partOfSpeech: 'ADJECTIVE', definitionKo: '진짜의', definition: 'genuine; real', level: 'L2', tags: ['품질'], frequency: 525 },
  { word: 'complementary', partOfSpeech: 'ADJECTIVE', definitionKo: '보완적인, 무료의', definition: 'combining well with something', level: 'L2', tags: ['서비스'], frequency: 526, tips: 'complimentary(칭찬의)와 혼동 주의' },
  { word: 'comprehensive', partOfSpeech: 'ADJECTIVE', definitionKo: '포괄적인', definition: 'complete and including everything', level: 'L2', tags: ['범위'], frequency: 527 },
  { word: 'confidential', partOfSpeech: 'ADJECTIVE', definitionKo: '기밀의', definition: 'intended to be kept secret', level: 'L1', tags: ['보안'], frequency: 528 },
  { word: 'consecutive', partOfSpeech: 'ADJECTIVE', definitionKo: '연속적인', definition: 'following in unbroken order', level: 'L2', tags: ['시간'], frequency: 529 },
  { word: 'defective', partOfSpeech: 'ADJECTIVE', definitionKo: '결함이 있는', definition: 'having a fault', level: 'L1', tags: ['품질'], frequency: 530 },
  { word: 'eligible', partOfSpeech: 'ADJECTIVE', definitionKo: '자격이 있는', definition: 'having the right to do something', level: 'L1', tags: ['자격'], frequency: 531 },
  { word: 'feasible', partOfSpeech: 'ADJECTIVE', definitionKo: '실행 가능한', definition: 'possible to do easily', level: 'L2', tags: ['계획'], frequency: 532 },
  { word: 'liable', partOfSpeech: 'ADJECTIVE', definitionKo: '책임이 있는', definition: 'legally responsible', level: 'L2', tags: ['법률'], frequency: 533 },
  { word: 'lucrative', partOfSpeech: 'ADJECTIVE', definitionKo: '수익성이 좋은', definition: 'producing much money', level: 'L2', tags: ['수익'], frequency: 534 },
  { word: 'perishable', partOfSpeech: 'ADJECTIVE', definitionKo: '부패하기 쉬운', definition: 'likely to decay quickly', level: 'L2', tags: ['물류'], frequency: 535 },
  { word: 'preliminary', partOfSpeech: 'ADJECTIVE', definitionKo: '예비의', definition: 'happening before main event', level: 'L2', tags: ['단계'], frequency: 536 },
  { word: 'prospective', partOfSpeech: 'ADJECTIVE', definitionKo: '장래의', definition: 'expected or potential', level: 'L2', tags: ['미래'], frequency: 537 },
  { word: 'provisional', partOfSpeech: 'ADJECTIVE', definitionKo: '임시의', definition: 'arranged for the present', level: 'L2', tags: ['상태'], frequency: 538 },
  { word: 'reciprocal', partOfSpeech: 'ADJECTIVE', definitionKo: '상호간의', definition: 'given or felt by each side', level: 'L2', tags: ['관계'], frequency: 539 },
  { word: 'subsequent', partOfSpeech: 'ADJECTIVE', definitionKo: '그 다음의', definition: 'coming after something', level: 'L2', tags: ['순서'], frequency: 540 },
  { word: 'subsidiary', partOfSpeech: 'NOUN', definitionKo: '자회사', definition: 'a company controlled by another', level: 'L2', tags: ['조직'], frequency: 541 },
  { word: 'surplus', partOfSpeech: 'NOUN', definitionKo: '잉여, 흑자', definition: 'an amount left over', level: 'L2', tags: ['재정'], frequency: 542 },
  { word: 'warranty', partOfSpeech: 'NOUN', definitionKo: '보증', definition: 'a written guarantee', level: 'L1', tags: ['판매'], frequency: 543 },
  { word: 'inventory', partOfSpeech: 'NOUN', definitionKo: '재고', definition: 'a complete list of items', level: 'L1', tags: ['물류'], frequency: 544 },
  { word: 'itinerary', partOfSpeech: 'NOUN', definitionKo: '여행 일정', definition: 'a planned route', level: 'L2', tags: ['출장'], frequency: 545 },
  { word: 'ledger', partOfSpeech: 'NOUN', definitionKo: '원장', definition: 'a book of financial accounts', level: 'L2', tags: ['회계'], frequency: 546 },
  { word: 'liability', partOfSpeech: 'NOUN', definitionKo: '부채, 책임', definition: 'the state of being responsible', level: 'L2', tags: ['법률'], frequency: 547 },
  { word: 'merchandise', partOfSpeech: 'NOUN', definitionKo: '상품', definition: 'goods to be bought and sold', level: 'L1', tags: ['판매'], frequency: 548 },
  { word: 'quota', partOfSpeech: 'NOUN', definitionKo: '할당량', definition: 'a limited amount allowed', level: 'L2', tags: ['영업'], frequency: 549 },
  { word: 'voucher', partOfSpeech: 'NOUN', definitionKo: '쿠폰, 상품권', definition: 'a document exchangeable for goods', level: 'L1', tags: ['판매'], frequency: 550 },
  { word: 'agenda', partOfSpeech: 'NOUN', definitionKo: '의제, 안건', definition: 'a list of items to be discussed', level: 'L1', tags: ['회의'], frequency: 551 },
  { word: 'amenity', partOfSpeech: 'NOUN', definitionKo: '편의시설', definition: 'a useful or pleasant facility', level: 'L2', tags: ['시설'], frequency: 552 },
  { word: 'brochure', partOfSpeech: 'NOUN', definitionKo: '브로셔', definition: 'a small book with pictures', level: 'L1', tags: ['마케팅'], frequency: 553 },
  { word: 'clientele', partOfSpeech: 'NOUN', definitionKo: '고객층', definition: 'clients collectively', level: 'L2', tags: ['고객'], frequency: 554 },
  { word: 'collateral', partOfSpeech: 'NOUN', definitionKo: '담보', definition: 'something pledged as security', level: 'L2', tags: ['금융'], frequency: 555 },
  { word: 'deficit', partOfSpeech: 'NOUN', definitionKo: '적자', definition: 'the amount by which something falls short', level: 'L2', tags: ['재정'], frequency: 556 },
  { word: 'dividend', partOfSpeech: 'NOUN', definitionKo: '배당금', definition: 'a sum paid to shareholders', level: 'L2', tags: ['투자'], frequency: 557 },
  { word: 'entrepreneur', partOfSpeech: 'NOUN', definitionKo: '기업가', definition: 'a person who sets up a business', level: 'L2', tags: ['경영'], frequency: 558 },
  { word: 'expenditure', partOfSpeech: 'NOUN', definitionKo: '지출', definition: 'the action of spending money', level: 'L2', tags: ['재정'], frequency: 559 },
  { word: 'franchise', partOfSpeech: 'NOUN', definitionKo: '프랜차이즈', definition: 'a license to sell goods', level: 'L2', tags: ['경영'], frequency: 560 },
  { word: 'tariff', partOfSpeech: 'NOUN', definitionKo: '관세', definition: 'a tax on imports or exports', level: 'L2', tags: ['무역'], frequency: 561 },
  { word: 'vendor', partOfSpeech: 'NOUN', definitionKo: '판매자', definition: 'a person selling something', level: 'L1', tags: ['거래'], frequency: 562 },
  { word: 'promptly', partOfSpeech: 'ADVERB', definitionKo: '즉시', definition: 'without delay', level: 'L1', tags: ['시간'], frequency: 563 },
  { word: 'respectively', partOfSpeech: 'ADVERB', definitionKo: '각각', definition: 'in the order mentioned', level: 'L2', tags: ['순서'], frequency: 564 },
  { word: 'accordingly', partOfSpeech: 'ADVERB', definitionKo: '따라서', definition: 'in a way that is appropriate', level: 'L2', tags: ['연결어'], frequency: 565 },
  { word: 'mutually', partOfSpeech: 'ADVERB', definitionKo: '상호간에', definition: 'in a mutual manner', level: 'L2', tags: ['관계'], frequency: 566 },
  { word: 'abide by', partOfSpeech: 'VERB', definitionKo: '준수하다', definition: 'to follow rules or decisions', level: 'L2', tags: ['규정'], frequency: 567 },
  { word: 'adhere to', partOfSpeech: 'VERB', definitionKo: '고수하다', definition: 'to stick firmly to', level: 'L2', tags: ['규정'], frequency: 568 },
  { word: 'audit', partOfSpeech: 'VERB', definitionKo: '감사하다', definition: 'to officially examine accounts', level: 'L2', tags: ['회계'], frequency: 569 },
  { word: 'downturn', partOfSpeech: 'NOUN', definitionKo: '침체', definition: 'a decline in economic activity', level: 'L2', tags: ['경제'], frequency: 570 },
  { word: 'merger', partOfSpeech: 'NOUN', definitionKo: '합병', definition: 'a combination of companies', level: 'L2', tags: ['경영'], frequency: 571 },
  { word: 'overtime', partOfSpeech: 'NOUN', definitionKo: '초과근무', definition: 'time worked beyond normal hours', level: 'L1', tags: ['근무'], frequency: 572 },
  { word: 'payroll', partOfSpeech: 'NOUN', definitionKo: '급여 대장', definition: 'a list of employees and wages', level: 'L2', tags: ['인사'], frequency: 573 },
  { word: 'procurement', partOfSpeech: 'NOUN', definitionKo: '조달', definition: 'the action of obtaining', level: 'L2', tags: ['구매'], frequency: 574 },
  { word: 'revenue', partOfSpeech: 'NOUN', definitionKo: '수익', definition: 'income from business', level: 'L1', tags: ['재정'], frequency: 575 },
  { word: 'turnover', partOfSpeech: 'NOUN', definitionKo: '매출액, 이직률', definition: 'the amount of money taken', level: 'L2', tags: ['재정'], frequency: 576 },
  { word: 'wholesale', partOfSpeech: 'NOUN', definitionKo: '도매', definition: 'selling goods in large quantities', level: 'L1', tags: ['판매'], frequency: 577 },
  { word: 'workforce', partOfSpeech: 'NOUN', definitionKo: '노동력', definition: 'people engaged in work', level: 'L2', tags: ['인사'], frequency: 578 },
  { word: 'refund', partOfSpeech: 'VERB', definitionKo: '환불하다', definition: 'to give money back', level: 'L1', tags: ['판매'], frequency: 579 },
  { word: 'remit', partOfSpeech: 'VERB', definitionKo: '송금하다', definition: 'to send money in payment', level: 'L2', tags: ['금융'], frequency: 580 },
];

const toeflWords = [
  // TOEFL 학술 영어 (80개)
  { word: 'paradigm', partOfSpeech: 'NOUN', definitionKo: '패러다임', definition: 'a typical example or pattern', level: 'L3', tags: ['학술'], frequency: 601 },
  { word: 'proliferate', partOfSpeech: 'VERB', definitionKo: '급증하다', definition: 'to increase rapidly in number', level: 'L3', tags: ['과학'], frequency: 602 },
  { word: 'inherent', partOfSpeech: 'ADJECTIVE', definitionKo: '내재하는', definition: 'existing as a natural part', level: 'L3', tags: ['철학'], frequency: 603 },
  { word: 'catalyst', partOfSpeech: 'NOUN', definitionKo: '촉매', definition: 'something that causes change', level: 'L3', tags: ['과학'], frequency: 604 },
  { word: 'synthesis', partOfSpeech: 'NOUN', definitionKo: '종합', definition: 'the combination of ideas', level: 'L3', tags: ['학술'], frequency: 605 },
  { word: 'hypothesis', partOfSpeech: 'NOUN', definitionKo: '가설', definition: 'an idea not yet proved', level: 'L2', tags: ['연구'], frequency: 606 },
  { word: 'analogous', partOfSpeech: 'ADJECTIVE', definitionKo: '유사한', definition: 'similar in certain respects', level: 'L3', tags: ['비교'], frequency: 607 },
  { word: 'prevalent', partOfSpeech: 'ADJECTIVE', definitionKo: '널리 퍼진', definition: 'widespread at a particular time', level: 'L3', tags: ['사회'], frequency: 608 },
  // TOEFL 추가 단어 (9-80)
  { word: 'anthropology', partOfSpeech: 'NOUN', definitionKo: '인류학', definition: 'the study of human societies', level: 'L3', tags: ['학문'], frequency: 609 },
  { word: 'archaeology', partOfSpeech: 'NOUN', definitionKo: '고고학', definition: 'the study of ancient cultures', level: 'L3', tags: ['학문'], frequency: 610 },
  { word: 'biodiversity', partOfSpeech: 'NOUN', definitionKo: '생물 다양성', definition: 'variety of life in a habitat', level: 'L3', tags: ['환경'], frequency: 611 },
  { word: 'cognitive', partOfSpeech: 'ADJECTIVE', definitionKo: '인지의', definition: 'related to thinking processes', level: 'L3', tags: ['심리'], frequency: 612 },
  { word: 'connotation', partOfSpeech: 'NOUN', definitionKo: '함축', definition: 'an idea suggested by a word', level: 'L3', tags: ['언어'], frequency: 613 },
  { word: 'contemporary', partOfSpeech: 'ADJECTIVE', definitionKo: '동시대의', definition: 'living or occurring at the same time', level: 'L2', tags: ['시간'], frequency: 614 },
  { word: 'cumulative', partOfSpeech: 'ADJECTIVE', definitionKo: '누적되는', definition: 'increasing by successive additions', level: 'L3', tags: ['데이터'], frequency: 615 },
  { word: 'demographic', partOfSpeech: 'ADJECTIVE', definitionKo: '인구통계학적', definition: 'relating to population statistics', level: 'L3', tags: ['사회'], frequency: 616 },
  { word: 'diffusion', partOfSpeech: 'NOUN', definitionKo: '확산', definition: 'the spreading of something widely', level: 'L3', tags: ['과학'], frequency: 617 },
  { word: 'empirical', partOfSpeech: 'ADJECTIVE', definitionKo: '경험적인', definition: 'based on observation', level: 'L3', tags: ['연구'], frequency: 618 },
  { word: 'epoch', partOfSpeech: 'NOUN', definitionKo: '시대', definition: 'a period of time in history', level: 'L3', tags: ['역사'], frequency: 619 },
  { word: 'erosion', partOfSpeech: 'NOUN', definitionKo: '침식', definition: 'the gradual destruction', level: 'L2', tags: ['지질'], frequency: 620 },
  { word: 'excavate', partOfSpeech: 'VERB', definitionKo: '발굴하다', definition: 'to dig out from the ground', level: 'L3', tags: ['고고학'], frequency: 621 },
  { word: 'fauna', partOfSpeech: 'NOUN', definitionKo: '동물군', definition: 'the animals of a region', level: 'L3', tags: ['생물'], frequency: 622 },
  { word: 'flora', partOfSpeech: 'NOUN', definitionKo: '식물군', definition: 'the plants of a region', level: 'L3', tags: ['생물'], frequency: 623 },
  { word: 'fossil', partOfSpeech: 'NOUN', definitionKo: '화석', definition: 'remains of prehistoric organism', level: 'L2', tags: ['지질'], frequency: 624 },
  { word: 'glacial', partOfSpeech: 'ADJECTIVE', definitionKo: '빙하의', definition: 'relating to ice or glaciers', level: 'L3', tags: ['지질'], frequency: 625 },
  { word: 'habitat', partOfSpeech: 'NOUN', definitionKo: '서식지', definition: 'natural home of an organism', level: 'L2', tags: ['생태'], frequency: 626 },
  { word: 'indigenous', partOfSpeech: 'ADJECTIVE', definitionKo: '토착의', definition: 'originating in a place', level: 'L3', tags: ['문화'], frequency: 627 },
  { word: 'irrigation', partOfSpeech: 'NOUN', definitionKo: '관개', definition: 'supply of water to land', level: 'L3', tags: ['농업'], frequency: 628 },
  { word: 'metamorphosis', partOfSpeech: 'NOUN', definitionKo: '변태', definition: 'a transformation', level: 'L3', tags: ['생물'], frequency: 629 },
  { word: 'migration', partOfSpeech: 'NOUN', definitionKo: '이주', definition: 'movement from one place to another', level: 'L2', tags: ['생태'], frequency: 630 },
  { word: 'molecule', partOfSpeech: 'NOUN', definitionKo: '분자', definition: 'a group of atoms bonded together', level: 'L2', tags: ['화학'], frequency: 631 },
  { word: 'mutation', partOfSpeech: 'NOUN', definitionKo: '돌연변이', definition: 'a genetic change', level: 'L3', tags: ['생물'], frequency: 632 },
  { word: 'nomadic', partOfSpeech: 'ADJECTIVE', definitionKo: '유목의', definition: 'living as a wanderer', level: 'L3', tags: ['문화'], frequency: 633 },
  { word: 'organism', partOfSpeech: 'NOUN', definitionKo: '유기체', definition: 'a living thing', level: 'L2', tags: ['생물'], frequency: 634 },
  { word: 'paleontology', partOfSpeech: 'NOUN', definitionKo: '고생물학', definition: 'study of fossils', level: 'L3', tags: ['학문'], frequency: 635 },
  { word: 'photosynthesis', partOfSpeech: 'NOUN', definitionKo: '광합성', definition: 'process plants use to make food', level: 'L2', tags: ['생물'], frequency: 636 },
  { word: 'precipitation', partOfSpeech: 'NOUN', definitionKo: '강수', definition: 'rain, snow, or hail', level: 'L2', tags: ['기상'], frequency: 637 },
  { word: 'predator', partOfSpeech: 'NOUN', definitionKo: '포식자', definition: 'an animal that hunts others', level: 'L2', tags: ['생태'], frequency: 638 },
  { word: 'prehistoric', partOfSpeech: 'ADJECTIVE', definitionKo: '선사시대의', definition: 'before written records', level: 'L2', tags: ['역사'], frequency: 639 },
  { word: 'primate', partOfSpeech: 'NOUN', definitionKo: '영장류', definition: 'a mammal including humans', level: 'L3', tags: ['생물'], frequency: 640 },
  { word: 'sediment', partOfSpeech: 'NOUN', definitionKo: '퇴적물', definition: 'matter that settles', level: 'L3', tags: ['지질'], frequency: 641 },
  { word: 'seismic', partOfSpeech: 'ADJECTIVE', definitionKo: '지진의', definition: 'relating to earthquakes', level: 'L3', tags: ['지질'], frequency: 642 },
  { word: 'specimen', partOfSpeech: 'NOUN', definitionKo: '표본', definition: 'a sample for study', level: 'L2', tags: ['과학'], frequency: 643 },
  { word: 'stratum', partOfSpeech: 'NOUN', definitionKo: '지층', definition: 'a layer of rock', level: 'L3', tags: ['지질'], frequency: 644, tips: '복수형: strata' },
  { word: 'symbiosis', partOfSpeech: 'NOUN', definitionKo: '공생', definition: 'mutually beneficial relationship', level: 'L3', tags: ['생태'], frequency: 645 },
  { word: 'terrestrial', partOfSpeech: 'ADJECTIVE', definitionKo: '육지의', definition: 'relating to earth or land', level: 'L3', tags: ['환경'], frequency: 646 },
  { word: 'topography', partOfSpeech: 'NOUN', definitionKo: '지형', definition: 'the physical features of an area', level: 'L3', tags: ['지리'], frequency: 647 },
  { word: 'tundra', partOfSpeech: 'NOUN', definitionKo: '툰드라', definition: 'a treeless arctic region', level: 'L3', tags: ['지리'], frequency: 648 },
  { word: 'vegetation', partOfSpeech: 'NOUN', definitionKo: '초목', definition: 'plants collectively', level: 'L2', tags: ['생태'], frequency: 649 },
  { word: 'vertebrate', partOfSpeech: 'NOUN', definitionKo: '척추동물', definition: 'an animal with a backbone', level: 'L3', tags: ['생물'], frequency: 650 },
  { word: 'artifact', partOfSpeech: 'NOUN', definitionKo: '인공물', definition: 'an object made by humans', level: 'L2', tags: ['역사'], frequency: 651 },
  { word: 'civilization', partOfSpeech: 'NOUN', definitionKo: '문명', definition: 'an advanced stage of society', level: 'L2', tags: ['역사'], frequency: 652 },
  { word: 'colonization', partOfSpeech: 'NOUN', definitionKo: '식민지화', definition: 'establishing control over area', level: 'L3', tags: ['역사'], frequency: 653 },
  { word: 'domestication', partOfSpeech: 'NOUN', definitionKo: '가축화', definition: 'taming animals for human use', level: 'L3', tags: ['역사'], frequency: 654 },
  { word: 'hierarchy', partOfSpeech: 'NOUN', definitionKo: '계층 구조', definition: 'a system of ranking', level: 'L2', tags: ['사회'], frequency: 655 },
  { word: 'interpretation', partOfSpeech: 'NOUN', definitionKo: '해석', definition: 'an explanation of meaning', level: 'L2', tags: ['학술'], frequency: 656 },
  { word: 'methodology', partOfSpeech: 'NOUN', definitionKo: '방법론', definition: 'a system of methods', level: 'L3', tags: ['연구'], frequency: 657 },
  { word: 'aboriginal', partOfSpeech: 'ADJECTIVE', definitionKo: '원주민의', definition: 'inhabiting from earliest times', level: 'L3', tags: ['문화'], frequency: 658 },
  { word: 'aquatic', partOfSpeech: 'ADJECTIVE', definitionKo: '수생의', definition: 'relating to water', level: 'L2', tags: ['생태'], frequency: 659 },
  { word: 'arid', partOfSpeech: 'ADJECTIVE', definitionKo: '건조한', definition: 'having little or no rain', level: 'L2', tags: ['기후'], frequency: 660 },
  { word: 'carnivorous', partOfSpeech: 'ADJECTIVE', definitionKo: '육식성의', definition: 'feeding on flesh', level: 'L3', tags: ['생물'], frequency: 661 },
  { word: 'chronic', partOfSpeech: 'ADJECTIVE', definitionKo: '만성의', definition: 'persisting for a long time', level: 'L2', tags: ['의학'], frequency: 662 },
  { word: 'dormant', partOfSpeech: 'ADJECTIVE', definitionKo: '휴면의', definition: 'temporarily inactive', level: 'L3', tags: ['생물'], frequency: 663 },
  { word: 'endemic', partOfSpeech: 'ADJECTIVE', definitionKo: '고유의', definition: 'native to a specific region', level: 'L3', tags: ['생태'], frequency: 664 },
  { word: 'feral', partOfSpeech: 'ADJECTIVE', definitionKo: '야생의', definition: 'wild, especially after domestication', level: 'L3', tags: ['생물'], frequency: 665 },
  { word: 'herbivorous', partOfSpeech: 'ADJECTIVE', definitionKo: '초식성의', definition: 'feeding on plants', level: 'L3', tags: ['생물'], frequency: 666 },
  { word: 'maritime', partOfSpeech: 'ADJECTIVE', definitionKo: '해양의', definition: 'relating to the sea', level: 'L3', tags: ['지리'], frequency: 667 },
  { word: 'migratory', partOfSpeech: 'ADJECTIVE', definitionKo: '이주하는', definition: 'making seasonal journeys', level: 'L3', tags: ['생태'], frequency: 668 },
  { word: 'nocturnal', partOfSpeech: 'ADJECTIVE', definitionKo: '야행성의', definition: 'active at night', level: 'L2', tags: ['생물'], frequency: 669 },
  { word: 'polar', partOfSpeech: 'ADJECTIVE', definitionKo: '극지의', definition: 'relating to the poles', level: 'L2', tags: ['지리'], frequency: 670 },
  { word: 'temperate', partOfSpeech: 'ADJECTIVE', definitionKo: '온대의', definition: 'having mild temperatures', level: 'L2', tags: ['기후'], frequency: 671 },
  { word: 'tropical', partOfSpeech: 'ADJECTIVE', definitionKo: '열대의', definition: 'very hot and humid', level: 'L2', tags: ['기후'], frequency: 672 },
  { word: 'volcanic', partOfSpeech: 'ADJECTIVE', definitionKo: '화산의', definition: 'relating to volcanoes', level: 'L2', tags: ['지질'], frequency: 673 },
  { word: 'adapt', partOfSpeech: 'VERB', definitionKo: '적응하다', definition: 'to adjust to conditions', level: 'L1', tags: ['생태'], frequency: 674 },
  { word: 'disperse', partOfSpeech: 'VERB', definitionKo: '흩어지다', definition: 'to spread over a wide area', level: 'L3', tags: ['분포'], frequency: 675 },
  { word: 'domesticate', partOfSpeech: 'VERB', definitionKo: '가축화하다', definition: 'to tame for human use', level: 'L3', tags: ['역사'], frequency: 676 },
  { word: 'erode', partOfSpeech: 'VERB', definitionKo: '침식하다', definition: 'to gradually wear away', level: 'L2', tags: ['지질'], frequency: 677 },
  { word: 'evolve', partOfSpeech: 'VERB', definitionKo: '진화하다', definition: 'to develop gradually', level: 'L2', tags: ['생물'], frequency: 678 },
  { word: 'excavation', partOfSpeech: 'NOUN', definitionKo: '발굴', definition: 'the act of digging out', level: 'L3', tags: ['고고학'], frequency: 679 },
  { word: 'extinct', partOfSpeech: 'ADJECTIVE', definitionKo: '멸종된', definition: 'no longer existing', level: 'L2', tags: ['생물'], frequency: 680 },
];

const satWords = [
  // SAT 고급 어휘 (80개)
  { word: 'ubiquitous', partOfSpeech: 'ADJECTIVE', definitionKo: '어디에나 있는', definition: 'present everywhere', level: 'L3', tags: ['일반'], frequency: 701 },
  { word: 'ephemeral', partOfSpeech: 'ADJECTIVE', definitionKo: '일시적인', definition: 'lasting for a very short time', level: 'L3', tags: ['시간'], frequency: 702 },
  { word: 'pragmatic', partOfSpeech: 'ADJECTIVE', definitionKo: '실용적인', definition: 'dealing with things realistically', level: 'L3', tags: ['철학'], frequency: 703 },
  { word: 'superfluous', partOfSpeech: 'ADJECTIVE', definitionKo: '불필요한', definition: 'unnecessary, more than needed', level: 'L3', tags: ['양'], frequency: 704 },
  { word: 'verbose', partOfSpeech: 'ADJECTIVE', definitionKo: '장황한', definition: 'using more words than needed', level: 'L3', tags: ['글'], frequency: 705 },
  { word: 'laconic', partOfSpeech: 'ADJECTIVE', definitionKo: '간결한', definition: 'using very few words', level: 'L3', tags: ['글'], frequency: 706 },
  { word: 'candid', partOfSpeech: 'ADJECTIVE', definitionKo: '솔직한', definition: 'truthful and straightforward', level: 'L2', tags: ['태도'], frequency: 707 },
  { word: 'ameliorate', partOfSpeech: 'VERB', definitionKo: '개선하다', definition: 'to make something better', level: 'L3', tags: ['변화'], frequency: 708 },
  // SAT 추가 단어 (9-80)
  { word: 'acrimony', partOfSpeech: 'NOUN', definitionKo: '신랄함', definition: 'bitterness or ill feeling', level: 'L3', tags: ['감정'], frequency: 709 },
  { word: 'adulation', partOfSpeech: 'NOUN', definitionKo: '아첨', definition: 'excessive admiration', level: 'L3', tags: ['태도'], frequency: 710 },
  { word: 'aesthetic', partOfSpeech: 'ADJECTIVE', definitionKo: '미적인', definition: 'concerned with beauty', level: 'L2', tags: ['예술'], frequency: 711 },
  { word: 'affable', partOfSpeech: 'ADJECTIVE', definitionKo: '상냥한', definition: 'friendly and easy to talk to', level: 'L3', tags: ['성격'], frequency: 712 },
  { word: 'altruistic', partOfSpeech: 'ADJECTIVE', definitionKo: '이타적인', definition: 'selflessly concerned for others', level: 'L3', tags: ['성격'], frequency: 713 },
  { word: 'ambivalent', partOfSpeech: 'ADJECTIVE', definitionKo: '양면적인', definition: 'having mixed feelings', level: 'L3', tags: ['감정'], frequency: 714 },
  { word: 'anachronism', partOfSpeech: 'NOUN', definitionKo: '시대착오', definition: 'something out of its time', level: 'L3', tags: ['역사'], frequency: 715 },
  { word: 'apathy', partOfSpeech: 'NOUN', definitionKo: '무관심', definition: 'lack of interest or concern', level: 'L2', tags: ['감정'], frequency: 716 },
  { word: 'ardent', partOfSpeech: 'ADJECTIVE', definitionKo: '열렬한', definition: 'enthusiastic or passionate', level: 'L3', tags: ['감정'], frequency: 717 },
  { word: 'benevolent', partOfSpeech: 'ADJECTIVE', definitionKo: '자비로운', definition: 'well-meaning and kindly', level: 'L3', tags: ['성격'], frequency: 718 },
  { word: 'capricious', partOfSpeech: 'ADJECTIVE', definitionKo: '변덕스러운', definition: 'given to sudden changes', level: 'L3', tags: ['성격'], frequency: 719 },
  { word: 'censure', partOfSpeech: 'VERB', definitionKo: '비난하다', definition: 'to express strong disapproval', level: 'L3', tags: ['비판'], frequency: 720 },
  { word: 'chicanery', partOfSpeech: 'NOUN', definitionKo: '속임수', definition: 'the use of deception', level: 'L3', tags: ['행동'], frequency: 721 },
  { word: 'clairvoyant', partOfSpeech: 'ADJECTIVE', definitionKo: '천리안의', definition: 'having supernatural insight', level: 'L3', tags: ['능력'], frequency: 722 },
  { word: 'complacent', partOfSpeech: 'ADJECTIVE', definitionKo: '자기만족적인', definition: 'smugly self-satisfied', level: 'L3', tags: ['태도'], frequency: 723 },
  { word: 'congenial', partOfSpeech: 'ADJECTIVE', definitionKo: '마음이 맞는', definition: 'pleasant and agreeable', level: 'L3', tags: ['관계'], frequency: 724 },
  { word: 'connive', partOfSpeech: 'VERB', definitionKo: '공모하다', definition: 'to secretly allow something', level: 'L3', tags: ['행동'], frequency: 725 },
  { word: 'contentious', partOfSpeech: 'ADJECTIVE', definitionKo: '논쟁적인', definition: 'causing or likely to cause argument', level: 'L3', tags: ['토론'], frequency: 726 },
  { word: 'culpable', partOfSpeech: 'ADJECTIVE', definitionKo: '비난받아 마땅한', definition: 'deserving blame', level: 'L3', tags: ['책임'], frequency: 727 },
  { word: 'deference', partOfSpeech: 'NOUN', definitionKo: '존경, 복종', definition: 'humble submission and respect', level: 'L3', tags: ['태도'], frequency: 728 },
  { word: 'delineate', partOfSpeech: 'VERB', definitionKo: '묘사하다', definition: 'to describe precisely', level: 'L3', tags: ['표현'], frequency: 729 },
  { word: 'demagogue', partOfSpeech: 'NOUN', definitionKo: '선동가', definition: 'a political leader who seeks support by appealing to popular desires', level: 'L3', tags: ['정치'], frequency: 730 },
  { word: 'didactic', partOfSpeech: 'ADJECTIVE', definitionKo: '교훈적인', definition: 'intended to teach', level: 'L3', tags: ['교육'], frequency: 731 },
  { word: 'diffident', partOfSpeech: 'ADJECTIVE', definitionKo: '자신 없는', definition: 'modest or shy', level: 'L3', tags: ['성격'], frequency: 732 },
  { word: 'dogmatic', partOfSpeech: 'ADJECTIVE', definitionKo: '독단적인', definition: 'asserting opinions as truths', level: 'L3', tags: ['태도'], frequency: 733 },
  { word: 'duplicity', partOfSpeech: 'NOUN', definitionKo: '이중성', definition: 'deceitfulness', level: 'L3', tags: ['행동'], frequency: 734 },
  { word: 'ebullient', partOfSpeech: 'ADJECTIVE', definitionKo: '넘치는', definition: 'cheerful and full of energy', level: 'L3', tags: ['감정'], frequency: 735 },
  { word: 'egregious', partOfSpeech: 'ADJECTIVE', definitionKo: '지독한', definition: 'outstandingly bad', level: 'L3', tags: ['정도'], frequency: 736 },
  { word: 'eloquent', partOfSpeech: 'ADJECTIVE', definitionKo: '웅변의', definition: 'fluent and persuasive in speaking', level: 'L2', tags: ['말'], frequency: 737 },
  { word: 'emulate', partOfSpeech: 'VERB', definitionKo: '모방하다', definition: 'to match or surpass by imitation', level: 'L3', tags: ['행동'], frequency: 738 },
  { word: 'enervate', partOfSpeech: 'VERB', definitionKo: '약화시키다', definition: 'to cause to feel drained', level: 'L3', tags: ['상태'], frequency: 739 },
  { word: 'enigmatic', partOfSpeech: 'ADJECTIVE', definitionKo: '불가사의한', definition: 'difficult to interpret', level: 'L3', tags: ['특성'], frequency: 740 },
  { word: 'equanimity', partOfSpeech: 'NOUN', definitionKo: '평정', definition: 'mental calmness', level: 'L3', tags: ['감정'], frequency: 741 },
  { word: 'equivocate', partOfSpeech: 'VERB', definitionKo: '얼버무리다', definition: 'to use ambiguous language', level: 'L3', tags: ['말'], frequency: 742 },
  { word: 'esoteric', partOfSpeech: 'ADJECTIVE', definitionKo: '난해한', definition: 'intended for small group', level: 'L3', tags: ['특성'], frequency: 743 },
  { word: 'euphemism', partOfSpeech: 'NOUN', definitionKo: '완곡어법', definition: 'a mild expression', level: 'L3', tags: ['언어'], frequency: 744 },
  { word: 'exonerate', partOfSpeech: 'VERB', definitionKo: '무죄를 입증하다', definition: 'to absolve from blame', level: 'L3', tags: ['법률'], frequency: 745 },
  { word: 'expedient', partOfSpeech: 'ADJECTIVE', definitionKo: '편의적인', definition: 'convenient but possibly improper', level: 'L3', tags: ['행동'], frequency: 746 },
  { word: 'furtive', partOfSpeech: 'ADJECTIVE', definitionKo: '은밀한', definition: 'attempting to avoid notice', level: 'L3', tags: ['행동'], frequency: 747 },
  { word: 'garrulous', partOfSpeech: 'ADJECTIVE', definitionKo: '수다스러운', definition: 'excessively talkative', level: 'L3', tags: ['성격'], frequency: 748 },
  { word: 'gratuitous', partOfSpeech: 'ADJECTIVE', definitionKo: '불필요한', definition: 'uncalled for; unnecessary', level: 'L3', tags: ['특성'], frequency: 749 },
  { word: 'gregarious', partOfSpeech: 'ADJECTIVE', definitionKo: '사교적인', definition: 'fond of company', level: 'L3', tags: ['성격'], frequency: 750 },
  { word: 'hackneyed', partOfSpeech: 'ADJECTIVE', definitionKo: '진부한', definition: 'lacking significance through overuse', level: 'L3', tags: ['표현'], frequency: 751 },
  { word: 'iconoclast', partOfSpeech: 'NOUN', definitionKo: '우상파괴자', definition: 'a person who attacks beliefs', level: 'L3', tags: ['인물'], frequency: 752 },
  { word: 'impetuous', partOfSpeech: 'ADJECTIVE', definitionKo: '성급한', definition: 'acting quickly without thought', level: 'L3', tags: ['성격'], frequency: 753 },
  { word: 'incorrigible', partOfSpeech: 'ADJECTIVE', definitionKo: '고칠 수 없는', definition: 'not able to be corrected', level: 'L3', tags: ['특성'], frequency: 754 },
  { word: 'indolent', partOfSpeech: 'ADJECTIVE', definitionKo: '나태한', definition: 'wanting to avoid activity', level: 'L3', tags: ['성격'], frequency: 755 },
  { word: 'inimical', partOfSpeech: 'ADJECTIVE', definitionKo: '적대적인', definition: 'tending to obstruct or harm', level: 'L3', tags: ['관계'], frequency: 756 },
  { word: 'insipid', partOfSpeech: 'ADJECTIVE', definitionKo: '무미건조한', definition: 'lacking flavor or interest', level: 'L3', tags: ['특성'], frequency: 757 },
  { word: 'intransigent', partOfSpeech: 'ADJECTIVE', definitionKo: '비타협적인', definition: 'unwilling to compromise', level: 'L3', tags: ['태도'], frequency: 758 },
  { word: 'invective', partOfSpeech: 'NOUN', definitionKo: '독설', definition: 'insulting language', level: 'L3', tags: ['언어'], frequency: 759 },
  { word: 'irascible', partOfSpeech: 'ADJECTIVE', definitionKo: '화를 잘 내는', definition: 'having a hot temper', level: 'L3', tags: ['성격'], frequency: 760 },
  { word: 'lament', partOfSpeech: 'VERB', definitionKo: '슬퍼하다', definition: 'to mourn or grieve', level: 'L2', tags: ['감정'], frequency: 761 },
  { word: 'lethargic', partOfSpeech: 'ADJECTIVE', definitionKo: '무기력한', definition: 'affected by lethargy', level: 'L3', tags: ['상태'], frequency: 762 },
  { word: 'loquacious', partOfSpeech: 'ADJECTIVE', definitionKo: '말이 많은', definition: 'tending to talk a great deal', level: 'L3', tags: ['성격'], frequency: 763 },
  { word: 'magnanimous', partOfSpeech: 'ADJECTIVE', definitionKo: '관대한', definition: 'very generous or forgiving', level: 'L3', tags: ['성격'], frequency: 764 },
  { word: 'malicious', partOfSpeech: 'ADJECTIVE', definitionKo: '악의적인', definition: 'intending to do harm', level: 'L2', tags: ['태도'], frequency: 765 },
  { word: 'melancholy', partOfSpeech: 'NOUN', definitionKo: '우울', definition: 'a feeling of sadness', level: 'L2', tags: ['감정'], frequency: 766 },
  { word: 'mercurial', partOfSpeech: 'ADJECTIVE', definitionKo: '변덕스러운', definition: 'subject to sudden changes', level: 'L3', tags: ['성격'], frequency: 767 },
  { word: 'obsequious', partOfSpeech: 'ADJECTIVE', definitionKo: '아첨하는', definition: 'obedient or attentive to an excessive degree', level: 'L3', tags: ['태도'], frequency: 768 },
  { word: 'ostentatious', partOfSpeech: 'ADJECTIVE', definitionKo: '과시적인', definition: 'characterized by pretentious display', level: 'L3', tags: ['태도'], frequency: 769 },
  { word: 'parsimonious', partOfSpeech: 'ADJECTIVE', definitionKo: '인색한', definition: 'unwilling to spend money', level: 'L3', tags: ['성격'], frequency: 770 },
  { word: 'perfidious', partOfSpeech: 'ADJECTIVE', definitionKo: '배신하는', definition: 'deceitful and untrustworthy', level: 'L3', tags: ['성격'], frequency: 771 },
  { word: 'phlegmatic', partOfSpeech: 'ADJECTIVE', definitionKo: '냉담한', definition: 'having an unemotional disposition', level: 'L3', tags: ['성격'], frequency: 772 },
  { word: 'predilection', partOfSpeech: 'NOUN', definitionKo: '선호', definition: 'a preference or special liking', level: 'L3', tags: ['선호'], frequency: 773 },
  { word: 'pretentious', partOfSpeech: 'ADJECTIVE', definitionKo: '허세부리는', definition: 'attempting to impress by affecting greater importance', level: 'L2', tags: ['태도'], frequency: 774 },
  { word: 'reticent', partOfSpeech: 'ADJECTIVE', definitionKo: '과묵한', definition: 'not revealing thoughts', level: 'L3', tags: ['성격'], frequency: 775 },
  { word: 'sagacious', partOfSpeech: 'ADJECTIVE', definitionKo: '현명한', definition: 'having good judgment', level: 'L3', tags: ['지혜'], frequency: 776 },
  { word: 'soporific', partOfSpeech: 'ADJECTIVE', definitionKo: '졸리게 하는', definition: 'tending to induce sleep', level: 'L3', tags: ['효과'], frequency: 777 },
  { word: 'taciturn', partOfSpeech: 'ADJECTIVE', definitionKo: '말이 없는', definition: 'reserved in speech', level: 'L3', tags: ['성격'], frequency: 778 },
  { word: 'vapid', partOfSpeech: 'ADJECTIVE', definitionKo: '맹한', definition: 'offering nothing stimulating', level: 'L3', tags: ['특성'], frequency: 779 },
  { word: 'zealot', partOfSpeech: 'NOUN', definitionKo: '광신자', definition: 'a person who is fanatical', level: 'L3', tags: ['인물'], frequency: 780 },
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
