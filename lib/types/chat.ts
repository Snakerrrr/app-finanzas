/**
 * AI SDK chat message types and type guards
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChatMessagePart =
  | { type: "text"; text: string }
  | { type: string; [key: string]: unknown };

export type UIMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  parts: ChatMessagePart[];
  createdAt?: Date;
};

export type LegacyMessage = {
  role: string;
  content: string | Array<{ type: string; text?: string }>;
};

export type ChatMessage = UIMessage | LegacyMessage;

export type ChatIntent =
  | "BALANCE"
  | "MOVIMIENTOS"
  | "SALUDO"
  | "AYUDA"
  | "OTRO";

export type ChatIntentParameters = {
  category: string | null;
  startDate: string | null;
  endDate: string | null;
};

export type ClassifiedIntent = {
  intent: ChatIntent;
  parameters: ChatIntentParameters;
};

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidUIRole(role: unknown): role is "user" | "assistant" | "system" {
  return (
    typeof role === "string" &&
    (role === "user" || role === "assistant" || role === "system")
  );
}

export function isUIMessage(msg: unknown): msg is UIMessage {
  if (!isObject(msg)) return false;
  if (typeof msg.id !== "string") return false;
  if (!isValidUIRole(msg.role)) return false;
  if (!Array.isArray(msg.parts)) return false;
  return true;
}

export function isLegacyMessage(msg: unknown): msg is LegacyMessage {
  if (!isObject(msg)) return false;
  if (typeof msg.role !== "string") return false;
  if (!("content" in msg)) return false;
  const content = msg.content;
  if (typeof content === "string") return true;
  if (Array.isArray(content)) return true;
  return false;
}

export function isUIMessageArray(msgs: unknown): msgs is ChatMessage[] {
  if (!Array.isArray(msgs)) return false;
  for (let i = 0; i < msgs.length; i++) {
    const el = msgs[i];
    if (!isUIMessage(el) && !isLegacyMessage(el)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function extractTextFromPart(part: unknown): string {
  if (!isObject(part)) return "";
  if (part.type === "text" && typeof part.text === "string") return part.text;
  if (typeof part.text === "string") return part.text;
  return "";
}

function extractContentFromUIMessage(msg: UIMessage): string {
  const texts: string[] = [];
  for (const part of msg.parts) {
    const text = extractTextFromPart(part);
    if (text) texts.push(text);
  }
  return texts.join("");
}

function extractContentFromLegacyMessage(msg: LegacyMessage): string {
  const content = msg.content;
  if (typeof content === "string") return content;
  const texts: string[] = [];
  for (const item of content) {
    if (typeof item === "object" && item !== null && "text" in item) {
      const textVal = item.text;
      if (typeof textVal === "string") texts.push(textVal);
    }
  }
  return texts.join("");
}

export function extractMessageContent(message: unknown): string {
  if (isUIMessage(message)) return extractContentFromUIMessage(message);
  if (isLegacyMessage(message)) return extractContentFromLegacyMessage(message);
  return "";
}

export function getLastUserMessage(messages: unknown): string {
  if (!Array.isArray(messages)) return "";
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (!isObject(msg)) continue;
    if (msg.role === "user") {
      return extractMessageContent(msg);
    }
  }
  return "";
}
