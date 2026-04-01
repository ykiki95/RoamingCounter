// ============================================================
// seed-counter.js — 방문자 카운터 초기값 설정 스크립트
// 최초 1회만 실행하세요.
// 
// 사용법:
//   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io \
//   UPSTASH_REDIS_REST_TOKEN=AXxx... \
//   node seed-counter.js
// ============================================================

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_URL || !UPSTASH_TOKEN) {
  console.error('❌ 환경변수를 설정해 주세요:');
  console.error('   UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN');
  process.exit(1);
}

async function redisCommand(...args) {
  const res = await fetch(UPSTASH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  return res.json();
}

async function seed() {
  // ── 초기값 설정 (원하는 숫자로 변경 가능) ──
  const INITIAL_TOTAL = 13492;
  const INITIAL_TODAY = 38;

  // 오늘 날짜 (KST)
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const todayStr = kst.toISOString().split('T')[0];

  console.log(`📅 오늘 날짜 (KST): ${todayStr}`);

  // 누적 방문자 설정
  const r1 = await redisCommand('SET', 'roaming:total', INITIAL_TOTAL);
  console.log(`✅ 누적 방문자 → ${INITIAL_TOTAL}명`, r1);

  // 오늘 방문자 설정 (48시간 후 자동 만료)
  const r2 = await redisCommand('SET', `roaming:today:${todayStr}`, INITIAL_TODAY, 'EX', 172800);
  console.log(`✅ 오늘 방문자 → ${INITIAL_TODAY}명`, r2);

  console.log('\n🎉 초기값 설정 완료!');
}

seed().catch(console.error);
