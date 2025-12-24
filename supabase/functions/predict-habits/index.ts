import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data, analysisType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Received data for analysis:", { dataLength: data?.length, analysisType });

    let systemPrompt = "";
    let userPrompt = "";

    if (analysisType === "supervised") {
      systemPrompt = `你是一個專業的數據分析師，專門進行監督式學習預測。
根據用戶提供的歷史習慣追蹤數據，分析模式並預測未來7天的表現。
請以 JSON 格式回傳預測結果，包含：
1. predictions: 未來7天每天的預測分數陣列
2. confidence: 預測信心度 (0-1)
3. trends: 識別到的趨勢描述
4. recommendations: 改進建議`;

      userPrompt = `以下是使用者的習慣追蹤歷史數據：
${JSON.stringify(data, null, 2)}

請進行監督式學習分析，基於這些數據預測未來7天的趨勢和分數。
回傳格式必須是有效的 JSON。`;
    } else if (analysisType === "unsupervised") {
      systemPrompt = `你是一個專業的數據分析師，專門進行非監督式學習分析。
根據用戶提供的習慣追蹤數據，進行聚類分析和異常檢測。
請以 JSON 格式回傳分析結果，包含：
1. clusters: 識別到的數據聚類（如：高表現日、中等表現日、低表現日）
2. anomalies: 異常值檢測結果
3. patterns: 發現的隱藏模式
4. insights: 深度洞察`;

      userPrompt = `以下是使用者的習慣追蹤數據：
${JSON.stringify(data, null, 2)}

請進行非監督式學習分析，識別數據中的聚類、異常值和隱藏模式。
回傳格式必須是有效的 JSON。`;
    } else {
      systemPrompt = `你是一個專業的數據分析師。請分析提供的習慣追蹤數據並提供綜合分析報告。`;
      userPrompt = `分析以下數據：${JSON.stringify(data, null, 2)}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "請求過於頻繁，請稍後再試。" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "需要付款，請為工作區添加額度。" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    console.log("AI response received:", content);

    let parsedResult;
    try {
      parsedResult = JSON.parse(content);
    } catch {
      parsedResult = { raw: content };
    }

    return new Response(JSON.stringify({ result: parsedResult, analysisType }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Prediction error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
