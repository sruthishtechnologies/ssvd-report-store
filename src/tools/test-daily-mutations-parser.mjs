#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  looksLikeHtmlResponse,
  parseEchawadiHtmlPayload,
  parseEchawadiMutationHtml,
} from "../lib/echawadiHtml.js";

const root = dirname(fileURLToPath(import.meta.url));
const fixtures = join(root, "..", "fixtures");

function load(name) {
  return readFileSync(join(fixtures, name), "utf8");
}

const cardsHtml = load("echawadi-mutation-cards.html");
const scriptOnlyHtml = load("echawadi-mutation-script-only.html");

assert.equal(looksLikeHtmlResponse(cardsHtml), true);
assert.equal(looksLikeHtmlResponse('{"data":[]}'), false);

const rows = parseEchawadiMutationHtml(cardsHtml);
assert.equal(rows.length, 2, "expected two non-empty MR cards");
assert.equal(rows[0].MRNumber, "46 / 2025-2026");
assert.equal(rows[0].TypeofTransaction, "ಕೋರ್ಟ್ ಆದೇಶ");
assert.equal(rows[0].SurveyNumbers, "10 / * / *");
assert.equal(rows[0].applicant, "");
assert.equal(rows[0].AcquisitionType, "(ಕೋ.ಆ) ದಾನ");
assert.equal(rows[0].TypeofTransactionNo, "102");
assert.equal(rows[1].MRNumber, "54 / 2025-2026");
assert.equal(rows[1].applicant, "niranjan");
assert.equal(rows[1].TypeofTransaction, "ಖಾತೆ ಬದಲಾವಣೆ");
assert.equal(rows[1].SurveyNumbers, "34 / * / *");

const payload = parseEchawadiHtmlPayload("GetActiveCasesofMutationStatus", cardsHtml);
assert.ok(Array.isArray(payload.data));
assert.equal(payload.data.length, 2);

const emptyPayload = parseEchawadiHtmlPayload("GetActiveCasesofMutationStatus", scriptOnlyHtml);
assert.deepEqual(emptyPayload.data, []);

// Guard the old failure mode: HTML with script paths must not be treated as JSON fragments.
assert.equal(looksLikeHtmlResponse(scriptOnlyHtml), true);
assert.doesNotThrow(() => parseEchawadiHtmlPayload("GetActiveCasesofMutationStatus", scriptOnlyHtml));

console.log("Daily Mutations eChawadi HTML parser checks passed.");
