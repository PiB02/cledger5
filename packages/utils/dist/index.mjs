// src/embedding-text-builder.ts
function toCEFR(n) {
  const map = ["", "A1", "A2", "B1", "B2", "C1", "C2"];
  return n && n >= 1 && n <= 6 ? map[n] || "unknown" : "unknown";
}
function normSkill(s) {
  const unaccent = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[àâä]/gi, "a").replace(/[éèêë]/gi, "e").replace(/[îï]/gi, "i").replace(/[ôö]/gi, "o").replace(/[ùûü]/gi, "u").replace(/[ÿ]/gi, "y").replace(/[ç]/gi, "c").replace(/[ñ]/gi, "n");
  };
  return unaccent(s).trim().toLowerCase().replace(/\s+/g, " ");
}
function buildEmbeddingText(ctx, data) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const title = data.title_canonical.slice(0, 80);
  const rome = (data.rome_codes || []).sort().join("; ") || "unknown";
  const loc = `${data.city || ""}|${data.department_code || ""}|${data.region_code || ""}|FR`;
  const seniority = (_a = data.career_level) != null ? _a : "unknown";
  const contract = (_b = data.contract_type_code) != null ? _b : "unknown";
  const workMode = (_c = data.work_mode_code) != null ? _c : "unknown";
  const langs = (data.languages || []).sort((a, b) => a.code.localeCompare(b.code)).map((l) => `${l.code}=${toCEFR(l.cefr)}`).join("; ") || "unknown";
  const degree = ctx === "offer" ? (_e = (_d = data.degree_min_eqf) == null ? void 0 : _d.toString()) != null ? _e : "unknown" : (_g = (_f = data.degree_top_eqf) == null ? void 0 : _f.toString()) != null ? _g : "unknown";
  const req = (data.skills_required || []).map(normSkill).filter(Boolean);
  const pref = (data.skills_preferred || []).map(normSkill).filter(Boolean);
  const dedup = (arr) => Array.from(new Set(arr));
  const limit = (arr) => arr.slice(0, 50);
  const reqF = limit(dedup(req));
  const prefF = limit(dedup(pref));
  const salary = data.salary_min && data.salary_max && data.salary_period ? `${data.salary_min}-${data.salary_max} EUR ${data.salary_period}` : "unknown";
  const avail = data.availability || (data.contract_start_date ? new Date(data.contract_start_date).toISOString().slice(0, 7) : (
    // YYYY-MM
    "unknown"
  ));
  const lines = [
    `TITLE: ${title}`,
    `ROME: ${rome}`,
    `LOCATION: ${loc}`,
    `SENIORITY: ${seniority}`,
    `CONTRACT: ${contract}`,
    `WORK_MODE: ${workMode}`,
    `LANGUAGES: ${langs}`,
    `${ctx === "offer" ? "DEGREE_EQF_MIN" : "DEGREE_EQF_TOP"}: ${degree}`,
    `SKILLS_REQUIRED: ${reqF.join("|")}`,
    `SKILLS_PREFERRED: ${prefF.join("|")}`,
    `SALARY: ${salary}`,
    `AVAILABILITY: ${avail}`
  ];
  const txt = lines.join("\n");
  if (txt.length > 1500) {
    throw new Error(`Embedding text too long: ${txt.length} characters (max: 1500)`);
  }
  if (ctx === "offer" && !reqF.length && ((_h = data.skills_required) == null ? void 0 : _h.length)) {
    throw new Error("Required skills empty after normalization");
  }
  return txt;
}
async function hashEmbeddingText(text) {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  try {
    const crypto2 = await import("crypto");
    return crypto2.createHash("sha256").update(text).digest("hex");
  } catch (e) {
    throw new Error("No crypto implementation available");
  }
}

// src/cost-estimator.ts
var OPENAI_PRICING = {
  "gpt-4o-mini": {
    input: 0.15,
    // $0.15 per 1M input tokens
    output: 0.6
    // $0.60 per 1M output tokens
  },
  "text-embedding-3-small": {
    input: 0.02
    // $0.02 per 1M tokens
  }
};
var TOKEN_ESTIMATES = {
  offer_extraction: {
    input: 800,
    // Description offre moyenne
    output: 400
    // JSON structuré extrait
  },
  cv_parsing: {
    input: 2e3,
    // CV moyen 2 pages
    output: 800
    // Profil structuré extrait
  },
  embedding_text: {
    input: 400
    // Texte formaté pour embedding
  }
};
var TIME_ESTIMATES = {
  offer_extraction: 2,
  cv_parsing: 3,
  embedding_generation: 0.5,
  database_write: 0.2
};
function estimateOpenAICost(operation, count = 1) {
  let totalCost = 0;
  let totalTokens = 0;
  switch (operation) {
    case "offer_extraction": {
      const inputTokens = TOKEN_ESTIMATES.offer_extraction.input * count;
      const outputTokens = TOKEN_ESTIMATES.offer_extraction.output * count;
      totalTokens = inputTokens + outputTokens;
      totalCost = inputTokens / 1e6 * OPENAI_PRICING["gpt-4o-mini"].input + outputTokens / 1e6 * OPENAI_PRICING["gpt-4o-mini"].output;
      break;
    }
    case "cv_parsing": {
      const inputTokens = TOKEN_ESTIMATES.cv_parsing.input * count;
      const outputTokens = TOKEN_ESTIMATES.cv_parsing.output * count;
      totalTokens = inputTokens + outputTokens;
      totalCost = inputTokens / 1e6 * OPENAI_PRICING["gpt-4o-mini"].input + outputTokens / 1e6 * OPENAI_PRICING["gpt-4o-mini"].output;
      break;
    }
    case "embedding": {
      const inputTokens = TOKEN_ESTIMATES.embedding_text.input * count;
      totalTokens = inputTokens;
      totalCost = inputTokens / 1e6 * OPENAI_PRICING["text-embedding-3-small"].input;
      break;
    }
  }
  return {
    cost: Math.round(totalCost * 1e4) / 1e4,
    // Arrondi à 4 décimales
    tokens: totalTokens
  };
}
function estimateBatchDuration(type, itemCount, concurrency = 3) {
  let timePerItem = 0;
  switch (type) {
    case "offers_ingest":
      timePerItem = TIME_ESTIMATES.offer_extraction + TIME_ESTIMATES.embedding_generation + TIME_ESTIMATES.database_write;
      break;
    case "cv_parsing":
      timePerItem = TIME_ESTIMATES.cv_parsing + TIME_ESTIMATES.embedding_generation + TIME_ESTIMATES.database_write * 3;
      break;
    case "embeddings_update":
      timePerItem = TIME_ESTIMATES.embedding_generation + TIME_ESTIMATES.database_write;
      break;
  }
  const batches = Math.ceil(itemCount / concurrency);
  const totalSeconds = batches * timePerItem;
  return Math.ceil(totalSeconds * 1.2);
}
function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
function formatCost(cost) {
  return `$${cost.toFixed(4)}`;
}

// src/normalizers.ts
function normalizePhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 9 && cleaned[0] !== "0") {
    cleaned = "0" + cleaned;
  }
  if (cleaned.length === 10 && cleaned.startsWith("0")) {
    cleaned = "33" + cleaned.slice(1);
  }
  if (cleaned.length === 11 && cleaned.startsWith("33")) {
    return "+" + cleaned;
  }
  return cleaned;
}
function normalizeSiret(siret) {
  const cleaned = siret.replace(/\D/g, "");
  if (cleaned.length !== 14) {
    return null;
  }
  if (!validateSiret(cleaned)) {
    return null;
  }
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, "$1 $2 $3 $4");
}
function validateSiret(siret) {
  if (siret.length !== 14) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(siret[i]);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }
  return sum % 10 === 0;
}
function normalizePostalCode(code) {
  const cleaned = code.replace(/\D/g, "");
  if (cleaned.length !== 5) {
    return null;
  }
  const dept = parseInt(cleaned.slice(0, 2));
  if (dept < 1 || dept > 95 && dept < 97 || dept > 97) {
    return null;
  }
  return cleaned;
}
function normalizeRomeCode(code) {
  const cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!/^[A-Z]\d{4}$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}
function normalizeNafCode(code) {
  const cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!/^\d{4}[A-Z]$/.test(cleaned)) {
    return null;
  }
  return cleaned.slice(0, 2) + "." + cleaned.slice(2, 4) + cleaned[4];
}
function normalizeUrl(url) {
  try {
    if (!url.match(/^https?:\/\//)) {
      url = "https://" + url;
    }
    const parsed = new URL(url);
    let normalized = parsed.toString();
    if (normalized.endsWith("/") && parsed.pathname === "/") {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch (e) {
    return null;
  }
}
function normalizeEmail(email) {
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return null;
  }
  return trimmed;
}
function generateOfferFingerprint(data) {
  const parts = [
    normalizeForFingerprint(data.title),
    normalizeForFingerprint(data.company_name),
    normalizeForFingerprint(data.location_city || ""),
    normalizeForFingerprint(data.contract_type || "")
  ];
  return parts.filter(Boolean).join("_");
}
function normalizeForFingerprint(str) {
  if (!str || str === "undefined") {
    return "";
  }
  return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").slice(0, 50);
}
export {
  buildEmbeddingText,
  estimateBatchDuration,
  estimateOpenAICost,
  formatCost,
  formatDuration,
  generateOfferFingerprint,
  hashEmbeddingText,
  normSkill,
  normalizeEmail,
  normalizeNafCode,
  normalizePhoneNumber,
  normalizePostalCode,
  normalizeRomeCode,
  normalizeSiret,
  normalizeUrl,
  toCEFR
};
//# sourceMappingURL=index.mjs.map