// ===================================================
// Vercel Serverless Function: Gemini API 코멘트 생성
// 무료 티어 지원 모델: gemini-2.5-flash / gemini-1.5-flash
// ===================================================

export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { memoText } = req.body || {};

  if (!memoText || typeof memoText !== "string" || memoText.trim() === "") {
    return res.status(400).json({ error: "메모 내용(memoText)이 필요합니다." });
  }

  // Vercel 환경변수에서 API 키 추출 (또는 로컬 테스트용 키)
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY 환경변수가 설정되지 않았습니다."
    });
  }

  try {
    // 안정적인 무료 티어 gemini-1.5-flash 모델 사용
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `너는 초·중등학교 학급 담벼락의 친절하고 따뜻한 AI 도우미 교사야.
학생이 작성한 아래 메모를 읽고, 격려와 칭찬 또는 깊이 생각해볼 수 있는 1~2문장의 따뜻한 한 줄 코멘트를 한국어로 작성해줘.
학생의 개인정보나 이름은 언급하지 마.

[학생의 메모 내용]
${memoText}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API 호출 에러 응답:", errorText);
      let errMsg = "Gemini API 호출에 실패했습니다.";
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.error && parsed.error.message) {
          errMsg = parsed.error.message;
        }
      } catch (e) {}
      return res.status(response.status).json({
        error: errMsg
      });
    }

    const data = await response.json();
    const comment = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "좋은 생각이에요! 계속 응원할게요.";

    return res.status(200).json({ comment });
  } catch (error) {
    console.error("서버 내부 오류:", error);
    return res.status(500).json({ error: "서버 처리 중 오류가 발생했습니다." });
  }
}
