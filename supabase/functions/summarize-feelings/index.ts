import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FEELINGS = [
  '歸屬感','成就感','安全感','安定感','自信','同理心','平等心','使命感','影響力','舞台'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ feelings: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const systemPrompt = `你是一位內觀心理分析師。請從使用者的每日反思文字中，挑選出最相符的「感覺」標籤。
僅能從以下 10 個感覺中挑選：${FEELINGS.join('、')}。
請務必使用 record_feelings 工具回傳結果，不要輸出其他文字。`;

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
          { role: 'user', content: `文字：\n${text}` }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'record_feelings',
            description: '記錄符合的感覺標籤',
            parameters: {
              type: 'object',
              properties: {
                feelings: {
                  type: 'array',
                  items: { type: 'string', enum: FEELINGS },
                  description: '挑選符合的感覺'
                }
              },
              required: ['feelings']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'record_feelings' } }
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('AI error:', response.status, err);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: '請求過於頻繁' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: '需要付費才能使用此功能' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let feelings: string[] = [];
    if (toolCall?.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        feelings = (args.feelings ?? []).filter((f: string) => FEELINGS.includes(f));
      } catch (e) {
        console.error('parse error:', e);
      }
    }

    return new Response(JSON.stringify({ feelings }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('summarize-feelings error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown';
    return new Response(JSON.stringify({ error: msg, feelings: [] }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
