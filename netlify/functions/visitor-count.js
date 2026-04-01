// ============================================================
// netlify/functions/visitor-count.js
// 방문자 카운터 — Upstash Redis 연동
// Redis 미설정 시 기본값 반환 (서비스 중단 방지)
// ============================================================

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  // ── Redis 미설정 시 기본값 반환 (서비스 중단 방지) ──
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    console.log("WARN: Upstash 환경변수 미설정. 기본값 반환.");
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ today: 38, total: 13492, fallback: true }),
    };
  }

  async function redisCommand(...args) {
    const response = await fetch(UPSTASH_URL, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + UPSTASH_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
    return response.json();
  }

  try {
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const todayStr = kst.toISOString().split("T")[0];
    const todayKey = "roaming:today:" + todayStr;
    const totalKey = "roaming:total";

    if (event.httpMethod === "POST") {
      const todayResult = await redisCommand("INCR", todayKey);
      await redisCommand("EXPIRE", todayKey, 172800);
      const totalResult = await redisCommand("INCR", totalKey);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          today: todayResult.result,
          total: totalResult.result,
        }),
      };
    } else {
      const todayResult = await redisCommand("GET", todayKey);
      const totalResult = await redisCommand("GET", totalKey);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          today: parseInt(todayResult.result) || 0,
          total: parseInt(totalResult.result) || 0,
        }),
      };
    }
  } catch (err) {
    console.log("Redis 에러:", err.message);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ today: 38, total: 13492, fallback: true }),
    };
  }
};
