import http from "node:http";
import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { setDefaultResultOrder } from "node:dns";

setDefaultResultOrder("ipv4first");

function loadLocalEnv() {
  const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
  for (const filename of [".env", ".env.local"]) {
    try {
      const lines = readFileSync(join(projectRoot, filename), "utf8").split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
        const index = trimmed.indexOf("=");
        const key = trimmed.slice(0, index).trim();
        const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
        if (key && process.env[key] === undefined) process.env[key] = value;
      }
    } catch {
      // Local env files are optional.
    }
  }
}

loadLocalEnv();

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(ROOT, "public");
const APPLE_VISION_OCR_SCRIPT = join(ROOT, "tools", "apple-vision-ocr.swift");
const EXPORT_DIR = join(ROOT, "..", "data", "exports");
const ADMIN_STORE_PATH = join(ROOT, "..", "data", "admin-store.json");
const SAVED_REPORTS_DIR = join(ROOT, "..", "data", "saved-reports");
const BHOOMI_URL = "https://landrecords.karnataka.gov.in/Service2/";
const MR_STATUS_URL = "https://landrecords.karnataka.gov.in/Service12/MutationStatus.aspx";
const MR_EXTRACT_URL = "https://landrecords.karnataka.gov.in/Service11/MR_MutationExtract.aspx";
const KHATHA_URL = "https://landrecords.karnataka.gov.in/Service64/";
const AKARBAND_BASE_URL = "https://bhoomojini.karnataka.gov.in";
const AKARBAND_API_URL = `${AKARBAND_BASE_URL}/Service39/Home`;
const ADVANCED_RTC_API_URL = "https://landrecords.karnataka.gov.in/service53/ds_rtc.asmx";
const OWNERSHIP_HISTORY_URL = "https://landrecords.karnataka.gov.in/service40/PendcySurveyNoWiseRpt";
const ECHAWADI_BASE_URL = "https://rdservices.karnataka.gov.in";
const ECHAWADI_API_URL = `${ECHAWADI_BASE_URL}/echawadi/Home`;
const REPORT_TASK_TIMEOUT_MS = 60000;
const OLD_RTC_TASK_TIMEOUT_MS = 300000;
const ADVANCED_DETAILS_TASK_TIMEOUT_MS = 90000;
const OWNERSHIP_MAP_TASK_TIMEOUT_MS = 120000;
const REPORT_ENRICH_TIMEOUT_MS = 10000;
const OFFICIAL_FETCH_TIMEOUT_MS = 12000;
const OFFICIAL_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const OFFICIAL_PROXY_URL = process.env.OFFICIAL_HTTPS_PROXY || process.env.QUOTAGUARDSTATIC_URL || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.2";
const OPENAI_VISION_MODEL = process.env.OPENAI_VISION_MODEL || OPENAI_MODEL;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-5";
const ANTHROPIC_VERSION = "2023-06-01";
const PLAYWRIGHT_MODULE_URL = process.env.PLAYWRIGHT_MODULE_URL || (process.env.NODE_ENV === "production" ? "playwright" : "file:///Users/salavala/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs");
const CHROME_EXECUTABLE_PATH = process.env.CHROME_EXECUTABLE_PATH || (process.platform === "darwin" ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : "");
let ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "SriSatVam@999";
const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "ap-south-1";
const AWS_STORAGE_MODE = process.env.STORAGE_MODE || (process.env.AWS_DYNAMODB_TABLE && process.env.AWS_S3_BUCKET ? "aws" : "local");
const AWS_DYNAMODB_TABLE = process.env.AWS_DYNAMODB_TABLE || "";
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || "";
const AWS_S3_PREFIX = (process.env.AWS_S3_PREFIX || "ssvd-report-store").replace(/^\/+|\/+$/g, "");
const AWS_SECRETS_ID = process.env.AWS_SECRETS_ID || "";
const AWS_SES_FROM_EMAIL = process.env.AWS_SES_FROM_EMAIL || "";
const APP_PUBLIC_URL = (process.env.APP_PUBLIC_URL || process.env.PUBLIC_APP_URL || "").replace(/\/+$/g, "");
const REPORT_WORKSPACES = [
  { id: "fullLegalReport", name: "Full Legal Report" },
  { id: "landAutoGenReport", name: "Land AutoGen Report" },
  { id: "dailyMutationsReport", name: "Daily Mutations Report" },
  { id: "landScoreCard", name: "Land Score Card" },
  { id: "dueDiligenceDashboard", name: "Evidence & Gaps Dashboard" },
  { id: "documentGapFinder", name: "Document Gap Finder" },
  { id: "titleChainTimeline", name: "Title Chain Timeline" },
  { id: "deedUploadMatch", name: "EC / Sale Deed Match" },
  { id: "kaveriReadiness", name: "Kaveri Readiness" },
  { id: "surveyBoundaryReport", name: "Survey & Boundary Report" },
  { id: "villageRiskRadar", name: "Village Risk Radar" },
  { id: "portalHealthMonitor", name: "Portal Health Monitor" },
  { id: "buyerActionTracker", name: "Buyer Action Tracker" },
  { id: "surveyRecords", name: "Survey Records" },
  { id: "downloadRtcs", name: "RTC Downloads & Scan" },
  { id: "mrDownloader", name: "MR Downloader" },
  { id: "kathaValidation", name: "Katha Validation" },
  { id: "villageScan", name: "Village Scan" },
];

const sessions = new Map();
const documents = new Map();
let officialProxyDispatcher;
let playwrightChromiumPromise;
let s3ClientPromise;
let dynamoDocumentPromise;
let secretsClientPromise;

function awsStorageEnabled() {
  return AWS_STORAGE_MODE === "aws" && Boolean(AWS_DYNAMODB_TABLE && AWS_S3_BUCKET);
}

async function getS3Client() {
  s3ClientPromise ||= import("@aws-sdk/client-s3").then(({ S3Client }) => new S3Client({ region: AWS_REGION }));
  return s3ClientPromise;
}

async function getDynamoDocument() {
  dynamoDocumentPromise ||= Promise.all([
    import("@aws-sdk/client-dynamodb"),
    import("@aws-sdk/lib-dynamodb"),
  ]).then(([{ DynamoDBClient }, { DynamoDBDocumentClient }]) => (
    DynamoDBDocumentClient.from(new DynamoDBClient({ region: AWS_REGION }))
  ));
  return dynamoDocumentPromise;
}

async function getSecretsClient() {
  secretsClientPromise ||= import("@aws-sdk/client-secrets-manager").then(({ SecretsManagerClient }) => new SecretsManagerClient({ region: AWS_REGION }));
  return secretsClientPromise;
}

async function loadAwsSecrets() {
  if (!AWS_SECRETS_ID) return;
  const [{ GetSecretValueCommand }, client] = await Promise.all([
    import("@aws-sdk/client-secrets-manager"),
    getSecretsClient(),
  ]);
  const response = await client.send(new GetSecretValueCommand({ SecretId: AWS_SECRETS_ID }));
  const secret = response.SecretString ? JSON.parse(response.SecretString) : {};
  for (const [key, value] of Object.entries(secret)) {
    if (value !== undefined && value !== null && process.env[key] === undefined) process.env[key] = String(value);
  }
  ADMIN_USERNAME = process.env.ADMIN_USERNAME || ADMIN_USERNAME;
  ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ADMIN_PASSWORD;
}

function dynamoKey(pk, sk) {
  return { pk, sk };
}

async function dynamoGet(pk, sk) {
  const [{ GetCommand }, doc] = await Promise.all([import("@aws-sdk/lib-dynamodb"), getDynamoDocument()]);
  const result = await doc.send(new GetCommand({
    TableName: AWS_DYNAMODB_TABLE,
    Key: dynamoKey(pk, sk),
  }));
  return result.Item;
}

async function dynamoPut(item) {
  const [{ PutCommand }, doc] = await Promise.all([import("@aws-sdk/lib-dynamodb"), getDynamoDocument()]);
  await doc.send(new PutCommand({
    TableName: AWS_DYNAMODB_TABLE,
    Item: {
      ...item,
      updatedAt: new Date().toISOString(),
    },
  }));
}

function s3Key(...parts) {
  return [AWS_S3_PREFIX, ...parts.map((part) => safeName(part, "item"))].filter(Boolean).join("/");
}

function withReportTimeout(promise, timeoutMs, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([
    Promise.resolve(promise).finally(() => clearTimeout(timeoutId)),
    timeout,
  ]);
}

function officialHeaders(headers = {}) {
  return Object.fromEntries(Object.entries({
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
    "accept-language": "en-IN,en;q=0.9,kn;q=0.8",
    "cache-control": "no-cache",
    pragma: "no-cache",
    "user-agent": OFFICIAL_USER_AGENT,
    ...headers,
  }).filter(([, value]) => value !== undefined && value !== null && value !== ""));
}

function describeRequestError(error) {
  const parts = [];
  for (let item = error; item; item = item.cause) {
    if (item.code) parts.push(item.code);
    if (item.message) parts.push(item.message);
  }
  return [...new Set(parts)].join(" - ") || "network request failed";
}

async function officialFetch(url, options = {}, label = "Official service") {
  const { headers = {}, timeoutMs = OFFICIAL_FETCH_TIMEOUT_MS, retries = 1, ...fetchOptions } = options;
  let lastError;
  if (OFFICIAL_PROXY_URL && !officialProxyDispatcher) {
    const { ProxyAgent } = await import("undici");
    officialProxyDispatcher = new ProxyAgent(OFFICIAL_PROXY_URL);
  }
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, {
        ...fetchOptions,
        headers: officialHeaders(headers),
        ...(officialProxyDispatcher ? { dispatcher: officialProxyDispatcher } : {}),
        signal: controller.signal,
      });
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error(`${label} request failed: ${describeRequestError(lastError)}`);
}

const currentFields = {
  district: {
    id: "ctl00_MainContent_ddlCDistrict",
    name: "ctl00$MainContent$ddlCDistrict",
    target: "ctl00$MainContent$ddlCDistrict",
  },
  taluk: {
    id: "ctl00_MainContent_ddlCTaluk",
    name: "ctl00$MainContent$ddlCTaluk",
    target: "ctl00$MainContent$ddlCTaluk",
  },
  hobli: {
    id: "ctl00_MainContent_ddlCHobli",
    name: "ctl00$MainContent$ddlCHobli",
    target: "ctl00$MainContent$ddlCHobli",
  },
  village: {
    id: "ctl00_MainContent_ddlCVillage",
    name: "ctl00$MainContent$ddlCVillage",
    target: "ctl00$MainContent$ddlCVillage",
  },
  survey: {
    id: "ctl00_MainContent_txtCSurveyNo",
    name: "ctl00$MainContent$txtCSurveyNo",
    target: "ctl00$MainContent$txtCSurveyNo",
  },
  surnoc: {
    id: "ctl00_MainContent_ddlCSurnocNo",
    name: "ctl00$MainContent$ddlCSurnocNo",
    target: "ctl00$MainContent$ddlCSurnocNo",
  },
  hissa: {
    id: "ctl00_MainContent_ddlCHissaNo",
    name: "ctl00$MainContent$ddlCHissaNo",
    target: "ctl00$MainContent$ddlCHissaNo",
  },
  period: {
    id: "ctl00_MainContent_ddlCPeriod",
    name: "ctl00$MainContent$ddlCPeriod",
    target: "ctl00$MainContent$ddlCPeriod",
  },
  year: {
    id: "ctl00_MainContent_ddlCYear",
    name: "ctl00$MainContent$ddlCYear",
  },
};

const oldFields = {
  district: {
    id: "ctl00_MainContent_ddlODist",
    name: "ctl00$MainContent$ddlODist",
    target: "ctl00$MainContent$ddlODist",
  },
  taluk: {
    id: "ctl00_MainContent_ddlOTaluk",
    name: "ctl00$MainContent$ddlOTaluk",
    target: "ctl00$MainContent$ddlOTaluk",
  },
  hobli: {
    id: "ctl00_MainContent_ddlOHobli",
    name: "ctl00$MainContent$ddlOHobli",
    target: "ctl00$MainContent$ddlOHobli",
  },
  village: {
    id: "ctl00_MainContent_ddlOVillage",
    name: "ctl00$MainContent$ddlOVillage",
    target: "ctl00$MainContent$ddlOVillage",
  },
  survey: {
    id: "ctl00_MainContent_txtOSurveyNo",
    name: "ctl00$MainContent$txtOSurveyNo",
    target: "ctl00$MainContent$txtOSurveyNo",
  },
  surnoc: {
    id: "ctl00_MainContent_ddlOSurnocNo",
    name: "ctl00$MainContent$ddlOSurnocNo",
    target: "ctl00$MainContent$ddlOSurnocNo",
  },
  hissa: {
    id: "ctl00_MainContent_ddlOHissaNo",
    name: "ctl00$MainContent$ddlOHissaNo",
    target: "ctl00$MainContent$ddlOHissaNo",
  },
  period: {
    id: "ctl00_MainContent_ddlOPeriod",
    name: "ctl00$MainContent$ddlOPeriod",
    target: "ctl00$MainContent$ddlOPeriod",
  },
  year: {
    id: "ctl00_MainContent_ddlOYear",
    name: "ctl00$MainContent$ddlOYear",
    target: "ctl00$MainContent$ddlOYear",
  },
};

const mutationStatusFields = {
  district: { id: "MainContent_drpdist", name: "ctl00$MainContent$drpdist", target: "ctl00$MainContent$drpdist" },
  taluk: { id: "MainContent_drptaluk", name: "ctl00$MainContent$drptaluk", target: "ctl00$MainContent$drptaluk" },
  hobli: { id: "MainContent_drphobli", name: "ctl00$MainContent$drphobli", target: "ctl00$MainContent$drphobli" },
  village: { id: "MainContent_drpvillage", name: "ctl00$MainContent$drpvillage", target: "ctl00$MainContent$drpvillage" },
  survey: { id: "MainContent_txtSurvey", name: "ctl00$MainContent$txtSurvey", target: "ctl00$MainContent$txtSurvey" },
  surnoc: { id: "MainContent_drpsurnoc", name: "ctl00$MainContent$drpsurnoc", target: "ctl00$MainContent$drpsurnoc" },
  hissa: { id: "MainContent_drphissa", name: "ctl00$MainContent$drphissa", target: "ctl00$MainContent$drphissa" },
};

const mutationExtractFields = {
  district: { id: "ctl00_MainContent_drpdist", name: "ctl00$MainContent$drpdist", target: "ctl00$MainContent$drpdist" },
  taluk: { id: "ctl00_MainContent_drptaluk", name: "ctl00$MainContent$drptaluk", target: "ctl00$MainContent$drptaluk" },
  hobli: { id: "ctl00_MainContent_drphobli", name: "ctl00$MainContent$drphobli", target: "ctl00$MainContent$drphobli" },
  village: { id: "ctl00_MainContent_drpvillage", name: "ctl00$MainContent$drpvillage", target: "ctl00$MainContent$drpvillage" },
  survey: { id: "ctl00_MainContent_txtSurvey", name: "ctl00$MainContent$txtSurvey", target: "ctl00$MainContent$txtSurvey" },
};

const khathaFields = {
  district: { id: "drpdist", name: "drpdist", target: "drpdist" },
  taluk: { id: "drptaluk", name: "drptaluk", target: "drptaluk" },
  hobli: { id: "drphobli", name: "drphobli", target: "drphobli" },
  village: { id: "ddlVillage", name: "ddlVillage", target: "ddlVillage" },
  survey: { id: "txtSurvey", name: "txtSurvey", target: "txtSurvey" },
};

const ownershipHistoryFields = {
  district: { id: "MainContent_drpdist", name: "ctl00$MainContent$drpdist", target: "ctl00$MainContent$drpdist" },
  taluk: { id: "MainContent_drptaluk", name: "ctl00$MainContent$drptaluk", target: "ctl00$MainContent$drptaluk" },
  hobli: { id: "MainContent_ddlHobli", name: "ctl00$MainContent$ddlHobli", target: "ctl00$MainContent$ddlHobli" },
  village: { id: "MainContent_ddlVillage", name: "ctl00$MainContent$ddlVillage", target: "" },
  survey: { id: "MainContent_txtSurvey", name: "ctl00$MainContent$txtSurvey", target: "" },
};

const khathaButtons = {
  fetch: { id: "btnGetReport", name: "btnGetReport", value: "ವರದಿ ಪಡೆಯಿರಿ" },
};

const ownershipHistoryButtons = {
  fetch: { id: "MainContent_Button1", name: "ctl00$MainContent$Button1", value: "Get Report" },
};

const fields = currentFields;

const buttons = {
  go: {
    id: "ctl00_MainContent_btnCGo",
    name: "ctl00$MainContent$btnCGo",
    value: "Go",
  },
  fetch: {
    id: "ctl00_MainContent_btnCFetchDetails",
    name: "ctl00$MainContent$btnCFetchDetails",
    value: "Fetch details",
  },
};

const currentPreviewButton = {
  name: "ctl00$MainContent$btnCPreview",
  value: "View",
};

const oldButtons = {
  tab: { name: "ctl00$MainContent$Tab3", value: "Old Year" },
  go: { id: "ctl00_MainContent_btnOGO", name: "ctl00$MainContent$btnOGO", value: "Go" },
  fetch: { id: "ctl00_MainContent_btnOFetchDetails", name: "ctl00$MainContent$btnOFetchDetails", value: "Fetch details" },
};

const oldPreviewButton = {
  name: "ctl00$MainContent$btnOPreview",
  value: "View",
};

const mutationStatusButtons = {
  fetch: { id: "MainContent_btnFetch", name: "ctl00$MainContent$btnFetch", value: "Fetch Details" },
};

const mutationExtractButtons = {
  fetch: { id: "ctl00_MainContent_btnFetch", name: "ctl00$MainContent$btnFetch", value: "Fetch Details" },
};

const mutationExtractPreviewButton = {
  id: "ctl00_MainContent_btnPreview",
  name: "ctl00$MainContent$btnPreview",
  value: "Preview",
};

const relatedServices = [
  { name: "Khata Extract", url: "https://landrecords.karnataka.gov.in/service64/" },
  { name: "Survey Document", url: "https://bhoomojini.karnataka.gov.in/oscitizen/" },
  { name: "Akarband", url: "https://bhoomojini.karnataka.gov.in/service39/" },
  { name: "RTC with sketch", url: "https://rdservices.karnataka.gov.in/BhoomiMaps/" },
  { name: "eChavadi", url: "https://rdservices.karnataka.gov.in/echawadi/" },
  { name: "Survey Sketch", url: "https://rdservices.karnataka.gov.in/service84/" },
  { name: "Record Room Document", url: "https://recordroom.karnataka.gov.in/service4" },
  { name: "Digitally signed RTC and MR", url: "https://rtc.karnataka.gov.in/service78/" },
  { name: "Mutation History", url: "https://landrecords.karnataka.gov.in/service40/PendcySurveyNoWiseRpt" },
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".pdf": "application/pdf",
};

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value = "") {
  return decodeHtml(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`${name}=["']([^"']*)["']`, "i"));
  return match ? decodeHtml(match[1]) : "";
}

function hiddenValue(html, id) {
  const match = html.match(new RegExp(`id=["']${id}["'][^>]*value=["']([^"']*)["']`, "i"));
  return match ? decodeHtml(match[1]) : "";
}

function selectBlock(html, id) {
  const re = new RegExp(`<select\\b([^>]*)id=["']${id}["']([^>]*)>([\\s\\S]*?)<\\/select>`, "i");
  const match = html.match(re);
  if (!match) return { disabled: true, options: [] };

  const tag = `${match[1]} ${match[2]}`;
  const options = [...match[3].matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/gi)].map((option) => {
    const attrs = option[1];
    return {
      value: attr(attrs, "value"),
      label: stripTags(option[2]),
      selected: /\bselected\b/i.test(attrs),
    };
  });

  return {
    disabled: /\bdisabled\b/i.test(tag),
    options,
    selected: options.find((option) => option.selected)?.value || "",
  };
}

function inputState(html, id) {
  const match = html.match(new RegExp(`<input\\b[^>]*id=["']${id}["'][^>]*>`, "i"));
  if (!match) return { disabled: true, value: "" };
  return {
    disabled: /\bdisabled\b/i.test(match[0]),
    value: attr(match[0], "value"),
  };
}

function buttonState(html, id) {
  const match = html.match(new RegExp(`<input\\b[^>]*id=["']${id}["'][^>]*>`, "i"));
  return {
    disabled: !match || /\bdisabled\b/i.test(match[0]),
  };
}

function selectedLabel(html, key, value, fieldConfig = fields) {
  const select = selectBlock(html, fieldConfig[key].id);
  return select.options.find((option) => option.value === value)?.label || value || "";
}

function sanitizeResultHtml(html, baseUrl = BHOOMI_URL) {
  const resultMatches = [
    ...html.matchAll(/<div[^>]*class=["'][^"']*(?:panel|well)[^"']*["'][^>]*>[\s\S]*?<\/div>\s*<\/div>/gi),
  ]
    .map((match) => match[0])
    .filter((block) => /Lbl|Grid|Details|Mutation|Owner|Cultivator|Land|Survey|Village|Hissa|Period|Revenue/i.test(block));

  const fallback = html.match(/<div id=["']ctl00_MainContent_div1["'][\s\S]*?<div id=["']ctl00_MainContent_Panel2["']/i);
  const raw = resultMatches.join("\n") || fallback?.[0] || "";

  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+=["'][^"']*["']/gi, "")
    .replace(/\s(?:src|href)=["'](?!https?:|#)([^"']*)["']/gi, ` href="${baseUrl}$1"`)
    .replace(/\sstyle=["'][^"']*["']/gi, "")
    .replace(/\sclass=["'][^"']*["']/gi, "")
    .trim();
}

function officialContentHtml(html, baseUrl = BHOOMI_URL) {
  const updatePanel = html.match(/<div id=["'][^"']*(?:UpdatePanel1|pnl|Panel|div1|Grid)[^"']*["'][\s\S]*?(?:<\/form>|<nav class=["']navbar navbar-default navbar-fixed-bottom)/i);
  const raw = updatePanel?.[0] || sanitizeResultHtml(html, baseUrl) || "";
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<input\b[^>]*type=["']hidden["'][^>]*>/gi, "")
    .replace(/\son\w+=["'][^"']*["']/gi, "")
    .replace(/\s(?:src|href)=["'](?!https?:|#)([^"']*)["']/gi, ` href="${baseUrl}$1"`)
    .replace(/\sstyle=["'][^"']*["']/gi, "")
    .replace(/\sclass=["'][^"']*["']/gi, "")
    .replace(/\s(id|name)=["'][^"']*["']/gi, "")
    .trim();
}

function visibleText(html) {
  return stripTags(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<option\b[^>]*>/gi, " ")
  );
}

function extractDataRows(html) {
  const rows = [];
  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => stripTags(cell[1]));
    const useful = cells.filter(Boolean);
    if (useful.length >= 2) rows.push(useful);
  }
  return rows.slice(0, 80);
}

function extractAllDataRows(html) {
  const rows = [];
  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => stripTags(cell[1]));
    const useful = cells.filter(Boolean);
    if (useful.length >= 1) rows.push(useful);
  }
  return rows;
}

function summarizeOfficialHtml(html) {
  const text = visibleText(html);
  const rows = extractDataRows(html);
  const hasData = rows.length > 0 || /(owner|mutation|khata|extent|land|cultivator|survey|hissa|transaction|rtc)/i.test(text);
  return {
    hasData,
    text: text.slice(0, 5000),
    rows,
  };
}

function mutationStatusResultText(html) {
  const candidates = [];
  for (const match of html.matchAll(/<(?:span|label|div|td)\b[^>]*(?:id|class)=["'][^"']*(?:lbl|Label|msg|status|Status|result|Result)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|label|div|td)>/gi)) {
    const text = stripTags(match[1]);
    if (/ವಹಿವಾಟಿನ\s*ಸಂಖ್ಯೆ|ಸ್ಥಿತಿ\s*:|Transaction\s*(?:No|Number)\s*:|Status\s*:/i.test(text)) candidates.push(text);
  }
  for (const row of extractAllDataRows(html)) {
    const text = row.join(" ");
    if (/ವಹಿವಾಟಿನ\s*ಸಂಖ್ಯೆ|ಸ್ಥಿತಿ\s*:|Transaction\s*(?:No|Number)\s*:|Status\s*:/i.test(text) && !/Select District|Select Taluk|Select Hobli|Select Village/i.test(text)) {
      candidates.push(text);
    }
  }
  const visible = visibleText(html);
  const focused = visible.match(/(?:ವಹಿವಾಟಿನ\s*ಸಂಖ್ಯೆ\s*:?\s*[^\s,]+\s*,?\s*)?ಸ್ಥಿತಿ\s*:?\s*[^.।]+[.।]?/);
  if (focused) candidates.push(focused[0]);
  const noPending = visible.match(/ಸ್ಥಿತಿ\s*:?\s*ಯಾವುದೇ\s+ಮ್ಯುಟೇಶನ್\s+ಬಾಕಿ\s+ಇರುವುದಿಲ್ಲ[.।]?/);
  if (noPending) candidates.push(noPending[0]);
  return candidates
    .map((value) => value.replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim())
    .find((value) => value && !/Beta Version|Logout|Select District|Select Taluk|Select Village|Surnoc No/i.test(value)) || "";
}

function parseMutationStatusSummary(html) {
  const text = mutationStatusResultText(html);
  const transaction = (text.match(/ವಹಿವಾಟಿನ\s*ಸಂಖ್ಯೆ\s*:?\s*([^\s,]+)/) || text.match(/Transaction\s*(?:No|Number)\s*:?\s*([^\s,]+)/i) || [])[1] || "";
  const statusRaw = (text.match(/ಸ್ಥಿತಿ\s*:?\s*([^]+?)(?=\s*(?:&copy;|©|Disclaimer|BHOOMI MONITORING|All Rights Reserved|Designed|$))/) || text.match(/Status\s*:?\s*([^]+?)(?=\s*(?:&copy;|©|Disclaimer|BHOOMI MONITORING|All Rights Reserved|Designed|$))/i) || [])[1]?.trim() || "";
  const status = statusRaw
    .replace(/&copy;[\s\S]*$/i, "")
    .replace(/©[\s\S]*$/i, "")
    .replace(/BHOOMI MONITORING[\s\S]*$/i, "")
    .replace(/All Rights Reserved[\s\S]*$/i, "")
    .replace(/Beta Version[\s\S]*$/i, "")
    .trim();
  const noPending = /ಯಾವುದೇ\s+ಮ್ಯುಟೇಶನ್\s+ಬಾಕಿ|no\s+mutation\s+pending/i.test(text);
  const rows = [];
  if (transaction || status || noPending) {
    if (transaction) rows.push(["ವಹಿವಾಟಿನ ಸಂಖ್ಯೆ / MR Number", transaction]);
    rows.push(["ಸ್ಥಿತಿ / Status", status || (noPending ? "ಯಾವುದೇ ಮ್ಯುಟೇಶನ್ ಬಾಕಿ ಇರುವುದಿಲ್ಲ" : "-")]);
  }
  return {
    hasData: rows.length > 0,
    text: rows.length ? rows.map((row) => row.join(": ")).join(" | ") : "Mutation status was not returned for this survey.",
    rows: rows.length ? rows : [["ಸ್ಥಿತಿ / Status", "Mutation status was not returned for this survey."]],
  };
}

function parseMutationRegisterSummary(html, values = {}) {
  const summary = summarizeOfficialHtml(html);
  const usefulRows = summary.rows.filter((row) => {
    const joined = row.join(" ");
    return !/BAGALKOTE|BALLARI|BENGALURU|Select District/i.test(joined);
  });
  const headerIndex = usefulRows.findIndex((row) => row.some((cell) => /Survey No/i.test(cell)) && row.some((cell) => /MR Number/i.test(cell)));
  const header = headerIndex >= 0 ? usefulRows[headerIndex] : usefulRows[0] || [];
  const bodyRows = headerIndex >= 0 ? usefulRows.slice(headerIndex + 1) : usefulRows.slice(1);
  const surveyIndex = header.findIndex((cell) => /Survey No/i.test(cell));
  const selectedSurvey = String(values.survey || "").trim();
  const selectedHissa = String(values.hissaLabel || values.hissa || "").trim();
  const filteredRows = bodyRows.filter((row) => {
    const surveyNo = row[surveyIndex] || row.find((cell) => /^\d+\//.test(cell)) || "";
    const parts = surveyNo.split("/");
    if (!selectedSurvey || parts[0] !== selectedSurvey) return false;
    if (!selectedHissa) return true;
    return (parts[2] || "") === selectedHissa;
  });
  const rows = filteredRows.length
    ? [header, ...filteredRows]
    : (header.length ? [header, ["No MR records found for this survey and hissa", ""]] : [["No MR records found for this survey and hissa", ""]]);
  return {
    ...summary,
    hasData: filteredRows.length > 0,
    rows: cleanMrRows(rows),
  };
}

function cleanMrRows(rows) {
  if (!rows.length) return rows;
  const header = rows[0];
  const selectIndex = header.findIndex((cell) => /^(&nbsp;|\s*select\s*)$/i.test(cell));
  if (selectIndex === -1) return rows;
  return rows.map((row) => row.filter((_, index) => index !== selectIndex));
}

function postBackTarget(value = "") {
  const decoded = decodeHtml(value);
  const match = decoded.match(/__doPostBack\(['"]([^'"]+)['"]\s*,\s*['"]([^'"]*)['"]\)/i);
  return match ? { target: match[1], argument: match[2] || "" } : null;
}

function mrRowSelectControl(rowHtml = "") {
  for (const input of rowHtml.matchAll(/<input\b[^>]*>/gi)) {
    const tag = input[0];
    if (!/select/i.test([attr(tag, "value"), attr(tag, "id"), attr(tag, "name")].join(" "))) continue;
    return {
      type: "input",
      name: attr(tag, "name"),
      value: attr(tag, "value") || "Select",
    };
  }
  for (const link of rowHtml.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const text = stripTags(link[2]);
    if (!/select/i.test(text)) continue;
    const postBack = postBackTarget(link[1]);
    if (postBack) return { type: "postback", ...postBack };
  }
  return null;
}

function parseOfficialDate(value = "") {
  const text = normalizeText(value);
  const parts = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (parts) {
    const day = Number(parts[1]);
    const month = Number(parts[2]) - 1;
    const year = Number(parts[3].length === 2 ? `20${parts[3]}` : parts[3]);
    const time = Date.UTC(year, month, day);
    if (Number.isFinite(time)) return time;
  }
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function headerIndex(header = [], pattern) {
  return header.findIndex((cell) => pattern.test(cell || ""));
}

function parseMrDownloadRows(html, values = {}) {
  const tableRows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((match) => ({
      html: match[0],
      cells: [...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => stripTags(cell[1])),
    }))
    .filter((row) => row.cells.some(Boolean));
  const headerIndexValue = tableRows.findIndex((row) => row.cells.some((cell) => /Survey No/i.test(cell)) && row.cells.some((cell) => /MR Number/i.test(cell)));
  if (headerIndexValue < 0) return { header: [], rows: [] };

  const rawHeader = tableRows[headerIndexValue].cells;
  const selectIndex = rawHeader.findIndex((cell) => /^(&nbsp;|\s*select\s*)$/i.test(cell));
  const header = selectIndex >= 0 ? rawHeader.filter((_, index) => index !== selectIndex) : rawHeader;
  const surveyIndex = headerIndex(header, /Survey No/i);
  const hissa = String(values.hissaLabel || values.hissa || "").trim();
  const survey = String(values.survey || "").trim();
  const mrIndex = headerIndex(header, /MR Number/i);
  const dateIndex = headerIndex(header, /Tahsildar.*Approved|Approved.*Date|Approve/i);

  const rows = [];
  for (const tableRow of tableRows.slice(headerIndexValue + 1)) {
    const selectControl = mrRowSelectControl(tableRow.html);
    const cells = selectIndex >= 0 ? tableRow.cells.filter((_, index) => index !== selectIndex) : tableRow.cells;
    if (!cells.some(Boolean) || !selectControl) continue;
    const surveyNo = cells[surveyIndex] || cells.find((cell) => /^\d+\//.test(cell)) || "";
    const surveyParts = surveyNo.split("/");
    if (survey && surveyParts[0] !== survey) continue;
    if (hissa && surveyParts[2] && surveyParts[2] !== hissa) continue;
    const data = Object.fromEntries(header.map((key, index) => [key || `Column ${index + 1}`, cells[index] || ""]));
    const mrNumber = cells[mrIndex] || cells.find((cell) => /\bMR\b|\d+\/\d{4}/i.test(cell)) || "";
    const approvedDate = cells[dateIndex] || "";
    rows.push({
      index: rows.length + 1,
      cells,
      data,
      mrNumber,
      surveyNo,
      approvedDate,
      approvedDateSort: parseOfficialDate(approvedDate),
      selectControl,
    });
  }

  rows.sort((a, b) => a.approvedDateSort - b.approvedDateSort || a.index - b.index);
  return { header, rows };
}

function previewButtonControl(html = "") {
  for (const input of html.matchAll(/<input\b[^>]*>/gi)) {
    const tag = input[0];
    if (/preview/i.test([attr(tag, "value"), attr(tag, "id"), attr(tag, "name")].join(" "))) {
      return { type: "input", name: attr(tag, "name"), value: attr(tag, "value") || "Preview" };
    }
  }
  for (const link of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    if (!/preview/i.test(stripTags(link[2]))) continue;
    const postBack = postBackTarget(link[1]);
    if (postBack) return { type: "postback", ...postBack };
  }
  return { type: "input", name: mutationExtractPreviewButton.name, value: mutationExtractPreviewButton.value };
}

function previewDocumentUrl(html = "", baseUrl = MR_EXTRACT_URL) {
  const openPath = (html.match(/window\.open\(\s*['"]([^'"]+)['"]/i) || [])[1];
  if (openPath) return new URL(decodeHtml(openPath), baseUrl).href;
  const framePath = (html.match(/<iframe\b[^>]*src=["']([^"']+)["']/i) || [])[1];
  if (framePath) return new URL(decodeHtml(framePath), baseUrl).href;
  const pdfPath = (html.match(/<(?:a|embed|object)\b[^>]*(?:href|src|data)=["']([^"']+\.pdf[^"']*)["']/i) || [])[1];
  if (pdfPath) return new URL(decodeHtml(pdfPath), baseUrl).href;
  return "";
}

function previewImageUrls(html = "", baseUrl = MR_EXTRACT_URL) {
  return [...html.matchAll(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => new URL(decodeHtml(match[1]), baseUrl).href)
    .filter((url) => !/logo|banner|captcha|spacer|header/i.test(url));
}

function mrSnapshotFilename(entry, extension = "svg") {
  const name = [entry.mrNumber || `mr-${entry.index}`, entry.approvedDate || ""]
    .join("-")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${name || `mr-${entry.index}`}.${extension}`;
}

function entryValue(entry, patterns = []) {
  for (const [key, value] of Object.entries(entry.data || {})) {
    if (patterns.some((pattern) => pattern.test(key)) && normalizeText(value)) return normalizeText(value);
  }
  for (const value of entry.cells || []) {
    if (patterns.some((pattern) => pattern.test(value)) && normalizeText(value)) return normalizeText(value);
  }
  return "";
}

function mrTransactionNumber(entry) {
  return entryValue(entry, [/transaction/i, /ವಹಿವಾಟು/i, /MLR/i])
    || (entry.cells || []).find((cell) => /[A-Z]{2,}[-/]\d/i.test(cell))
    || "";
}

function mrMutationYear(entry) {
  const explicit = entryValue(entry, [/year/i, /ವರ್ಷ/i]);
  if (/\b(?:19|20)\d{2}\s*-\s*(?:\d{2}|(?:19|20)\d{2})\b/.test(explicit)) return explicit;
  const transaction = mrTransactionNumber(entry);
  const yearPair = transaction.match(/\b((?:19|20)\d{2})[-/](\d{2})\b/);
  if (yearPair) return `${yearPair[1]}-${yearPair[2]}`;
  const dateYear = String(entry.approvedDate || "").match(/\b((?:19|20)\d{2})\b/);
  return dateYear ? `${dateYear[1]}-${String(Number(dateYear[1]) + 1).slice(-2)}` : explicit;
}

function mrSource(entry) {
  return entryValue(entry, [/source/i, /acquisition/i, /register/i, /ಮೂಲ/i, /ಸ್ವಾಧೀನ/i])
    || "-";
}

function mrChangeType(entry) {
  return entryValue(entry, [/mutation\s*type/i, /change/i, /ಬದಲಾವಣೆ/i, /ರೀತಿ|ರೀತಿ/i])
    || entryValue(entry, [/type/i])
    || "-";
}

function compactMrMatrix(entry, values = {}) {
  return [
    ["ಜಿಲ್ಲೆ :", values.districtLabel || values.district || "-", "ವಹಿವಾಟು ವರ್ಷ :", mrMutationYear(entry) || "-", "ಮೂಲ:", mrSource(entry), "ಸಂಖ್ಯೆ :", mrTransactionNumber(entry) || "-"],
    ["ತಾಲ್ಲೂಕು :", values.talukLabel || values.taluk || "-", "ವಹಿವಾಟು ಸಂಖ್ಯೆ :", entry.mrNumber || "-", "ಬದಲಾವಣೆ ರೀತಿ :", mrChangeType(entry), "ದಿನಾಂಕ :", entry.approvedDate || "-"],
    ["ಗ್ರಾಮ :", values.villageLabel || values.village || "-", "-", "-", "-", "-", "-", "-"],
  ];
}

function compactMrFlatRow(entry, values = {}) {
  return [
    values.districtLabel || values.district || "-",
    values.talukLabel || values.taluk || "-",
    values.villageLabel || values.village || "-",
    mrMutationYear(entry) || "-",
    entry.mrNumber || "-",
    mrSource(entry),
    mrTransactionNumber(entry) || "-",
    mrChangeType(entry),
    entry.approvedDate || "-",
  ];
}

function isOfficialMrBlockStart(row = []) {
  const text = row.join(" ");
  return /ಜಿಲ್ಲೆ|District/i.test(text) && /ವಹಿವಾಟು\s*ವರ್ಷ|ವರ್ಷ|Year/i.test(text) && /ಸಂಖ್ಯೆ|Number|No\.?/i.test(text);
}

function officialMrPreviewBlocks(rows = []) {
  const blocks = [];
  for (let index = 0; index < rows.length - 1; index += 1) {
    const first = rows[index] || [];
    const second = rows[index + 1] || [];
    const third = rows[index + 2] || [];
    if (!isOfficialMrBlockStart(first)) continue;
    if (!/ತಾಲ್ಲೂಕು|Taluk/i.test(second.join(" "))) continue;
    const block = [first, second];
    if (/ಗ್ರಾಮ|Village/i.test(third.join(" "))) block.push(third);
    blocks.push(block);
  }
  return blocks;
}

function mrBlockValue(row = [], labelPattern) {
  for (let index = 0; index < row.length; index += 1) {
    if (labelPattern.test(row[index] || "")) return normalizeText(row[index + 1] || "");
  }
  return "";
}

function linkedDocumentFromBlock(block = [], entry = {}) {
  const first = block[0] || [];
  const second = block[1] || [];
  const number = mrBlockValue(first, /ಸಂಖ್ಯೆ|Number|No\.?/i);
  const date = mrBlockValue(second, /ದಿನಾಂಕ|Date/i);
  if (!number || number === "-" || /^\d{4}\s*-\s*\d{2,4}$/.test(number)) return null;
  return {
    mrNumber: entry.mrNumber || "",
    mrDate: entry.approvedDate || "",
    documentNumber: number,
    documentDate: date && date !== "-" ? date : "",
  };
}

function linkedDocumentBlocks(rows = [], entry = {}) {
  const blocks = officialMrPreviewBlocks(rows);
  const linked = blocks
    .map((block) => ({ block, document: linkedDocumentFromBlock(block, entry) }))
    .filter((item) => item.document);
  return linked.length ? linked : blocks.slice(0, 1).map((block) => ({ block, document: null }));
}

function officialMrRowEntries(html = "") {
  return [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((match) => ({
      html: match[0],
      cells: [...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => stripTags(cell[1])),
    }))
    .filter((row) => row.cells.some(Boolean));
}

function linkedDocumentRowBlocksFromHtml(html = "", entry = {}) {
  const entries = officialMrRowEntries(html);
  const blocks = [];
  for (let index = 0; index < entries.length - 1; index += 1) {
    const first = entries[index];
    const second = entries[index + 1];
    const third = entries[index + 2];
    if (!isOfficialMrBlockStart(first.cells)) continue;
    if (!/ತಾಲ್ಲೂಕು|Taluk/i.test(second.cells.join(" "))) continue;
    const rowEntries = [first, second];
    if (/ಗ್ರಾಮ|Village/i.test((third?.cells || []).join(" "))) rowEntries.push(third);
    const document = linkedDocumentFromBlock(rowEntries.map((row) => row.cells), entry);
    if (document) blocks.push({ rowHtml: rowEntries.map((row) => row.html), document });
  }
  if (blocks.length) return blocks;
  const firstBlock = officialMrPreviewBlocks(entries.map((row) => row.cells))[0];
  if (!firstBlock) return [];
  const start = entries.findIndex((row) => row.cells === firstBlock[0] || row.cells.join("\u0000") === firstBlock[0].join("\u0000"));
  return start >= 0 ? [{ rowHtml: entries.slice(start, start + firstBlock.length).map((row) => row.html), document: null }] : [];
}

async function chromium() {
  if (!playwrightChromiumPromise) {
    playwrightChromiumPromise = import(PLAYWRIGHT_MODULE_URL).then((module) => module.chromium);
  }
  return playwrightChromiumPromise;
}

function browserLaunchOptions() {
  return {
    headless: true,
    ...(CHROME_EXECUTABLE_PATH ? { executablePath: CHROME_EXECUTABLE_PATH } : {}),
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  };
}

function officialMrImageHtml(rowHtml = [], title = "") {
  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          html, body { margin: 0; background: #fff; color: #263441; font-family: Arial, "Noto Sans Kannada", "Noto Sans", sans-serif; }
          .capture { display: inline-block; padding: 20px; background: #fff; }
          h1 { margin: 0 0 10px; color: #102a56; font-size: 25px; line-height: 1.2; }
          table { border-collapse: collapse; table-layout: fixed; width: 1500px; background: #fff; }
          td, th { border: 1px solid #d8e1e6; padding: 16px 18px; min-width: 150px; font-size: 22px; line-height: 1.25; vertical-align: middle; }
          td:nth-child(odd), th:nth-child(odd) { background: #f6f8fa; font-weight: 800; }
          td:nth-child(even), th:nth-child(even) { font-weight: 650; }
        </style>
      </head>
      <body>
        <main class="capture">
          <h1>${xmlEscape(title)}</h1>
          <table><tbody>${rowHtml.join("\n")}</tbody></table>
        </main>
      </body>
    </html>`;
}

function htmlBody(html = "") {
  return (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i) || [])[1] || html;
}

function htmlHead(html = "") {
  return (html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i) || [])[1] || "";
}

function officialMrFullImageHtml(html = "", baseUrl = MR_EXTRACT_URL) {
  const head = htmlHead(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<base\b[^>]*>/gi, "");
  const body = htmlBody(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<input\b[^>]*type=["']hidden["'][^>]*>/gi, "")
    .replace(/\son\w+=["'][^"']*["']/gi, "");
  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <base href="${xmlEscape(baseUrl)}">
        ${head}
        <style>
          html, body { margin: 0 !important; background: #fff !important; }
          .capture { display: inline-block; padding: 8px; background: #fff; color: #111; }
          .capture input, .capture select, .capture button, .capture nav, .capture .navbar, .capture .btn, .capture .form-control { display: none !important; }
          .capture table { max-width: none; }
          .capture img { max-width: none; }
        </style>
      </head>
      <body><main class="capture">${body}</main></body>
    </html>`;
}

async function storeHtmlScreenshot(html, filename) {
  const browserType = await chromium();
  const browser = await browserType.launch(browserLaunchOptions());
  try {
    const page = await browser.newPage({ viewport: { width: 2400, height: 1200 }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "load" });
    const buffer = await page.locator(".capture").screenshot();
    return storeDocument(buffer, "image/png", filename.replace(/\.svg$/i, ".png"));
  } finally {
    await browser.close();
  }
}

function safePdfFilename(filename = "") {
  const safe = String(filename || "")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .replace(/^-|-$/g, "")
    .slice(0, 140);
  return safe && safe.endsWith(".pdf") ? safe : `${safe || "SriSatVam_Land_Report"}.pdf`;
}

async function renderHtmlPdf(html = "", filename = "SriSatVam_Land_Report.pdf") {
  const browserType = await chromium();
  const browser = await browserType.launch(browserLaunchOptions());
  try {
    const css = await readFile(join(PUBLIC_DIR, "styles.css"), "utf8");
    const page = await browser.newPage();
    const baseUrl = `http://${HOST}:${PORT}/`;
    const documentHtml = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <base href="${xmlEscape(baseUrl)}">
          <style>${css}</style>
          <style>
            body { background: #fff !important; font-family: "Noto Sans Kannada", "Lohit Kannada", Arial, sans-serif !important; }
            .autogen-download-action, .report-actions, .service-tabs { display: none !important; }
            .print-document { width: 100%; }
            img, .report-image, .current-rtc-page, .mr-extract-page, .rtc-crop-frame img { display: block !important; }
          </style>
        </head>
        <body class="pdf-render print-mode">
          <main class="print-output" style="display:block">${html}</main>
        </body>
      </html>`;
    await page.setContent(documentHtml, { waitUntil: "networkidle", timeout: 120000 });
    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      margin: { top: "9mm", right: "9mm", bottom: "16mm", left: "9mm" },
      headerTemplate: "<div></div>",
      footerTemplate: `
        <div style="width:100%;font-size:8px;color:#555;text-align:center;padding:0 9mm;">
          Reserved rights @ Sri SatVam Developers | 78878 58858 | sales@srisatvam.com
        </div>`,
    });
    return {
      filename: safePdfFilename(filename),
      downloadUrl: storeDocument(buffer, "application/pdf", safePdfFilename(filename)),
    };
  } finally {
    await browser.close();
  }
}

async function storeMrPreviewDocument(working, entry, previewHtml, previewUrl) {
  const documentUrl = previewDocumentUrl(previewHtml, previewUrl || MR_EXTRACT_URL);
  const htmlToUse = documentUrl && !/\.pdf(?:$|\?)/i.test(documentUrl)
    ? await fetchOfficialText(working, documentUrl, MR_EXTRACT_URL)
    : previewHtml;
  const baseUrl = documentUrl || previewUrl || MR_EXTRACT_URL;
  const unavailableMessage = "Details Not Available or Not able to fetch MR";
  const previewText = visibleText(htmlToUse);

  if (/Details\s+Not\s+Available|No\s+Details\s+Available|Details\s+are\s+not\s+available/i.test(previewText)) {
    return {
      text: unavailableMessage,
      attachmentError: unavailableMessage,
      linkDocuments: [],
    };
  }

  if (documentUrl && /\.pdf(?:$|\?)/i.test(documentUrl)) {
    const response = await officialFetch(documentUrl, {
      headers: { cookie: working.cookie, referer: MR_EXTRACT_URL },
      timeoutMs: 30000,
    }, "MR preview PDF");
    if (!response.ok) throw new Error(`MR PDF returned HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const stored = await storePdfWithPreview(buffer, mrSnapshotFilename(entry, "pdf"));
    return { ...stored, text: "Official MR PDF preview fetched." };
  }

  const imageUrl = previewImageUrls(htmlToUse, baseUrl)[0];
  if (imageUrl) {
    const response = await officialFetch(imageUrl, {
      headers: { cookie: working.cookie, referer: baseUrl },
      timeoutMs: 30000,
    }, "MR preview image");
    if (!response.ok) throw new Error(`MR image returned HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") || "image/png";
    const extension = /jpeg|jpg/i.test(contentType) ? "jpg" : "png";
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    return {
      imageUrl: storeDocument(imageBuffer, contentType, mrSnapshotFilename(entry, extension)),
      text: "Official MR preview image fetched.",
    };
  }

  const rows = extractAllDataRows(htmlToUse).filter((row) => {
    const text = row.join(" ");
    return !/Select District|Select Taluk|BHOOMI MONITORING|Logout|Designed/i.test(text);
  });
  const linkedBlocks = linkedDocumentBlocks(rows, entry);
  const htmlBlocks = linkedDocumentRowBlocksFromHtml(htmlToUse, entry);
  try {
    const imageUrl = await storeHtmlScreenshot(
      officialMrFullImageHtml(htmlToUse, baseUrl),
      mrSnapshotFilename(entry, "png"),
    );
    return {
      imageUrl,
      text: "Official MR extract image captured from Service11 preview page.",
      linkDocuments: (htmlBlocks.length ? htmlBlocks.map((item) => item.document) : linkedBlocks.map((item) => item.document)).filter(Boolean),
    };
  } catch {
    // The MR Downloader should show the official MR preview only. If capture fails,
    // show a clear unavailable state instead of a generated table image.
  }
  return {
    text: unavailableMessage,
    attachmentError: unavailableMessage,
    linkDocuments: linkedBlocks.map((item) => item.document).filter(Boolean),
  };
}

async function fetchMrPreviewRecord(baseSession, values, entry) {
  const working = {
    ...baseSession,
    id: randomUUID(),
    html: baseSession.html,
    cookie: baseSession.cookie,
    updatedAt: Date.now(),
  };
  const selectForm = buildForm(working, values, "", mutationExtractFields);
  if (entry.selectControl.type === "postback") {
    selectForm.set("__EVENTTARGET", entry.selectControl.target);
    selectForm.set("__EVENTARGUMENT", entry.selectControl.argument || "");
  } else if (entry.selectControl.name) {
    selectForm.set(entry.selectControl.name, entry.selectControl.value || "Select");
  }
  await fetchOfficial(working, selectForm, MR_EXTRACT_URL);

  const preview = previewButtonControl(working.html);
  const previewForm = buildForm(working, values, "", mutationExtractFields);
  if (preview.type === "postback") {
    previewForm.set("__EVENTTARGET", preview.target);
    previewForm.set("__EVENTARGUMENT", preview.argument || "");
  } else {
    previewForm.set(preview.name, preview.value || "Preview");
  }
  await fetchOfficial(working, previewForm, MR_EXTRACT_URL);

  const stored = await storeMrPreviewDocument(working, entry, working.html, MR_EXTRACT_URL);
  return {
    label: `Official MR Extract - MR ${entry.mrNumber || entry.index}${entry.approvedDate ? ` - ${entry.approvedDate}` : ""}`,
    mrNumber: entry.mrNumber,
    approvedDate: entry.approvedDate,
    linkDocuments: stored.linkDocuments || [],
    summary: {
      hasData: true,
      text: stored.text,
      rows: [
        ["MR Number", entry.mrNumber || "-"],
        ["Survey No", entry.surveyNo || "-"],
        ["Tahsildar Approved Date", entry.approvedDate || "-"],
        ["Preview", stored.text],
      ],
    },
    imageUrl: stored.imageUrl,
    imageClass: "mr-extract-page",
    pdfUrl: stored.pdfUrl,
    filename: mrSnapshotFilename(entry, "pdf"),
    attachmentError: stored.attachmentError,
  };
}

async function fetchMrDownloaderReport(values) {
  const session = await createServiceSession(MR_EXTRACT_URL, new URLSearchParams({ UserName: "" }));
  const selected = await prepareSurveyFlow(session, mutationExtractFields, values, {});
  const form = buildForm(session, { ...values, ...selected }, "", mutationExtractFields);
  form.set(mutationExtractButtons.fetch.name, mutationExtractButtons.fetch.value);
  await fetchOfficial(session, form, MR_EXTRACT_URL);

  const parsed = parseMrDownloadRows(session.html, values);
  const tableRows = parsed.rows.map((row) => row.cells);
  const records = [];
  for (const entry of parsed.rows) {
    try {
      records.push(await fetchMrPreviewRecord(session, { ...values, ...selected }, entry));
    } catch (error) {
      records.push({
        label: `Official MR Extract - MR ${entry.mrNumber || entry.index}${entry.approvedDate ? ` - ${entry.approvedDate}` : ""}`,
        mrNumber: entry.mrNumber,
        approvedDate: entry.approvedDate,
        linkDocuments: [],
        summary: {
          hasData: false,
          text: `Could not fetch MR preview: ${error.message}`,
          rows: [
            ["MR Number", entry.mrNumber || "-"],
            ["Survey No", entry.surveyNo || "-"],
            ["Tahsildar Approved Date", entry.approvedDate || "-"],
            ["Fetch Status", `Could not fetch MR preview: ${error.message}`],
          ],
        },
        imageClass: "mr-extract-page",
        attachmentError: "Details Not Available or Not able to fetch MR",
      });
    }
  }
  const linkDocuments = records.flatMap((record) => record.linkDocuments || []);

  return {
    generatedAt: new Date().toISOString(),
    overview: {
      district: values.districtLabel || values.district || "",
      taluk: values.talukLabel || values.taluk || "",
      hobli: values.hobliLabel || values.hobli || "",
      village: values.villageLabel || values.village || "",
      survey: values.survey || "",
      surnoc: values.surnocLabel || values.surnoc || "",
      hissa: values.hissaLabel || values.hissa || "",
    },
    table: {
      header: parsed.header,
      rows: tableRows,
    },
    records,
    linkDocuments,
    failures: records.filter((record) => !record.summary?.hasData).map((record) => ({
      mrNumber: record.mrNumber,
      approvedDate: record.approvedDate,
      message: record.summary?.text || "Could not fetch MR preview",
    })),
  };
}

function parseKhathaSummary(html) {
  const summary = summarizeOfficialHtml(html);
  const rows = summary.rows.filter((row) => {
    const joined = row.join(" ");
    return !/Select District|BAGALKOTE|BALLARI|BENGALURU/i.test(joined);
  });
  const text = visibleText(html);
  const hasNoRecords = /No\s+Khatha\s+records\s+found|No\s+Khata\s+records\s+found/i.test(text) || rows.some((row) => /No\s+Khatha\s+records\s+found|No\s+Khata\s+records\s+found/i.test(row.join(" ")));
  return {
    hasData: !hasNoRecords && rows.length > 0,
    text: text.slice(0, 1400),
    rows: (!hasNoRecords && rows.length) ? rows : [["No Khatha records found for this survey", ""]],
  };
}

function parseKhathaByNumberSummary(html, khathaNumber) {
  const rows = extractDataRows(html).filter((row) => {
    const joined = row.join(" ");
    return !/Select District|ಜಿಲ್ಲೆಯ ಆಯ್ಕೆ|Select Taluk|ತಾಲ್ಲೂಕಿನ ಆಯ್ಕೆ|Select Hobli|ಹೋಬಳಿಯ ಆಯ್ಕೆ|Select Village|ಗ್ರಾಮದ ಆಯ್ಕೆ/i.test(joined);
  });
  const text = visibleText(html);
  const hasNoRecords = /No\s+Khatha\s+records\s+found|No\s+Khata\s+records\s+found|No\s+records/i.test(text);
  return {
    hasData: !hasNoRecords && rows.length > 1,
    text: text.slice(0, 3000),
    rows: (!hasNoRecords && rows.length) ? rows : [["Status", `No Khatha details returned for Khatha ${khathaNumber}`]],
  };
}

function khathaNumberFromSummary(summary) {
  if (!summary.hasData) return "";
  const flatRows = (summary.rows || []).flat();
  const headerRowIndex = (summary.rows || []).findIndex((row) => row.some((cell) => /khata|khatha|ಖಾತ|ಖತಾ/i.test(cell)));
  if (headerRowIndex >= 0 && summary.rows[headerRowIndex + 1]) {
    const header = summary.rows[headerRowIndex];
    const value = cleanKhathaNumber(summary.rows[headerRowIndex + 1][header.findIndex((cell) => /khata|khatha|ಖಾತ|ಖತಾ/i.test(cell))]);
    if (isLikelyKhathaNumber(value)) return value;
  }
  const text = [summary.text, ...flatRows].join(" ");
  const value = cleanKhathaNumber((text.match(/(?:Khata|Khatha|Katha|ಖಾತ|ಖತಾ)\s*(?:No|Number|ಸಂಖ್ಯೆ)?\s*:?\s*([A-Za-z0-9/-]+)/i) || [])[1] || "");
  return isLikelyKhathaNumber(value) ? value : "";
}

const bilingualFields = {
  khata: [/khata?h?|katha/i, /ಖಾತ|ಖತಾ/],
  possession: [/acqui?sition|possession|holding/i, /ಕಬ್ಜೆ|ಸ್ವಾಧೀನ/],
  rights: [/other\s*rights|rights/i, /ಇತರೆ\s*ಹಕ್ಕು|ಹಕ್ಕುಗಳು/],
  liabilities: [/liabil|loan|encumbrance|charge/i, /ಋಣ|ಭಾರ|ಸಾಲ/],
  extent: [/land\s*extent|total\s*extent|extent/i, /ಜಮೀನಿನ\s*ವಿಸ್ತೀರ್ಣ|ವಿಸ್ತೀರ್ಣ/],
};

function matchesAny(value, patterns) {
  const text = String(value ?? "").trim();
  return Boolean(text) && patterns.some((pattern) => pattern.test(text));
}

function meaningfulValue(value) {
  const text = String(value ?? "").trim();
  return text && text !== "-";
}

function firstObjectValue(row, patterns, fallbackKeys = []) {
  for (const key of fallbackKeys) {
    if (meaningfulValue(row?.[key])) return row[key];
  }
  for (const [key, value] of Object.entries(row || {})) {
    if (meaningfulValue(value) && matchesAny(key, patterns)) {
      return value;
    }
  }
  return "";
}

function firstRowValue(rows, patterns) {
  for (let rowIndex = 0; rowIndex < (rows || []).length; rowIndex += 1) {
    const row = rows[rowIndex] || [];
    for (let cellIndex = 0; cellIndex < row.length; cellIndex += 1) {
      if (!matchesAny(row[cellIndex], patterns)) continue;
      const inlineValue = row[cellIndex + 1];
      if (row.length <= 3 && cellIndex === 0) {
        if (meaningfulValue(inlineValue) && !matchesAny(inlineValue, patterns)) return inlineValue;
        continue;
      }
      const nextRowValue = rows[rowIndex + 1]?.[cellIndex];
      if (meaningfulValue(nextRowValue)) return nextRowValue;
    }
  }
  return "";
}

function firstTextValue(text, patterns) {
  const label = patterns.map((pattern) => pattern.source).join("|");
  const match = String(text || "").match(new RegExp(`(?:${label})\\s*(?:ನಂ|ಸಂಖ್ಯೆ|No|Number)?\\s*(?::|-)\\s*([^\\n:|]+?)(?=\\s{2,}|\\s+(?:Khata|Khatha|Katha|Owner|Extent|Rights|Liabilities|Acquisition|Possession|ಖಾತ|ಕಬ್ಜೆ|ಸ್ವಾಧೀನ|ಇತರೆ|ಋಣ)|$)`, "i"));
  return match?.[1]?.trim() || "";
}

function firstSummaryValue(records, patterns) {
  for (const record of records || []) {
    const fromRows = firstRowValue(record.summary?.rows || [], patterns);
    if (fromRows) return fromRows;
    const fromText = firstTextValue(record.summary?.text || "", patterns);
    if (fromText) return fromText;
  }
  return "";
}

function xmlEscape(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlEscape(value = "") {
  return xmlEscape(value).replace(/'/g, "&#39;");
}

function wrapSvgText(value, maxChars = 42) {
  const words = String(value ?? "-").replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
    } else if ((current + " " + word).length <= maxChars) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines.slice(0, 3) : ["-"];
}

function firstJsonPayload(text = "") {
  const value = String(text || "").trim();
  const start = value.search(/[[{"]/);
  if (start < 0) return value;
  const source = value.slice(start);
  const opener = source[0];
  const closer = opener === "{" ? "}" : opener === "[" ? "]" : "\"";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === "\"") inString = false;
      continue;
    }
    if (char === "\"") {
      inString = true;
      if (opener === "\"" && index > 0) return source.slice(0, index + 1);
      continue;
    }
    if (char === opener && opener !== "\"") depth += 1;
    if (char === closer && opener !== "\"") {
      depth -= 1;
      if (depth === 0) return source.slice(0, index + 1);
    }
  }
  return source;
}

function normalizedOfficialJsonText(text = "") {
  return String(text || "")
    .replace(/:\s*nodata(?=\s*[,}])/gi, ':"nodata"')
    .replace(/:\s*undefined(?=\s*[,}])/gi, ":null");
}

function parseOfficialJson(text) {
  const normalized = normalizedOfficialJsonText(text);
  try {
    const parsed = JSON.parse(normalized);
    return typeof parsed === "string" ? parseOfficialJson(parsed) : parsed;
  } catch (error) {
    if (/\bnodata\b/i.test(normalized)) return { data: "nodata", parseWarning: error.message };
    const payload = firstJsonPayload(normalized);
    if (payload && payload !== normalized) {
      const parsed = JSON.parse(payload);
      return typeof parsed === "string" ? parseOfficialJson(parsed) : parsed;
    }
    throw error;
  }
}

async function fetchAkarbandJson(path, payload = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    form.set(key, String(value ?? ""));
  }
  const response = await officialFetch(`${AKARBAND_API_URL}/${path}`, {
    method: "POST",
    headers: {
      referer: `${AKARBAND_BASE_URL}/service39/`,
    },
    body: form,
  }, "Akarband service");
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Akarband service returned HTTP ${response.status}`);
  }
  return parseOfficialJson(text || "{}");
}

async function fetchEchawadiJson(path, payload = {}) {
  const response = await officialFetch(`${ECHAWADI_API_URL}/${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      referer: `${ECHAWADI_BASE_URL}/echawadi/`,
    },
    body: JSON.stringify(payload),
  }, "eChawadi service");
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`eChawadi service returned HTTP ${response.status}`);
  }
  if (!text || text === "\"\"" || text === "null") return null;
  return parseOfficialJson(text);
}

async function fetchAdvancedRtcJson(path, payload = {}) {
  const response = await officialFetch(`${ADVANCED_RTC_API_URL}/${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      referer: "https://landrecords.karnataka.gov.in/service53/RTC",
    },
    body: JSON.stringify(payload),
  }, "Advanced RTC service");
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Advanced RTC service returned HTTP ${response.status}`);
  }
  const parsed = parseOfficialJson(text || "{}");
  return typeof parsed.d === "string" ? JSON.parse(parsed.d) : parsed.d;
}

function normalizePlace(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLowerCase();
}

function numberString(value = "") {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  const number = Number(normalized);
  return Number.isFinite(number) ? String(number) : normalized;
}

function surveyText(row) {
  return [
    row.SurveyNumbers,
    row.SurveyNo,
    row.Survey_no,
    row.survey_no,
    row.LND_SYNO,
    row.LND_SRNOC,
    row.LND_HISSA,
  ].filter((value) => value !== undefined && value !== null).join(" ");
}

function rowMatchesSurvey(row, values) {
  const selectedSurvey = String(values.survey || "").trim();
  if (!selectedSurvey) return false;
  const text = surveyText(row);
  if (!text) return false;
  const directFields = [row.Survey_no, row.LND_SYNO, row.survey_no].filter((value) => value !== undefined && value !== null);
  if (directFields.some((value) => String(value).trim() === selectedSurvey || String(value).trim().split("/")[0] === selectedSurvey)) return true;
  return new RegExp(`(^|[^0-9])${selectedSurvey}\\s*(?:/|,|$)`).test(String(text));
}

function compactRows(rows, values, mapper) {
  const seen = new Set();
  const uniqueRows = rows.filter((row) => {
    const key = JSON.stringify(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const mapped = uniqueRows.map((row) => {
    const valuesRow = mapper(row).map((value) => value ?? "");
    return [rowMatchesSurvey(row, values) ? "YES" : "", ...valuesRow];
  });
  return mapped.sort((a, b) => {
    if (a[0] === "YES" && b[0] !== "YES") return -1;
    if (a[0] !== "YES" && b[0] === "YES") return 1;
    return 0;
  });
}

function eChawadiSummary(label, rows, values, headers, mapper) {
  const matchingRows = rows.filter((row) => rowMatchesSurvey(row, values));
  const body = compactRows(matchingRows, values, mapper);
  return {
    label,
    summary: {
      hasData: body.length > 0,
      text: body.length ? `${body.length} matching item(s) found` : "No matching records found",
      rows: body.length ? [["Survey Match", ...headers], ...body] : [["Status", "No matching records found for selected survey"]],
    },
  };
}

function rowField(row = {}, keys = []) {
  const entries = Object.entries(row);
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim()) return String(row[key]).trim();
    const found = entries.find(([entryKey, value]) => entryKey.toLowerCase() === String(key).toLowerCase() && value !== undefined && value !== null && String(value).trim());
    if (found) return String(found[1]).trim();
  }
  return "";
}

function tableCellText(cell = "") {
  if (cell && typeof cell === "object") return normalizeText(cell.text || cell.label || cell.url || "");
  return normalizeText(cell);
}

function uniqueTableRows(rows = [], mapper) {
  const seen = new Set();
  return rows.map(mapper).filter((row) => {
    const normalized = row.map((cell) => tableCellText(cell)).join("|");
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function rowFieldByPattern(row = {}, patterns = []) {
  for (const [key, value] of Object.entries(row || {})) {
    if (value === undefined || value === null || !String(value).trim()) continue;
    if (patterns.some((pattern) => pattern.test(key))) return String(value).trim();
  }
  return "";
}

function mutationLinkCell(row = {}, label = "", patterns = []) {
  const url = rowFieldByPattern(row, patterns.filter((pattern) => /url|link|href|path|form/i.test(pattern.source)));
  const text = rowFieldByPattern(row, patterns) || (url ? label : "");
  if (/^https?:\/\//i.test(url)) return { text: text || label, url };
  if (/^\/\//.test(url)) return { text: text || label, url: `https:${url}` };
  if (/^\//.test(url)) return { text: text || label, url: `${ECHAWADI_BASE_URL}${url}` };
  return text || "";
}

function dailyMutationTableRow(row = {}) {
  return [
    rowField(row, ["MRNumber", "MR_Number", "MR No", "MRNo"]),
    rowField(row, ["TypeofTransaction", "TransactionType", "Transaction"]),
    rowField(row, ["SurveyNumbers", "SurveyNo", "Survey_no", "survey_no"]),
    rowField(row, ["applicant", "ApplicantName", "Applicant"]),
    rowField(row, ["Seller", "seller", "SellerName", "seller_name", "FromOwner", "From_Owner", "Vendor"]),
    rowField(row, ["Buyer", "buyer", "BuyerName", "buyer_name", "ToOwner", "To_Owner", "Purchaser"]),
    rowField(row, ["AcquisitionType", "Acquisition"]),
    rowField(row, ["status", "Status", "MutationStatus"]),
    mutationLinkCell(row, "Open Form-12", [/form.?12/i, /form.?xii/i, /form12/i]),
    mutationLinkCell(row, "Open Form-21", [/form.?21/i, /form.?xxi/i, /form21/i]),
  ];
}

function villageScanTable(id, title, rows, header, mapper) {
  const body = uniqueTableRows(rows, mapper);
  return {
    id,
    title,
    header,
    rows: body,
    count: body.length,
  };
}

function normalizeOwnerName(value = "") {
  return normalizeText(value)
    .replace(/\b(?:s\/o|d\/o|w\/o|c\/o|son\s+of|daughter\s+of|wife\s+of)\b\.?/gi, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function namesMatch(left = "", right = "") {
  const a = normalizeOwnerName(left);
  const b = normalizeOwnerName(right);
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  const aParts = new Set(a.split(" ").filter((part) => part.length > 1));
  const bParts = b.split(" ").filter((part) => part.length > 1);
  return bParts.length > 0 && bParts.every((part) => aParts.has(part));
}

function rowContainsSelectedSurvey(row = [], values = {}) {
  const survey = String(values.survey || "").trim();
  if (!survey) return false;
  const text = row.join(" ");
  const escaped = survey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^0-9])${escaped}\\s*(?:/|,|\\s|$)`).test(text);
}

function matchingHeaderIndex(headers = [], patterns = []) {
  return headers.findIndex((header) => patterns.some((pattern) => pattern.test(header)));
}

function khathaMatchingRows(summary, values) {
  const rows = summary?.rows || [];
  const headerRow = rows.find((row) => (
    row.some((cell) => /survey|ಸರ್ವೆ|ಸ\.ನಂ|ಸ ನಂ/i.test(cell))
      && row.some((cell) => /owner|ಹೆಸರು|ಖಾತೆದಾರ|ಹಕ್ಕುದಾರ/i.test(cell))
  )) || [];
  const surveyIndex = matchingHeaderIndex(headerRow, [/survey|ಸರ್ವೆ|ಸ\.ನಂ|ಸ ನಂ/i]);
  const ownerIndex = matchingHeaderIndex(headerRow, [/owner|ಹೆಸರು|ಖಾತೆದಾರ|ಹಕ್ಕುದಾರ/i]);
  const khathaIndex = matchingHeaderIndex(headerRow, [/khata|khatha|katha|ಖಾತ|ಖತಾ/i]);
  const extentIndex = matchingHeaderIndex(headerRow, [/extent|ವಿಸ್ತೀರ್ಣ|area/i]);
  const statusIndex = matchingHeaderIndex(headerRow, [/status|ಸ್ಥಿತಿ/i]);

  const candidates = rows.filter((row) => rowContainsSelectedSurvey(row, values));
  return candidates.map((row) => ({
    survey: surveyIndex >= 0 ? row[surveyIndex] : (row.find((cell) => rowContainsSelectedSurvey([cell], values)) || values.survey || ""),
    khathaNumber: khathaIndex >= 0 ? row[khathaIndex] : firstRowValue([row], bilingualFields.khata),
    owner: ownerIndex >= 0 ? row[ownerIndex] : "",
    extent: extentIndex >= 0 ? row[extentIndex] : "",
    status: statusIndex >= 0 ? row[statusIndex] : "",
    sourceRow: row,
  }));
}

function kathaValidationComparison(values, currentRtcSection, khathaSection, khathaByNumberRecord, khathaNumber) {
  const rtcRows = currentRtcSection?.rtcRows || [];
  const rtcOwners = uniq(rtcRows.flatMap((row) => row.owners || []).map(normalizeText).filter(Boolean));
  const khathaMatches = khathaMatchingRows(khathaByNumberRecord?.summary, values);
  const khathaOwners = uniq(khathaMatches.map((row) => normalizeText(row.owner)).filter(Boolean));
  const matchedPairs = [];
  const mismatches = [];

  for (const rtcOwner of rtcOwners) {
    const match = khathaOwners.find((khathaOwner) => namesMatch(rtcOwner, khathaOwner));
    if (match) matchedPairs.push([rtcOwner, match]);
    else mismatches.push([rtcOwner, khathaOwners.join("; ") || "No matching survey owner found in Khatha details"]);
  }
  const status = rtcOwners.length && khathaOwners.length && mismatches.length === 0
    ? "Owner details matched"
    : "Owner name mismatch";

  return {
    status,
    khathaNumber,
    rtcOwners,
    khathaOwners,
    matchedPairs,
    mismatches,
    surveyRows: khathaMatches,
    records: [
      {
        label: "Katha Validation Result",
        summary: {
          hasData: Boolean(rtcOwners.length || khathaOwners.length),
          text: status,
          rows: [
            ["Check", "Result"],
            ["Selected Survey", [values.survey, values.surnocLabel || values.surnoc, values.hissaLabel || values.hissa].filter(Boolean).join(" / ") || "-"],
            ["Khatha Number", khathaNumber || "Not found"],
            ["RTC Owners", rtcOwners.join("; ") || "Not found"],
            ["Matching Khatha Owners", khathaOwners.join("; ") || "Not found for selected survey"],
            ["Validation", status],
          ],
        },
      },
      {
        label: "Owner Name Comparison",
        summary: {
          hasData: Boolean(rtcOwners.length || khathaOwners.length),
          text: mismatches.length ? "Owner name mismatch found." : "Owner details matched.",
          rows: [
            ["RTC Owner", "Khatha Owner", "Status"],
            ...matchedPairs.map(([rtcOwner, khathaOwner]) => [rtcOwner, khathaOwner, "Owner details matched"]),
            ...mismatches.map(([rtcOwner, khathaOwner]) => [rtcOwner, khathaOwner, "Owner name mismatch"]),
          ],
        },
      },
      {
        label: "Khatha Survey Matching Entries",
        summary: {
          hasData: khathaMatches.length > 0,
          text: khathaMatches.length ? `${khathaMatches.length} Khatha row(s) matched selected survey.` : "No Khatha rows matched selected survey.",
          rows: khathaMatches.length
            ? [["Survey", "Khatha Number", "Owner", "Extent", "Status"], ...khathaMatches.map((row) => [
              row.survey || "-",
              row.khathaNumber || khathaNumber || "-",
              row.owner || "-",
              row.extent || "-",
              row.status || "-",
            ])]
            : [["Status", "No matching survey row found in Khatha details"]],
        },
      },
      ...(khathaByNumberRecord ? [khathaByNumberRecord] : []),
      ...((khathaSection?.records || []).filter((record) => record !== khathaByNumberRecord)),
    ],
  };
}

function selectedSurveyParts(values) {
  return {
    survey: String(values.survey || "").trim(),
    surnoc: String(values.surnocLabel || values.surnoc || "").trim(),
    hissa: String(values.hissaLabel || values.hissa || "").trim(),
  };
}

function surveyPartMatches(actual, selected) {
  if (!selected) return true;
  return String(actual ?? "").trim() === selected;
}

function advancedOwnerRows(details, values) {
  const selected = selectedSurveyParts(values);
  return (details || []).filter((row) => (
    surveyPartMatches(row.survey_no, selected.survey)
      && surveyPartMatches(row.surnoc, selected.surnoc)
      && surveyPartMatches(row.hissa_no, selected.hissa)
  ));
}

function rowsFromObjects(objects, headers, mapper) {
  const body = (objects || []).map((item) => mapper(item).map((value) => value ?? ""));
  return body.length ? [headers, ...body] : [["Status", "No details returned"]];
}

function advancedKhathaNumberFromBlock(block) {
  const ownerNumbers = (block?.ownerdetails || [])
    .map((row) => firstObjectValue(row, bilingualFields.khata, ["Khatanumber", "KhataNumber", "KhataNo", "KhathaNumber"]))
    .map(cleanKhathaNumber)
    .filter(isLikelyKhathaNumber);
  return uniq(ownerNumbers).join(", ");
}

function advancedRecordsFromRtcData(rtcData, ownerRows) {
  const block = Array.isArray(rtcData) ? rtcData.find(Boolean) : null;
  const records = [
    {
      label: "Service53 survey owner records",
      summary: {
        hasData: ownerRows.length > 0,
        text: ownerRows.length ? `${ownerRows.length} matching owner record(s)` : "No matching owner records returned",
        rows: rowsFromObjects(ownerRows, ["Owner", "Survey", "Surnoc", "Hissa", "Land Code", "Owner Nos"], (row) => [
          row.owner,
          row.survey_no,
          row.surnoc,
          row.hissa_no,
          row.land_code,
          [row.main_owner_no, row.owner_no].filter(Boolean).join(" / "),
        ]),
      },
    },
  ];

  if (!block) {
    records.push({
      label: "Advanced RTC detail status",
      summary: {
        hasData: false,
        text: "The official Service53 RTC detail service did not return extended fields for this selection.",
        rows: [["Status", "Advanced RTC details were not returned by the official service"]],
      },
    });
    return records;
  }

  records.push({
    label: "ಜಮೀನಿನ ವಿಸ್ತೀರ್ಣ / Land extent and revenue",
    summary: {
      hasData: Boolean(block.landdetails?.length),
      text: "Land extent, revenue, kharab, soil, and patta details",
      rows: rowsFromObjects(block.landdetails, ["Survey", "Hissa", "Total Extent", "Karab A", "Karab B", "Balance", "Revenue", "Water Rate", "Cesses", "Patta", "Soil"], (row) => [
        row.Surveyno,
        row.Hissa,
        row.Totalextent,
        row.Phodkharaba,
        row.Phodkharabb,
        row.Balanceextents,
        row.Landrevenue || row.Totalrevenue,
        row.Waterrate,
        row.Cesses,
        row.Patta,
        row.Soiltype,
      ]),
    },
  });
  records.push({
    label: "ಖಾತೆ ನಂ / 10. ಕಬ್ಜೆ ಅಥವಾ ಸ್ವಾಧೀನತೆಯ ರೀತಿ / ಋಣಗಳು",
    summary: {
      hasData: Boolean(block.ownerdetails?.length),
      text: "Owner khata, acquisition, rights, and liabilities",
      rows: rowsFromObjects(block.ownerdetails, ["Owner", "Extent", "Khata No", "Acquisition / Possession", "Rights", "Liabilities"], (row) => [
        [row.Ownername, row.Relation, row.Relative].filter(Boolean).join(" "),
        row.Ownerextents || firstObjectValue(row, bilingualFields.extent, ["OwnerExtent", "Extent"]),
        cleanKhathaNumber(firstObjectValue(row, bilingualFields.khata, ["Khatanumber", "KhataNumber", "KhataNo", "KhathaNumber"])),
        firstObjectValue(row, bilingualFields.possession, ["Acquistiondetails", "Acquisitiondetails", "Possessiondetails"]),
        firstObjectValue(row, bilingualFields.rights, ["Rights", "OtherRights"]),
        firstObjectValue(row, bilingualFields.liabilities, ["Liablities", "Liabilities"]),
      ]),
    },
  });
  records.push({
    label: "12. ಸಾಗುವಳಿ ಮತ್ತು ಗೇಣಿಯ ವಿವರಗಳು / Cultivation and tenancy",
    summary: {
      hasData: Boolean(block.cultivator?.length),
      text: "Cultivator, crop, land utilization, water source, and tenancy details",
      rows: rowsFromObjects(block.cultivator, ["Year / Season", "Cultivator", "Cultivation Type", "Extent", "Tenant Amount", "Land Use", "Crop", "Crop Extent", "Water Source", "Yield / Acre"], (row) => [
        [row.Yearname, row.Seasonname].filter(Boolean).join(" "),
        [row.Culti_name, row.Cult_relationship, row.Cult_relativename].filter(Boolean).join(" "),
        row.Cultivationtype,
        row.Cultivationextent,
        row.Tenantamount,
        [row.Landutilzation_classification, row.Landutilization_extent, row.Landclassification].filter(Boolean).join(" / "),
        row.Cropname || row.Mixed_mixturename,
        row.Totalcropextent || row.Singlecropextent || row.Mixedcropextent,
        row.Watersource,
        row.Yielsperacre,
      ]),
    },
  });
  records.push({
    label: "ನೀರಾವರಿ ಮತ್ತು ಮರಗಳು / Irrigation and trees",
    summary: {
      hasData: Boolean(block.irrigation?.length || block.tree?.length),
      text: "Irrigation and tree details",
      rows: [
        ...rowsFromObjects(block.irrigation, ["Type", "Water Source", "Kharif", "Rabi", "Garden", "Total"], (row) => [
          "Irrigation",
          row.Watersource,
          row.Kharifextents,
          row.Rabiextent,
          row.Gardenextent,
          row.Totalextent,
        ]),
        ...((block.tree || []).length ? rowsFromObjects(block.tree, ["Type", "Tree", "Count"], (row) => ["Tree", row.Treename, row.Numberoftrees]).slice(1) : []),
      ],
    },
  });
  return records;
}

function advancedFallbackRecordsFromRtcSection(rtcSection) {
  const rtcRows = rtcSection?.rtcRows || [];
  const records = [];
  if (rtcRows.length) {
    records.push({
      label: "RTC owner, extent, and restrictions",
      summary: {
        hasData: true,
        text: "Advanced Details fallback parsed from the current RTC table because Service53 returned no extended detail payload.",
        rows: rowsFromObjects(rtcRows, ["Owner(s)", "Extent(s)", "Khata Number", "Owner Category", "Gov Restriction", "Court Stay", "Alienated", "Land ID"], (row) => [
          (row.owners || []).join("; "),
          (row.extents || []).join("; "),
          row.khataNumber,
          (row.ownerCategories || []).join(", "),
          (row.govRestrictions || []).join(", "),
          (row.courtStays || []).join(", "),
          (row.alienated || []).join(", "),
          row.landId,
        ]),
      },
    });
  }

  const rtcRecords = rtcSection?.records || [];
  const khata = firstSummaryValue(rtcRecords, bilingualFields.khata);
  const possession = firstSummaryValue(rtcRecords, bilingualFields.possession);
  const rights = firstSummaryValue(rtcRecords, bilingualFields.rights);
  const liabilities = firstSummaryValue(rtcRecords, bilingualFields.liabilities);
  const extent = firstSummaryValue(rtcRecords, bilingualFields.extent);
  const detailRows = [
    ["Khata Number / ಖಾತೆ ನಂ", khata || "-"],
    ["10. Acquisition or possession / ಕಬ್ಜೆ ಅಥವಾ ಸ್ವಾಧೀನತೆಯ ರೀತಿ", possession || "-"],
    ["11. Other rights / ಇತರೆ ಹಕ್ಕುಗಳು", rights || "-"],
    ["11. Liabilities / ಋಣಗಳು", liabilities || "-"],
    ["Land extent / ಜಮೀನಿನ ವಿಸ್ತೀರ್ಣ", extent || "-"],
  ];
  records.push({
    label: "Bilingual RTC label extraction",
    summary: {
      hasData: detailRows.some((row) => row[1] !== "-"),
      text: "Kannada and English labels parsed from the available RTC detail text.",
      rows: detailRows,
    },
  });
  return records;
}

function advancedSnapshotItems(records) {
  const items = [];
  for (const record of records || []) {
    if (/status/i.test(record.label || "")) continue;
    const rows = record.summary?.rows || [];
    if (!rows.length) continue;
    items.push({
      kind: "heading",
      text: record.label || "Advanced RTC details",
    });
    const headers = rows[0] || [];
    const body = rows.slice(1);
    for (const row of body) {
      if (!row.some(meaningfulValue)) continue;
      const label = row.length === 2
        ? row[0]
        : headers.map((header, index) => [header, row[index]].filter(meaningfulValue).join(": ")).filter(Boolean).join(" | ");
      const value = row.length === 2 ? row[1] : "";
      items.push({ kind: "row", label, value });
    }
  }
  return items;
}

function advancedSnapshotSvg(values, records) {
  const items = advancedSnapshotItems(records);
  const width = 1400;
  const lineHeight = 24;
  const rowGap = 12;
  let y = 34;
  const blocks = [];
  const addText = (x, yPos, text, size = 18, weight = 500, fill = "#4f5f6d") => {
    const lines = wrapSvgText(text, x > 420 ? 58 : 34);
    lines.forEach((line, index) => {
      blocks.push(`<text x="${x}" y="${yPos + index * lineHeight}" font-size="${size}" font-weight="${weight}" fill="${fill}">${xmlEscape(line)}</text>`);
    });
    return lines.length * lineHeight;
  };

  blocks.push(`<rect x="0" y="0" width="${width}" height="100%" fill="#ffffff"/>`);
  blocks.push(`<text x="18" y="${y}" font-size="24" font-weight="700" fill="#1f2933">Advanced RTC Details</text>`);
  blocks.push(`<text x="640" y="${y}" font-size="18" font-weight="700" fill="#1f2933">Sri SatVam Bhoomi Data Reader</text>`);
  y += 38;

  const surveyLine = [
    `District: ${values.districtLabel || values.district || "-"}`,
    `Taluk: ${values.talukLabel || values.taluk || "-"}`,
    `Hobli: ${values.hobliLabel || values.hobli || "-"}`,
    `Village: ${values.villageLabel || values.village || "-"}`,
    `Survey: ${[values.survey, values.surnocLabel || values.surnoc, values.hissaLabel || values.hissa].filter(Boolean).join(" / ") || "-"}`,
  ].join("    ");
  blocks.push(`<text x="18" y="${y}" font-size="16" fill="#52616f">${xmlEscape(surveyLine)}</text>`);
  y += 30;

  for (const item of items) {
    if (item.kind === "heading") {
      blocks.push(`<rect x="0" y="${y - 18}" width="${width}" height="34" fill="#4f83bd"/>`);
      blocks.push(`<text x="18" y="${y + 5}" font-size="18" font-weight="700" fill="#ffffff">${xmlEscape(item.text)}</text>`);
      y += 42;
      continue;
    }
    const valueHeight = Math.max(addText(18, y, item.label, 16, 700), addText(580, y, item.value || "", 16, 500));
    blocks.push(`<line x1="18" y1="${y + valueHeight + 4}" x2="${width - 18}" y2="${y + valueHeight + 4}" stroke="#d8e0e7" stroke-width="1"/>`);
    y += valueHeight + rowGap;
  }

  if (!items.length) {
    blocks.push(`<text x="18" y="${y}" font-size="18" fill="#52616f">No Advanced RTC page details were returned for this selection.</text>`);
    y += 32;
  }

  const height = Math.max(520, y + 24);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <style>text{font-family:Arial,'Noto Sans Kannada','Noto Sans',sans-serif;}</style>
    <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>
    ${blocks.join("\n")}
  </svg>`;
}

function storeAdvancedSnapshot(values, records) {
  const svg = advancedSnapshotSvg(values, records);
  const filename = `advanced-rtc-${values.survey || "record"}.svg`;
  return storeDocument(Buffer.from(svg, "utf8"), "image/svg+xml", filename);
}

function surveyPattern(value) {
  return /^\d+\s*\/\s*[^/]+\s*\/\s*[^/\s]+/.test(String(value || "").trim());
}

function parseExtentValue(value = "") {
  const text = stripTags(String(value));
  return (text.match(/(?:ಒಟ್ಟು|Total)\s*:?\s*([0-9.]+)/i)
    || text.match(/(?:ಖರಾಬ್\s*\(ಅ\)|Kharab\s*A)\s*:?\s*([0-9.]+)/i)
    || text.match(/(?:ಖರಾಬ್\s*\(ಬ\)|Kharab\s*B)\s*:?\s*([0-9.]+)/i)
    || [])[1] || "";
}

function mutationNature(type = "", acquisition = "") {
  const joined = `${type} ${acquisition}`;
  if (/ಫೋಡಿ|ವಿಭಜನೆ|partition|split|podi/i.test(joined)) return "Partition / split";
  if (/ಕೋರ್ಟ್|court/i.test(joined)) return "Court order / transfer";
  if (/ಕ್ರಯ|sale|purchase/i.test(joined)) return "Purchase / sale";
  if (/ಹಕ್ಕು|ಋಣ|bank|loan|charge|obligation|ಆಧಾರ|ಭೋಗ್ಯ/i.test(joined)) return "Rights / bank charge";
  if (/ಖಾತೆ|ಪೌತಿ|pauti|katha|khata/i.test(joined)) return "Khata / pauti change";
  return [type, acquisition].filter(Boolean).join(" / ") || "-";
}

function selectedSurveyKey(values) {
  return [values.survey, values.surnocLabel || values.surnoc, values.hissaLabel || values.hissa]
    .filter(Boolean)
    .join("/")
    .replace(/\/+/g, "/");
}

function parseOwnershipHistoryReport(html, values) {
  const rows = extractAllDataRows(html);
  const headerIndex = rows.findIndex((row) => {
    const joined = row.join(" ");
    return /Survey No/i.test(joined) && /MR\s*Number|Mutation Type|Sl\s*No/i.test(joined);
  });
  const mutationRows = [];
  if (headerIndex >= 0) {
    for (const row of rows.slice(headerIndex + 1)) {
      if (row.length < 8 || !/^\d+$/.test(row[0] || "")) break;
      mutationRows.push({
        slNo: row[0],
        surveyNo: row[1],
        year: row[2],
        transactionNo: row[3],
        mrNo: row[4],
        mrDisplay: `MR ${row[4]}/${row[2]}`,
        mutationType: row[5],
        acquisitionType: row[6],
        approveDate: row[7],
        nature: mutationNature(row[5], row[6]),
        focus: selectedSurveyKey(values) && row[1] === selectedSurveyKey(values) ? "YES" : "",
      });
    }
  }

  const landDetails = [];
  let stage = "";
  let activeLand = null;
  for (const row of rows) {
    const joined = row.join(" ");
    if (/ಈಗಿನ|Current/i.test(joined) && /ಸರ್ವೇ|Survey/i.test(joined)) stage = "Before / existing";
    if (/ಹೊಸ|New/i.test(joined) && /ಸರ್ವೇ|Survey/i.test(joined)) stage = "After / new";
    if (surveyPattern(row[0]) && /ಒಟ್ಟು|Total/i.test(row[1] || "")) {
      activeLand = {
        stage,
        surveyNo: row[0],
        totalExtent: parseExtentValue(row[1]),
        revenue: (row[2] || "").replace(/ಕಂದಾಯ\s*:?\s*/i, "").trim(),
        patta: row[3] || "",
        soil: row[4] || "",
        kharabA: "",
        kharabB: "",
      };
      landDetails.push(activeLand);
    } else if (activeLand && /ಖರಾಬ್\s*\(ಅ\)|Kharab\s*A/i.test(row[1] || "")) {
      activeLand.kharabA = parseExtentValue(row[1]);
    } else if (activeLand && /ಖರಾಬ್\s*\(ಬ\)|Kharab\s*B/i.test(row[1] || "")) {
      activeLand.kharabB = parseExtentValue(row[1]);
    }
  }

  const ownerPositions = rows
    .filter((row) => row.length === 3
      && surveyPattern(row[0])
      && (!values.survey || String(row[0]).startsWith(`${values.survey}/`))
      && /[0-9]+\.[0-9.]+/.test(row[2] || "")
      && !/MR\s*T|Rs\.?|BANK/i.test(row[1] || ""))
    .map((row) => ({
      surveyNo: row[0],
      owner: row[1],
      ownerExtent: row[2],
    }));

  const finalPositions = ownerPositions.map((owner) => {
    const land = [...landDetails].reverse().find((item) => item.stage === "After / new" && item.surveyNo === owner.surveyNo)
      || [...landDetails].reverse().find((item) => item.surveyNo === owner.surveyNo);
    return { ...owner, ...land };
  });

  return {
    html,
    rows,
    mutationRows,
    landDetails,
    finalPositions,
    text: visibleText(html),
  };
}

function ownershipInsightRows(data, values) {
  const latest = data.mutationRows[0];
  const focusRows = data.mutationRows.filter((row) => row.focus === "YES" || !selectedSurveyKey(values) || row.surveyNo.startsWith(`${values.survey}/`));
  const finalSurveys = uniq(data.finalPositions.map((row) => row.surveyNo));
  return [
    ["Mutation entries found", String(data.mutationRows.length)],
    ["Focused survey chain", focusRows.length ? `${focusRows.length} matching / related entries` : "No exact hissa match found"],
    ["Latest MR", latest ? `${latest.mrDisplay} on ${latest.approveDate} (${latest.nature})` : "-"],
    ["Final survey position", finalSurveys.length ? finalSurveys.join(", ") : "-"],
  ];
}

function ownershipMapSvg(values, data) {
  const width = 1600;
  const height = 1050;
  const focus = selectedSurveyKey(values) || `${values.survey || "-"}`;
  const latestRows = data.mutationRows.slice(0, 5);
  const finalRows = data.finalPositions.slice(0, 4);
  const insightRows = ownershipInsightRows(data, values);
  const blocks = [];
  const rect = (x, y, w, h, stroke = "#83aaf7", fill = "#fff", r = 10) => blocks.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`);
  const text = (x, y, value, size = 20, weight = 500, fill = "#16213e") => {
    wrapSvgText(value, Math.max(18, Math.floor((width - x - 40) / (size * 0.46)))).forEach((line, index) => {
      blocks.push(`<text x="${x}" y="${y + index * (size + 5)}" font-size="${size}" font-weight="${weight}" fill="${fill}">${xmlEscape(line)}</text>`);
    });
  };
  const arrow = (x1, y1, x2, y2) => blocks.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#0b4db3" stroke-width="5" marker-end="url(#arrow)"/>`);

  blocks.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="#f7fbff"/>`);
  text(150, 54, "Land Derivation & Mutation Dashboard", 42, 800, "#071b7a");
  text(150, 92, `Survey No. ${focus} - ${values.villageLabel || values.village || ""}, ${values.hobliLabel || values.hobli || ""}, ${values.talukLabel || values.taluk || ""}`, 21, 500, "#111827");
  rect(1125, 24, 440, 54, "#555", "#fff", 8);
  text(1142, 59, "Source: Bhoomi Encumbrance / MR History Report", 19, 700, "#071b7a");

  const chips = [
    ["District", values.districtLabel || values.district || "-"],
    ["Taluk", values.talukLabel || values.taluk || "-"],
    ["Hobli", values.hobliLabel || values.hobli || "-"],
    ["Village", values.villageLabel || values.village || "-"],
    ["Parent Survey", values.survey || "-"],
    ["Focus Hissa", focus],
  ];
  chips.forEach(([label, value], index) => {
    const x = 24 + index * 260;
    rect(x, 118, 245, 84);
    text(x + 18, 150, label, 17, 500, "#26364a");
    text(x + 18, 178, value, 21, 800, index === 5 ? "#067333" : "#111827");
  });

  blocks.push(`<rect x="24" y="220" width="1540" height="38" rx="8" fill="#0b4db3"/>`);
  text(46, 248, "1. Main MR History Summary", 23, 800, "#fff");
  latestRows.slice(0, 3).forEach((row, index) => {
    const x = 50 + index * 500;
    rect(x, 275, 455, 166, "#9dc0ff");
    blocks.push(`<circle cx="${x + 38}" cy="314" r="24" fill="#0b4db3"/>`);
    text(x + 29, 323, String(index + 1), 24, 800, "#fff");
    text(x + 86, 309, row.mrDisplay, 24, 800, "#071b7a");
    text(x + 86, 345, `Date: ${row.approveDate}`, 17, 600);
    text(x + 86, 373, `Nature: ${row.nature}`, 17, 600);
    text(x + 86, 401, `Survey: ${row.surveyNo}`, 17, 600);
    text(x + 86, 429, `Type: ${[row.mutationType, row.acquisitionType].filter(Boolean).join(" / ")}`, 16, 500, "#2d3748");
  });

  rect(24, 466, 760, 265, "#1c76b7");
  blocks.push(`<rect x="24" y="466" width="350" height="38" rx="8" fill="#0b4db3"/>`);
  text(46, 494, "2. Easy Land Derivation Map", 23, 800, "#fff");
  const mapNodes = [
    [`Parent Survey`, `${values.survey || "-"} / history`],
    [latestRows.at(-1)?.mrDisplay || "Old MR", latestRows.at(-1)?.nature || "Start"],
    [latestRows[0]?.mrDisplay || "Latest MR", latestRows[0]?.nature || "Latest mutation"],
    ["Final Position", finalRows.map((row) => row.surveyNo).join(" & ") || focus],
  ];
  mapNodes.forEach(([label, value], index) => {
    const x = 42 + index * 180;
    rect(x, 532, 150, 122, index === 0 ? "#008b5a" : "#9dc0ff");
    text(x + 16, 565, label, 17, 800, index === 0 ? "#067333" : "#071b7a");
    text(x + 16, 604, value, 17, 700, "#111827");
    if (index < mapNodes.length - 1) arrow(x + 150, 593, x + 176, 593);
  });
  text(58, 694, finalRows.length > 1 ? "Split / partition style final position detected from mutation history." : "Mutation history chain prepared from official Service40 report.", 19, 600, "#075985");

  rect(806, 466, 758, 265, "#1c76b7");
  blocks.push(`<rect x="806" y="466" width="350" height="38" rx="8" fill="#0b4db3"/>`);
  text(828, 494, "3. Record Movement Timeline", 23, 800, "#fff");
  const timeline = data.mutationRows.slice().reverse().slice(0, 6);
  if (timeline.length) {
    const startX = 850;
    const gap = 112;
    blocks.push(`<line x1="${startX}" y1="575" x2="${startX + gap * (timeline.length - 1)}" y2="575" stroke="#0b4db3" stroke-width="4"/>`);
    timeline.forEach((row, index) => {
      const x = startX + index * gap;
      blocks.push(`<circle cx="${x}" cy="575" r="28" fill="#fff" stroke="#0b4db3" stroke-width="4"/>`);
      text(x - 28, 535, row.year.split("-")[0], 15, 700, "#071b7a");
      text(x - 44, 630, row.mrDisplay, 14, 700);
      text(x - 44, 650, row.nature, 13, 500, "#2d3748");
    });
  }

  blocks.push(`<rect x="24" y="752" width="1540" height="170" rx="12" fill="#ffffff" stroke="#008b5a" stroke-width="2"/>`);
  blocks.push(`<rect x="24" y="752" width="360" height="42" rx="8" fill="#0b4db3"/>`);
  text(46, 782, "4. Final Position as per Report", 23, 800, "#fff");
  finalRows.forEach((row, index) => {
    const x = 55 + index * 370;
    text(x, 835, row.surveyNo, 27, 800, "#067333");
    text(x, 865, `Owner: ${row.owner}`, 16, 600);
    text(x, 890, `Owner extent: ${row.ownerExtent || "-"}`, 16, 700, "#111827");
    text(x, 915, `Total with kharab: ${row.totalExtent || "-"}`, 16, 600);
  });

  blocks.push(`<rect x="24" y="938" width="250" height="86" rx="10" fill="#0b4db3"/>`);
  text(70, 990, "Key Insight", 30, 800, "#fff");
  insightRows.slice(0, 3).forEach((row, index) => {
    const x = 310 + index * 410;
    blocks.push(`<circle cx="${x}" cy="980" r="26" fill="#0b4db3"/>`);
    text(x - 7, 989, String(index + 1), 24, 800, "#fff");
    text(x + 42, 965, row[0], 18, 800, "#111827");
    text(x + 42, 995, row[1], 17, 500, "#111827");
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#0b4db3"/></marker></defs>
    <style>text{font-family:Arial,'Noto Sans Kannada','Noto Sans',sans-serif;}</style>
    ${blocks.join("\n")}
  </svg>`;
}

function storeOwnershipMap(values, data) {
  const svg = ownershipMapSvg(values, data);
  const filename = `ownership-map-${values.survey || "record"}.svg`;
  return storeDocument(Buffer.from(svg, "utf8"), "image/svg+xml", filename);
}

function tableSnapshotSvg(title, values, rows) {
  const width = 1400;
  const columnCount = Math.max(1, Math.max(...(rows || [[]]).map((row) => row.length)));
  const columnWidth = Math.floor((width - 48) / columnCount);
  const lineHeight = 20;
  let y = 34;
  const blocks = [];
  blocks.push(`<rect x="0" y="0" width="${width}" height="100%" fill="#ffffff"/>`);
  blocks.push(`<text x="24" y="${y}" font-size="28" font-weight="800" fill="#0b4db3">${xmlEscape(title)}</text>`);
  y += 34;
  const surveyLine = [
    `District: ${values.districtLabel || values.district || "-"}`,
    `Taluk: ${values.talukLabel || values.taluk || "-"}`,
    `Hobli: ${values.hobliLabel || values.hobli || "-"}`,
    `Village: ${values.villageLabel || values.village || "-"}`,
    `Survey: ${[values.survey, values.surnocLabel || values.surnoc, values.hissaLabel || values.hissa].filter(Boolean).join(" / ") || "-"}`,
  ].join("    ");
  blocks.push(`<text x="24" y="${y}" font-size="16" fill="#52616f">${xmlEscape(surveyLine)}</text>`);
  y += 32;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const wrapped = Array.from({ length: columnCount }, (_, index) => wrapSvgText(row[index] || "", Math.max(18, Math.floor(columnWidth / 9))));
    const rowHeight = Math.max(42, 16 + Math.max(...wrapped.map((lines) => lines.length)) * lineHeight);
    const fill = rowIndex === 0 ? "#eaf2ff" : rowIndex % 2 ? "#ffffff" : "#f8fafc";
    blocks.push(`<rect x="24" y="${y - 22}" width="${width - 48}" height="${rowHeight}" fill="${fill}" stroke="#d8e0e7" stroke-width="1"/>`);
    for (let column = 0; column < columnCount; column += 1) {
      const x = 34 + column * columnWidth;
      wrapped[column].forEach((line, index) => {
        blocks.push(`<text x="${x}" y="${y + index * lineHeight}" font-size="${rowIndex === 0 ? 16 : 15}" font-weight="${rowIndex === 0 ? 800 : 500}" fill="#1f2933">${xmlEscape(line)}</text>`);
      });
      if (column > 0) {
        blocks.push(`<line x1="${24 + column * columnWidth}" y1="${y - 22}" x2="${24 + column * columnWidth}" y2="${y - 22 + rowHeight}" stroke="#d8e0e7" stroke-width="1"/>`);
      }
    }
    y += rowHeight;
  }

  const height = Math.max(360, y + 30);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <style>text{font-family:Arial,'Noto Sans Kannada','Noto Sans',sans-serif;}</style>
    <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>
    ${blocks.join("\n")}
  </svg>`;
}

function storeTableSnapshot(title, values, rows, filename) {
  const svg = tableSnapshotSvg(title, values, rows);
  return storeDocument(Buffer.from(svg, "utf8"), "image/svg+xml", filename);
}

function previewRtcImageUrl(html, baseUrl = BHOOMI_URL) {
  const imgMatch = html.match(/<img\b[^>]*(?:id=["']ImgSketchPage["'][^>]*src|src)=["']([^"']+)["'][^>]*>/i)
    || html.match(/<img\b[^>]*src=["']([^"']*RTCPreviewPng[^"']*)["'][^>]*>/i);
  return imgMatch ? new URL(decodeHtml(imgMatch[1]), baseUrl).href : "";
}

async function fetchRtcPreviewRecord(session, values, label, fieldConfig = currentFields, previewButton = currentPreviewButton, prefix = "current") {
  const previewForm = buildForm(session, values, "", fieldConfig);
  previewForm.set(previewButton.name, previewButton.value);
  await fetchOfficial(session, previewForm, session.url);

  const previewPagePath = (session.html.match(/window\.open\(\s*['"]([^'"]*PreviewRTC\.aspx[^'"]*)['"]/i) || [])[1] || "PreviewRTC.aspx";
  const previewPageUrl = new URL(previewPagePath, session.url || BHOOMI_URL).href;
  const previewHtml = await fetchOfficialText(session, previewPageUrl, session.url || BHOOMI_URL);
  const imageUrl = previewRtcImageUrl(previewHtml, previewPageUrl);
  if (!imageUrl) throw new Error("Official RTC View page did not return a preview image");

  const response = await officialFetch(imageUrl, {
    headers: {
      cookie: session.cookie,
      referer: previewPageUrl,
    },
    timeoutMs: 30000,
  }, "Current RTC preview image");
  if (!response.ok) throw new Error(`Current RTC preview image returned HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "image/png";
  const buffer = Buffer.from(await response.arrayBuffer());
  const storedImageUrl = storeDocument(
    buffer,
    contentType,
    `${prefix}-rtc-${values.survey || "survey"}-${values.surnocLabel || values.surnoc || "surnoc"}-${values.hissaLabel || values.hissa || "hissa"}-${values.yearLabel || values.periodLabel || "record"}.png`.replace(/[^a-z0-9._-]+/gi, "-").toLowerCase(),
  );

  return {
    label: `${prefix === "old" ? "Old" : "Current"} RTC official View page`,
    summary: {
      hasData: true,
      text: `Official ${prefix === "old" ? "Old" : "Current"} RTC View page image fetched from Bhoomi.`,
      rows: [
        ["View", "Official RTC preview image fetched"],
        ["Period", label || values.periodLabel || "-"],
      ],
    },
    imageUrl: storedImageUrl,
    imageClass: "current-rtc-page",
  };
}

async function fetchCurrentRtcPreviewRecord(session, values, label) {
  return fetchRtcPreviewRecord(session, values, label, currentFields, currentPreviewButton, "current");
}

function emptyOwnershipHistoryData(html = "") {
  return {
    html,
    rows: extractAllDataRows(html),
    mutationRows: [],
    landDetails: [],
    finalPositions: [],
    text: visibleText(html),
  };
}

function ownershipMapRecords(values, parsed, statusRows = []) {
  const imageUrl = storeOwnershipMap(values, parsed);
  const historyRows = [
    ["Date", "MR No", "Survey No", "Nature", "Mutation Type", "Acquisition Type", "Transaction No", "Focus"],
    ...parsed.mutationRows.map((row) => [
      row.approveDate,
      row.mrDisplay,
      row.surveyNo,
      row.nature,
      row.mutationType,
      row.acquisitionType,
      row.transactionNo,
      row.focus,
    ]),
  ];
  const finalRows = [
    ["Survey No", "Owner", "Owner Extent", "Total Extent", "Kharab A", "Kharab B", "Stage"],
    ...parsed.finalPositions.map((row) => [
      row.surveyNo,
      row.owner,
      row.ownerExtent,
      row.totalExtent || "",
      row.kharabA || "",
      row.kharabB || "",
      row.stage || "",
    ]),
  ];
  const records = [
    {
      label: "Ownership dashboard snapshot",
      summary: {
        hasData: parsed.mutationRows.length > 0,
        text: parsed.mutationRows.length ? "Mutation history dashboard generated from Service40." : "Ownership map dashboard prepared without mutation-history rows.",
        rows: [["Snapshot", "Ownership map dashboard attached in the report"]],
      },
      imageUrl,
      imageClass: "ownership-map-page",
    },
  ];
  if (statusRows.length) {
    records.push({
      label: "Service40 mutation history status",
      summary: {
        hasData: false,
        text: "Service40 did not generate a mutation-history report for this selection.",
        rows: statusRows,
      },
    });
  }
  records.push(
    {
      label: "Main MR history summary",
      summary: {
        hasData: parsed.mutationRows.length > 0,
        text: `${parsed.mutationRows.length} mutation history row(s) found`,
        rows: parsed.mutationRows.length ? historyRows : [["Status", "No mutation history rows returned by Service40"]],
      },
    },
    {
      label: "Final land position after mutation history",
      summary: {
        hasData: parsed.finalPositions.length > 0,
        text: parsed.finalPositions.length ? `${parsed.finalPositions.length} final survey position(s) parsed` : "No final position rows parsed",
        rows: parsed.finalPositions.length ? finalRows : [["Status", "No final land position rows parsed"]],
      },
    },
    {
      label: "Ownership map key insights",
      summary: {
        hasData: parsed.mutationRows.length > 0,
        text: "Derived mutation-history observations",
        rows: ownershipInsightRows(parsed, values),
      },
    },
  );
  return records;
}

function akarbandSurveyEntries(data) {
  return Object.values(data || {})
    .map((item) => ({
      survey: String(item.Item1 ?? "").trim(),
      surnoc: String(item.Item2 ?? "").trim(),
      hissa: String(item.Item3 ?? "").trim(),
    }))
    .filter((item) => item.survey);
}

function chooseAkarbandSelection(entries, values) {
  const requested = {
    survey: String(values.survey || "").trim(),
    surnoc: String(values.surnocLabel || values.surnoc || "").trim(),
    hissa: String(values.hissaLabel || values.hissa || "").trim(),
  };
  const surveyMatches = entries.filter((entry) => entry.survey === requested.survey);
  const exact = surveyMatches.find((entry) => {
    const surnocOk = !requested.surnoc || entry.surnoc === requested.surnoc;
    const hissaOk = !requested.hissa || entry.hissa === requested.hissa;
    return surnocOk && hissaOk;
  });
  const chosen = exact || surveyMatches[0] || requested;
  return {
    survey: chosen.survey || requested.survey,
    surnoc: chosen.surnoc || requested.surnoc || "*",
    hissa: chosen.hissa || requested.hissa || "*",
    matched: Boolean(exact),
    surveyAvailable: surveyMatches.length > 0,
  };
}

function storeDocument(buffer, contentType, filename) {
  const id = randomUUID();
  const safeFilename = filename.replace(/[^\w.-]+/g, "-");
  const key = s3Key("documents", id, safeFilename);
  documents.set(id, {
    buffer,
    contentType,
    filename: safeFilename,
    s3Key: key,
    createdAt: Date.now(),
  });
  persistDocument(id).catch((error) => console.warn(`S3 document persistence failed for ${id}: ${error.message}`));
  return `/api/document/${id}`;
}

async function persistDocument(id) {
  if (!awsStorageEnabled()) return;
  const document = documents.get(id);
  if (!document) return;
  const [{ PutObjectCommand }, s3] = await Promise.all([import("@aws-sdk/client-s3"), getS3Client()]);
  await s3.send(new PutObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: document.s3Key,
    Body: document.buffer,
    ContentType: document.contentType,
  }));
  await dynamoPut({
    pk: "DOC",
    sk: id,
    id,
    s3Key: document.s3Key,
    filename: document.filename,
    contentType: document.contentType,
    createdAt: document.createdAt,
  });
}

async function streamToBuffer(body) {
  if (!body) return Buffer.alloc(0);
  if (Buffer.isBuffer(body)) return body;
  const chunks = [];
  for await (const chunk of body) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function loadStoredDocument(id) {
  if (!awsStorageEnabled()) return null;
  const metadata = await dynamoGet("DOC", id);
  if (!metadata?.s3Key) return null;
  const [{ GetObjectCommand }, s3] = await Promise.all([import("@aws-sdk/client-s3"), getS3Client()]);
  const response = await s3.send(new GetObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: metadata.s3Key,
  }));
  return {
    buffer: await streamToBuffer(response.Body),
    contentType: metadata.contentType || response.ContentType || "application/octet-stream",
    filename: metadata.filename || "document",
    s3Key: metadata.s3Key,
    createdAt: metadata.createdAt || Date.now(),
  };
}

function runCommand(command, args, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`${command} timed out`));
    }, timeoutMs);

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `${command} exited with ${code}`));
    });
  });
}

function runCommandOutput(command, args, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`${command} timed out`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr.trim() || `${command} exited with ${code}`));
    });
  });
}

async function renderPdfPreview(buffer, filename) {
  const tempDir = await mkdtemp(join(tmpdir(), "akarband-"));
  try {
    const pdfPath = join(tempDir, filename);
    await writeFile(pdfPath, buffer);
    if (process.platform === "darwin") {
      await runCommand("/usr/bin/qlmanage", ["-t", "-s", "1800", "-o", tempDir, pdfPath]);
      const files = await readdir(tempDir);
      const previewFile = files.find((file) => file.endsWith(".png") && file.includes(filename));
      if (!previewFile) throw new Error("Akarband preview image was not produced");
      return await readFile(join(tempDir, previewFile));
    }

    const previewPrefix = join(tempDir, "preview");
    await runCommand("pdftoppm", ["-png", "-singlefile", "-r", "180", pdfPath, previewPrefix]);
    return await readFile(`${previewPrefix}.png`);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function storePdfWithPreview(buffer, filename) {
  const pdfUrl = storeDocument(buffer, "application/pdf", filename);
  try {
    const previewBuffer = await renderPdfPreview(buffer, filename);
    const imageUrl = storeDocument(previewBuffer, "image/png", filename.replace(/\.pdf$/i, ".png"));
    return { pdfUrl, imageUrl };
  } catch (error) {
    return { pdfUrl, imageError: error.message };
  }
}

function normalizeText(value = "") {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function truncateText(value = "", max = 260) {
  const text = normalizeText(value);
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function sectionByReportTitle(report, title) {
  return (report.sections || []).find((section) => section.title === title);
}

function recordsByLabel(section, label) {
  return (section?.records || []).filter((record) => normalizeText(record.label).toLowerCase() === label.toLowerCase());
}

function pendingRccmsRows(report) {
  const echawadi = sectionByReportTitle(report, "eChawadi");
  const rccmsRecord = recordsByLabel(echawadi, "RCCMS")[0];
  const rows = rccmsRecord?.summary?.rows || [];
  if (rows.length <= 1) return [];
  const headers = rows[0].map(normalizeText);
  return rows.slice(1)
    .filter((row) => row.some((cell) => normalizeText(cell)))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header || `Column ${index + 1}`, normalizeText(row[index])])))
    .filter((row) => /pending|active|case|yes|open|ongoing/i.test(Object.values(row).join(" ")));
}

function summarizeSectionForAnalysis(section) {
  return {
    title: section.title,
    status: section.status || "",
    error: section.error || "",
    records: (section.records || []).map((record) => ({
      label: record.label || "",
      text: truncateText(record.summary?.text || "", 400),
      rows: (record.summary?.rows || []).slice(0, 20).map((row) => row.map((cell) => truncateText(cell, 160))),
      hasAttachment: Boolean(record.pdfUrl || record.imageUrl),
    })),
  };
}

function compactPayloadForAnalysis(payload) {
  const report = payload.rawFetchedData || payload.report || payload;
  return {
    exportedAt: payload.exportedAt || "",
    landDetails: payload.landDetails || report.overview || {},
    overview: report.overview || {},
    rtcRows: (report.rtcRows || []).slice(0, 80),
    sections: (report.sections || []).map(summarizeSectionForAnalysis),
    pendingRccms: pendingRccmsRows(report),
  };
}

function fallbackLegalAnalysis(payload) {
  const report = payload.rawFetchedData || payload.report || payload;
  const compact = compactPayloadForAnalysis(payload);
  const sections = report.sections || [];
  const errors = sections.filter((section) => section.error);
  const pendingRccms = compact.pendingRccms;
  const oldRtcCount = (sectionByReportTitle(report, "Old Year RTC")?.records || []).length;
  const mutationRows = sectionByReportTitle(report, "Mutation Register")?.records?.flatMap((record) => record.summary?.rows || []) || [];
  const owners = uniq((report.rtcRows || []).flatMap((row) => row.owners || []).map(normalizeText));
  const khatha = report.overview?.khatha || firstSummaryValue(sections.flatMap((section) => section.records || []), bilingualFields.khata) || "";

  return {
    provider: process.env.OPENAI_API_KEY ? "local-fallback-after-openai-error" : "local-fallback",
    title: "Full Legal Report Summary",
    executiveSummary: [
      `Property selection: ${[
        compact.overview.district,
        compact.overview.taluk,
        compact.overview.hobli,
        compact.overview.village,
        compact.overview.survey ? `Survey ${compact.overview.survey}` : "",
        compact.overview.surnoc ? `Surnoc ${compact.overview.surnoc}` : "",
        compact.overview.hissa ? `Hissa ${compact.overview.hissa}` : "",
      ].filter(Boolean).join(" / ") || "Selected land details"}.`,
      `${report.rtcRows?.length || 0} RTC row(s), ${oldRtcCount} old RTC record(s), and ${mutationRows.length} mutation table row(s) were available for review.`,
      pendingRccms.length ? `${pendingRccms.length} pending/current RCCMS revenue case item(s) were found in eChawadi data.` : "No matching pending RCCMS items were found in the fetched eChawadi data.",
    ],
    ownershipSummary: owners.length
      ? owners.slice(0, 12).map((owner) => `Owner observed in RTC chain: ${owner}`)
      : ["Owner chain was not available from fetched RTC rows."],
    documentGaps: [
      khatha ? "" : "Khatha number is not clearly available in the consolidated fetched data.",
      oldRtcCount ? "" : "Old RTC history is limited or unavailable for this selection.",
      errors.length ? `${errors.length} service section(s) returned fetch errors: ${errors.map((section) => section.title).join(", ")}.` : "",
      sections.some((section) => section.title === "Akarband") ? "" : "Akarband reference was not available in the fetched report payload.",
    ].filter(Boolean),
    risks: [
      pendingRccms.length ? "Pending RCCMS revenue cases should be reviewed before relying on the title chain." : "",
      mutationRows.length ? "" : "Mutation Register details are not available or not structured enough for a complete mutation-history review.",
      (report.rtcRows || []).some((row) => normalizeText(row.ongoingMutation)) ? "RTC rows indicate ongoing mutation information that should be verified." : "",
    ].filter(Boolean),
    recommendations: [
      "Verify current RTC, MR extracts, old RTC history, Khatha, Akarband and eChawadi items against official portal copies before final legal opinion.",
      pendingRccms.length ? "Collect RCCMS case orders/status details for every pending item listed in Review Points." : "Keep eChawadi/RCCMS evidence with the report file for audit trail.",
      "Use this generated summary as a review aid only; final legal conclusions should be confirmed by a qualified property/legal professional.",
    ],
    pendingRccms,
  };
}

function extractOpenAiText(data) {
  if (data.output_text) return data.output_text;
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .filter(Boolean)
    .join("\n");
}

async function openAiLegalAnalysis(payload) {
  if (!process.env.OPENAI_API_KEY) return null;
  const compact = compactPayloadForAnalysis(payload);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: "You analyse Karnataka Bhoomi land-record JSON for legal-report drafting. Return valid JSON only. Do not invent facts. Keep recommendations practical and cautious.",
        },
        {
          role: "user",
          content: `Create a legal report summary and review points from this fetched portal data. JSON keys required: title, executiveSummary, ownershipSummary, documentGaps, risks, recommendations, pendingRccms. Each value except title and pendingRccms should be an array of concise strings. Keep pendingRccms as an array. Data:\n${JSON.stringify(compact)}`,
        },
      ],
      max_output_tokens: 2500,
    }),
  });
  if (!response.ok) throw new Error(`OpenAI analysis failed: HTTP ${response.status}`);
  const data = await response.json();
  const text = extractOpenAiText(data);
  const jsonText = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return { ...JSON.parse(jsonText), provider: "openai", model: OPENAI_MODEL };
}

function extractClaudeText(data) {
  return (data.content || [])
    .map((item) => item.text || "")
    .filter(Boolean)
    .join("\n");
}

function fallbackClaudeReview(payload) {
  const legal = fallbackLegalAnalysis(payload);
  const report = payload.rawFetchedData || payload.report || payload;
  const compact = compactPayloadForAnalysis(payload);
  const rccms = compact.pendingRccms || [];
  const mutationRows = sectionByReportTitle(report, "Mutation Register")?.records?.flatMap((record) => record.summary?.rows || []) || [];
  return {
    provider: process.env.ANTHROPIC_API_KEY ? "local-fallback-after-claude-error" : "local-fallback",
    title: "Claude Review",
    summary: [
      `Reviewed ${report.rtcRows?.length || 0} RTC row(s), ${mutationRows.length} mutation table row(s), and ${rccms.length} pending/current RCCMS row(s).`,
      "This review is generated from the same exported JSON data used by the app report.",
    ],
    observations: [
      ...(legal.executiveSummary || []),
      ...(legal.ownershipSummary || []).slice(0, 4),
    ],
    concerns: [
      ...(legal.risks || []),
      ...(legal.documentGaps || []),
    ].filter(Boolean),
    validationQuestions: [
      "Does every owner change in RTC history have a matching mutation extract and registered deed?",
      "Do survey, surnoc, hissa and extent match across RTC, MR extract, sale deeds, Akarband and khatha?",
      "Are any RCCMS/revenue cases pending or recently disposed for the selected survey/hissa?",
      "If converted/alienated, does the conversion order cover this exact extent and intended use?",
      "Does the Encumbrance Certificate show all transactions seen in mutation history?",
    ],
    recommendedNextSteps: [
      ...(legal.recommendations || []),
      "Use this review as an independent checklist, not as final legal opinion.",
    ],
    pendingRccms: rccms,
  };
}

async function claudeReviewAnalysis(payload) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const compact = compactPayloadForAnalysis(payload);
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2500,
      system: "You are reviewing Karnataka Bhoomi land-record JSON for property due-diligence. Return valid JSON only. Do not invent facts. Keep the review concise and practical.",
      messages: [
        {
          role: "user",
          content: `Create an independent Claude-style review from this fetched portal data. Required JSON keys: title, summary, observations, concerns, validationQuestions, recommendedNextSteps, pendingRccms. Values except title and pendingRccms must be arrays of concise strings. Keep pendingRccms as an array. Data:\n${JSON.stringify(compact)}`,
        },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Claude review failed: HTTP ${response.status}`);
  const data = await response.json();
  const text = extractClaudeText(data);
  const jsonText = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return { ...JSON.parse(jsonText), provider: "claude", model: CLAUDE_MODEL };
}

function pdfEscape(value = "") {
  return String(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapPdfLine(value = "", max = 92) {
  const words = normalizeText(value).split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line ? `${line} ${word}` : word).length > max) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function createSimplePdf(title, sections) {
  const pages = [];
  let lines = [title, `Generated: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`, ""];
  const pushLine = (line = "") => {
    if (lines.length >= 48) {
      pages.push(lines);
      lines = [];
    }
    lines.push(line);
  };
  for (const section of sections) {
    pushLine(section.heading);
    for (const item of section.items || []) {
      for (const wrapped of wrapPdfLine(item)) pushLine(`- ${wrapped}`);
    }
    pushLine("");
  }
  if (lines.length) pages.push(lines);

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  const pageRefs = [];
  for (const pageLines of pages) {
    const content = [
      "BT",
      "/F1 11 Tf",
      "50 790 Td",
      "14 TL",
      ...pageLines.map((line, index) => `${index ? "T*" : ""} (${pdfEscape(line)}) Tj`),
      "ET",
    ].join("\n");
    const contentObjectNumber = objects.length + 1;
    objects.push(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);
    const pageObjectNumber = objects.length + 1;
    pageRefs.push(pageObjectNumber);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`);
  }
  objects[1] = `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`;

  const chunks = ["%PDF-1.4\n"];
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(chunks.join("")));
    chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });
  const xrefOffset = Buffer.byteLength(chunks.join(""));
  chunks.push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  offsets.slice(1).forEach((offset) => chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`));
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  return Buffer.from(chunks.join(""), "utf8");
}

function legalAnalysisSections(analysis) {
  return [
    { heading: "Executive Summary", items: analysis.executiveSummary || [] },
    { heading: "Ownership Summary", items: analysis.ownershipSummary || [] },
    { heading: "Document Gaps", items: analysis.documentGaps || ["No major document gaps were identified from the structured data."] },
    { heading: "Risks", items: analysis.risks || ["No major risks were identified from the structured data."] },
    { heading: "Recommendations", items: analysis.recommendations || [] },
  ];
}

async function generateLegalReport(payload) {
  let analysis;
  try {
    analysis = await openAiLegalAnalysis(payload);
  } catch (error) {
    analysis = { ...fallbackLegalAnalysis(payload), llmError: error.message };
  }
  if (!analysis) analysis = fallbackLegalAnalysis(payload);
  const pdfBuffer = createSimplePdf(analysis.title || "Full Legal Report Summary", legalAnalysisSections(analysis));
  const filename = `full-legal-report-${Date.now()}.pdf`;
  const pdfUrl = storeDocument(pdfBuffer, "application/pdf", filename);
  return { analysis, pdfUrl, filename };
}

async function generateClaudeReview(payload) {
  let review;
  try {
    review = await claudeReviewAnalysis(payload);
  } catch (error) {
    review = { ...fallbackClaudeReview(payload), llmError: error.message };
  }
  if (!review) review = fallbackClaudeReview(payload);
  return { review };
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function findValueAfter(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`${escaped}\\s*(?:is\\s*)?:\\s*([^:]+?)(?=\\s+[A-Z][A-Za-z ]{2,}\\s*:|\\s+RTC Documents|\\s+OnGoing|$)`, "i"));
  return match ? match[1].trim() : "";
}

function cleanKhathaNumber(value = "") {
  const text = normalizeText(value)
    .replace(/^(?:Khata|Khatha|Katha|Khatah|ಖಾತೆ?|ಖತಾ)\s*(?:No|Number|ನಂ|ಸಂಖ್ಯೆ)?\s*[:\-]?\s*/i, "")
    .replace(/\s+(?:Owner|Extent|Rights|Liabilities|Acquisition|Possession|ಮಾಲೀಕ|ವಿಸ್ತೀರ್ಣ|ಹಕ್ಕು|ಋಣ).*$/i, "")
    .trim();
  if (!text || text === "-") return "";
  if (/^(?:no|number|records?|found|select|owner|extent|ಖಾತೆ?|ಖತಾ)$/i.test(text)) return "";
  if (text.length > 80) return "";
  return text;
}

function isLikelyKhathaNumber(value = "") {
  const text = cleanKhathaNumber(value);
  if (!text) return false;
  if (/[0-9]/.test(text)) return true;
  return /^[A-Z]{1,8}[/-]?[A-Z0-9]{1,12}$/i.test(text);
}

function matchingCellIndex(headers = [], patterns = []) {
  return headers.findIndex((header) => patterns.some((pattern) => pattern.test(String(header || ""))));
}

function extractOwnerRows(rows) {
  const headerIndex = rows.findIndex((row) => (
    row.some((cell) => /^(?:owner|owner\s*name)|ಮಾಲೀಕ|ಹೆಸರು|ಹಕ್ಕುದಾರ/i.test(cell))
      && row.some((cell) => /extent|ವಿಸ್ತೀರ್ಣ|ವಿಸ್ತೀರ್ಣ/i.test(cell))
  ));
  if (headerIndex === -1) return [];
  const headers = rows[headerIndex].map((header) => String(header || "").toLowerCase());
  const ownerIndex = matchingCellIndex(headers, [/^(?:owner|owner\s*name)$/i, /ಮಾಲೀಕ|ಹೆಸರು|ಹಕ್ಕುದಾರ/i]);
  const extentIndex = matchingCellIndex(headers, [/^extent$/i, /ವಿಸ್ತೀರ್ಣ|ವಿಸ್ತೀರ್ಣ/i]);
  const khataIndex = matchingCellIndex(headers, [/khata|khatah|khatha|katha|ಖಾತ|ಖತಾ/i]);
  const categoryIndex = headers.findIndex((header) => header.includes("owner category"));
  const govRestrictionIndex = headers.findIndex((header) => header.includes("gov restriction"));
  const courtStayIndex = headers.findIndex((header) => header.includes("court stay"));
  const alienatedIndex = headers.findIndex((header) => header.includes("alienated"));

  return rows.slice(headerIndex + 1)
    .filter((row) => row[ownerIndex] || row[extentIndex])
    .map((row) => ({
      owner: row[ownerIndex] || "",
      extent: row[extentIndex] || "",
      khata: cleanKhathaNumber(row[khataIndex] || ""),
      category: row[categoryIndex] || "",
      govRestriction: row[govRestrictionIndex] || "",
      courtStay: row[courtStayIndex] || "",
      alienated: row[alienatedIndex] || "",
    }));
}

function khathaNumberFromRtcRows(rows = []) {
  const ownerRows = extractOwnerRows(rows);
  const fromOwnerRows = uniq(ownerRows.map((row) => cleanKhathaNumber(row.khata)).filter(isLikelyKhathaNumber));
  if (fromOwnerRows.length) return fromOwnerRows.join(", ");

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] || [];
    for (let cellIndex = 0; cellIndex < row.length; cellIndex += 1) {
      const cell = String(row[cellIndex] || "");
      if (!/khata|khatah|khatha|katha|ಖಾತ|ಖತಾ/i.test(cell)) continue;
      const candidates = [
        row[cellIndex + 1],
        row[cellIndex - 1],
        rows[rowIndex + 1]?.[cellIndex],
        rows[rowIndex + 1]?.[cellIndex + 1],
      ].map(cleanKhathaNumber).filter(isLikelyKhathaNumber);
      if (candidates.length) return uniq(candidates).join(", ");
    }
  }
  return "";
}

function khathaNumberFromRtcText(text = "") {
  const patterns = [
    /(?:Khata|Khatha|Katha|Khatah)\s*(?:No|Number)?\s*[:\-]?\s*([A-Za-z0-9/-]+)/i,
    /(?:ಖಾತೆ?|ಖತಾ)\s*(?:ನಂ|ಸಂಖ್ಯೆ)?\s*[:\-]?\s*([A-Za-z0-9/-]+)/i,
  ];
  for (const pattern of patterns) {
    const value = cleanKhathaNumber((String(text || "").match(pattern) || [])[1] || "");
    if (isLikelyKhathaNumber(value)) return value;
  }
  return "";
}

function rtcRecordFromSummary({ mode, label, summary, values }) {
  const ownerRows = extractOwnerRows(summary.rows || []);
  const text = summary.text || "";
  const labelYear = (label.match(/\(([^)]+)\)/) || [])[1]?.trim() || "";
  const khataNumber = khathaNumberFromRtcRows(summary.rows || [])
    || khathaNumberFromRtcText(text)
    || cleanKhathaNumber(findValueAfter(text, "Khatah Number"))
    || cleanKhathaNumber(findValueAfter(text, "Khata Number"));
  return {
    type: mode === "old" ? "Old RTC" : "Current RTC",
    period: label || values.periodLabel || "",
    year: labelYear || values.yearLabel || values.year || "",
    village: values.villageLabel || values.village || findValueAfter(text, "Village"),
    survey: values.survey || findValueAfter(text, "Survey No"),
    surnoc: values.surnocLabel || values.surnoc || "",
    hissa: values.hissaLabel || values.hissa || "",
    landId: (text.match(/Your Land ID is\s*:\s*([0-9 ]+)/i) || [])[1]?.trim() || "",
    khataNumber,
    ongoingMutation: (text.match(/OnGoing Mutation\s*:\s*(Yes|No)/i) || [])[1] || "",
    owners: ownerRows.map((row) => row.owner),
    extents: ownerRows.map((row) => row.extent),
    ownerCategories: uniq(ownerRows.map((row) => row.category)),
    govRestrictions: uniq(ownerRows.map((row) => row.govRestriction)),
    courtStays: uniq(ownerRows.map((row) => row.courtStay)),
    alienated: uniq(ownerRows.map((row) => row.alienated)),
    ownerDetails: ownerRows,
    notes: ownerRows.length ? "" : text.slice(0, 360),
  };
}

function parseState(session) {
  if (session.sourceType === "echawadi") return parseEchawadiLocationState(session);
  const html = session.html;
  return {
    sessionId: session.id,
    lastUpdated: new Date().toISOString(),
    source: BHOOMI_URL,
    selects: {
      district: selectBlock(html, fields.district.id),
      taluk: selectBlock(html, fields.taluk.id),
      hobli: selectBlock(html, fields.hobli.id),
      village: selectBlock(html, fields.village.id),
      surnoc: selectBlock(html, fields.surnoc.id),
      hissa: selectBlock(html, fields.hissa.id),
      period: selectBlock(html, fields.period.id),
      year: selectBlock(html, fields.year.id),
    },
    survey: inputState(html, fields.survey.id),
    canGo: !buttonState(html, buttons.go.id).disabled,
    canFetch: !buttonState(html, buttons.fetch.id).disabled,
    details: {
      village: stripTags((html.match(/id=["']ctl00_MainContent_lblCValueVillage["'][^>]*>([\s\S]*?)<\/span>/i) || [])[1] || ""),
      survey: stripTags((html.match(/id=["']ctl00_MainContent_lblCvalueSurveyNo["'][^>]*>([\s\S]*?)<\/span>/i) || [])[1] || ""),
      surnoc: stripTags((html.match(/id=["']ctl00_MainContent_lblCValueSurnoc["'][^>]*>([\s\S]*?)<\/span>/i) || [])[1] || ""),
      hissa: stripTags((html.match(/id=["']ctl00_MainContent_lblCValueHissaNo["'][^>]*>([\s\S]*?)<\/span>/i) || [])[1] || ""),
      period: stripTags((html.match(/id=["']ctl00_MainContent_lblCValuePeriod["'][^>]*>([\s\S]*?)<\/span>/i) || [])[1] || ""),
      year: stripTags((html.match(/id=["']ctl00_MainContent_lblCValueYear["'][^>]*>([\s\S]*?)<\/span>/i) || [])[1] || ""),
    },
  };
}

function stateOption(value, label, selected = false) {
  return { value: numberString(value), label: label || numberString(value), selected };
}

function stateSelect(options = [], selected = "", disabled = false) {
  const normalizedSelected = numberString(selected);
  return {
    disabled,
    selected: normalizedSelected,
    options: options.map((option) => ({
      ...option,
      selected: Boolean(normalizedSelected && numberString(option.value) === normalizedSelected),
    })),
  };
}

function echawadiOptions(rows = [], codeKey, labelKey) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => stateOption(row[codeKey], row[labelKey]))
    .filter((option) => option.value);
}

function parseEchawadiLocationState(session) {
  const selected = session.selected || {};
  return {
    sessionId: session.id,
    lastUpdated: new Date().toISOString(),
    source: ECHAWADI_API_URL,
    sourceType: "echawadi",
    selects: {
      district: stateSelect([stateOption("", "Select District"), ...(session.options?.district || [])], selected.district, false),
      taluk: stateSelect([stateOption("", "Select Taluk"), ...(session.options?.taluk || [])], selected.taluk, !selected.district),
      hobli: stateSelect([stateOption("", "Select Hobli"), ...(session.options?.hobli || [])], selected.hobli, !selected.taluk),
      village: stateSelect([stateOption("", "Select Village"), ...(session.options?.village || [])], selected.village, !selected.hobli),
      surnoc: stateSelect([stateOption("", "Not required")], "", true),
      hissa: stateSelect([stateOption("", "Not required")], "", true),
      period: stateSelect([stateOption("", "Not required")], "", true),
      year: stateSelect([stateOption("", "Not required")], "", true),
    },
    survey: { disabled: true, value: "" },
    canGo: false,
    canFetch: Boolean(selected.district && selected.taluk && selected.hobli && selected.village),
    details: {},
  };
}

async function createEchawadiLocationSession() {
  const districts = await fetchEchawadiJson("LoadDistrict", {});
  const session = {
    id: randomUUID(),
    sourceType: "echawadi",
    url: ECHAWADI_API_URL,
    selected: {},
    options: {
      district: echawadiOptions(districts?.data, "district_code", "district_name_kn"),
      taluk: [],
      hobli: [],
      village: [],
    },
    updatedAt: Date.now(),
  };
  sessions.set(session.id, session);
  return session;
}

async function updateEchawadiLocationSession(session, field, value, values = {}) {
  if (field === "district") {
    session.selected = { district: numberString(value) };
    const taluks = await fetchEchawadiJson("LoadTaluk", { pDistCode: session.selected.district });
    session.options.taluk = echawadiOptions(taluks?.data, "taluka_code", "taluka_name_kn");
    session.options.hobli = [];
    session.options.village = [];
  } else if (field === "taluk") {
    session.selected = {
      district: numberString(values.district || session.selected.district),
      taluk: numberString(value),
    };
    const hoblis = await fetchEchawadiJson("LoadHobli", {
      pDistCode: session.selected.district,
      pTalukCode: session.selected.taluk,
    });
    session.options.hobli = echawadiOptions(hoblis?.data, "hobli_code", "hobli_name_kn");
    session.options.village = [];
  } else if (field === "hobli") {
    session.selected = {
      district: numberString(values.district || session.selected.district),
      taluk: numberString(values.taluk || session.selected.taluk),
      hobli: numberString(value),
    };
    const villages = await fetchEchawadiJson("LoadVillage", {
      pDistCode: session.selected.district,
      pTalukCode: session.selected.taluk,
      pHobliCode: session.selected.hobli,
    });
    session.options.village = echawadiOptions(villages?.data, "village_code", "village_name_kn");
  } else if (field === "village") {
    session.selected = {
      district: numberString(values.district || session.selected.district),
      taluk: numberString(values.taluk || session.selected.taluk),
      hobli: numberString(values.hobli || session.selected.hobli),
      village: numberString(value),
    };
  }
  session.updatedAt = Date.now();
}

function buildForm(session, values, eventTarget = "", fieldConfig = fields) {
  const params = new URLSearchParams();
  params.set("__EVENTTARGET", eventTarget);
  params.set("__EVENTARGUMENT", "");
  params.set("__VIEWSTATE", hiddenValue(session.html, "__VIEWSTATE"));
  params.set("__VIEWSTATEGENERATOR", hiddenValue(session.html, "__VIEWSTATEGENERATOR"));
  params.set("__VIEWSTATEENCRYPTED", hiddenValue(session.html, "__VIEWSTATEENCRYPTED"));
  params.set("__EVENTVALIDATION", hiddenValue(session.html, "__EVENTVALIDATION"));

  for (const [key, field] of Object.entries(fieldConfig)) {
    const select = key === "survey" ? inputState(session.html, field.id) : selectBlock(session.html, field.id);
    const value = values[key] ?? (key === "survey" ? select.value : select.selected);
    if (!select.disabled && value !== undefined && value !== "") {
      params.set(field.name, value);
    }
  }

  return params;
}

async function fetchOfficial(session, body, url = session.url || BHOOMI_URL) {
  const response = await officialFetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: session.cookie,
      referer: url,
    },
    body,
  }, "Bhoomi official site");

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Official site returned HTTP ${response.status}`);
  }
  const cookie = (response.headers.get("set-cookie") || "").split(";")[0];
  if (cookie) session.cookie = cookie;
  session.html = text;
  session.updatedAt = Date.now();
}

async function fetchOfficialText(session, url, referer = session.url || url) {
  const response = await officialFetch(url, {
    headers: {
      cookie: session.cookie,
      referer,
    },
  }, "Bhoomi official site");
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Official site returned HTTP ${response.status}`);
  }
  const cookie = (response.headers.get("set-cookie") || "").split(";")[0];
  if (cookie) session.cookie = cookie;
  return text;
}

async function createSession() {
  const response = await officialFetch(BHOOMI_URL, {}, "Bhoomi Service2");
  const html = await response.text();
  if (!response.ok) {
    throw new Error(`Official site returned HTTP ${response.status}`);
  }
  const cookie = (response.headers.get("set-cookie") || "").split(";")[0];
  const session = { id: randomUUID(), cookie, html, url: BHOOMI_URL, updatedAt: Date.now() };
  sessions.set(session.id, session);
  return session;
}

async function createServiceSession(url, body) {
  const response = await officialFetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  }, "Bhoomi official site");
  const html = await response.text();
  if (!response.ok) {
    throw new Error(`Official site returned HTTP ${response.status}`);
  }
  return {
    id: randomUUID(),
    cookie: (response.headers.get("set-cookie") || "").split(";")[0],
    html,
    url,
    updatedAt: Date.now(),
  };
}

function firstUsableOption(select, preferredValue, preferredLabel = "") {
  if (preferredValue && select.options.some((option) => option.value === preferredValue && !/^select /i.test(option.label))) {
    return preferredValue;
  }
  if (preferredLabel) {
    const normalizedLabel = String(preferredLabel).trim();
    const byLabel = select.options.find((option) => option.label.trim() === normalizedLabel && !/^select /i.test(option.label));
    if (byLabel) return byLabel.value;
  }
  return select.options.find((option) => option.value && !/^select /i.test(option.label) && !/^select /i.test(option.value))?.value || "";
}

function usableOptions(select) {
  return select.options.filter((option) => option.value && !/^select /i.test(option.value) && !/^select /i.test(option.label));
}

function dedupeRtcRows(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = JSON.stringify([
      row.type,
      row.period,
      row.year,
      row.survey,
      row.surnoc,
      row.hissa,
    ]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeComparable(value = "") {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function yearsFromText(value = "") {
  return [...String(value || "").matchAll(/\b(?:19|20)\d{2}\s*-\s*(?:19|20)\d{2}\b/g)]
    .map((match) => match[0].replace(/\s+/g, ""));
}

function uniqueSortedYears(values = []) {
  return uniq(values)
    .sort((a, b) => Number(b.slice(0, 4)) - Number(a.slice(0, 4)));
}

function ownerStateKeyFromRows(ownerRows = []) {
  const details = ownerRows
    .map((row) => [
      normalizeComparable(row.owner),
      normalizeComparable(row.extent),
      normalizeComparable(row.khata),
    ].join("|"))
    .filter((value) => value.replace(/\|/g, ""))
    .sort();
  return details.join("||");
}

function ownerStateKeyFromRtcRow(row) {
  const details = (row.ownerDetails || []).length
    ? ownerStateKeyFromRows(row.ownerDetails)
    : (row.owners || []).map((owner, index) => [
      normalizeComparable(owner),
      normalizeComparable(row.extents?.[index] || ""),
      normalizeComparable(row.khataNumber || ""),
    ].join("|")).sort().join("||");
  return details || normalizeComparable([row.khataNumber, row.notes].filter(Boolean).join("|"));
}

function ownerStateKeyFromRecord(record) {
  return ownerStateKeyFromRows(extractOwnerRows(record.summary?.rows || []))
    || normalizeComparable(record.summary?.text || record.label || "");
}

function mergeYearLabels(existing = "", additions = []) {
  const years = uniqueSortedYears([...yearsFromText(existing), ...additions.flatMap(yearsFromText)]);
  return years.length ? years.join("\n") : existing;
}

function dedupeOldRtcRows(rows) {
  const merged = new Map();
  for (const row of rows) {
    if (row.type !== "Old RTC") {
      merged.set(`current:${JSON.stringify(row)}`, row);
      continue;
    }
    const key = JSON.stringify([
      row.type,
      row.survey,
      row.surnoc,
      row.hissa,
      ownerStateKeyFromRtcRow(row),
    ]);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...row });
      continue;
    }
    const mergedYears = mergeYearLabels(existing.year, [row.year, row.period]);
    existing.year = mergedYears;
    existing.period = mergeYearLabels(existing.period, [row.period, row.year]) || existing.period;
  }
  return [...merged.values()];
}

function dedupeOldRtcRecords(records) {
  const merged = new Map();
  for (const record of records) {
    const key = ownerStateKeyFromRecord(record);
    if (!key || /select district|owner details details/i.test(record.summary?.text || "")) {
      continue;
    }
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...record, duplicateLabels: [record.label].filter(Boolean) });
      continue;
    }
    existing.duplicateLabels.push(record.label);
  }

  return [
    ...[...merged.values()].map((record) => {
      const years = mergeYearLabels("", record.duplicateLabels);
      const dateRanges = uniq(record.duplicateLabels.map((label) => String(label || "").split("|")[0].trim()).filter(Boolean));
      return {
        ...record,
        label: [
          dateRanges[0] || record.label,
          years ? `Years: ${years}` : "",
        ].filter(Boolean).join(" | "),
        summary: {
          ...record.summary,
          rows: record.summary?.rows || [],
          text: [
            record.summary?.text || "",
            record.duplicateLabels.length > 1 ? `Collapsed ${record.duplicateLabels.length} duplicate RTC entries with the same owner/extent state.` : "",
          ].filter(Boolean).join(" "),
        },
      };
    }),
  ];
}

function oldRtcRecordsFromRows(rows) {
  return rows
    .filter((row) => row.type === "Old RTC")
    .map((row) => {
      const ownerRows = (row.ownerDetails || []).length
        ? row.ownerDetails.map((owner) => [owner.owner || "-", owner.extent || "-", owner.khata || row.khataNumber || "-"])
        : (row.owners || []).map((owner, index) => [owner || "-", row.extents?.[index] || "-", row.khataNumber || "-"]);
      return {
        label: row.period || row.year || "Old RTC",
        summary: {
          hasData: ownerRows.length > 0,
          text: ownerRows.length ? "Old RTC owner, extent and khata state parsed from Bhoomi." : "No owner rows parsed.",
          rows: ownerRows.length ? [["Owner", "Extent", "Khatah Number"], ...ownerRows] : [["Status", "No owner rows parsed"]],
        },
      };
    });
}

function khathaRecordFromNumber(khathaNumber, source) {
  return {
    label: source,
    summary: {
      hasData: Boolean(khathaNumber),
      text: khathaNumber ? `Khatha number found from ${source}` : "Khatha number was not found",
      rows: khathaNumber ? [["Khata Number / ಖಾತೆ ನಂ", khathaNumber], ["Source", source]] : [["Status", "Khatha number was not found"]],
    },
  };
}

function enrichKhathaSection(khathaSection, khathaNumber, source) {
  if (!khathaSection || !khathaNumber) return;
  khathaSection.khathaNumber = khathaSection.khathaNumber || khathaNumber;
  const existing = firstSummaryValue(khathaSection.records || [], bilingualFields.khata);
  if (existing) return;
  khathaSection.status = "Fetched";
  khathaSection.records = [khathaRecordFromNumber(khathaNumber, source), ...(khathaSection.records || [])];
}

function currentRtcKhathaNumber(reportOrSection) {
  const sections = Array.isArray(reportOrSection) ? reportOrSection : [reportOrSection].filter(Boolean);
  const currentSections = sections.filter((section) => section?.title === "Current Year RTC");
  const rtcRows = currentSections.flatMap((section) => section.rtcRows || []);
  const currentValues = uniq(rtcRows
    .filter((row) => row.type === "Current RTC")
    .map((row) => cleanKhathaNumber(row.khataNumber))
    .filter(isLikelyKhathaNumber));
  if (currentValues.length) {
    return { number: currentValues.join(", "), source: "Latest RTC Section 9" };
  }

  const records = currentSections.flatMap((section) => section.rawRecords || section.records || []);
  const rowValues = uniq(records
    .map((record) => khathaNumberFromRtcRows(record.summary?.rows || []))
    .map(cleanKhathaNumber)
    .filter(isLikelyKhathaNumber));
  if (rowValues.length) return { number: rowValues.join(", "), source: "Latest RTC Section 9 table" };

  const textValues = uniq(records
    .map((record) => khathaNumberFromRtcText(record.summary?.text || ""))
    .map(cleanKhathaNumber)
    .filter(isLikelyKhathaNumber));
  if (textValues.length) return { number: textValues.join(", "), source: "Latest RTC text" };
  return { number: "", source: "" };
}

async function enrichKhathaSectionByNumber(khathaSection, values, khathaNumber) {
  if (!khathaSection || !khathaNumber) return;
  if ((khathaSection.records || []).some((record) => record.label === "Khatha details by Katha Number")) return;
  try {
    const record = await fetchKhathaByNumberRecord(values, khathaNumber);
    khathaSection.status = record.summary?.hasData ? "Fetched" : khathaSection.status;
    khathaSection.records = [record, ...(khathaSection.records || [])];
  } catch (error) {
    khathaSection.records = [
      {
        label: "Khatha details by Katha Number",
        summary: {
          hasData: false,
          text: `Could not fetch Khatha details by number: ${error.message}`,
          rows: [["Status", `Could not fetch Khatha details by number: ${error.message}`]],
        },
      },
      ...(khathaSection.records || []),
    ];
  }
}

async function postSelection(session, fieldConfig, key, value, values, url = session.url) {
  const field = fieldConfig[key];
  const form = buildForm(session, { ...values, [key]: value }, field.target, fieldConfig);
  form.set(field.name, value);
  await fetchOfficial(session, form, url);
}

async function switchToOldYear(session) {
  const form = buildForm(session, {}, "", currentFields);
  form.set(oldButtons.tab.name, oldButtons.tab.value);
  await fetchOfficial(session, form, BHOOMI_URL);
}

async function prepareSurveyFlow(session, fieldConfig, values, options = {}) {
  const keys = ["district", "taluk", "hobli", "village"];
  const selected = {};
  for (const key of keys) {
    const value = values[key];
    if (!value) throw new Error(`Missing ${key}`);
    selected[key] = value;
    await postSelection(session, fieldConfig, key, value, selected, session.url);
  }

  selected.survey = values.survey;
  const surveyField = fieldConfig.survey;
  if (options.goButton) {
    const form = buildForm(session, selected, "", fieldConfig);
    form.set(surveyField.name, values.survey);
    form.set(options.goButton.name, options.goButton.value);
    await fetchOfficial(session, form, session.url);
  } else {
    await postSelection(session, fieldConfig, "survey", values.survey, selected, session.url);
  }

  if (fieldConfig.surnoc) {
    const surnoc = firstUsableOption(
      selectBlock(session.html, fieldConfig.surnoc.id),
      options.preferredSurnocValue ?? values.surnoc,
      options.preferredSurnocLabel ?? values.surnocLabel,
    );
    if (surnoc) {
      selected.surnoc = surnoc;
      await postSelection(session, fieldConfig, "surnoc", surnoc, selected, session.url);
    }
  }

  if (fieldConfig.hissa) {
    const hissa = firstUsableOption(
      selectBlock(session.html, fieldConfig.hissa.id),
      options.preferredHissaValue ?? values.hissa,
      options.preferredHissaLabel ?? values.hissaLabel,
    );
    if (hissa) {
      selected.hissa = hissa;
      await postSelection(session, fieldConfig, "hissa", hissa, selected, session.url);
    }
  }

  return selected;
}

async function fetchRtcSection(mode, values, options = {}) {
  const session = await createServiceSession(BHOOMI_URL);
  const fieldConfig = mode === "old" ? oldFields : currentFields;
  const buttonConfig = mode === "old" ? oldButtons : buttons;
  if (mode === "old") await switchToOldYear(session);

  const selected = await prepareSurveyFlow(session, fieldConfig, values, { goButton: buttonConfig.go });
  const periodSelect = selectBlock(session.html, fieldConfig.period.id);
  const periodOptions = usableOptions(periodSelect);

  const preferredPeriod = mode === "current" && values.period
    ? periodOptions.find((option) => option.value === values.period)
    : null;
  const wantedPeriods = preferredPeriod ? [preferredPeriod] : periodOptions;
  const records = [];
  for (const periodOption of wantedPeriods) {
    const period = periodOption.value;
    const periodProbe = await createServiceSession(BHOOMI_URL);
    if (mode === "old") await switchToOldYear(periodProbe);
    const selectedForPeriod = await prepareSurveyFlow(periodProbe, fieldConfig, { ...values, ...selected }, { goButton: buttonConfig.go });
    if (fieldConfig.period) await postSelection(periodProbe, fieldConfig, "period", period, { ...values, ...selectedForPeriod, period }, periodProbe.url);

    const yearOptions = mode === "old" && fieldConfig.year ? usableOptions(selectBlock(periodProbe.html, fieldConfig.year.id)) : [];
    const yearsToFetch = yearOptions.length ? yearOptions : [{ value: "", label: "" }];
    const periodHtml = periodProbe.html;
    const periodCookie = periodProbe.cookie;
    for (const yearOption of yearsToFetch) {
      const working = {
        ...periodProbe,
        id: randomUUID(),
        html: periodHtml,
        cookie: periodCookie,
        updatedAt: Date.now(),
      };
      const rtcValues = { ...values, ...selectedForPeriod, period };
      if (yearOption.value) {
        rtcValues.year = yearOption.value;
        rtcValues.yearLabel = yearOption.label;
        await postSelection(working, fieldConfig, "year", yearOption.value, rtcValues, working.url);
      }
      const form = buildForm(working, rtcValues, "", fieldConfig);
      form.set(buttonConfig.fetch.name, buttonConfig.fetch.value);
      await fetchOfficial(working, form, working.url);
      const html = sanitizeResultHtml(working.html, BHOOMI_URL) || officialContentHtml(working.html, BHOOMI_URL);
      const periodLabel = periodOption.label || selectedLabel(working.html, "period", period, fieldConfig) || period;
      const yearLabel = yearOption.label || selectedLabel(working.html, "year", yearOption.value, fieldConfig);
      const label = [periodLabel, yearLabel].filter(Boolean).join(" | ");
      const summary = summarizeOfficialHtml(html);
      const rtc = rtcRecordFromSummary({ mode, label: periodLabel, summary, values: { ...rtcValues, periodLabel, yearLabel } });
      const rtcKey = JSON.stringify([
        rtc.type,
        rtc.survey,
        rtc.surnoc,
        rtc.hissa,
        rtc.period,
        rtc.year,
        ownerStateKeyFromRtcRow(rtc),
      ]);
      records.push({
        label,
        summary,
        rtc,
        rtcKey,
      });
      if (mode === "current" || options.includeOfficialPreviews) {
        try {
          const previewRecord = mode === "current"
            ? await fetchCurrentRtcPreviewRecord(working, { ...rtcValues, periodLabel, yearLabel }, label)
            : await fetchRtcPreviewRecord(working, { ...rtcValues, periodLabel, yearLabel }, label, fieldConfig, oldPreviewButton, "old");
          previewRecord.rtcKey = rtcKey;
          previewRecord.rtc = rtc;
          records.push(previewRecord);
        } catch (error) {
          records.push({
            label: `${mode === "old" ? "Old" : "Current"} RTC official View page`,
            rtcKey,
            rtc,
            attachmentError: "Details Not Available or Not able to fetch RTC",
            summary: {
              hasData: false,
              text: `Could not fetch official RTC View image: ${error.message}`,
              rows: [["Status", `Could not fetch official RTC View image: ${error.message}`]],
            },
          });
        }
      }
    }
  }

  const rtcRows = dedupeOldRtcRows(dedupeRtcRows(records.map((record) => record.rtc).filter(Boolean)));
  const dedupedOldRecords = mode === "old" ? dedupeOldRtcRecords(records) : [];
  const displayRecords = mode === "old"
    ? (dedupedOldRecords.length ? dedupedOldRecords : oldRtcRecordsFromRows(rtcRows))
    : records;
  return {
    title: mode === "old" ? "Old Year RTC" : "Current Year RTC",
    status: displayRecords.length ? "Fetched" : "No period available",
    records: displayRecords,
    rawRecords: records,
    rtcRows,
    availablePeriods: periodOptions,
  };
}

async function fetchMutationSection(kind, values) {
  const url = kind === "status" ? MR_STATUS_URL : MR_EXTRACT_URL;
  const fieldConfig = kind === "status" ? mutationStatusFields : mutationExtractFields;
  const buttonConfig = kind === "status" ? mutationStatusButtons : mutationExtractButtons;
  const session = await createServiceSession(url, new URLSearchParams({ UserName: "" }));

  const selected = await prepareSurveyFlow(session, fieldConfig, values, kind === "status" ? {
    preferredHissaValue: "",
    preferredHissaLabel: "*",
  } : {});
  const form = buildForm(session, { ...values, ...selected }, "", fieldConfig);
  form.set(buttonConfig.fetch.name, buttonConfig.fetch.value);
  await fetchOfficial(session, form, url);
  const summary = kind === "status" ? parseMutationStatusSummary(session.html) : parseMutationRegisterSummary(session.html, values);
  return {
    title: kind === "status" ? "Mutation Status" : "Mutation Register",
    status: summary.hasData ? "Fetched" : "No details returned",
    records: [{ label: kind === "status" ? "MR status by survey number" : "MR extract by survey number", summary }],
  };
}

async function fetchKhathaSection(values) {
  const session = await createServiceSession(KHATHA_URL);
  const radioForm = buildForm(session, {}, "rbnSurveyNum", {});
  radioForm.set("a", "rbnSurveyNum");
  await fetchOfficial(session, radioForm, KHATHA_URL);

  const selected = {};
  for (const key of ["district", "taluk", "hobli", "village"]) {
    const field = khathaFields[key];
    const value = values[key];
    if (!value) throw new Error(`Missing ${key}`);
    selected[key] = value;
    const form = buildForm(session, selected, field.target, khathaFields);
    form.set("a", "rbnSurveyNum");
    form.set(field.name, value);
    await fetchOfficial(session, form, KHATHA_URL);
  }

  const form = buildForm(session, { ...selected, survey: values.survey || "" }, "", khathaFields);
  form.set("a", "rbnSurveyNum");
  form.set(khathaFields.survey.name, values.survey || "");
  form.set(khathaButtons.fetch.name, khathaButtons.fetch.value);
  await fetchOfficial(session, form, KHATHA_URL);

  let summary = parseKhathaSummary(session.html);
  let sourceLabel = "Khatha details by survey number";
  if (!khathaNumberFromSummary(summary)) {
    try {
      const fallback = await fetchKhathaSectionBySurveyFallback(values);
      if (fallback.summary?.hasData || fallback.khathaNumber) {
        summary = fallback.summary;
        sourceLabel = fallback.label;
      }
    } catch {
      // Keep the primary Service64 result; RTC and Advanced RTC fallbacks still run.
    }
  }
  return {
    title: "Khatha Number",
    status: summary.hasData ? "Fetched" : "No details returned",
    records: [{ label: sourceLabel, summary }],
    khathaNumber: khathaNumberFromSummary(summary),
  };
}

async function fetchKhathaSectionBySurveyFallback(values) {
  const session = await createServiceSession(KHATHA_URL);
  const selected = {};
  for (const key of ["district", "taluk", "hobli", "village"]) {
    const field = khathaFields[key];
    const value = values[key];
    if (!value) throw new Error(`Missing ${key}`);
    selected[key] = value;
    const form = buildForm(session, selected, field.target, khathaFields);
    form.set("a", "rbnSurveyNum");
    form.set("rbnSurveyNum", "rbnSurveyNum");
    form.set(field.name, value);
    await fetchOfficial(session, form, KHATHA_URL);
  }

  const form = buildForm(session, { ...selected, survey: values.survey || "" }, "", khathaFields);
  form.set("a", "rbnSurveyNum");
  form.set("rbnSurveyNum", "rbnSurveyNum");
  form.set(khathaFields.survey.name, values.survey || "");
  form.set("txtSurveyNo", values.survey || "");
  form.set("SurveyNo", values.survey || "");
  form.set(khathaButtons.fetch.name, khathaButtons.fetch.value);
  await fetchOfficial(session, form, KHATHA_URL);
  const summary = parseKhathaSummary(session.html);
  return {
    label: "Khatha details by survey number fallback",
    summary,
    khathaNumber: khathaNumberFromSummary(summary),
  };
}

async function fetchKhathaByNumberRecord(values, khathaNumber) {
  const session = await createServiceSession(KHATHA_URL);
  const selected = {};
  for (const key of ["district", "taluk", "hobli", "village"]) {
    const field = khathaFields[key];
    const value = values[key];
    if (!value) throw new Error(`Missing ${key}`);
    selected[key] = value;
    const form = buildForm(session, selected, field.target, khathaFields);
    form.set("a", "rbnKhataNum");
    form.set(field.name, value);
    await fetchOfficial(session, form, KHATHA_URL);
  }

  const form = buildForm(session, { ...selected, survey: khathaNumber }, "", khathaFields);
  form.set("a", "rbnKhataNum");
  form.set(khathaFields.survey.name, khathaNumber);
  form.set(khathaButtons.fetch.name, khathaButtons.fetch.value);
  await fetchOfficial(session, form, KHATHA_URL);

  const summary = parseKhathaByNumberSummary(session.html, khathaNumber);
  const imageUrl = storeTableSnapshot(
    `Khatha details by Katha Number ${khathaNumber}`,
    values,
    summary.rows,
    `khatha-${khathaNumber || "number"}.svg`,
  );
  return {
    label: "Khatha details by Katha Number",
    summary,
    imageUrl,
    imageClass: "khatha-page",
  };
}

async function fetchAdvancedDetailsSection(values) {
  const selected = selectedSurveyParts(values);
  const ownerResponse = await fetchAdvancedRtcJson("FnGetSurveyDetailsUsingBhoomiIndex", {
    pDeptUserId: "",
    pDeptPass: "",
    pDistCode: values.district || "",
    pTlkCode: values.taluk || "",
    pHobliCode: values.hobli || "",
    pVillCode: values.village || "",
    sLang: "kn_in",
  });
  const ownerRows = advancedOwnerRows(ownerResponse?.Details || [], values);
  const detailResponse = await fetchAdvancedRtcJson("getXml_Dsrtc", {
    dist_code: values.district || "",
    taluk_code: values.taluk || "",
    hobli_code: values.hobli || "",
    village_code: values.village || "",
    surveyNo: selected.survey,
    surnoc: selected.surnoc,
    hissano: selected.hissa,
  });
  const records = advancedRecordsFromRtcData(detailResponse, ownerRows);
  let khathaNumber = advancedKhathaNumberFromBlock(Array.isArray(detailResponse) ? detailResponse.find(Boolean) : null)
    || firstSummaryValue(records, bilingualFields.khata);

  const hasDetailPayload = Array.isArray(detailResponse) && detailResponse.some(Boolean);
  if (!hasDetailPayload) {
    try {
      const rtcFallback = await fetchRtcSection("current", values);
      const fallbackRecords = advancedFallbackRecordsFromRtcSection(rtcFallback);
      records.push(...fallbackRecords);
      khathaNumber = khathaNumber
        || rtcFallback.rtcRows?.map((row) => row.khataNumber).find(Boolean)
        || firstSummaryValue(fallbackRecords, bilingualFields.khata);
    } catch (error) {
      records.push({
        label: "RTC fallback status",
        summary: {
          hasData: false,
          text: `Could not parse fallback RTC details: ${error.message}`,
          rows: [["Status", `Could not parse fallback RTC details: ${error.message}`]],
        },
      });
    }
  }
  const imageUrl = storeAdvancedSnapshot(values, records);
  records.push({
    label: "Advanced RTC page snapshot",
    summary: {
      hasData: true,
      text: "Printable Advanced RTC page snapshot prepared for the report.",
      rows: [["Snapshot", "Advanced RTC details page attached in the report"]],
    },
    imageUrl,
    imageClass: "advanced-rtc-page",
  });
  return {
    title: "Advanced Details",
    status: records.some((record) => record.summary?.hasData) ? "Fetched" : "No details returned",
    records,
    khathaNumber,
  };
}

async function fetchAkarbandSection(values) {
  const locationPayload = {
    distId: values.district || "",
    tlkId: values.taluk || "",
    hblId: values.hobli || "",
    vlgId: values.village || "",
  };
  const surveyData = await fetchAkarbandJson("GetSurveyNos", locationPayload);
  const entries = akarbandSurveyEntries(surveyData);
  const selection = chooseAkarbandSelection(entries, values);
  const response = await fetchAkarbandJson("GetAkarband", {
    ...locationPayload,
    syno: selection.survey,
    surnoc: selection.surnoc,
    hissa: selection.hissa,
  });

  const message = response.ReturnVal || response.ReturnValue || response.Message || "";
  const pdfBase64 = response.PdfFile || "";
  const rows = [];
  if (!selection.matched && selection.surveyAvailable) {
    rows.push(["Selection note", "Nearest available Akarband survey entry was used from the official list"]);
  }

  if (pdfBase64) {
    const buffer = Buffer.from(pdfBase64, "base64");
    const filename = `akarband-survey-${selection.survey || "record"}.pdf`.replace(/[^\w.-]+/g, "-");
    const { pdfUrl, imageUrl, imageError } = await storePdfWithPreview(buffer, filename);
    rows.push(["Certificate", "Official Akarband PDF fetched"]);
    if (imageError) rows.push(["Attachment preview", imageError]);
    return {
      title: "Akarband",
      status: "Fetched",
      records: [{
        label: "Akarband certificate",
        summary: {
          hasData: true,
          text: "Official Akarband PDF fetched from Bhoomojini.",
          rows,
        },
        pdfUrl,
        imageUrl,
        filename,
      }],
    };
  }

  rows.push(["Certificate", message || "Akarband document was not returned by the official service"]);
  return {
    title: "Akarband",
    status: "No details returned",
    records: [{
      label: "Akarband certificate by survey number",
      summary: {
        hasData: false,
        text: message || "Akarband document was not returned by the official service",
        rows,
      },
    }],
  };
}

async function fetchOwnershipMapSection(values) {
  const session = await createServiceSession(OWNERSHIP_HISTORY_URL);
  const selected = {};
  for (const key of ["district", "taluk", "hobli"]) {
    const field = ownershipHistoryFields[key];
    const value = values[key];
    if (!value) throw new Error(`Missing ${key}`);
    selected[key] = value;
    await postSelection(session, ownershipHistoryFields, key, value, selected, OWNERSHIP_HISTORY_URL);
  }

  selected.village = values.village || "";
  selected.survey = values.survey || "";
  const form = buildForm(session, selected, "", ownershipHistoryFields);
  form.set(ownershipHistoryFields.village.name, selected.village);
  form.set(ownershipHistoryFields.survey.name, selected.survey);
  form.set(ownershipHistoryButtons.fetch.name, ownershipHistoryButtons.fetch.value);
  await fetchOfficial(session, form, OWNERSHIP_HISTORY_URL);

  const popupPath = (session.html.match(/window\.open\('([^']*HtmlPendcysurveynoWise[^']*)'/i) || [])[1] || "HtmlPendcysurveynoWise.aspx";
  const popupUrl = new URL(popupPath, "https://landrecords.karnataka.gov.in/service40/").href;
  const popupHtml = await fetchOfficialText(session, popupUrl, OWNERSHIP_HISTORY_URL);
  const reportPath = (popupHtml.match(/window\.open\('([^']*BhoomiPendcySurveynoWise\.html[^']*)'/i) || [])[1];
  if (!reportPath) {
    const parsed = emptyOwnershipHistoryData(popupHtml);
    return {
      title: "Ownership Map",
      status: "No details returned",
      records: ownershipMapRecords(values, parsed, [
        ["Status", "Mutation history popup did not return a generated report"],
        ["Survey", selectedSurveyKey(values) || values.survey || "-"],
        ["Village", values.villageLabel || values.village || "-"],
        ["Source", OWNERSHIP_HISTORY_URL],
      ]),
    };
  }
  const reportUrl = new URL(reportPath, popupUrl).href;
  const reportHtml = await fetchOfficialText(session, reportUrl, popupUrl);
  const parsed = parseOwnershipHistoryReport(reportHtml, values);
  return {
    title: "Ownership Map",
    status: parsed.mutationRows.length ? "Fetched" : "No details returned",
    records: ownershipMapRecords(values, parsed),
  };
}

async function resolveEchawadiVillage(values) {
  const dist = numberString(values.district);
  const taluk = numberString(values.taluk);
  const hobli = numberString(values.hobli);
  const villageList = await fetchEchawadiJson("LoadVillage", {
    pDistCode: dist,
    pTalukCode: taluk,
    pHobliCode: hobli,
  });
  const villages = villageList?.data || [];
  const selectedVillage = numberString(values.village);
  const selectedLabel = normalizePlace(values.villageLabel || "");
  const matched = villages.find((village) => numberString(village.village_code) === selectedVillage)
    || villages.find((village) => selectedLabel && normalizePlace(village.village_name_kn) === selectedLabel);
  if (!matched) {
    throw new Error("Could not map selected village to eChawadi village code");
  }
  return {
    dist,
    taluk,
    hobli,
    village: `${numberString(matched.LGDCODE)}_${numberString(matched.village_code)}`,
    villageName: matched.village_name_kn || values.villageLabel || "",
  };
}

async function fetchEchawadiData(path, params) {
  const response = await fetchEchawadiJson(path, { paramObj: params });
  if (!response) return [];
  if (response.data === "nodata") return [];
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.Table)) return response.data.Table;
  return [];
}

async function fetchEchawadiSection(values) {
  const location = await resolveEchawadiVillage(values);
  const baseParams = {
    Dist: location.dist,
    Taluk: location.taluk,
    Hobli: location.hobli,
    Village: location.village,
  };
  const [
    mutations,
    rccmsPending,
    rccmsDisposed,
    rccmsRejected,
    conversions,
    renewableEnergy,
    industrialProjects,
    epouti,
  ] = await Promise.all([
    fetchEchawadiData("GetActiveCasesofMutationStatus", baseParams),
    fetchEchawadiData("GetActiveRCCMS", { ...baseParams, RCCMSSearchtype: "P" }),
    fetchEchawadiData("GetActiveRCCMS", { ...baseParams, RCCMSSearchtype: "D" }),
    fetchEchawadiData("GetActiveRCCMS", { ...baseParams, RCCMSSearchtype: "R" }),
    fetchEchawadiData("GetActiveConversionLand", { ...baseParams, LCDataSearchtype: "D" }),
    fetchEchawadiData("GetActiveConversionLand", { ...baseParams, LCDataSearchtype: "E" }),
    fetchEchawadiData("GetActiveConversionLand", { ...baseParams, LCDataSearchtype: "I" }),
    fetchEchawadiData("GetEpoutiData", baseParams),
  ]);

  const rccms = [
    ...rccmsPending.map((row) => ({ ...row, Case_Status: row.Case_Status || "Pending" })),
    ...rccmsDisposed.map((row) => ({ ...row, Case_Status: row.Case_Status || "Disposed" })),
    ...rccmsRejected.map((row) => ({ ...row, Case_Status: row.Case_Status || "Rejected" })),
  ];
  const total = mutations.length + rccms.length + conversions.length + renewableEnergy.length + industrialProjects.length + epouti.length;
  const records = [
    {
      label: "Village summary",
      summary: {
        hasData: total > 0,
        text: `${total} eChawadi item(s) found for ${location.villageName}`,
        rows: [
          ["Category", "Items", "Survey matches"],
          ["Mutations", mutations.length, mutations.filter((row) => rowMatchesSurvey(row, values)).length],
          ["RCCMS", rccms.length, rccms.filter((row) => rowMatchesSurvey(row, values)).length],
          ["Land Conversions", conversions.length, conversions.filter((row) => rowMatchesSurvey(row, values)).length],
          ["Renewable Energy / Industrial Projects", renewableEnergy.length + industrialProjects.length, [...renewableEnergy, ...industrialProjects].filter((row) => rowMatchesSurvey(row, values)).length],
          ["E-Pouti", epouti.length, epouti.filter((row) => rowMatchesSurvey(row, values)).length],
        ],
      },
    },
    eChawadiSummary("Mutations", mutations, values, ["MR Number", "Transaction", "Survey Numbers", "Applicant", "Acquisition", "Status"], (row) => [
      row.MRNumber,
      row.TypeofTransaction,
      row.SurveyNumbers,
      row.applicant,
      row.AcquisitionType,
      row.status,
    ]),
    eChawadiSummary("RCCMS", rccms, values, ["Case ID", "Survey / Surnoc / Hissa", "Owner", "Case Status", "Ack No"], (row) => [
      row.case_id,
      [row.Survey_no, row.surnoc || "-", row.hissano || "-"].filter(Boolean).join(" / "),
      row.ownername,
      row.Case_Status,
      row.Ack_No,
    ]),
    eChawadiSummary("Land Conversions", conversions, values, ["Request", "Survey No", "Applicant", "Purpose", "Sub Purpose", "Status"], (row) => [
      row.REQ_AID || row.REQ_ID,
      row.SurveyNo,
      row.ApplicantName,
      row.Purpose,
      row.SubPurpose,
      row.status,
    ]),
    eChawadiSummary("Renewable Energy / Industrial Projects", [...renewableEnergy, ...industrialProjects], values, ["Request", "Survey No", "Applicant", "Request Type", "Purpose", "Status"], (row) => [
      row.REQ_AID || row.REQ_ID,
      row.SurveyNo,
      row.ApplicantName,
      row.RequestType,
      row.Purpose,
      row.status,
    ]),
    eChawadiSummary("E-Pouti", epouti, values, ["Application No", "Survey No", "Owner", "Extent", "Status"], (row) => [
      row.Owner_Appl_No,
      row.survey_no,
      row.Owner_Name,
      row.Owner_Extent,
      row.Status_Description,
    ]),
  ];

  return {
    title: "eChawadi",
    status: total ? "Fetched" : "No details returned",
    records,
  };
}

async function fetchVillageScanReport(values) {
  const location = await resolveEchawadiVillage(values);
  const baseParams = {
    Dist: location.dist,
    Taluk: location.taluk,
    Hobli: location.hobli,
    Village: location.village,
  };
  const [
    mutations,
    conversions,
    renewableEnergy,
    industrialProjects,
    epouti,
  ] = await Promise.all([
    fetchEchawadiData("GetActiveCasesofMutationStatus", baseParams),
    fetchEchawadiData("GetActiveConversionLand", { ...baseParams, LCDataSearchtype: "D" }),
    fetchEchawadiData("GetActiveConversionLand", { ...baseParams, LCDataSearchtype: "E" }),
    fetchEchawadiData("GetActiveConversionLand", { ...baseParams, LCDataSearchtype: "I" }),
    fetchEchawadiData("GetEpoutiData", baseParams),
  ]);

  const allConversions = [
    ...conversions.map((row) => ({ ...row, scanType: row.RequestType || "Land Conversion" })),
    ...renewableEnergy.map((row) => ({ ...row, scanType: row.RequestType || "Renewable Energy" })),
    ...industrialProjects.map((row) => ({ ...row, scanType: row.RequestType || "Industrial Project" })),
  ];
  const tables = [
    villageScanTable("mutations", "Mutations in the Village", mutations, ["MR Number", "Transaction", "Survey Numbers", "Applicant", "Seller", "Buyer", "Acquisition", "Status", "Form-12", "Form-21"], dailyMutationTableRow),
    villageScanTable("conversions", "Land Conversions", allConversions, ["Request", "Survey No", "Applicant", "Type", "Purpose", "Status"], (row) => [
      rowField(row, ["REQ_AID", "REQ_ID", "RequestId", "RequestNo"]),
      rowField(row, ["SurveyNo", "Survey_no", "survey_no"]),
      rowField(row, ["ApplicantName", "Applicant", "applicant"]),
      rowField(row, ["scanType", "RequestType"]),
      rowField(row, ["Purpose", "SubPurpose"]),
      rowField(row, ["status", "Status"]),
    ]),
    villageScanTable("epouti", "E-Pouti", epouti, ["Application No", "Survey No", "Owner", "Extent", "Status"], (row) => [
      rowField(row, ["Owner_Appl_No", "ApplicationNo", "Appl_No"]),
      rowField(row, ["survey_no", "SurveyNo", "Survey_no"]),
      rowField(row, ["Owner_Name", "OwnerName", "ownername"]),
      rowField(row, ["Owner_Extent", "Extent"]),
      rowField(row, ["Status_Description", "status", "Status"]),
    ]),
  ];
  const total = tables.reduce((sum, table) => sum + table.count, 0);

  return {
    generatedAt: new Date().toISOString(),
    overview: {
      district: values.districtLabel || values.district || location.dist,
      taluk: values.talukLabel || values.taluk || location.taluk,
      hobli: values.hobliLabel || values.hobli || location.hobli,
      village: values.villageLabel || location.villageName || location.village,
      source: "eChawadi",
      totalItems: total,
    },
    tables,
    raw: {
      mutations,
      landConversions: conversions,
      renewableEnergy,
      industrialProjects,
      epouti,
    },
  };
}

async function echawadiVillagesForHobli(values = {}) {
  const dist = numberString(values.district);
  const taluk = numberString(values.taluk);
  const hobli = numberString(values.hobli);
  if (!dist || !taluk || !hobli) throw new Error("District, taluk and hobli are required for Daily Mutations Report.");
  const villages = await fetchEchawadiJson("LoadVillage", {
    pDistCode: dist,
    pTalukCode: taluk,
    pHobliCode: hobli,
  });
  return echawadiOptions(villages?.data, "village_code", "village_name_kn");
}

function dailyMutationRowsFromVillage(report = {}, village = {}) {
  const mutationTable = (report.tables || []).find((table) => table.id === "mutations" || /mutation/i.test(table.title || ""));
  return (mutationTable?.rows || []).map((row) => [
    village.label || report.overview?.village || "-",
    ...row,
  ]);
}

function dailyMutationReportHtml(report = {}) {
  const overview = report.overview || {};
  const headers = ["MR Number", "Transaction", "Survey Numbers", "Applicant", "Seller", "Buyer", "Acquisition", "Status", "Form-12", "Form-21"];
  return `
    <article class="print-document daily-mutations-print-document">
      <header class="print-title">
        <h1>Daily Mutations Report</h1>
        <p>${htmlEscape([overview.hobli, overview.taluk, overview.district].filter(Boolean).join(", ") || "Selected Hobli")}</p>
      </header>
      <section class="print-section">
        <h2>Hobli Summary</h2>
        ${rowsHtml([
          ["District", overview.district || "-"],
          ["Taluk", overview.taluk || "-"],
          ["Hobli", overview.hobli || "-"],
          ["Villages Scanned", overview.villagesScanned || 0],
          ["Mutations Found", overview.totalMutations || 0],
          ["Generated", report.generatedAt || "-"],
        ])}
      </section>
      ${(report.villages || []).map((item) => `
        <section class="print-section">
          <h2>${htmlEscape(item.villageName || "Village")}</h2>
          ${item.error ? `<p class="error-card">${htmlEscape(item.error)}</p>` : ""}
          ${genericTableHtml({ header: headers, rows: item.mutations || [] }) || `<p>No Ongoing Mutations for ${htmlEscape(item.villageName || "selected")} village.</p>`}
        </section>
      `).join("")}
    </article>
  `;
}

async function fetchDailyMutationsReport(values = {}, options = {}) {
  const villages = Array.isArray(options.villages) && options.villages.length
    ? options.villages
    : await echawadiVillagesForHobli(values);
  const report = {
    generatedAt: new Date().toISOString(),
    overview: {
      district: values.districtLabel || values.district || "",
      taluk: values.talukLabel || values.taluk || "",
      hobli: values.hobliLabel || values.hobli || "",
      source: "eChawadi",
      villagesScanned: 0,
      totalMutations: 0,
    },
    villages: [],
    combinedMutationRows: [],
  };

  for (const village of villages) {
    const villageValues = {
      ...values,
      village: village.value,
      villageLabel: village.label,
    };
    try {
      const villageReport = await fetchVillageScanReport(villageValues);
      const mutationTable = (villageReport.tables || []).find((table) => table.id === "mutations" || /mutation/i.test(table.title || ""));
      const mutations = mutationTable?.rows || [];
      report.villages.push({
        village: village.value,
        villageName: village.label,
        mutationCount: mutations.length,
        mutations,
        generatedAt: villageReport.generatedAt,
      });
      report.combinedMutationRows.push(...dailyMutationRowsFromVillage(villageReport, village));
    } catch (error) {
      report.villages.push({
        village: village.value,
        villageName: village.label,
        mutationCount: 0,
        mutations: [],
        error: error.message,
      });
    }
  }

  report.overview.villagesScanned = report.villages.length;
  report.overview.totalMutations = report.combinedMutationRows.length;
  if (options.renderPdf !== false) {
    report.pdf = await renderHtmlPdf(
      dailyMutationReportHtml(report),
      options.filename || `Daily_Mutations_${safeName(report.overview.hobli || values.hobli, "Hobli")}_${new Date().toISOString().slice(0, 10)}.pdf`,
    );
  }
  return report;
}

async function fetchKathaValidationReport(values) {
  const [currentRtcSection, khathaSection, advancedResult] = await Promise.allSettled([
    fetchRtcSection("current", values),
    fetchKhathaSection(values),
    fetchAdvancedDetailsSection(values),
  ]);
  const currentRtc = currentRtcSection.status === "fulfilled" ? currentRtcSection.value : null;
  const khatha = khathaSection.status === "fulfilled" ? khathaSection.value : null;
  const advanced = advancedResult.status === "fulfilled" ? advancedResult.value : null;
  const latestRtcKhatha = currentRtcKhathaNumber(currentRtc);
  const khathaNumber = values.khathaNumber
    || latestRtcKhatha.number
    || khatha?.khathaNumber
    || advanced?.khathaNumber
    || currentRtc?.rtcRows?.map((row) => row.khataNumber).find(Boolean)
    || firstSummaryValue(khatha?.records || [], bilingualFields.khata)
    || firstSummaryValue(advanced?.records || [], bilingualFields.khata);

  let khathaByNumberRecord = null;
  let khathaFetchError = "";
  if (khathaNumber) {
    try {
      khathaByNumberRecord = await fetchKhathaByNumberRecord(values, khathaNumber);
    } catch (error) {
      khathaFetchError = error.message;
    }
  }
  const comparison = kathaValidationComparison(values, currentRtc, khatha, khathaByNumberRecord, khathaNumber);
  if (khathaFetchError) {
    comparison.records.splice(1, 0, {
      label: "Khatha details by Katha Number",
      summary: {
        hasData: false,
        text: `Could not fetch Khatha details by number: ${khathaFetchError}`,
        rows: [["Status", `Could not fetch Khatha details by number: ${khathaFetchError}`]],
      },
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    overview: {
      district: values.districtLabel || values.district || "-",
      taluk: values.talukLabel || values.taluk || "-",
      hobli: values.hobliLabel || values.hobli || "-",
      village: values.villageLabel || values.village || "-",
      survey: values.survey || "-",
      surnoc: values.surnocLabel || values.surnoc || "-",
      hissa: values.hissaLabel || values.hissa || "-",
      khathaNumber: khathaNumber || "",
      validationStatus: comparison.status,
    },
    records: comparison.records,
    rtcOwners: comparison.rtcOwners,
    khathaOwners: comparison.khathaOwners,
    khathaSurveyRows: comparison.surveyRows,
    sourceStatus: {
      currentRtc: currentRtcSection.status === "fulfilled" ? "Fetched" : currentRtcSection.reason?.message || "Failed",
      khathaBySurvey: khathaSection.status === "fulfilled" ? "Fetched" : khathaSection.reason?.message || "Failed",
      advancedDetails: advancedResult.status === "fulfilled" ? "Fetched" : advancedResult.reason?.message || "Failed",
      khathaByNumber: khathaByNumberRecord ? "Fetched" : (khathaFetchError || "Not fetched"),
    },
    raw: {
      currentRtc,
      khatha,
      advanced,
      khathaByNumberRecord,
    },
  };
}

function rtcDownloadKey(record) {
  const rtc = record.rtc || {};
  return JSON.stringify([
    rtc.type,
    rtc.survey,
    rtc.surnoc,
    rtc.hissa,
    rtc.period,
    rtc.year,
    ownerStateKeyFromRtcRow(rtc),
  ]);
}

function rtcSortYear(record) {
  const text = [record.rtc?.year, record.rtc?.period, record.label].filter(Boolean).join(" ");
  const years = yearsFromText(text);
  return years.length ? Math.min(...years) : 9999;
}

function rtcDownloadTableRow(record, imageRecord) {
  const rtc = record.rtc || {};
  return [
    rtc.type || "-",
    [rtc.period, rtc.year].filter(Boolean).join("\n") || record.label || "-",
    (rtc.owners || []).join("; ") || "-",
    (rtc.extents || []).join("; ") || "-",
    rtc.khataNumber || "-",
    imageRecord?.imageUrl ? "Fetched" : "Not able to fetch RTC",
  ];
}

function storedDocumentFromUrl(url = "") {
  const id = String(url || "").match(/\/api\/document\/([^/?#]+)/)?.[1];
  return id ? documents.get(id) : null;
}

function parseJsonObject(text = "") {
  const cleaned = String(text || "").replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : {};
  }
}

function fallbackRtcScanFields(record) {
  const rows = record.summary?.rows || [];
  const fields = [];
  for (const row of rows) {
    if (row.length >= 2 && normalizeText(row[0]) && normalizeText(row[1])) {
      fields.push({ key: normalizeText(row[0]), value: normalizeText(row.slice(1).join(" | ")), section: "RTC metadata" });
    }
  }
  return fields.length ? fields : [
    { key: "RTC", value: record.label || "-", section: "RTC metadata" },
    { key: "Scan Status", value: record.attachmentError || "No image text extracted", section: "RTC metadata" },
  ];
}

function normalizeSectionRows(rows = []) {
  return (Array.isArray(rows) ? rows : []).map((row) => Object.fromEntries(
    Object.entries(row || {}).map(([key, value]) => [normalizeText(key), normalizeText(value)]),
  )).filter((row) => Object.values(row).some(Boolean));
}

function focusedRtcFieldsFromSections(sections = {}) {
  return [
    ...normalizeSectionRows(sections.section9).flatMap((row, index) => Object.entries(row).map(([key, value]) => ({ section: `9. Khata / Owner Details Row ${index + 1}`, key, value }))),
    ...normalizeSectionRows(sections.section10).flatMap((row, index) => Object.entries(row).map(([key, value]) => ({ section: `10. Acquisition / Possession Row ${index + 1}`, key, value }))),
    ...normalizeSectionRows(sections.section11).flatMap((row, index) => Object.entries(row).map(([key, value]) => ({ section: `11. Other Rights and Liabilities Row ${index + 1}`, key, value }))),
    ...normalizeSectionRows(sections.section12).flatMap((row, index) => Object.entries(row).map(([key, value]) => ({ section: `12. Cultivation / Crop Details Row ${index + 1}`, key, value }))),
  ].filter((field) => field.key || field.value);
}

function emptyFocusedSections() {
  return { section9: [], section10: [], section11: [], section12: [] };
}

function sectionKeyFromText(value = "") {
  const text = normalizeText(value);
  if (/^(?:section\s*)?9\b|khata|khatha|katha|owner|ಖಾತ|ಮಾಲೀಕ|ಹಕ್ಕುದಾರ/i.test(text)) return "section9";
  if (/^(?:section\s*)?10\b|acquisition|possession|mutation|MR\s|ಕಬ್ಜೆ|ಸ್ವಾಧೀನ|ಬದಲಾವಣೆ/i.test(text)) return "section10";
  if (/^(?:section\s*)?11\b|other\s+rights|liabil|loan|rights|ಋಣ|ಹಕ್ಕು|ಹೊಣೆ|ಸಾಲ/i.test(text)) return "section11";
  if (/^(?:section\s*)?12\b|cultivation|crop|season|water|yield|tenant|ಸಾಗುವಳಿ|ಬೆಳೆ|ನೀರಾವರಿ|ಗೇಣಿ/i.test(text)) return "section12";
  return "";
}

function focusedSectionsFromFields(fields = []) {
  const sections = emptyFocusedSections();
  for (const field of fields || []) {
    const sectionKey = sectionKeyFromText(`${field.section || ""} ${field.key || ""}`);
    if (!sectionKey) continue;
    const row = {};
    const key = normalizeText(field.key || "value")
      .replace(/[^a-z0-9_]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase() || "value";
    row[key] = normalizeText(field.value || "");
    row.other_visible_values = [field.section, field.key, field.value].map(normalizeText).filter(Boolean).join(" | ");
    sections[sectionKey].push(row);
  }
  return sections;
}

function mergeFocusedSections(primary = {}, fallback = {}) {
  return {
    section9: normalizeSectionRows(primary.section9).length ? normalizeSectionRows(primary.section9) : normalizeSectionRows(fallback.section9),
    section10: normalizeSectionRows(primary.section10).length ? normalizeSectionRows(primary.section10) : normalizeSectionRows(fallback.section10),
    section11: normalizeSectionRows(primary.section11).length ? normalizeSectionRows(primary.section11) : normalizeSectionRows(fallback.section11),
    section12: normalizeSectionRows(primary.section12).length ? normalizeSectionRows(primary.section12) : normalizeSectionRows(fallback.section12),
  };
}

function rtcImageScanPrompt(record = {}) {
  return `Scan this Karnataka RTC image carefully. The most important information for analysis is in RTC sections 9, 10, 11, and 12. Extract those sections completely, including every visible row and blank/zero values when they are meaningful.

Return valid JSON only with this exact shape:
{
  "rawText": "all readable OCR text for sections 9 to 12",
  "fields": [{"section":"...","key":"...","value":"..."}],
  "sections": {
    "section9": [{"owner_name":"","extent":"","khata_number":"","survey_or_surnoc":"","other_visible_values":""}],
    "section10": [{"acquisition_or_possession_type":"","mutation_reference":"","date_or_year":"","other_visible_values":""}],
    "section11": [{"other_rights":"","liabilities_or_loans":"","rights_holder":"","amount_or_extent":"","other_visible_values":""}],
    "section12": [{"year_season":"","cultivator_name":"","cultivation_type":"","crop":"","crop_extent":"","water_source":"","yield":"","land_use":"","irrigated_extent":"","tenant_or_lease":"","other_visible_values":""}]
  }
}

Rules:
- Preserve Kannada text as visible; do not translate unless English is already visible.
- For section 12, extract every crop/season row separately.
- For section 9, include owner/khata/extent information even if the columns are narrow.
- For section 10, capture mutation/MR references such as MR H10/2015-16.
- For section 11, capture both other rights and liabilities/loans columns.
- Do not invent missing values. Use "" for blank cells.
- RTC label: ${record.label || "RTC"}`;
}

function normalizedRtcImageScan(parsed = {}, provider = "", model = "") {
  const fields = Array.isArray(parsed.fields) ? parsed.fields : [];
  const parsedSections = {
    section9: normalizeSectionRows(parsed.sections?.section9),
    section10: normalizeSectionRows(parsed.sections?.section10),
    section11: normalizeSectionRows(parsed.sections?.section11),
    section12: normalizeSectionRows(parsed.sections?.section12),
  };
  const normalizedFields = fields.map((field) => ({
    section: normalizeText(field.section || "RTC"),
    key: normalizeText(field.key || ""),
    value: normalizeText(field.value || ""),
  })).filter((field) => field.key || field.value);
  const sections = mergeFocusedSections(parsedSections, focusedSectionsFromFields(normalizedFields));
  const focusedFields = focusedRtcFieldsFromSections(sections);
  return {
    provider,
    model,
    rawText: normalizeText(parsed.rawText || ""),
    sections,
    fields: [...focusedFields, ...normalizedFields].filter((field) => field.key || field.value),
  };
}

function ocrTextLines(text = "") {
  return String(text || "")
    .split(/\r?\n/)
    .map(normalizeText)
    .filter(Boolean);
}

function uniqueOcrLines(lines = []) {
  const seen = new Set();
  return lines.filter((line) => {
    const key = line.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function observationText(observations = [], filter) {
  return uniqueOcrLines(
    (observations || [])
      .filter((item) => normalizeText(item?.text) && filter(item))
      .map((item) => normalizeText(item.text)),
  );
}

function matchingText(values = [], lines = []) {
  const normalizedLines = lines.map((line) => line.toLowerCase());
  return (values || []).filter((value) => {
    const text = normalizeText(value);
    return text && normalizedLines.some((line) => line.includes(text.toLowerCase()));
  });
}

function section12CropRows(lines = []) {
  const rows = [];
  let current = null;
  for (const line of lines) {
    if (/\b20\d{2}\s*[-–]\s*20\d{2}\b/.test(line) || /ಮುಂಗಾರು|ಹಿಂಗಾರು|ಬೇಸಿಗೆ|kharif|rabi|summer/i.test(line)) {
      if (current) rows.push(current);
      current = { year_season: line, other_visible_values: line };
    } else if (current) {
      current.other_visible_values = [current.other_visible_values, line].filter(Boolean).join(" | ");
      if (!current.cultivator_name && !/\d+\.\d+|^G$|^-$/.test(line)) current.cultivator_name = line;
      if (!current.crop_extent && /\d+\.\d+\.\d+\.\d+|\d+\.\d+/.test(line)) current.crop_extent = line;
      if (!current.crop && /^G$|ಗೇಣಿ|ಬೆಳೆ|crop/i.test(line)) current.crop = line;
    }
  }
  if (current) rows.push(current);
  return rows.length ? rows : (lines.length ? [{ other_visible_values: lines.join(" | ") }] : []);
}

function localOcrSections(ocr = {}, record = {}) {
  const observations = Array.isArray(ocr.observations) ? ocr.observations : [];
  const allLines = uniqueOcrLines(ocrTextLines(ocr.text));
  const top = (item) => Number(item.y) >= 0.48;
  const section9Lines = observationText(observations, (item) => top(item) && Number(item.x) >= 0.38 && Number(item.x) < 0.60);
  const section10Lines = observationText(observations, (item) => top(item) && Number(item.x) >= 0.58 && Number(item.x) < 0.79);
  const section11Lines = observationText(observations, (item) => top(item) && Number(item.x) >= 0.76);
  const section12Lines = observationText(observations, (item) => Number(item.y) < 0.52);
  const rtc = record.rtc || {};
  const owners = matchingText(rtc.owners || [], allLines);
  const extents = matchingText(rtc.extents || [], allLines);
  const khataNumber = normalizeText(rtc.khataNumber || "");
  const mutationReferences = uniqueOcrLines([
    ...section10Lines,
    ...allLines.filter((line) => /\bMR\b|mutation|ಬದಲಾವಣೆ|ಕಬ್ಜೆ|ಸ್ವಾಧೀನ/i.test(line)),
  ]);

  return {
    section9: section9Lines.length || owners.length || extents.length || khataNumber ? [{
      owner_name: owners.join("; "),
      extent: extents.join("; "),
      khata_number: khataNumber,
      survey_or_surnoc: [rtc.survey, rtc.surnoc, rtc.hissa].filter(Boolean).join("/"),
      other_visible_values: section9Lines.join(" | "),
    }] : [],
    section10: mutationReferences.length ? [{
      mutation_reference: mutationReferences.filter((line) => /\bMR\b/i.test(line)).join("; "),
      other_visible_values: mutationReferences.join(" | "),
    }] : [],
    section11: section11Lines.length ? [{
      other_rights: section11Lines.join(" | "),
      liabilities_or_loans: section11Lines.filter((line) => /loan|liabil|ಸಾಲ|ಋಣ|ಹೊಣೆ/i.test(line)).join("; "),
      other_visible_values: section11Lines.join(" | "),
    }] : [],
    section12: section12CropRows(section12Lines),
  };
}

function localOcrFields(ocr = {}) {
  return ocrTextLines(ocr.text).slice(0, 200).map((line, index) => ({
    section: sectionKeyFromText(line) || "Local OCR text",
    key: `OCR line ${index + 1}`,
    value: line,
  }));
}

async function appleVisionRtcImageScan(record, document) {
  if (process.platform !== "darwin" || !document?.buffer) return null;
  const tempDir = await mkdtemp(join(tmpdir(), "rtc-ocr-"));
  const imageExt = /jpe?g/i.test(document.contentType || "") ? ".jpg" : ".png";
  const imagePath = join(tempDir, `rtc${imageExt}`);
  try {
    await writeFile(imagePath, document.buffer);
    const output = await runCommandOutput("/usr/bin/env", [
      `CLANG_MODULE_CACHE_PATH=${join(tempDir, "module-cache")}`,
      `TMPDIR=${tempDir}`,
      "/usr/bin/xcrun",
      "swift",
      APPLE_VISION_OCR_SCRIPT,
      imagePath,
    ], 90000);
    const ocr = JSON.parse(output || "{}");
    const rawText = normalizeText(ocr.text || "");
    if (!rawText) return null;
    return normalizedRtcImageScan({
      rawText,
      fields: localOcrFields(ocr),
      sections: localOcrSections(ocr, record),
    }, "local-apple-vision-ocr", "Apple Vision");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function openAiRtcImageScan(record, document) {
  if (!process.env.OPENAI_API_KEY || !document?.buffer) return null;
  const imageDataUrl = `data:${document.contentType || "image/png"};base64,${document.buffer.toString("base64")}`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_VISION_MODEL,
      input: [
        {
          role: "system",
          content: "You extract text from Karnataka Bhoomi RTC images. Return valid JSON only. Do not invent fields. Preserve Kannada/English labels exactly when visible.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: rtcImageScanPrompt(record),
            },
            { type: "input_image", image_url: imageDataUrl },
          ],
        },
      ],
      max_output_tokens: 5000,
    }),
  });
  if (!response.ok) throw new Error(`OpenAI RTC image scan failed: HTTP ${response.status}`);
  const data = await response.json();
  const parsed = parseJsonObject(extractOpenAiText(data));
  return normalizedRtcImageScan(parsed, "openai", OPENAI_VISION_MODEL);
}

async function claudeRtcImageScan(record, document) {
  if (!process.env.ANTHROPIC_API_KEY || !document?.buffer) return null;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 5000,
      system: "You extract text from Karnataka Bhoomi RTC images. Return valid JSON only. Do not invent fields. Preserve Kannada/English labels exactly when visible.",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: rtcImageScanPrompt(record) },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: document.contentType || "image/png",
                data: document.buffer.toString("base64"),
              },
            },
          ],
        },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Claude RTC image scan failed: HTTP ${response.status}`);
  const data = await response.json();
  const parsed = parseJsonObject(extractClaudeText(data));
  return normalizedRtcImageScan(parsed, "claude", CLAUDE_MODEL);
}

async function scanRtcRecord(record, index) {
  const document = documentFromUrl(record.imageUrl);
  let scan = null;
  const errors = [];
  if (document) {
    try {
      scan = await appleVisionRtcImageScan(record, document);
    } catch (scanError) {
      errors.push(`Local OCR: ${scanError.message}`);
    }
    if ((!scan || !scan.fields?.length) && process.env.OPENAI_API_KEY) {
      try {
        scan = await openAiRtcImageScan(record, document);
      } catch (scanError) {
        errors.push(`OpenAI: ${scanError.message}`);
      }
    }
    if ((!scan || !scan.fields?.length) && process.env.ANTHROPIC_API_KEY) {
      try {
        scan = await claudeRtcImageScan(record, document);
      } catch (scanError) {
        errors.push(`Claude: ${scanError.message}`);
      }
    }
  }
  if (!scan || !scan.fields?.length) {
    scan = {
      provider: process.platform === "darwin" || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY ? "metadata-fallback-after-ocr-error" : "metadata-fallback",
      model: "",
      rawText: "",
      fields: fallbackRtcScanFields(record),
      sections: {},
    };
  }
  const error = errors.join(" | ");
  const fields = scan.fields.map((field) => ({
    rtcIndex: index + 1,
    rtcLabel: record.label || `RTC ${index + 1}`,
    section: field.section || "RTC",
    key: field.key || "-",
    value: field.value || "-",
    provider: scan.provider,
    error,
  }));
  return {
    label: record.label || `RTC ${index + 1}`,
    imageUrl: record.imageUrl || "",
    attachmentError: record.attachmentError || "",
    provider: scan.provider,
    model: scan.model,
    rawText: scan.rawText,
    fieldCount: fields.length,
    fields,
    sections: scan.sections || {},
    error,
  };
}

async function fetchScanRtcsReport(values) {
  const downloadReport = await fetchDownloadRtcsReport(values);
  const scans = (downloadReport.records || []).map((record, index) => ({
    label: record.label || `RTC ${index + 1}`,
    imageUrl: record.imageUrl || "",
    attachmentError: record.attachmentError || "",
    rtc: record.rtc || {},
  }));
  return {
    generatedAt: new Date().toISOString(),
    overview: {
      ...(downloadReport.overview || {}),
      scannedRtcs: scans.length,
      extractedFields: 0,
      focusedRows: 0,
      uniqueKeys: 0,
      scanProvider: "RTC image crop view",
    },
    sourceStatus: downloadReport.sourceStatus || {},
    downloadReport,
    scans,
    focusedSectionTables: [],
    scanStatusTable: { header: [], rows: [] },
    keyValueTable: { header: [], rows: [] },
    keyMatrix: { header: [], rows: [] },
  };
}

async function fetchDownloadRtcsReport(values) {
  const [currentResult, oldResult] = await Promise.allSettled([
    fetchRtcSection("current", values, { includeOfficialPreviews: true }),
    fetchRtcSection("old", values, { includeOfficialPreviews: true }),
  ]);
  const sections = [currentResult, oldResult].flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
  const records = sections.flatMap((section) => section.rawRecords || section.records || []);
  const dataRecords = records.filter((record) => record.rtc && record.summary?.rows?.length && !record.imageUrl && !record.attachmentError);
  const imageByKey = new Map();
  for (const record of records.filter((item) => item.rtc && (item.imageUrl || item.attachmentError))) {
    if (!imageByKey.has(record.rtcKey || rtcDownloadKey(record))) imageByKey.set(record.rtcKey || rtcDownloadKey(record), record);
  }

  const unique = new Map();
  for (const record of dataRecords) {
    const key = record.rtcKey || rtcDownloadKey(record);
    if (!unique.has(key)) unique.set(key, record);
  }
  const uniqueRecords = [...unique.values()].sort((a, b) => rtcSortYear(a) - rtcSortYear(b));
  const downloadRecords = uniqueRecords.map((record) => {
    const imageRecord = imageByKey.get(record.rtcKey || rtcDownloadKey(record));
    return {
      label: `${record.rtc?.type || "RTC"} - ${[record.rtc?.period, record.rtc?.year].filter(Boolean).join(" | ") || record.label || "Record"}`,
      summary: {
        hasData: Boolean(imageRecord?.imageUrl),
        text: imageRecord?.imageUrl ? "Official RTC image fetched from Bhoomi." : "Details Not Available or Not able to fetch RTC",
        rows: [
          ["RTC Type", record.rtc?.type || "-"],
          ["Period / Year", [record.rtc?.period, record.rtc?.year].filter(Boolean).join(" | ") || record.label || "-"],
          ["Owners", (record.rtc?.owners || []).join("; ") || "-"],
          ["Extent", (record.rtc?.extents || []).join("; ") || "-"],
          ["Khatha Number", record.rtc?.khataNumber || "-"],
        ],
      },
      imageUrl: imageRecord?.imageUrl || "",
      imageClass: "current-rtc-page",
      attachmentError: imageRecord?.imageUrl ? "" : "Details Not Available or Not able to fetch RTC",
    };
  });
  const failures = downloadRecords.filter((record) => record.attachmentError).map((record) => ({
    label: record.label,
    message: record.attachmentError,
  }));
  const currentCount = downloadRecords.filter((record) => /Current RTC/i.test(record.label)).length;
  const oldCount = downloadRecords.filter((record) => /Old RTC/i.test(record.label)).length;

  return {
    generatedAt: new Date().toISOString(),
    overview: {
      district: values.districtLabel || values.district || "",
      taluk: values.talukLabel || values.taluk || "",
      hobli: values.hobliLabel || values.hobli || "",
      village: values.villageLabel || values.village || "",
      survey: values.survey || "",
      surnoc: values.surnocLabel || values.surnoc || "",
      hissa: values.hissaLabel || values.hissa || "",
      totalUniqueRtcs: downloadRecords.length,
      currentRtcs: currentCount,
      oldRtcs: oldCount,
      fetchedImages: downloadRecords.filter((record) => record.imageUrl).length,
    },
    table: {
      header: ["RTC Type", "Period / Year", "Owner(s)", "Extent", "Khatha Number", "Image Status"],
      rows: uniqueRecords.map((record) => rtcDownloadTableRow(record, imageByKey.get(record.rtcKey || rtcDownloadKey(record)))),
    },
    records: downloadRecords,
    failures,
    sourceStatus: {
      currentRtc: currentResult.status === "fulfilled" ? "Fetched" : currentResult.reason?.message || "Failed",
      oldRtc: oldResult.status === "fulfilled" ? "Fetched" : oldResult.reason?.message || "Failed",
    },
  };
}

const AUTO_GEN_SERVICE_STEPS = [
  { id: "rtcDetails", title: "RTC Details", status: "Fetch RTC Details", type: "fullLegal", sections: ["currentRtc", "oldRtc"] },
  { id: "mutationReport", title: "Mutation Report", status: "Fetch Mutation Report", type: "fullLegal", sections: ["mutationRecords", "mutationStatus", "ownershipMap"] },
  { id: "ownersChangeLog", title: "Owners Change Log", status: "Fetch Owners Change Log", type: "fullLegal", sections: ["currentRtc", "oldRtc"] },
  { id: "akarband", title: "Akarband", status: "Fetch Akarband", type: "fullLegal", sections: ["akarband"] },
  { id: "kathaExtract", title: "Katha Extract", status: "Fetch Katha Extract", type: "fullLegal", sections: ["khatha", "advancedDetails"] },
  { id: "echawadi", title: "eChawadi Report", status: "Fetch eChawadi Report", type: "fullLegal", sections: ["echawadi"] },
  { id: "reviewPoints", title: "Review Points", status: "Generate Review Points", type: "fullLegal", sections: ["advancedDetails", "mutationStatus", "ownershipMap", "echawadi"] },
  { id: "downloadRtcs", title: "RTC Downloads & Scan", status: "Download RTCs", type: "downloadRtcs" },
  { id: "mrDownloader", title: "MR Downloader", status: "Download MR Extracts", type: "mrDownloader" },
  { id: "scanRtcs", title: "Scan RTCs", status: "Prepare Scan RTCs", type: "scanRtcs" },
  { id: "kathaValidation", title: "Katha Validation", status: "Validate Katha", type: "kathaValidation" },
  { id: "villageScan", title: "Village Scan", status: "Fetch Village Scan", type: "villageScan" },
];

function autoGenOverview(values = {}) {
  return {
    district: values.districtLabel || values.district || "",
    taluk: values.talukLabel || values.taluk || "",
    hobli: values.hobliLabel || values.hobli || "",
    village: values.villageLabel || values.village || "",
    survey: values.survey || "",
    surnoc: values.surnocLabel || values.surnoc || "",
    hissa: values.hissaLabel || values.hissa || "",
    generatedAt: new Date().toISOString(),
  };
}

function autoGenFileName(values = {}) {
  const safe = (value, fallback) => safeName(String(value || "").trim() || fallback, fallback);
  return `SriSatVam_${safe(values.villageLabel || values.village, "Village")}_${safe(values.survey, "Survey")}_${safe(values.hissaLabel || values.hissa, "Hissa")}.pdf`;
}

async function fetchAutoGenStep(step, values) {
  if (step.type === "fullLegal") return buildReport({ ...values, sections: step.sections });
  if (step.type === "downloadRtcs") {
    return withReportTimeout(
      fetchDownloadRtcsReport(values),
      OLD_RTC_TASK_TIMEOUT_MS,
      "Download RTCs took too long. Please try again.",
    );
  }
  if (step.type === "mrDownloader") {
    return withReportTimeout(
      fetchMrDownloaderReport(values),
      OLD_RTC_TASK_TIMEOUT_MS,
      "MR Downloader took too long. Please try again.",
    );
  }
  if (step.type === "scanRtcs") {
    return withReportTimeout(
      fetchScanRtcsReport(values),
      OLD_RTC_TASK_TIMEOUT_MS + 180000,
      "Scan RTCs took too long. Please try again.",
    );
  }
  if (step.type === "kathaValidation") {
    return withReportTimeout(
      fetchKathaValidationReport(values),
      REPORT_TASK_TIMEOUT_MS,
      "Katha Validation took too long. Please try again.",
    );
  }
  if (step.type === "villageScan") {
    return withReportTimeout(
      fetchVillageScanReport(values),
      REPORT_TASK_TIMEOUT_MS,
      "Village Scan took too long. Please try again.",
    );
  }
  throw new Error(`Unknown AutoGen step: ${step.title}`);
}

function rowsHtml(rows = []) {
  if (!Array.isArray(rows) || !rows.length) return "";
  return `
    <table class="wide-table compact-autogen-table">
      <tbody>
        ${rows.slice(0, 60).map((row) => `
          <tr>${(Array.isArray(row) ? row : [row]).map((cell) => `<td>${htmlEscape(tableCellText(cell) || "-")}</td>`).join("")}</tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function recordHtml(record = {}) {
  const title = record.label || record.title || record.name || "Record";
  const image = record.imageUrl || record.previewUrl || record.pdfPreviewUrl || "";
  return `
    <section class="autogen-record">
      <h4>${htmlEscape(title)}</h4>
      ${record.summary?.text ? `<p>${htmlEscape(record.summary.text)}</p>` : ""}
      ${rowsHtml(record.summary?.rows)}
      ${image ? `<img class="report-image current-rtc-page" src="${htmlEscape(image)}" alt="${htmlEscape(title)}">` : ""}
      ${record.attachmentError || record.error ? `<p class="error-card">${htmlEscape(record.attachmentError || record.error)}</p>` : ""}
    </section>
  `;
}

function genericTableHtml(table = {}) {
  if (!Array.isArray(table.rows) || !table.rows.length) return "";
  const header = Array.isArray(table.header) ? table.header : [];
  return `
    <table class="wide-table compact-autogen-table">
      ${header.length ? `<thead><tr>${header.map((cell) => `<th>${htmlEscape(cell)}</th>`).join("")}</tr></thead>` : ""}
      <tbody>
        ${table.rows.slice(0, 120).map((row) => `
          <tr>${(Array.isArray(row) ? row : [row]).map((cell) => `<td>${htmlEscape(tableCellText(cell) || "-")}</td>`).join("")}</tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function sectionHtml(section = {}) {
  return `
    <section class="summary-block autogen-api-section">
      <div class="section-title">
        <h3>${htmlEscape(section.title || "Section")}</h3>
        <span>${htmlEscape(section.status || "")}</span>
      </div>
      ${section.error ? `<p class="error-card">${htmlEscape(section.error)}</p>` : ""}
      ${genericTableHtml(section.table)}
      ${genericTableHtml(section.keyMatrix)}
      ${genericTableHtml(section.keyValueTable)}
      ${(section.sections || []).map(sectionHtml).join("")}
      ${(section.records || []).slice(0, 80).map(recordHtml).join("")}
      ${section.records?.length > 80 ? `<p>${htmlEscape(`${section.records.length - 80} more records included in JSON response.`)}</p>` : ""}
    </section>
  `;
}

function autoGenStepHtml(step = {}) {
  if (step.state === "failed") {
    return `
      <section class="print-section">
        <h2>${htmlEscape(step.title)}</h2>
        <p class="error-card">${htmlEscape(step.error || step.message || "Step failed")}</p>
      </section>
    `;
  }
  return `
    <section class="print-section">
      <h2>${htmlEscape(step.title)}</h2>
      ${step.data?.overview ? rowsHtml(Object.entries(step.data.overview).map(([key, value]) => [key, value])) : ""}
      ${genericTableHtml(step.data?.table)}
      ${(step.data?.sections || []).map(sectionHtml).join("")}
      ${(step.data?.records || []).slice(0, 80).map(recordHtml).join("")}
      ${step.data?.records?.length > 80 ? `<p>${htmlEscape(`${step.data.records.length - 80} more records included in JSON response.`)}</p>` : ""}
    </section>
  `;
}

function buildAutoGenApiPrintDocument(report = {}) {
  const overviewRows = Object.entries(report.overview || {})
    .filter(([, value]) => value)
    .map(([key, value]) => [key, value]);
  return `
    <article class="print-document autogen-print-document">
      <header class="print-title">
        <h1>Sri SatVam Land AutoGen Report</h1>
        <p>${htmlEscape([report.overview?.village, report.overview?.survey, report.overview?.surnoc, report.overview?.hissa].filter(Boolean).join(" / ") || "Selected land details")}</p>
      </header>
      <section class="print-section">
        <h2>Land Details</h2>
        ${rowsHtml(overviewRows)}
      </section>
      ${(report.steps || []).filter((step) => step.id !== "landDetails" && step.id !== "finalReport").map(autoGenStepHtml).join("")}
    </article>
  `;
}

async function generateAutoGenReport(values = {}, options = {}) {
  const overview = autoGenOverview(values);
  const selectedStepIds = Array.isArray(options.steps) ? new Set(options.steps.map(String)) : null;
  const serviceSteps = selectedStepIds
    ? AUTO_GEN_SERVICE_STEPS.filter((step) => selectedStepIds.has(step.id))
    : AUTO_GEN_SERVICE_STEPS;
  const steps = [{
    id: "landDetails",
    title: "Land Details",
    state: "completed",
    message: "Land details accepted",
    data: overview,
  }];

  for (const step of serviceSteps) {
    const startedAt = new Date().toISOString();
    try {
      const data = await fetchAutoGenStep(step, values);
      steps.push({
        id: step.id,
        title: step.title,
        type: step.type,
        state: "completed",
        message: "Completed",
        startedAt,
        completedAt: new Date().toISOString(),
        data,
      });
    } catch (error) {
      steps.push({
        id: step.id,
        title: step.title,
        type: step.type,
        state: "failed",
        message: error.message,
        error: error.message,
        startedAt,
        completedAt: new Date().toISOString(),
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    overview,
    ready: false,
    steps,
  };
  const pdf = options.renderPdf === false
    ? null
    : await renderHtmlPdf(buildAutoGenApiPrintDocument(report), options.filename || autoGenFileName(values));
  steps.push({
    id: "finalReport",
    title: "Final Report Ready",
    state: pdf ? "completed" : "skipped",
    message: pdf ? "PDF generated" : "PDF rendering skipped",
    data: pdf || null,
  });
  report.ready = true;
  report.pdf = pdf;
  report.summary = {
    totalSteps: steps.length,
    completed: steps.filter((step) => step.state === "completed").length,
    failed: steps.filter((step) => step.state === "failed").length,
    skipped: steps.filter((step) => step.state === "skipped").length,
  };
  return report;
}

async function buildReport(values) {
  const sections = [];
  const disabledSections = new Set();
  const selectedSections = Array.isArray(values.sections)
    ? new Set(values.sections.filter((section) => !disabledSections.has(section)))
    : new Set(["currentRtc", "oldRtc", "khatha", "advancedDetails", "mutationStatus", "mutationRecords", "ownershipMap", "akarband", "echawadi"]);
  const tasks = [
    ["currentRtc", () => fetchRtcSection("current", values), "Current Year RTC", REPORT_TASK_TIMEOUT_MS],
    ["oldRtc", () => fetchRtcSection("old", values), "Old Year RTC", OLD_RTC_TASK_TIMEOUT_MS],
    ["khatha", () => fetchKhathaSection(values), "Khatha Number", REPORT_TASK_TIMEOUT_MS],
    ["advancedDetails", () => fetchAdvancedDetailsSection(values), "Advanced Details", ADVANCED_DETAILS_TASK_TIMEOUT_MS],
    ["ownershipMap", () => fetchOwnershipMapSection(values), "Ownership Map", OWNERSHIP_MAP_TASK_TIMEOUT_MS],
    ["akarband", () => fetchAkarbandSection(values), "Akarband", REPORT_TASK_TIMEOUT_MS],
    ["echawadi", () => fetchEchawadiSection(values), "eChawadi", REPORT_TASK_TIMEOUT_MS],
    ["mutationStatus", () => fetchMutationSection("status", values), "Mutation Status", REPORT_TASK_TIMEOUT_MS],
    ["mutationRecords", () => fetchMutationSection("extract", values), "Mutation Register", REPORT_TASK_TIMEOUT_MS],
  ].filter(([key]) => selectedSections.has(key));

  sections.push(...await Promise.all(tasks.map(async ([, task, title, timeoutMs]) => {
    try {
      return await withReportTimeout(
        task(),
        timeoutMs,
        `${title} took too long to respond from the official service.`,
      );
    } catch (error) {
      return { title, status: "Could not fetch", error: error.message, records: [] };
    }
  })));

  const rtcRows = dedupeRtcRows(sections.flatMap((section) => section.rtcRows || []));
  const khathaSection = sections.find((section) => section.title === "Khatha Number");
  const advancedSection = sections.find((section) => section.title === "Advanced Details");
  const latestRtcKhatha = currentRtcKhathaNumber(sections);
  const khathaNumber = values.khathaNumber
    || latestRtcKhatha.number
    || khathaSection?.khathaNumber
    || advancedSection?.khathaNumber
    || firstSummaryValue(sections.flatMap((section) => section.records || []), bilingualFields.khata)
    || "";
  if (khathaNumber) {
    for (const row of rtcRows) row.khataNumber = row.khataNumber || khathaNumber;
    enrichKhathaSection(khathaSection, khathaNumber, latestRtcKhatha.number ? latestRtcKhatha.source : (advancedSection?.khathaNumber ? "Advanced Details" : "RTC details"));
    try {
      await withReportTimeout(
        enrichKhathaSectionByNumber(khathaSection, values, khathaNumber),
        REPORT_ENRICH_TIMEOUT_MS,
        "Khatha details by Katha Number took too long to respond from the official service.",
      );
    } catch (error) {
      if (khathaSection) {
        khathaSection.records = [
          {
            label: "Khatha details by Katha Number",
            summary: {
              hasData: false,
              text: error.message,
              rows: [["Status", error.message]],
            },
          },
          ...(khathaSection.records || []),
        ];
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    source: BHOOMI_URL,
    relatedServices,
    overview: {
      district: values.districtLabel || values.district || "",
      taluk: values.talukLabel || values.taluk || "",
      hobli: values.hobliLabel || values.hobli || "",
      village: values.villageLabel || values.village || "",
      survey: values.survey || "",
      surnoc: values.surnocLabel || values.surnoc || "",
      hissa: values.hissaLabel || values.hissa || "",
      period: values.periodLabel || values.period || "",
    },
    rtcRows,
    sections,
  };
}

function getSession(id) {
  const session = sessions.get(id);
  if (!session) throw new Error("Session expired. Start a new search.");
  return session;
}

function json(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function safeExportFilename(filename = "") {
  const safe = String(filename || "")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .replace(/^-|-$/g, "")
    .slice(0, 140);
  return safe && safe.endsWith(".json") ? safe : `${safe || "ssvd-bhoomi-raw-data"}.json`;
}

function safeName(value = "", fallback = "report") {
  return String(value || fallback)
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || fallback;
}

function savedReportsIndexPath(username = "") {
  return join(SAVED_REPORTS_DIR, safeName(username, "guest"), "index.json");
}

function savedReportPath(username = "", id = "") {
  return join(SAVED_REPORTS_DIR, safeName(username, "guest"), `${safeName(id, "report")}.json`);
}

async function readSavedReportsIndex(username = "") {
  if (awsStorageEnabled()) {
    const item = await dynamoGet(`USER#${safeName(username, "guest")}`, "SAVED_REPORT_INDEX");
    return Array.isArray(item?.reports) ? item.reports : [];
  }
  try {
    const parsed = JSON.parse(await readFile(savedReportsIndexPath(username), "utf8"));
    return Array.isArray(parsed.reports) ? parsed.reports : [];
  } catch {
    return [];
  }
}

async function writeSavedReportsIndex(username = "", reports = []) {
  if (awsStorageEnabled()) {
    await dynamoPut({
      pk: `USER#${safeName(username, "guest")}`,
      sk: "SAVED_REPORT_INDEX",
      reports,
    });
    return;
  }
  const indexPath = savedReportsIndexPath(username);
  await mkdir(dirname(indexPath), { recursive: true });
  await writeFile(indexPath, JSON.stringify({ reports }, null, 2));
}

async function readSavedReport(username = "", id = "") {
  if (awsStorageEnabled()) {
    const item = await dynamoGet(`USER#${safeName(username, "guest")}`, `SAVED_REPORT#${safeName(id, "report")}`);
    if (!item) throw new Error("Saved report not found.");
    return item.report;
  }
  return JSON.parse(await readFile(savedReportPath(username, id), "utf8"));
}

async function writeSavedReport(username = "", id = "", report = {}) {
  if (awsStorageEnabled()) {
    await dynamoPut({
      pk: `USER#${safeName(username, "guest")}`,
      sk: `SAVED_REPORT#${safeName(id, "report")}`,
      report,
    });
    return;
  }
  const reportPath = savedReportPath(username, id);
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, JSON.stringify(report, null, 2));
}

function savedReportSummary(id, name, state) {
  const land = state?.landDetails || {};
  return {
    id,
    name,
    savedAt: state?.savedAt || new Date().toISOString(),
    village: land.villageLabel || land.village || state?.reports?.fullLegalReport?.overview?.village || "",
    survey: land.survey || state?.reports?.fullLegalReport?.overview?.survey || "",
    hissa: land.hissaLabel || land.hissa || state?.reports?.fullLegalReport?.overview?.hissa || "",
  };
}

function documentFromUrl(url = "") {
  const match = String(url || "").match(/\/api\/document\/([^/?#]+)/);
  if (!match) return null;
  return documents.get(decodeURIComponent(match[1])) || null;
}

function extFromContentType(contentType = "", fallback = ".bin") {
  if (/pdf/i.test(contentType)) return ".pdf";
  if (/png/i.test(contentType)) return ".png";
  if (/jpe?g/i.test(contentType)) return ".jpg";
  if (/svg/i.test(contentType)) return ".svg";
  if (/json/i.test(contentType)) return ".json";
  return fallback;
}

function collectDocumentFiles(state = {}) {
  const files = [];
  const addRecord = (folder, record = {}, fallbackName = "document") => {
    for (const key of ["pdfUrl", "imageUrl", "downloadUrl"]) {
      const document = storedDocumentFromUrl(record[key]);
      if (!document) continue;
      const extension = extFromContentType(document.contentType, key === "pdfUrl" ? ".pdf" : ".png");
      const filename = safeName(record.filename || record.label || record.title || fallbackName, fallbackName);
      files.push({
        path: `${folder}/${filename}${filename.toLowerCase().endsWith(extension) ? "" : extension}`,
        buffer: document.buffer,
      });
    }
  };

  const reports = state.reports || {};
  for (const record of reports.downloadRtcs?.records || []) addRecord("RTCs", record, "rtc");
  for (const scan of reports.scanRtcs?.scans || []) addRecord("Scanned_RTCs", scan, "rtc-scan");
  for (const record of reports.mrDownloader?.records || []) addRecord("MRs", record, "mr");
  for (const section of reports.fullLegalReport?.sections || []) {
    for (const record of section.records || []) addRecord(`Full_Legal_Documents/${safeName(section.title, "section")}`, record, "record");
  }
  for (const record of reports.villageScan?.records || []) addRecord("Village_Scan", record, "village-record");
  if (reports.dailyMutations?.pdf?.downloadUrl) addRecord("Daily_Mutations", reports.dailyMutations.pdf, "daily-mutations-report");
  for (const record of reports.kathaValidation?.records || []) addRecord("Katha_Validation", record, "katha-record");

  const seen = new Set();
  return files.filter((file) => {
    const key = `${file.path}:${file.buffer.length}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

let crcTable;
function crc32(buffer) {
  crcTable ||= Array.from({ length: 256 }, (_, index) => {
    let crc = index;
    for (let k = 0; k < 8; k += 1) crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
    return crc >>> 0;
  });
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = (year - 1980) << 9 | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

function zipStored(files = []) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const now = dosDateTime();

  for (const file of files) {
    const name = Buffer.from(file.path.replace(/^\/+/, ""), "utf8");
    const data = Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(String(file.buffer || ""));
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(now.time, 10);
    local.writeUInt16LE(now.day, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(now.time, 12);
    central.writeUInt16LE(now.day, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, ...centralParts, end]);
}

function reportArchiveFiles(name = "", state = {}) {
  const base = safeName(name, "Saved_Report");
  const reports = state.reports || {};
  const jsonFiles = [
    ["all_saved_state.json", state],
    ["raw_full_legal_report.json", reports.fullLegalReport],
    ["autogen_report.json", reports.autoGenReport],
    ["mr_downloader_report.json", reports.mrDownloader],
    ["download_rtcs_report.json", reports.downloadRtcs],
    ["scan_rtcs_report.json", reports.scanRtcs],
    ["village_scan_report.json", reports.villageScan],
    ["daily_mutations_report.json", reports.dailyMutations],
    ["katha_validation_report.json", reports.kathaValidation],
    ["score_card.json", reports.scoreCard],
    ["feature_notes_status.json", reports.featureReports],
  ].filter(([, value]) => value);
  return [
    ...jsonFiles.map(([filename, value]) => ({
      path: `${base}/Reports/${filename}`,
      buffer: Buffer.from(JSON.stringify(value, null, 2), "utf8"),
    })),
    ...collectDocumentFiles(state).map((file) => ({
      ...file,
      path: `${base}/Documents/${file.path}`,
    })),
  ];
}

const portalHealthTargets = [
  { id: "bhoomi", name: "Bhoomi / RTC / MR", url: "https://landrecords.karnataka.gov.in/" },
  { id: "mojini", name: "Mojini / Survey", url: "https://bhoomojini.karnataka.gov.in/" },
  { id: "echawadi", name: "eChawadi", url: "https://rdservices.karnataka.gov.in/echawadi/" },
  { id: "kaveri", name: "Kaveri Online Services", url: "https://kaveri.karnataka.gov.in/" },
  { id: "rtcWallet", name: "i-RTC / Wallet", url: "https://rtc.karnataka.gov.in/" },
  { id: "bhoomiMaps", name: "RTC with Sketch / Bhoomi Maps", url: "https://rdservices.karnataka.gov.in/BhoomiMaps/" },
];

async function portalHealth() {
  const checkedAt = new Date().toISOString();
  const results = await Promise.all(portalHealthTargets.map(async (target) => {
    const started = Date.now();
    try {
      const response = await officialFetch(target.url, {
        method: "GET",
        timeoutMs: 7000,
        retries: 0,
      }, target.name);
      return {
        ...target,
        status: response.ok ? "Online" : `HTTP ${response.status}`,
        ok: response.ok,
        responseMs: Date.now() - started,
      };
    } catch (error) {
      return {
        ...target,
        status: error.message,
        ok: false,
        responseMs: Date.now() - started,
      };
    }
  }));
  return { checkedAt, results };
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  return body ? JSON.parse(body) : {};
}

function defaultAdminStore() {
  return {
    users: [],
    registrations: [],
    roles: [
      {
        id: "role-all-reports",
        name: "All Reports",
        workspaceIds: REPORT_WORKSPACES.map((workspace) => workspace.id),
      },
    ],
    notice: { enabled: false, message: "" },
    dailyMutationSchedules: [],
  };
}

async function readAdminStore() {
  if (awsStorageEnabled()) {
    const item = await dynamoGet("CONFIG", "ADMIN_STORE");
    const parsed = item?.store || defaultAdminStore();
    const roles = Array.isArray(parsed.roles) && parsed.roles.length ? parsed.roles : defaultAdminStore().roles;
    const allReportsRole = roles.find((role) => role.id === "role-all-reports");
    if (allReportsRole) allReportsRole.workspaceIds = REPORT_WORKSPACES.map((workspace) => workspace.id);
    return {
      ...defaultAdminStore(),
      ...parsed,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      registrations: Array.isArray(parsed.registrations) ? parsed.registrations : [],
      roles,
      notice: parsed.notice || { enabled: false, message: "" },
      dailyMutationSchedules: Array.isArray(parsed.dailyMutationSchedules) ? parsed.dailyMutationSchedules : [],
    };
  }
  try {
    const parsed = JSON.parse(await readFile(ADMIN_STORE_PATH, "utf8"));
    const roles = Array.isArray(parsed.roles) && parsed.roles.length ? parsed.roles : defaultAdminStore().roles;
    const allReportsRole = roles.find((role) => role.id === "role-all-reports");
    if (allReportsRole) allReportsRole.workspaceIds = REPORT_WORKSPACES.map((workspace) => workspace.id);
    return {
      ...defaultAdminStore(),
      ...parsed,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      registrations: Array.isArray(parsed.registrations) ? parsed.registrations : [],
      roles,
      notice: parsed.notice || { enabled: false, message: "" },
      dailyMutationSchedules: Array.isArray(parsed.dailyMutationSchedules) ? parsed.dailyMutationSchedules : [],
    };
  } catch {
    return defaultAdminStore();
  }
}

async function writeAdminStore(store) {
  if (awsStorageEnabled()) {
    await dynamoPut({
      pk: "CONFIG",
      sk: "ADMIN_STORE",
      store,
    });
    return;
  }
  await mkdir(dirname(ADMIN_STORE_PATH), { recursive: true });
  await writeFile(ADMIN_STORE_PATH, JSON.stringify(store, null, 2));
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    phone: user.phone,
    email: user.email,
    status: user.status,
    roleIds: user.roleIds || [],
    workspaceIds: user.workspaceIds || [],
    isAdmin: false,
  };
}

function adminUser() {
  return {
    id: "admin",
    username: ADMIN_USERNAME,
    name: "Administrator",
    phone: "",
    email: "",
    status: "active",
    roleIds: ["admin"],
    workspaceIds: REPORT_WORKSPACES.map((workspace) => workspace.id),
    isAdmin: true,
  };
}

function workspaceIdsForUser(user, store) {
  if (user?.isAdmin) return REPORT_WORKSPACES.map((workspace) => workspace.id);
  const direct = user?.workspaceIds || [];
  const fromRoles = (user?.roleIds || []).flatMap((roleId) => store.roles.find((role) => role.id === roleId)?.workspaceIds || []);
  return [...new Set([...direct, ...fromRoles])].filter((id) => REPORT_WORKSPACES.some((workspace) => workspace.id === id));
}

function userPayload(user, store) {
  const base = user?.isAdmin ? user : publicUser(user);
  return {
    ...base,
    workspaceIds: workspaceIdsForUser(base, store),
  };
}

function requireAdmin(body = {}) {
  if (body.adminUsername !== ADMIN_USERNAME) throw new Error("Admin access required.");
}

function registrationUsername(email = "") {
  return String(email || "").trim().toLowerCase();
}

function splitEmails(value = "") {
  return String(value || "")
    .split(/[,\n;]/)
    .map((email) => email.trim())
    .filter(Boolean);
}

function absoluteAppUrl(path = "") {
  const prefix = APP_PUBLIC_URL || `http://${HOST === "0.0.0.0" ? "127.0.0.1" : HOST}:${PORT}`;
  return `${prefix}${String(path || "").startsWith("/") ? path : `/${path}`}`;
}

async function sendDailyMutationEmail(schedule = {}, report = {}) {
  const emails = splitEmails(schedule.emails);
  if (!emails.length) return { sent: false, reason: "No email recipients configured." };
  if (!AWS_SES_FROM_EMAIL) return { sent: false, reason: "AWS_SES_FROM_EMAIL is not configured." };
  try {
    const [{ SESClient, SendEmailCommand }] = await Promise.all([
      import("@aws-sdk/client-ses"),
    ]);
    const client = new SESClient({ region: AWS_REGION });
    const pdfUrl = report.pdf?.downloadUrl ? absoluteAppUrl(report.pdf.downloadUrl) : "";
    await client.send(new SendEmailCommand({
      Source: AWS_SES_FROM_EMAIL,
      Destination: { ToAddresses: emails },
      Message: {
        Subject: { Charset: "UTF-8", Data: `Daily Mutations Report - ${schedule.hobliLabel || schedule.hobli || "Hobli"}` },
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: [
              `Daily Mutations Report is ready.`,
              `District: ${schedule.districtLabel || schedule.district || "-"}`,
              `Taluk: ${schedule.talukLabel || schedule.taluk || "-"}`,
              `Hobli: ${schedule.hobliLabel || schedule.hobli || "-"}`,
              `Villages scanned: ${report.overview?.villagesScanned || 0}`,
              `Mutations found: ${report.overview?.totalMutations || 0}`,
              pdfUrl ? `PDF: ${pdfUrl}` : "PDF link was not generated.",
            ].join("\n"),
          },
        },
      },
    }));
    return { sent: true, recipients: emails };
  } catch (error) {
    return { sent: false, reason: error.message };
  }
}

async function runDailyMutationSchedule(schedule = {}) {
  const report = await fetchDailyMutationsReport(schedule, { renderPdf: true });
  const email = await sendDailyMutationEmail(schedule, report);
  return {
    ok: true,
    ranAt: new Date().toISOString(),
    report,
    email,
  };
}

function todayInIst() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function currentIstHourMinute() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date()).map((part) => [part.type, part.value]));
  return { hour: Number(parts.hour), minute: Number(parts.minute) };
}

let dailyMutationSchedulerRunning = false;

async function runDueDailyMutationSchedules() {
  if (dailyMutationSchedulerRunning) return;
  const { hour, minute } = currentIstHourMinute();
  if (hour !== 6 || minute > 10) return;
  dailyMutationSchedulerRunning = true;
  try {
    const today = todayInIst();
    const store = await readAdminStore();
    let changed = false;
    for (const schedule of store.dailyMutationSchedules || []) {
      if (!schedule.enabled || schedule.lastRunDate === today) continue;
      try {
        const result = await runDailyMutationSchedule(schedule);
        schedule.lastRunDate = today;
        schedule.lastRunAt = result.ranAt;
        schedule.lastStatus = "Completed";
        schedule.lastReport = {
          generatedAt: result.report.generatedAt,
          totalMutations: result.report.overview?.totalMutations || 0,
          villagesScanned: result.report.overview?.villagesScanned || 0,
          pdf: result.report.pdf || null,
          email: result.email,
        };
      } catch (error) {
        schedule.lastRunDate = today;
        schedule.lastRunAt = new Date().toISOString();
        schedule.lastStatus = error.message;
      }
      changed = true;
    }
    if (changed) await writeAdminStore(store);
  } catch (error) {
    console.warn(`Daily mutations scheduler failed: ${error.message}`);
  } finally {
    dailyMutationSchedulerRunning = false;
  }
}

async function handleApi(req, res) {
  try {
    if (req.method === "GET" && req.url === "/api/public-state") {
      const store = await readAdminStore();
      json(res, 200, { notice: store.notice || { enabled: false, message: "" } });
      return;
    }

    if (req.method === "POST" && req.url === "/api/auth/login") {
      const body = await readJson(req);
      const store = await readAdminStore();
      const username = String(body.username || "").trim();
      const normalizedUsername = registrationUsername(username);
      const password = String(body.password || "");
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        json(res, 200, { user: userPayload(adminUser(), store), notice: store.notice });
        return;
      }
      const user = store.users.find((item) => item.username === normalizedUsername || item.email === normalizedUsername);
      if (!user || user.password !== password) throw new Error("Invalid user name or password.");
      if (user.status !== "active") throw new Error("User is not approved yet.");
      json(res, 200, { user: userPayload(user, store), notice: store.notice });
      return;
    }

    if (req.method === "POST" && req.url === "/api/register") {
      const body = await readJson(req);
      const store = await readAdminStore();
      const name = String(body.name || "").trim();
      const phone = String(body.phone || "").trim();
      const email = registrationUsername(body.email);
      if (!name || !phone || !email) throw new Error("Name, phone number and email are required.");
      if (store.users.some((user) => user.email === email || user.username === email)) throw new Error("A user with this email already exists.");
      if (store.registrations.some((request) => request.email === email && request.status === "pending")) throw new Error("Registration request is already pending.");
      store.registrations.push({
        id: randomUUID(),
        name,
        phone,
        email,
        status: "pending",
        requestedAt: new Date().toISOString(),
      });
      await writeAdminStore(store);
      json(res, 200, { ok: true, message: "Registration request submitted. Admin approval is required." });
      return;
    }

    if (req.method === "POST" && req.url === "/api/admin/state") {
      const body = await readJson(req);
      requireAdmin(body);
      const store = await readAdminStore();
      json(res, 200, {
        workspaces: REPORT_WORKSPACES,
        users: store.users.map(publicUser),
        registrations: store.registrations,
        roles: store.roles,
        notice: store.notice,
        dailyMutationSchedules: store.dailyMutationSchedules || [],
      });
      return;
    }

    if (req.method === "POST" && req.url === "/api/admin/notice") {
      const body = await readJson(req);
      requireAdmin(body);
      const store = await readAdminStore();
      store.notice = {
        enabled: Boolean(body.enabled),
        message: String(body.message || "").trim(),
      };
      await writeAdminStore(store);
      json(res, 200, { notice: store.notice });
      return;
    }

    if (req.method === "POST" && req.url === "/api/admin/role") {
      const body = await readJson(req);
      requireAdmin(body);
      const store = await readAdminStore();
      const role = body.role || {};
      const name = String(role.name || "").trim();
      if (!name) throw new Error("Role name is required.");
      const workspaceIds = (role.workspaceIds || []).filter((id) => REPORT_WORKSPACES.some((workspace) => workspace.id === id));
      if (role.id) {
        const existing = store.roles.find((item) => item.id === role.id);
        if (!existing) throw new Error("Role not found.");
        existing.name = name;
        existing.workspaceIds = workspaceIds;
      } else {
        store.roles.push({ id: randomUUID(), name, workspaceIds });
      }
      await writeAdminStore(store);
      json(res, 200, { roles: store.roles });
      return;
    }

    if (req.method === "POST" && req.url === "/api/admin/approve-registration") {
      const body = await readJson(req);
      requireAdmin(body);
      const store = await readAdminStore();
      const request = store.registrations.find((item) => item.id === body.requestId);
      if (!request) throw new Error("Registration request not found.");
      if (request.status !== "pending") throw new Error("Registration request is already processed.");
      const username = registrationUsername(request.email);
      if (store.users.some((user) => user.username === username || user.email === username)) throw new Error("User already exists.");
      const password = String(body.password || "").trim() || "Welcome@123";
      const workspaceIds = (body.workspaceIds || []).filter((id) => REPORT_WORKSPACES.some((workspace) => workspace.id === id));
      const roleIds = (body.roleIds || []).filter((id) => store.roles.some((role) => role.id === id));
      store.users.push({
        id: randomUUID(),
        username,
        password,
        name: request.name,
        phone: request.phone,
        email: request.email,
        status: "active",
        roleIds,
        workspaceIds,
        approvedAt: new Date().toISOString(),
      });
      request.status = "approved";
      request.approvedAt = new Date().toISOString();
      await writeAdminStore(store);
      json(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && req.url === "/api/admin/update-user") {
      const body = await readJson(req);
      requireAdmin(body);
      const store = await readAdminStore();
      const user = store.users.find((item) => item.id === body.userId);
      if (!user) throw new Error("User not found.");
      user.roleIds = (body.roleIds || []).filter((id) => store.roles.some((role) => role.id === id));
      user.workspaceIds = (body.workspaceIds || []).filter((id) => REPORT_WORKSPACES.some((workspace) => workspace.id === id));
      user.status = body.status === "inactive" ? "inactive" : "active";
      await writeAdminStore(store);
      json(res, 200, { user: publicUser(user) });
      return;
    }

    if (req.method === "POST" && req.url === "/api/admin/reset-password") {
      const body = await readJson(req);
      requireAdmin(body);
      const store = await readAdminStore();
      const user = store.users.find((item) => item.id === body.userId);
      if (!user) throw new Error("User not found.");
      const password = String(body.password || "").trim();
      if (!password) throw new Error("New password is required.");
      user.password = password;
      user.passwordResetAt = new Date().toISOString();
      await writeAdminStore(store);
      json(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && req.url === "/api/admin/daily-mutations-schedule") {
      const body = await readJson(req);
      requireAdmin(body);
      const store = await readAdminStore();
      const schedule = body.schedule || {};
      const district = numberString(schedule.district);
      const taluk = numberString(schedule.taluk);
      const hobli = numberString(schedule.hobli);
      if (!district || !taluk || !hobli) throw new Error("District, taluk and hobli are required.");
      const payload = {
        id: schedule.id || randomUUID(),
        name: String(schedule.name || schedule.hobliLabel || "Daily Mutations Report").trim(),
        enabled: schedule.enabled !== false,
        district,
        districtLabel: String(schedule.districtLabel || schedule.district || "").trim(),
        taluk,
        talukLabel: String(schedule.talukLabel || schedule.taluk || "").trim(),
        hobli,
        hobliLabel: String(schedule.hobliLabel || schedule.hobli || "").trim(),
        emails: splitEmails(schedule.emails).join(", "),
        updatedAt: new Date().toISOString(),
      };
      const existing = (store.dailyMutationSchedules || []).find((item) => item.id === payload.id);
      if (existing) Object.assign(existing, payload);
      else {
        store.dailyMutationSchedules ||= [];
        store.dailyMutationSchedules.push({ ...payload, createdAt: payload.updatedAt });
      }
      await writeAdminStore(store);
      json(res, 200, { schedules: store.dailyMutationSchedules });
      return;
    }

    if (req.method === "POST" && req.url === "/api/admin/delete-daily-mutations-schedule") {
      const body = await readJson(req);
      requireAdmin(body);
      const store = await readAdminStore();
      store.dailyMutationSchedules = (store.dailyMutationSchedules || []).filter((item) => item.id !== body.scheduleId);
      await writeAdminStore(store);
      json(res, 200, { schedules: store.dailyMutationSchedules });
      return;
    }

    if (req.method === "POST" && req.url === "/api/admin/run-daily-mutations-schedule") {
      const body = await readJson(req);
      requireAdmin(body);
      const store = await readAdminStore();
      const schedule = (store.dailyMutationSchedules || []).find((item) => item.id === body.scheduleId);
      if (!schedule) throw new Error("Daily mutations schedule not found.");
      const result = await runDailyMutationSchedule(schedule);
      schedule.lastRunDate = todayInIst();
      schedule.lastRunAt = result.ranAt;
      schedule.lastStatus = "Completed";
      schedule.lastReport = {
        generatedAt: result.report.generatedAt,
        totalMutations: result.report.overview?.totalMutations || 0,
        villagesScanned: result.report.overview?.villagesScanned || 0,
        pdf: result.report.pdf || null,
        email: result.email,
      };
      await writeAdminStore(store);
      json(res, 200, { result, schedules: store.dailyMutationSchedules });
      return;
    }

    if (req.method === "GET" && req.url === "/api/health") {
      json(res, 200, {
        ok: true,
        service: "Namma Bhoomi Report",
        proxyConfigured: Boolean(OFFICIAL_PROXY_URL),
        storageMode: awsStorageEnabled() ? "aws-s3-dynamodb" : "local-files",
        awsRegion: AWS_REGION,
      });
      return;
    }

    if (req.method === "POST" && req.url === "/api/portal-health") {
      json(res, 200, await portalHealth());
      return;
    }

    if (req.method === "GET" && req.url?.startsWith("/api/document/")) {
      const id = decodeURIComponent(req.url.split("/").pop() || "");
      const document = documents.get(id) || await loadStoredDocument(id);
      if (!document) {
        res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        res.end("Document expired");
        return;
      }
      res.writeHead(200, {
        "content-type": document.contentType,
        "content-disposition": `inline; filename="${document.filename}"`,
        "cache-control": "no-store",
      });
      res.end(document.buffer);
      return;
    }

    if (req.method === "POST" && req.url === "/api/saved-reports/save") {
      const body = await readJson(req);
      if (!body.state || typeof body.state !== "object") throw new Error("Saved report state is missing.");
      const username = registrationUsername(body.username || "guest") || "guest";
      const name = safeName(body.name || "Saved_Report", "Saved_Report");
      const id = safeName(body.id || name, "report");
      const state = {
        ...body.state,
        savedAt: new Date().toISOString(),
      };
      const summary = savedReportSummary(id, name, state);
      await writeSavedReport(username, id, { ...summary, state });
      const reports = (await readSavedReportsIndex(username)).filter((item) => item.id !== id);
      reports.unshift(summary);
      await writeSavedReportsIndex(username, reports);
      json(res, 200, { ok: true, ...summary });
      return;
    }

    if (req.method === "POST" && req.url === "/api/saved-reports/list") {
      const body = await readJson(req);
      const username = registrationUsername(body.username || "guest") || "guest";
      json(res, 200, { reports: await readSavedReportsIndex(username) });
      return;
    }

    if (req.method === "POST" && req.url === "/api/saved-reports/load") {
      const body = await readJson(req);
      const username = registrationUsername(body.username || "guest") || "guest";
      const id = safeName(body.id || "", "");
      if (!id) throw new Error("Saved report id is required.");
      const saved = await readSavedReport(username, id);
      json(res, 200, saved);
      return;
    }

    if (req.method === "POST" && req.url === "/api/saved-reports/archive") {
      const body = await readJson(req);
      if (!body.state || typeof body.state !== "object") throw new Error("Report state is missing.");
      const name = safeName(body.name || "Saved_Report", "Saved_Report");
      const files = reportArchiveFiles(name, body.state);
      if (!files.length) throw new Error("No report data is available to archive.");
      const buffer = zipStored(files);
      const filename = `${name}.zip`;
      json(res, 200, {
        ok: true,
        filename,
        files: files.length,
        downloadUrl: storeDocument(buffer, "application/zip", filename),
      });
      return;
    }

    if (req.method === "POST" && req.url === "/api/export-data") {
      const body = await readJson(req);
      if (!body.payload || typeof body.payload !== "object") throw new Error("Export payload is missing.");
      const filename = safeExportFilename(body.filename);
      const exportJson = JSON.stringify(body.payload, null, 2);
      let storedPath = "";
      if (!awsStorageEnabled()) {
        await mkdir(EXPORT_DIR, { recursive: true });
        storedPath = join(EXPORT_DIR, filename);
        await writeFile(storedPath, exportJson);
      }

      json(res, 200, {
        ok: true,
        filename,
        storedPath: storedPath || `s3://${AWS_S3_BUCKET}/${s3Key("documents", filename)}`,
        downloadUrl: storeDocument(Buffer.from(exportJson), "application/json; charset=utf-8", filename),
        savedAt: new Date().toISOString(),
      });
      return;
    }

    if (req.method === "POST" && req.url === "/api/autogen-report") {
      const body = await readJson(req);
      const values = body.values || {};
      if (!values || typeof values !== "object") throw new Error("Land details values are missing.");
      const report = await generateAutoGenReport(values, {
        filename: body.filename,
        renderPdf: body.renderPdf !== false,
        steps: body.steps,
      });
      json(res, 200, report);
      return;
    }

    if (req.method === "POST" && req.url === "/api/render-pdf") {
      const body = await readJson(req);
      if (!body.html || typeof body.html !== "string") throw new Error("Printable report HTML is missing.");
      const rendered = await renderHtmlPdf(body.html, body.filename || "SriSatVam_Land_Report.pdf");
      json(res, 200, rendered);
      return;
    }

    if (req.method === "POST" && req.url === "/api/legal-report") {
      const body = await readJson(req);
      if (!body.payload || typeof body.payload !== "object") throw new Error("Legal report payload is missing.");
      const report = await generateLegalReport(body.payload);
      json(res, 200, report);
      return;
    }

    if (req.method === "POST" && req.url === "/api/claude-review") {
      const body = await readJson(req);
      if (!body.payload || typeof body.payload !== "object") throw new Error("Claude review payload is missing.");
      const report = await generateClaudeReview(body.payload);
      json(res, 200, report);
      return;
    }

    if (req.method === "POST" && req.url === "/api/mr-downloader") {
      const body = await readJson(req);
      const report = await withReportTimeout(
        fetchMrDownloaderReport(body.values || {}),
        OLD_RTC_TASK_TIMEOUT_MS,
        "MR Downloader took too long. Please try again.",
      );
      json(res, 200, report);
      return;
    }

    if (req.method === "POST" && req.url === "/api/village-scan") {
      const body = await readJson(req);
      const report = await withReportTimeout(
        fetchVillageScanReport(body.values || {}),
        REPORT_TASK_TIMEOUT_MS,
        "Village Scan took too long. Please try again.",
      );
      json(res, 200, report);
      return;
    }

    if (req.method === "POST" && req.url === "/api/daily-mutations-report") {
      const body = await readJson(req);
      const report = await withReportTimeout(
        fetchDailyMutationsReport(body.values || {}, {
          renderPdf: body.renderPdf !== false,
          filename: body.filename,
        }),
        OLD_RTC_TASK_TIMEOUT_MS,
        "Daily Mutations Report took too long. Please try again.",
      );
      json(res, 200, report);
      return;
    }

    if (req.method === "POST" && req.url === "/api/katha-validation") {
      const body = await readJson(req);
      const report = await withReportTimeout(
        fetchKathaValidationReport(body.values || {}),
        REPORT_TASK_TIMEOUT_MS,
        "Katha Validation took too long. Please try again.",
      );
      json(res, 200, report);
      return;
    }

    if (req.method === "POST" && req.url === "/api/download-rtcs") {
      const body = await readJson(req);
      const report = await withReportTimeout(
        fetchDownloadRtcsReport(body.values || {}),
        OLD_RTC_TASK_TIMEOUT_MS,
        "Download RTCs took too long. Please try again.",
      );
      json(res, 200, report);
      return;
    }

    if (req.method === "POST" && req.url === "/api/scan-rtcs") {
      const body = await readJson(req);
      const report = await withReportTimeout(
        fetchScanRtcsReport(body.values || {}),
        OLD_RTC_TASK_TIMEOUT_MS + 180000,
        "Scan RTCs took too long. Please try again.",
      );
      json(res, 200, report);
      return;
    }

    if (req.method === "POST" && req.url === "/api/start") {
      const body = await readJson(req);
      const session = body.locationSource === "echawadi"
        ? await createEchawadiLocationSession()
        : await createSession();
      json(res, 200, parseState(session));
      return;
    }

    if (req.method === "POST" && req.url === "/api/select") {
      const body = await readJson(req);
      const session = getSession(body.sessionId);
      const field = fields[body.field];
      if (!field || body.value === undefined) throw new Error("Invalid field selection.");

      if (session.sourceType === "echawadi") {
        await updateEchawadiLocationSession(session, body.field, body.value, body.values || {});
        json(res, 200, parseState(session));
        return;
      }

      const values = { ...(body.values || {}), [body.field]: String(body.value) };
      const form = buildForm(session, values, field.target);
      form.set(field.name, String(body.value));
      await fetchOfficial(session, form);
      json(res, 200, parseState(session));
      return;
    }

    if (req.method === "POST" && req.url === "/api/go") {
      const body = await readJson(req);
      const session = getSession(body.sessionId);
      const form = buildForm(session, body.values || "");
      form.set(fields.survey.name, String(body.values?.survey || ""));
      form.set(buttons.go.name, buttons.go.value);
      await fetchOfficial(session, form);
      json(res, 200, parseState(session));
      return;
    }

    if (req.method === "POST" && req.url === "/api/fetch") {
      const body = await readJson(req);
      const session = getSession(body.sessionId);
      const form = buildForm(session, body.values || {});
      form.set(buttons.fetch.name, buttons.fetch.value);
      await fetchOfficial(session, form);
      const state = parseState(session);
      state.resultHtml = sanitizeResultHtml(session.html);
      const quickSummary = summarizeOfficialHtml(state.resultHtml);
      const quickOwners = extractOwnerRows(quickSummary.rows).map((row) => row.owner);
      state.summary = {
        district: selectedLabel(session.html, "district", body.values?.district),
        taluk: selectedLabel(session.html, "taluk", body.values?.taluk),
        hobli: selectedLabel(session.html, "hobli", body.values?.hobli),
        village: selectedLabel(session.html, "village", body.values?.village),
        survey: body.values?.survey || "",
        surnoc: selectedLabel(session.html, "surnoc", body.values?.surnoc),
        hissa: selectedLabel(session.html, "hissa", body.values?.hissa),
        owner: quickOwners.join("; "),
        period: selectedLabel(session.html, "period", body.values?.period),
      };
      json(res, 200, state);
      return;
    }

    if (req.method === "POST" && req.url === "/api/report") {
      const body = await readJson(req);
      const report = await buildReport(body.values || {});
      json(res, 200, report);
      return;
    }

    json(res, 404, { error: "Not found" });
  } catch (error) {
    json(res, 500, { error: error.message });
  }
}

async function serveStatic(req, res) {
  const requested = req.url === "/" ? "/index.html" : decodeURIComponent(req.url.split("?")[0]);
  const safePath = normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(PUBLIC_DIR, safePath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const data = await readFile(filePath);
    res.writeHead(200, { "content-type": mimeTypes[extname(filePath)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = http.createServer((req, res) => {
  if (req.url?.startsWith("/api/")) {
    handleApi(req, res);
  } else {
    serveStatic(req, res);
  }
});

try {
  await loadAwsSecrets();
  server.listen(PORT, HOST, () => {
    console.log(`SSVD Report Store running at http://${HOST}:${PORT}`);
    console.log(`Storage mode: ${awsStorageEnabled() ? "aws-s3-dynamodb" : "local-files"}`);
  });
  setInterval(() => {
    runDueDailyMutationSchedules().catch((error) => console.warn(`Daily mutations scheduler tick failed: ${error.message}`));
  }, 60 * 1000);
  runDueDailyMutationSchedules().catch((error) => console.warn(`Daily mutations scheduler startup check failed: ${error.message}`));
} catch (error) {
  console.error(`Startup failed: ${error.message}`);
  process.exitCode = 1;
}
