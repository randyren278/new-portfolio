/**
 * Minimal MCP client for Coros' hosted server (Streamable HTTP transport).
 *
 * initialize → notifications/initialized → tools/call. Replies may come
 * back as plain JSON or as a short SSE stream; both are handled. Only
 * read-only tools are ever called from the site.
 */

const MCP_URL = 'https://mcpus.coros.com/mcp';
const PROTOCOL = '2025-06-18';

type RpcMessage = {
  id?: number;
  result?: any;
  error?: { code: number; message: string };
};

export type CorosClient = {
  call(tool: string, args?: Record<string, unknown>): Promise<string>;
};

async function readReply(res: Response, id: number): Promise<RpcMessage> {
  const type = res.headers.get('content-type') ?? '';
  const text = await res.text();
  if (type.includes('text/event-stream')) {
    for (const event of text.split(/\r?\n\r?\n/)) {
      const data = event
        .split(/\r?\n/)
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .join('\n');
      if (!data) continue;
      const msg = JSON.parse(data) as RpcMessage;
      if (msg.id === id) return msg;
    }
    throw new Error(`coros mcp: no reply for request ${id}`);
  }
  const body = JSON.parse(text) as RpcMessage | RpcMessage[];
  const msg = Array.isArray(body) ? body.find((m) => m.id === id) : body;
  if (!msg) throw new Error(`coros mcp: no reply for request ${id}`);
  return msg;
}

export async function connectCoros(token: string): Promise<CorosClient> {
  let session: string | null = null;
  let protocol: string | null = null;
  let nextId = 0;

  async function send(method: string, params: unknown, notification = false) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    };
    if (session) headers['Mcp-Session-Id'] = session;
    if (protocol) headers['MCP-Protocol-Version'] = protocol;
    const id = ++nextId;
    const res = await fetch(MCP_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(
        notification ? { jsonrpc: '2.0', method, params } : { jsonrpc: '2.0', id, method, params },
      ),
      cache: 'no-store',
    });
    session = res.headers.get('mcp-session-id') ?? session;
    if (!res.ok) throw new Error(`coros mcp ${method}: HTTP ${res.status} ${await res.text()}`);
    if (notification) return null;
    const msg = await readReply(res, id);
    if (msg.error) throw new Error(`coros mcp ${method}: ${msg.error.message}`);
    return msg.result;
  }

  const init = await send('initialize', {
    protocolVersion: PROTOCOL,
    capabilities: {},
    clientInfo: { name: 'randyren.org', version: '1.0.0' },
  });
  protocol = init?.protocolVersion ?? PROTOCOL;
  await send('notifications/initialized', {}, true);

  return {
    async call(tool, args = {}) {
      const result = await send('tools/call', { name: tool, arguments: args });
      const text = ((result?.content ?? []) as { type: string; text?: string }[])
        .filter((c) => c.type === 'text')
        .map((c) => c.text ?? '')
        .join('\n');
      if (result?.isError) throw new Error(`coros ${tool}: ${text.slice(0, 200)}`);
      return text;
    },
  };
}
