/**
 * 安全过滤用户输入的学校自定义文本，防止 prompt injection
 */

const MAX_SCHOOL_INPUT_LENGTH = 200;

/* 禁止出现的注入模式 */
const INJECTION_PATTERNS = [
  /ignore/i,
  /override/i,
  /bypass/i,
  /system:/i,
  /prompt:/i,
  /---+/,
  /"""/,
  /''/,
  /skip/i,
  /disregard/i,
  /forget/i,
  /instead/i,
];

/* 禁止的字符模式 */
const BLOCKED_PATTERNS = [
  /https?:\/\//i,
  /[{}]/,
  /[<>]/,
  /`/,
];

/* 敏感词列表（简化版，生产环境应接入专业审核服务） */
const SENSITIVE_WORDS = [
  "裸体",
  "色情",
  "暴力",
  "政治",
  "恐怖",
];

/**
 * 清洗学校输入文本，仅作描述性上下文使用
 * @returns 清洗后的文本；如输入无效则返回空字符串
 */
export function sanitizeSchoolInput(value: string): string {
  if (!value || typeof value !== "string") return "";

  let cleaned = value.trim();

  /* 纯空白/纯符号拒绝 */
  if (/^[\s\W_]+$/.test(cleaned)) return "";

  /* 长度截断 */
  if (cleaned.length > MAX_SCHOOL_INPUT_LENGTH) {
    cleaned = cleaned.slice(0, MAX_SCHOOL_INPUT_LENGTH);
  }

  /* 注入模式检测：命中任何一条则截断到安全前缀 */
  for (const pattern of INJECTION_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match && match.index !== undefined) {
      cleaned = cleaned.slice(0, match.index).trim();
    }
  }

  /* 移除被禁字符 */
  for (const pattern of BLOCKED_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  /* 敏感词检测 */
  for (const word of SENSITIVE_WORDS) {
    if (cleaned.includes(word)) {
      return "";
    }
  }

  /* 重复字符检测（连续 5 个以上相同字符视为垃圾输入） */
  if (/(.)\1{4,}/.test(cleaned)) {
    return "";
  }

  return cleaned;
}

/**
 * 验证上传图片的基本安全性
 * 生产环境应接入专业内容审核 API（阿里云绿网/数美等）
 */
const MAX_CUSTOM_PROMPT_LENGTH = 500;

export function sanitizeCustomPrompt(value: string): string {
  if (!value || typeof value !== "string") return "";

  let cleaned = value.trim();
  if (/^[\s\W_]+$/.test(cleaned)) return "";

  if (cleaned.length > MAX_CUSTOM_PROMPT_LENGTH) {
    cleaned = cleaned.slice(0, MAX_CUSTOM_PROMPT_LENGTH);
  }

  for (const pattern of INJECTION_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match && match.index !== undefined) {
      cleaned = cleaned.slice(0, match.index).trim();
    }
  }

  for (const pattern of BLOCKED_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  for (const word of SENSITIVE_WORDS) {
    if (cleaned.includes(word)) return "";
  }

  if (/(.)\1{4,}/.test(cleaned)) return "";

  return cleaned;
}

export async function validateUploadedImage(_objectKey: string) {
  /* TODO: 接入内容审核服务 */
  return true;
}
