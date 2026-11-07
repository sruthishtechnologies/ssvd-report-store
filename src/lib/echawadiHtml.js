/**
 * Phase 0 freeze surface for Daily Mutations / eChawadi HTML responses.
 * Keep this module additive-only: scheduler, PDF, and SES contracts live elsewhere.
 */

export function looksLikeHtmlResponse(text = "") {
  const sample = String(text || "").trim().slice(0, 800).toLowerCase();
  return /^</.test(sample)
    || sample.includes("<!doctype")
    || sample.includes("<html")
    || sample.includes("<script")
    || sample.includes("<div")
    || sample.includes("<body");
}

export function stripHtmlText(value = "") {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function htmlHiddenInputValue(chunk = "", id = "") {
  const source = String(chunk || "");
  const escapedId = String(id || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`id="${escapedId}"[^>]*value="([^"]*)"`, "i"))
    || source.match(new RegExp(`value="([^"]*)"[^>]*id="${escapedId}"`, "i"));
  return match?.[1]?.trim() || "";
}

export function htmlStrongField(chunk = "", labelPattern) {
  const flags = labelPattern.flags.includes("i") ? labelPattern.flags : `${labelPattern.flags}i`;
  const match = String(chunk || "").match(new RegExp(`${labelPattern.source}\\s*:?\\s*</strong>\\s*([^<]+)`, flags));
  return stripHtmlText(match?.[1] || "");
}

export function parseEchawadiMutationHtml(html = "") {
  const source = String(html || "");
  const parts = source.split(/<div class="card h-100"[^>]*>/i).slice(1);
  const rows = [];
  for (const [offset, part] of parts.entries()) {
    const index = offset + 1;
    const mrNumber = htmlHiddenInputValue(part, `MRNumber_${index}`)
      || htmlStrongField(part, /M\s*R[^:<]*:\s*/)
      || "";
    if (!mrNumber) continue;

    const bodyChunk = (part.match(/<div class="card-body"[^>]*>([\s\S]*)$/i) || [null, part])[1];
    const bodyText = stripHtmlText(bodyChunk);
    const appliedMatch = bodyText.match(/^(.*?)\s*applied for\s+(.+?)\s+transaction\b/i);
    const applicant = appliedMatch?.[1]?.trim() || "";
    const transaction = appliedMatch?.[2]?.trim() || "";

    rows.push({
      MRNumber: mrNumber,
      TypeofTransaction: transaction,
      SurveyNumbers: htmlStrongField(part, /ಸರ್ವೆ\s*ನಂ\.?\s*/).replace(/,\s*$/, ""),
      applicant,
      Seller: "",
      Buyer: "",
      AcquisitionType: htmlStrongField(part, /ಸ್ವಾಧೀನತೆ\s*ರೀತಿ\s*/),
      status: htmlStrongField(part, /Status\s*/),
      TypeofTransactionNo: htmlHiddenInputValue(part, `tran_no_${index}`),
      YearCode: htmlHiddenInputValue(part, `year_code_${index}`),
    });
  }
  return rows;
}

export function parseEchawadiRccmsHtml(html = "") {
  const source = String(html || "");
  if (/No Records Found/i.test(source) && !/Case Number\s*:/i.test(source)) return [];
  const parts = source.split(/<div class="card h-100"[^>]*>/i).slice(1);
  return parts.map((part) => {
    const caseNumber = htmlStrongField(part, /Case\s*Number\s*/);
    if (!caseNumber) return null;
    return {
      case_id: caseNumber,
      Ack_No: htmlStrongField(part, /Ack(?:nowledgement)?\s*No\.?\s*/),
      ownername: htmlStrongField(part, /Owner\s*|ಮಾಲೀಕ\s*/),
      Survey_no: htmlStrongField(part, /Survey\s*No\.?\s*|ಸರ್ವೆ\s*ನಂ\.?\s*/),
      Case_Status: htmlStrongField(part, /Status\s*|ಸ್ಥಿತಿ\s*/),
    };
  }).filter(Boolean);
}

export function parseEchawadiHtmlPayload(path = "", html = "") {
  const source = String(html || "");
  if (/GetActiveCasesofMutationStatus/i.test(path)) {
    return { data: parseEchawadiMutationHtml(source) };
  }
  if (/GetActiveRCCMS/i.test(path)) {
    return { data: parseEchawadiRccmsHtml(source) };
  }
  if (/No Records Found/i.test(source)) {
    return { data: "nodata" };
  }
  return { data: [], parseWarning: `eChawadi ${path} returned HTML instead of JSON` };
}
