import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { walkJsonlFiles } from './io.js';
import { PATHS } from './paths.js';

const SAMPLE_PER_FILE = 200;

export async function scanSessions(): Promise<{
  files: number;
  totalLines: number;
  toolUses: number;
  assistantMessages: number;
  taskToolCalls: number;
  compactionEvents: number;
}> {
  const files = await walkJsonlFiles(PATHS.projectsDir);

  let totalLines = 0;
  let toolUses = 0;
  let assistantMessages = 0;
  let taskToolCalls = 0;
  let compactionEvents = 0;

  for (const file of files) {
    const stream = createReadStream(file, { encoding: 'utf-8' });
    const rl = createInterface({ input: stream, crlfDelay: Infinity });

    let perFile = 0;
    for await (const line of rl) {
      if (!line) continue;
      totalLines++;
      perFile++;
      if (perFile > SAMPLE_PER_FILE) continue;

      try {
        const obj = JSON.parse(line) as {
          type?: string;
          message?: {
            role?: string;
            content?: Array<{ type?: string; name?: string }> | string;
          };
        };

        if (obj.message?.role === 'assistant') {
          assistantMessages++;
          const content = obj.message.content;
          if (Array.isArray(content)) {
            for (const block of content) {
              if (block?.type === 'tool_use') {
                toolUses++;
                if (block.name === 'Task' || block.name === 'Agent') {
                  taskToolCalls++;
                }
              }
            }
          }
        }

        if (obj.type === 'summary' || obj.type === 'compact') {
          compactionEvents++;
        }
      } catch {
      }
    }
    rl.close();
    stream.close();
  }

  return {
    files: files.length,
    totalLines,
    toolUses,
    assistantMessages,
    taskToolCalls,
    compactionEvents,
  };
}
