const aiService = require('../services/aiService');
const sessionService = require('../services/sessionService');

class AiController {
  async chat(req, res) {
    const { apiKey, model, messages, graphName } = req.body;

    if (!apiKey || !messages || !Array.isArray(messages)) {
      res.status(400).json({ message: 'apiKey and messages[] are required' });
      return;
    }

    // Build schema context from the session's database service
    let context = { graphName: graphName || 'unknown', nodes: [], edges: [], propertyKeys: [] };

    try {
      const db = sessionService.get(req.sessionID);
      if (db && db.isConnected()) {
        const meta = await db.getMetaData(graphName ? { currentGraph: graphName } : null);
        // meta is keyed by graph name
        const graphKey = Object.keys(meta).find((k) => meta[k].nodes) || Object.keys(meta)[0];
        if (graphKey && meta[graphKey]) {
          context.graphName = graphKey;
          context.nodes = meta[graphKey].nodes || [];
          context.edges = meta[graphKey].edges || [];
          context.propertyKeys = meta[graphKey].propertyKeys || [];
        }
      }
    } catch (e) {
      // Proceed without schema context if metadata fetch fails
      console.warn('AI: Could not fetch schema context:', e.message);
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    await aiService.streamChat({
      apiKey,
      model,
      messages,
      context,
      onChunk: (text) => {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      },
      onDone: () => {
        res.write('data: [DONE]\n\n');
        res.end();
      },
      onError: (err) => {
        const msg = err.message || 'Unknown error';
        res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      },
    });
  }
}

module.exports = new AiController();
