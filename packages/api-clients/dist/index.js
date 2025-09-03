"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : Symbol.for("Symbol." + name);
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __await = function(promise, isYieldStar) {
  this[0] = promise;
  this[1] = isYieldStar;
};
var __asyncGenerator = (__this, __arguments, generator) => {
  var resume = (k, v, yes, no) => {
    try {
      var x = generator[k](v), isAwait = (v = x.value) instanceof __await, done = x.done;
      Promise.resolve(isAwait ? v[0] : v).then((y) => isAwait ? resume(k === "return" ? k : "next", v[1] ? { done: y.done, value: y.value } : y, yes, no) : yes({ value: y, done })).catch((e) => resume("throw", e, yes, no));
    } catch (e) {
      no(e);
    }
  }, method = (k) => it[k] = (x) => new Promise((yes, no) => resume(k, x, yes, no)), it = {};
  return generator = generator.apply(__this, __arguments), it[__knownSymbol("asyncIterator")] = () => it, method("next"), method("throw"), method("return"), it;
};

// src/index.ts
var index_exports = {};
__export(index_exports, {
  LBAClient: () => LBAClient,
  LBAOfferSchema: () => LBAOfferSchema
});
module.exports = __toCommonJS(index_exports);

// src/lba.ts
var import_zod = require("zod");
var LBAOfferSchema = import_zod.z.object({
  id: import_zod.z.string(),
  title: import_zod.z.string(),
  description: import_zod.z.string().nullable().optional(),
  // Company - completely optional structure
  company: import_zod.z.object({
    name: import_zod.z.string().nullable().optional(),
    // Can be undefined!
    siret: import_zod.z.string().nullable().optional(),
    size: import_zod.z.string().nullable().optional(),
    description: import_zod.z.string().nullable().optional()
  }).optional(),
  // Place - city can be null!
  place: import_zod.z.object({
    city: import_zod.z.string().nullable().optional(),
    // Can be null!
    postalCode: import_zod.z.string().nullable().optional(),
    zipCode: import_zod.z.string().nullable().optional(),
    department: import_zod.z.string().nullable().optional(),
    region: import_zod.z.string().nullable().optional(),
    inseeCode: import_zod.z.string().nullable().optional(),
    latitude: import_zod.z.number().nullable().optional(),
    longitude: import_zod.z.number().nullable().optional(),
    distance: import_zod.z.number().nullable().optional(),
    fullAddress: import_zod.z.string().nullable().optional(),
    address: import_zod.z.string().nullable().optional()
  }).optional(),
  // Contract
  contract: import_zod.z.object({
    type: import_zod.z.string().nullable().optional(),
    // Not always present
    duration: import_zod.z.number().nullable().optional(),
    workMode: import_zod.z.string().nullable().optional()
  }).optional(),
  // Job object
  job: import_zod.z.object({
    id: import_zod.z.string().nullable().optional(),
    contractType: import_zod.z.string().nullable().optional(),
    description: import_zod.z.string().nullable().optional(),
    creationDate: import_zod.z.string().nullable().optional(),
    jobStartDate: import_zod.z.string().nullable().optional(),
    jobExpirationDate: import_zod.z.string().nullable().optional(),
    romeDetails: import_zod.z.any().optional()
  }).optional(),
  // Salary
  salary: import_zod.z.object({
    min: import_zod.z.number().nullable().optional(),
    max: import_zod.z.number().nullable().optional(),
    period: import_zod.z.string().nullable().optional(),
    description: import_zod.z.string().nullable().optional()
  }).optional(),
  // Arrays - can be null!
  rome_codes: import_zod.z.array(import_zod.z.string()).nullable().optional(),
  naf_code: import_zod.z.string().nullable().optional(),
  skills: import_zod.z.array(import_zod.z.string()).nullable().optional(),
  nafs: import_zod.z.array(import_zod.z.any()).nullable().optional(),
  // Can be null!
  // Other optional fields
  degree_min: import_zod.z.string().nullable().optional(),
  experience_min: import_zod.z.number().nullable().optional(),
  languages: import_zod.z.array(import_zod.z.object({
    language: import_zod.z.string(),
    level: import_zod.z.string().nullable().optional()
  })).nullable().optional(),
  // Apply options
  apply_url: import_zod.z.string().url().nullable().optional(),
  apply_phone: import_zod.z.string().nullable().optional(),
  apply_email: import_zod.z.string().email().nullable().optional(),
  // Dates
  published_at: import_zod.z.string().nullable().optional(),
  updated_at: import_zod.z.string().nullable().optional(),
  expires_at: import_zod.z.string().nullable().optional(),
  // Matcha-specific fields
  ideaType: import_zod.z.string().nullable().optional(),
  contact: import_zod.z.any().optional(),
  target_diploma_level: import_zod.z.string().nullable().optional(),
  rythmeAlternance: import_zod.z.any().nullable().optional(),
  elligibleHandicap: import_zod.z.boolean().nullable().optional(),
  dureeContrat: import_zod.z.string().nullable().optional(),
  quantiteContrat: import_zod.z.number().nullable().optional(),
  status: import_zod.z.string().nullable().optional(),
  type: import_zod.z.array(import_zod.z.string()).nullable().optional(),
  recipient_id: import_zod.z.string().nullable().optional(),
  // LBA Company specific
  url: import_zod.z.string().nullable().optional(),
  applicationCount: import_zod.z.number().nullable().optional(),
  token: import_zod.z.string().nullable().optional()
});
var LBAResponseSchema = import_zod.z.object({
  // L'API retourne des objets avec une propriété 'results' qui contient les arrays
  peJobs: import_zod.z.object({
    results: import_zod.z.array(LBAOfferSchema)
  }).nullable().optional(),
  // Offres Pôle Emploi
  partnerJobs: import_zod.z.object({
    results: import_zod.z.array(LBAOfferSchema)
  }).nullable().optional(),
  // Offres partenaires
  matchas: import_zod.z.object({
    results: import_zod.z.array(LBAOfferSchema)
  }).nullable().optional(),
  // Offres matchées
  lbaCompanies: import_zod.z.object({
    results: import_zod.z.array(import_zod.z.any())
  }).nullable().optional(),
  // Entreprises LBA
  lbbCompanies: import_zod.z.object({
    results: import_zod.z.array(import_zod.z.any())
  }).nullable().optional()
  // Entreprises La Bonne Boîte
});
var LBAClient = class {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://labonnealternance.apprentissage.beta.gouv.fr/api/V1";
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 2e3;
  }
  async fetchWithRetry(url, options) {
    let lastError = null;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, __spreadProps(__spreadValues({}, options), {
          headers: __spreadProps(__spreadValues({}, options.headers), {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          })
        }));
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const delay = retryAfter ? parseInt(retryAfter) * 1e3 : this.retryDelay * (attempt + 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        if (response.status >= 500 && attempt < this.maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
          continue;
        }
        return response;
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        }
      }
    }
    throw lastError || new Error("Max retries exceeded");
  }
  async searchOffers(params = {}) {
    var _a, _b, _c;
    const url = new URL(`${this.baseUrl}/jobs`);
    url.searchParams.set("caller", "cledger5");
    const romeArray = params.romeCodes || params.rome || ["M1805"];
    const romeCodes = romeArray.join(",");
    url.searchParams.set("romes", romeCodes);
    const departments = params.departments || params.department;
    if ((departments == null ? void 0 : departments.length) && departments[0]) {
      const deptToInsee = {
        "75": "75056",
        // Paris
        "13": "13055",
        // Marseille
        "69": "69123",
        // Lyon
        "31": "31555",
        // Toulouse
        "06": "06088",
        // Nice
        "44": "44109",
        // Nantes
        "67": "67482",
        // Strasbourg
        "34": "34172",
        // Montpellier
        "33": "33063",
        // Bordeaux
        "59": "59350"
        // Lille
      };
      const insee = deptToInsee[departments[0]] || "75056";
      url.searchParams.set("insee", insee);
    } else if (((_a = params.city) == null ? void 0 : _a.length) && params.city[0]) {
      url.searchParams.set("insee", "75056");
    } else {
      url.searchParams.set("insee", "75056");
    }
    if (params.from) url.searchParams.set("from", params.from);
    if (params.to) url.searchParams.set("to", params.to);
    if (params.page) url.searchParams.set("page", params.page.toString());
    if (params.per_page) url.searchParams.set("per_page", params.per_page.toString());
    if ((_b = params.contract_type) == null ? void 0 : _b.length) url.searchParams.set("contract_type", params.contract_type.join(","));
    if ((_c = params.company_size) == null ? void 0 : _c.length) url.searchParams.set("company_size", params.company_size.join(","));
    console.log("LBA API URL:", url.toString());
    const response = await this.fetchWithRetry(url.toString(), { method: "GET" });
    if (!response.ok) {
      let errorDetails = "";
      try {
        const errorBody = await response.text();
        console.error("LBA API Error Response:", errorBody);
        try {
          const errorJson = JSON.parse(errorBody);
          if (errorJson.error) errorDetails = ` - ${errorJson.error}`;
          if (errorJson.error_messages) errorDetails += ` - ${errorJson.error_messages.join(", ")}`;
          if (errorJson.message) errorDetails = ` - ${errorJson.message}`;
        } catch (e) {
          if (errorBody && errorBody.length < 500) {
            errorDetails = ` - ${errorBody}`;
          }
        }
      } catch (e) {
        console.error("Could not read error response body:", e);
      }
      throw new Error(`LBA API error: ${response.status} ${response.statusText}${errorDetails}`);
    }
    const data = await response.json();
    return LBAResponseSchema.parse(data);
  }
  async getOffer(id) {
    const url = `${this.baseUrl}/jobs/${id}`;
    const response = await this.fetchWithRetry(url, { method: "GET" });
    if (!response.ok) {
      throw new Error(`LBA API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return LBAOfferSchema.parse(data);
  }
  // Fetch all offers with pagination
  fetchAllOffers() {
    return __asyncGenerator(this, arguments, function* (params = {}) {
      var _a, _b, _c, _d, _e;
      let page = 1;
      let hasMore = true;
      const perPage = params.per_page || 500;
      while (hasMore) {
        const response = yield new __await(this.searchOffers(__spreadProps(__spreadValues({}, params), {
          page,
          per_page: perPage
        })));
        const allOffers = [
          ...((_a = response.peJobs) == null ? void 0 : _a.results) || [],
          ...((_b = response.partnerJobs) == null ? void 0 : _b.results) || [],
          ...((_c = response.matchas) == null ? void 0 : _c.results) || [],
          ...((_d = response.lbaCompanies) == null ? void 0 : _d.results) || [],
          ...((_e = response.lbbCompanies) == null ? void 0 : _e.results) || []
        ];
        yield allOffers;
        hasMore = allOffers.length === perPage;
        page++;
        if (hasMore) {
          yield new __await(new Promise((resolve) => setTimeout(resolve, 100)));
        }
      }
    });
  }
  // Map LBA offer to canonical format
  mapToCanonical(lbaOffer) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
    return {
      external_id: lbaOffer.id,
      title: lbaOffer.title,
      description: lbaOffer.description || ((_a = lbaOffer.job) == null ? void 0 : _a.description) || "",
      // Company mapping - handle missing name
      company: ((_b = lbaOffer.company) == null ? void 0 : _b.name) ? {
        name: lbaOffer.company.name,
        siret: lbaOffer.company.siret,
        size_range: lbaOffer.company.size
      } : void 0,
      // Location mapping - handle missing city
      location: ((_c = lbaOffer.place) == null ? void 0 : _c.city) ? {
        city: lbaOffer.place.city,
        postal_code: ((_d = lbaOffer.place) == null ? void 0 : _d.postalCode) || ((_e = lbaOffer.place) == null ? void 0 : _e.zipCode),
        department_code: (_f = lbaOffer.place) == null ? void 0 : _f.department,
        region_code: (_g = lbaOffer.place) == null ? void 0 : _g.region,
        insee_code: (_h = lbaOffer.place) == null ? void 0 : _h.inseeCode,
        latitude: (_i = lbaOffer.place) == null ? void 0 : _i.latitude,
        longitude: (_j = lbaOffer.place) == null ? void 0 : _j.longitude
      } : void 0,
      // Contract mapping - handle both contract and job.contractType
      contract_types: ((_k = lbaOffer.contract) == null ? void 0 : _k.type) ? [this.mapContractType(lbaOffer.contract.type)] : ((_l = lbaOffer.job) == null ? void 0 : _l.contractType) ? [this.mapContractType(lbaOffer.job.contractType)] : [],
      work_modes: ((_m = lbaOffer.contract) == null ? void 0 : _m.workMode) ? [this.mapWorkMode(lbaOffer.contract.workMode)] : [],
      contract_duration_months: ((_n = lbaOffer.contract) == null ? void 0 : _n.duration) || (lbaOffer.dureeContrat ? parseInt(lbaOffer.dureeContrat) : void 0),
      // Salary mapping
      salary_min: (_o = lbaOffer.salary) == null ? void 0 : _o.min,
      salary_max: (_p = lbaOffer.salary) == null ? void 0 : _p.max,
      salary_period: (_q = lbaOffer.salary) == null ? void 0 : _q.period,
      // Skills and requirements
      rome_codes: lbaOffer.rome_codes || (((_r = lbaOffer.job) == null ? void 0 : _r.romeDetails) ? [(_s = lbaOffer.job.romeDetails.rome) == null ? void 0 : _s.code_rome].filter(Boolean) : []),
      naf_code: lbaOffer.naf_code,
      required_skills: lbaOffer.skills,
      education_level: lbaOffer.degree_min || lbaOffer.target_diploma_level,
      // Application
      application_url: lbaOffer.apply_url || lbaOffer.url,
      application_phone: lbaOffer.apply_phone,
      application_email: lbaOffer.apply_email,
      // Dates - handle different date fields
      published_at: lbaOffer.published_at || ((_t = lbaOffer.job) == null ? void 0 : _t.creationDate),
      updated_at: lbaOffer.updated_at || ((_u = lbaOffer.job) == null ? void 0 : _u.creationDate),
      expires_at: lbaOffer.expires_at || ((_v = lbaOffer.job) == null ? void 0 : _v.jobExpirationDate),
      // Alternance specific - check multiple sources
      alternance: ((_w = lbaOffer.contract) == null ? void 0 : _w.type) ? ["Apprentissage", "Professionnalisation", "Alternance"].includes(lbaOffer.contract.type) : ((_x = lbaOffer.job) == null ? void 0 : _x.contractType) === "Apprentissage" || ((_y = lbaOffer.type) == null ? void 0 : _y.includes("Apprentissage")),
      // Raw data for reference
      raw_data: lbaOffer
    };
  }
  mapContractType(lbaType) {
    const mapping = {
      "Apprentissage": "Apprentissage",
      "Professionnalisation": "Professionnalisation",
      "Alternance": "Alternance",
      "CDI": "CDI",
      "CDD": "CDD",
      "Stage": "Stage"
    };
    return mapping[lbaType] || lbaType;
  }
  mapWorkMode(lbaMode) {
    const mapping = {
      "presentiel": "OnSite",
      "teletravail": "Remote",
      "hybride": "Hybrid",
      "sur site": "OnSite",
      "a distance": "Remote"
    };
    return mapping[lbaMode.toLowerCase()] || "OnSite";
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LBAClient,
  LBAOfferSchema
});
//# sourceMappingURL=index.js.map