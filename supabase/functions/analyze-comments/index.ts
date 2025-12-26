import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { comments, analysisType, question } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (analysisType === 'summary') {
      systemPrompt = `你是一個專業的習慣追蹤數據分析師。請分析用戶的評語和習慣記錄，提供洞察和建議。
使用繁體中文回答，分析要具體且有建設性。`;
      userPrompt = `請分析以下用戶評語，總結主要主題、情緒傾向和常見模式：

${comments.map((c: any) => `日期: ${c.date}\n評語: ${c.comment}`).join('\n\n')}

請提供：
1. 主要主題總結
2. 情緒分析（正面/負面/中性比例）
3. 常見模式或習慣
4. 改進建議`;
    } else if (analysisType === 'chat') {
      systemPrompt = `你是一個友善的習慣追蹤助手。你可以回答用戶關於他們習慣數據和評語的問題。
基於提供的數據回答問題，使用繁體中文，語氣友善且有幫助。`;
      userPrompt = `用戶數據：
${comments.map((c: any) => `日期: ${c.date}, 評語: ${c.comment}, 習慣: ${c.habits?.join(', ') || '無'}`).join('\n')}

用戶問題：${question}`;
    } else {
      systemPrompt = `你是一個專業的數據分析師，專門分析用戶行為和習慣模式。使用繁體中文回答。`;
      userPrompt = `請分析以下數據並回答問題：

${JSON.stringify(comments, null, 2)}

問題：${question || '請提供整體分析'}`;
    }

    console.log('Calling AI gateway with analysis type:', analysisType);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: '請求過於頻繁，請稍後再試' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: '需要付費才能使用此功能' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || '無法生成分析結果';

    console.log('Analysis completed successfully');

    return new Response(JSON.stringify({ result, analysisType }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in analyze-comments function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
