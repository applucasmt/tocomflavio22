/* =============================================================
   API — Proxy serverless para o Replicate
   Roda no servidor da Vercel (Node.js)
   Protege o token e evita CORS
   ============================================================= */

export default async function handler(req, res) {
  // CORS — permite só do próprio domínio
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Pega token das variáveis de ambiente da Vercel
  const REPLICATE_TOKEN = process.env.REPLICATE_TOKEN;
  const MODEL_VERSION = process.env.REPLICATE_MODEL_VERSION;

  if (!REPLICATE_TOKEN || !MODEL_VERSION) {
    return res.status(500).json({
      error: 'Configuração incompleta',
      detail: 'Configure REPLICATE_TOKEN e REPLICATE_MODEL_VERSION nas variáveis de ambiente da Vercel'
    });
  }

  try {
    const { image, prompt } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: 'Imagem não enviada' });
    }

    console.log('[API] Recebida requisição de geração');

    // 1. Cria prediction
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + REPLICATE_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: MODEL_VERSION,
        input: {
          prompt: prompt,
          image: image,
          negative_prompt: 'different person, changed face, different hair, wrong identity, distorted, blurry',
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 30
        }
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('[API] Erro ao criar prediction:', errText);
      return res.status(createRes.status).json({
        error: 'Erro no Replicate',
        detail: errText
      });
    }

    let prediction = await createRes.json();
    console.log('[API] Prediction criada:', prediction.id);

    // 2. Polling até terminar
    const maxAttempts = 120; // 120 × 1.5s = 3 min máximo
    let attempts = 0;

    while (
      (prediction.status === 'starting' || prediction.status === 'processing') &&
      attempts < maxAttempts
    ) {
      await new Promise(r => setTimeout(r, 1500));
      attempts++;

      const pollRes = await fetch(
        'https://api.replicate.com/v1/predictions/' + prediction.id,
        {
          headers: { 'Authorization': 'Bearer ' + REPLICATE_TOKEN }
        }
      );

      if (!pollRes.ok) {
        console.error('[API] Erro no polling');
        break;
      }

      prediction = await pollRes.json();
      console.log('[API] Status:', prediction.status, '(' + attempts + ')');
    }

    // 3. Verifica resultado
    if (prediction.status === 'failed') {
      return res.status(500).json({
        error: 'Falha na geração',
        detail: prediction.error || 'Erro desconhecido'
      });
    }

    if (prediction.status === 'canceled') {
      return res.status(500).json({ error: 'Geração cancelada' });
    }

    if (prediction.status !== 'succeeded') {
      return res.status(504).json({
        error: 'Timeout',
        detail: 'A geração demorou mais que o esperado'
      });
    }

    if (!prediction.output || !prediction.output[0]) {
      return res.status(500).json({ error: 'Nenhum resultado retornado' });
    }

    console.log('[API] Sucesso:', prediction.output[0]);

    return res.status(200).json({
      success: true,
      image: prediction.output[0]
    });

  } catch (err) {
    console.error('[API] Erro interno:', err);
    return res.status(500).json({
      error: 'Erro interno',
      detail: err.message
    });
  }
}
