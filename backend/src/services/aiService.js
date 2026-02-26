const Anthropic = require('@anthropic-ai/sdk');

class AiService {
  buildSystemPrompt(context) {
    const parts = [
      'You are an Apache AGE query expert. You help users write Cypher queries that run inside PostgreSQL via the Apache AGE extension.',
      '',
      '## Current Graph',
      `Graph name: ${context.graphName || 'unknown'}`,
    ];

    if (context.nodes && context.nodes.length > 0) {
      parts.push('', '## Node Labels');
      context.nodes.forEach((n) => {
        parts.push(`- :${n.name} (${n.cnt || '?'} nodes)`);
      });
    }

    if (context.edges && context.edges.length > 0) {
      parts.push('', '## Edge Labels');
      context.edges.forEach((e) => {
        parts.push(`- [:${e.name}] (${e.cnt || '?'} edges)`);
      });
    }

    if (context.propertyKeys && context.propertyKeys.length > 0) {
      parts.push('', '## Property Keys');
      const keys = context.propertyKeys.map((p) => p.key || p.property_key || p).join(', ');
      parts.push(keys);
    }

    parts.push(
      '',
      '## AGE SQL Wrapper Syntax',
      'All Cypher queries in AGE must be wrapped in a SQL function call:',
      '```sql',
      `SELECT * FROM cypher('${context.graphName || 'my_graph'}', $$`,
      '  MATCH (n) RETURN n LIMIT 10',
      '$$) AS (result agtype);',
      '```',
      '',
      '## Rules',
      '- Always use the cypher() SQL wrapper with the correct graph name.',
      '- Specify column aliases with agtype type in the AS clause.',
      '- Use $$ dollar quoting for the Cypher query body.',
      '- For multiple return columns, list each with agtype type.',
      '- When showing queries, always include the full SQL wrapper.',
      '- Keep explanations concise and focused.',
      '- Format code blocks with ```sql markers.',
    );

    return parts.join('\n');
  }

  async streamChat({ apiKey, model, messages, context, onChunk, onDone, onError }) {
    try {
      const client = new Anthropic({ apiKey });
      const systemPrompt = this.buildSystemPrompt(context);

      const stream = await client.messages.stream({
        model: model || 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          onChunk(event.delta.text);
        }
      }

      onDone();
    } catch (err) {
      onError(err);
    }
  }
}

module.exports = new AiService();
