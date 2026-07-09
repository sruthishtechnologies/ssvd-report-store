const reports = [
  { id: "fullLegal", name: "Full Legal Report", sections: ["currentRtc", "oldRtc", "khatha", "advancedDetails", "mutationStatus", "mutationRecords", "ownershipMap", "akarband", "echawadi"] },
  { id: "landIssues", name: "Review Points", sections: ["advancedDetails", "mutationStatus", "ownershipMap", "echawadi"] },
  { id: "claudeReview", name: "Claude Review", sections: ["currentRtc", "oldRtc", "khatha", "advancedDetails", "mutationStatus", "mutationRecords", "ownershipMap", "akarband", "echawadi"] },
  { id: "mutationReport", name: "Mutation Report", sections: ["mutationRecords", "mutationStatus", "ownershipMap"] },
  { id: "rtcDetails", name: "RTC Details", sections: ["currentRtc", "oldRtc"] },
  { id: "ownersChangeLog", name: "Owners Change Log", sections: ["currentRtc", "oldRtc"] },
  { id: "advancedDetails", name: "Advanced Details", sections: ["advancedDetails"] },
  { id: "kathaExtract", name: "Katha Extract", sections: ["khatha"] },
  { id: "akarband", name: "Akarband", sections: ["akarband"] },
  { id: "echawadi", name: "eChawadi Report", sections: ["echawadi"] },
];

const workspaces = [
  {
    id: "fullLegalReport",
    name: "Full Legal Report",
    hint: "Complete legal report workspace with all fetched service tabs.",
    status: "Full Legal Report selected",
  },
  {
    id: "landAutoGenReport",
    name: "Land AutoGen Report",
    hint: "Automated step-by-step report generator that combines all service outputs into one printable PDF.",
    status: "Land AutoGen Report selected",
  },
  {
    id: "dailyMutationsReport",
    name: "Daily Mutations Report",
    hint: "Manual and scheduled hobli-level eChawadi mutation report across all villages.",
    status: "Daily Mutations Report selected",
  },
  {
    id: "landScoreCard",
    name: "Land Score Card",
    hint: "Manual land due-diligence scorecard for documents, risks and purchase decision readiness.",
    status: "Land Score Card selected",
  },
  {
    id: "dueDiligenceDashboard",
    name: "Evidence & Gaps Dashboard",
    hint: "One-screen readiness, evidence summary, document gaps and unresolved validation points.",
    status: "Evidence & Gaps Dashboard selected",
  },
  {
    id: "documentGapFinder",
    name: "Document Gap Finder",
    hint: "Find missing records, weak links and evidence gaps from fetched and manually validated documents.",
    status: "Document Gap Finder selected",
  },
  {
    id: "titleChainTimeline",
    name: "Title Chain Timeline",
    hint: "Owner-wise title chain timeline using RTC owner states, MR records and document links.",
    status: "Title Chain Timeline selected",
  },
  {
    id: "deedUploadMatch",
    name: "EC / Sale Deed Match",
    hint: "Upload or paste EC and sale deed text to compare survey, hissa, extent, document numbers and owner names.",
    status: "EC / Sale Deed Match selected",
  },
  {
    id: "kaveriReadiness",
    name: "Kaveri Readiness",
    hint: "Registration readiness checklist for Kaveri, EC, fee, e-challan, appointment and seller/buyer documents.",
    status: "Kaveri Readiness selected",
  },
  {
    id: "surveyBoundaryReport",
    name: "Survey & Boundary Report",
    hint: "Survey, Akarband, sketch, 11E, podi/tippani, access road and physical boundary validation report.",
    status: "Survey & Boundary Report selected",
  },
  {
    id: "villageRiskRadar",
    name: "Village Risk Radar",
    hint: "Village-level mutation, RCCMS, conversion and risk signals from eChawadi-style checks.",
    status: "Village Risk Radar selected",
  },
  {
    id: "portalHealthMonitor",
    name: "Portal Health Monitor",
    hint: "Checks availability of Bhoomi, Mojini, eChawadi, Kaveri and related official portals.",
    status: "Portal Health Monitor selected",
  },
  {
    id: "buyerActionTracker",
    name: "Buyer Action Tracker",
    hint: "Track buyer due-diligence tasks across documents, local checks, legal review and registration readiness.",
    status: "Buyer Action Tracker selected",
  },
  {
    id: "surveyRecords",
    name: "Survey Records",
    hint: "Workspace for survey, hissa, sketch and boundary record features.",
    status: "Survey Records selected",
  },
  {
    id: "downloadRtcs",
    name: "RTC Downloads & Scan",
    hint: "Workspace for RTC download batches, saved RTC files and important RTC image portions.",
    status: "RTC Downloads & Scan selected",
  },
  {
    id: "mrDownloader",
    name: "MR Downloader",
    hint: "Workspace for mutation register download and MR document batches.",
    status: "MR Downloader selected",
  },
  {
    id: "kathaValidation",
    name: "Katha Validation",
    hint: "Workspace for khatha extract validation and mismatch checks.",
    status: "Katha Validation selected",
  },
  {
    id: "villageScan",
    name: "Village Scan",
    hint: "Workspace for village-level checks and broader survey scans.",
    status: "Village Scan selected",
  },
  {
    id: "admin",
    name: "Admin",
    hint: "User approvals, roles, report permissions and notices.",
    status: "Admin selected",
    adminOnly: true,
  },
];

const sectionKeyByTitle = {
  "Current Year RTC": "currentRtc",
  "Old Year RTC": "oldRtc",
  "Khatha Number": "khatha",
  "Advanced Details": "advancedDetails",
  "Mutation Status": "mutationStatus",
  "Mutation Register": "mutationRecords",
  "Ownership Map": "ownershipMap",
  Akarband: "akarband",
  eChawadi: "echawadi",
};

const controls = {
  loginView: document.querySelector("#loginView"),
  appView: document.querySelector("#appView"),
  loginForm: document.querySelector("#loginForm"),
  registerForm: document.querySelector("#registerForm"),
  username: document.querySelector("#username"),
  password: document.querySelector("#password"),
  showRegister: document.querySelector("#showRegister"),
  showLogin: document.querySelector("#showLogin"),
  registerName: document.querySelector("#registerName"),
  registerPhone: document.querySelector("#registerPhone"),
  registerEmail: document.querySelector("#registerEmail"),
  registerMessage: document.querySelector("#registerMessage"),
  loginError: document.querySelector("#loginError"),
  logout: document.querySelector("#logout"),
  mainMenuButton: document.querySelector("#mainMenuButton"),
  adminButton: document.querySelector("#adminButton"),
  mainMenuPanel: document.querySelector("#mainMenuPanel"),
  customNoticeTicker: document.querySelector("#customNoticeTicker"),
  customNoticeText: document.querySelector("#customNoticeText"),
  customNoticeTextRepeat: document.querySelector("#customNoticeTextRepeat"),
  portalDownTicker: document.querySelector("#portalDownTicker"),
  activeWorkspaceName: document.querySelector("#activeWorkspaceName"),
  activeWorkspaceHint: document.querySelector("#activeWorkspaceHint"),
  landPanel: document.querySelector("#landPanel"),
  reportSurface: document.querySelector("#reportSurface"),
  reportActions: document.querySelector(".report-actions"),
  menu: document.querySelector("#reportMenu"),
  activeReportName: document.querySelector("#activeReportName"),
  status: document.querySelector("#status"),
  district: document.querySelector("#district"),
  taluk: document.querySelector("#taluk"),
  hobli: document.querySelector("#hobli"),
  village: document.querySelector("#village"),
  survey: document.querySelector("#survey"),
  surnoc: document.querySelector("#surnoc"),
  hissa: document.querySelector("#hissa"),
  period: document.querySelector("#period"),
  go: document.querySelector("#go"),
  fetchReport: document.querySelector("#fetchReport"),
  form: document.querySelector("#recordForm"),
  reportOutput: document.querySelector("#reportOutput"),
  printOutput: document.querySelector("#printOutput"),
  print: document.querySelector("#print"),
  exportData: document.querySelector("#exportData"),
  saveReport: document.querySelector("#saveReport"),
  savedReports: document.querySelector("#savedReports"),
  downloadFolder: document.querySelector("#downloadFolder"),
  portalStatusDialog: document.querySelector("#portalStatusDialog"),
  portalStatusMessage: document.querySelector("#portalStatusMessage"),
  portalStatusOk: document.querySelector("#portalStatusOk"),
};

const sequenceAfter = {
  district: ["taluk", "hobli", "village", "surnoc", "hissa", "period"],
  taluk: ["hobli", "village", "surnoc", "hissa", "period"],
  hobli: ["village", "surnoc", "hissa", "period"],
  village: ["surnoc", "hissa", "period"],
  surnoc: ["hissa", "period"],
  hissa: ["period"],
  period: [],
};

let sessionId = "";
let currentState = null;
let activeWorkspace = workspaces[0];
let activeReport = reports[0];
let cachedReport = null;
let cachedMrDownloader = null;
let cachedVillageScan = null;
let cachedDailyMutations = null;
let cachedKathaValidation = null;
let cachedDownloadRtcs = null;
let cachedScanRtcs = null;
let cachedAutoGenReport = null;
let cachedScoreCard = null;
let cachedFeatureReports = {};
let loading = false;
let cachedExportPayload = null;
let loadedSavedReportState = null;
let currentUser = null;
let adminState = null;
let customNotice = { enabled: false, message: "" };

const featureWorkspaceIds = new Set([
  "dueDiligenceDashboard",
  "documentGapFinder",
  "titleChainTimeline",
  "deedUploadMatch",
  "kaveriReadiness",
  "surveyBoundaryReport",
  "villageRiskRadar",
  "portalHealthMonitor",
  "buyerActionTracker",
]);

function isAdminUser() {
  return Boolean(currentUser?.isAdmin);
}

function permittedWorkspaces() {
  const allowed = new Set(currentUser?.workspaceIds || []);
  return workspaces.filter((workspace) => {
    if (workspace.adminOnly) return isAdminUser();
    return isAdminUser() || allowed.has(workspace.id);
  });
}

function hasWorkspaceAccess(workspaceId) {
  return permittedWorkspaces().some((workspace) => workspace.id === workspaceId);
}

function usesLandDetails() {
  return !isAdminWorkspace() && (isFullLegalWorkspace() || isAutoGenWorkspace() || isDailyMutationsWorkspace() || isMrDownloaderWorkspace() || isDownloadRtcsWorkspace() || isScanRtcsWorkspace() || isVillageScanWorkspace() || isKathaValidationWorkspace());
}

function isFeatureWorkspace() {
  return featureWorkspaceIds.has(activeWorkspace.id);
}

function activeLocationSource() {
  return (isVillageScanWorkspace() || isDailyMutationsWorkspace()) ? "echawadi" : "bhoomi";
}

function selectedText(control) {
  return control.options?.[control.selectedIndex]?.textContent || "";
}

function values() {
  return {
    district: controls.district.value,
    districtLabel: selectedText(controls.district),
    taluk: controls.taluk.value,
    talukLabel: selectedText(controls.taluk),
    hobli: controls.hobli.value,
    hobliLabel: selectedText(controls.hobli),
    village: controls.village.value,
    villageLabel: selectedText(controls.village),
    survey: controls.survey.value.trim(),
    surnoc: controls.surnoc.value,
    surnocLabel: selectedText(controls.surnoc),
    hissa: controls.hissa.value,
    hissaLabel: selectedText(controls.hissa),
    period: controls.period.value,
    periodLabel: selectedText(controls.period),
    sections: reports[0].sections,
  };
}

function setStatus(message) {
  controls.status.textContent = message;
}

function setPortalDownNotice(isDown) {
  controls.portalDownTicker.hidden = !isDown;
}

function showPortalStatusPopup(message = "Bhoomi portal is not working at this moment. Please try other reports or try again after some time.") {
  controls.portalStatusMessage.textContent = message;
  controls.portalStatusDialog.hidden = false;
  controls.portalStatusOk.focus();
}

function hidePortalStatusPopup() {
  controls.portalStatusDialog.hidden = true;
}

function isBhoomiPortalError(error) {
  return /Bhoomi|Official site|Service2|HTTP 500|official service/i.test(error?.message || "");
}

function isPlaceholder(value = "") {
  const normalized = String(value || "").trim();
  return !normalized || normalized === "0" || /^select\b/i.test(normalized) || /ಆಯ್ಕೆ/.test(normalized);
}

function hasRequiredInputs() {
  if (isDailyMutationsWorkspace()) {
    return Boolean(
      sessionId
      && !isPlaceholder(controls.district.value)
      && !isPlaceholder(controls.taluk.value)
      && !isPlaceholder(controls.hobli.value),
    );
  }
  if (isVillageScanWorkspace()) {
    return Boolean(
      sessionId
      && !isPlaceholder(controls.district.value)
      && !isPlaceholder(controls.taluk.value)
      && !isPlaceholder(controls.hobli.value)
      && !isPlaceholder(controls.village.value),
    );
  }
  return Boolean(
    sessionId
    && !isPlaceholder(controls.district.value)
    && !isPlaceholder(controls.taluk.value)
    && !isPlaceholder(controls.hobli.value)
    && !isPlaceholder(controls.village.value)
    && controls.survey.value.trim()
    && !isPlaceholder(controls.surnoc.value)
    && !isPlaceholder(controls.hissa.value),
  );
}

function setBusy(isBusy) {
  loading = isBusy;
  document.body.classList.toggle("is-loading", isBusy);
  for (const element of [controls.district, controls.taluk, controls.hobli, controls.village, controls.survey, controls.surnoc, controls.hissa, controls.go, controls.fetchReport]) {
    element.disabled = isBusy;
  }
  if (!isBusy && currentState) restoreDisabled(currentState);
}

function renderSelect(key, state) {
  const select = controls[key];
  const current = select.value;
  select.innerHTML = "";
  for (const option of state.options || []) {
    const node = document.createElement("option");
    node.value = option.value;
    node.textContent = option.label;
    node.selected = option.selected;
    select.append(node);
  }
  if (current && [...select.options].some((option) => option.value === current)) {
    select.value = current;
  }
}

function resetLandSelectors() {
  const placeholders = {
    district: "Select District",
    taluk: "Select Taluk",
    hobli: "Select Hobli",
    village: "Select Village",
    surnoc: "Select Surnoc",
    hissa: "Select Hissa",
    period: "Select Period",
  };
  for (const [key, label] of Object.entries(placeholders)) {
    controls[key].innerHTML = `<option value="">${label}</option>`;
    controls[key].disabled = true;
  }
  controls.district.disabled = false;
  controls.survey.value = "";
  controls.survey.disabled = true;
  controls.go.disabled = true;
  controls.fetchReport.disabled = true;
  currentState = null;
}

function restoreDisabled(state) {
  for (const key of ["district", "taluk", "hobli", "village", "surnoc", "hissa"]) {
    controls[key].disabled = state.selects[key]?.disabled ?? true;
  }
  if (isVillageScanWorkspace()) {
    controls.survey.disabled = true;
    controls.go.disabled = true;
    controls.surnoc.disabled = true;
    controls.hissa.disabled = true;
    controls.period.disabled = true;
    controls.fetchReport.disabled = loading || !hasRequiredInputs();
    return;
  }
  if (isDailyMutationsWorkspace()) {
    controls.village.disabled = true;
    controls.survey.disabled = true;
    controls.go.disabled = true;
    controls.surnoc.disabled = true;
    controls.hissa.disabled = true;
    controls.period.disabled = true;
    controls.fetchReport.disabled = loading || !hasRequiredInputs();
    return;
  }
  controls.survey.disabled = state.survey.disabled;
  controls.go.disabled = state.survey.disabled || !controls.survey.value.trim();
  controls.fetchReport.disabled = loading || !hasRequiredInputs();
}

function renderState(state) {
  currentState = state;
  sessionId = state.sessionId;
  for (const key of ["district", "taluk", "hobli", "village", "surnoc", "hissa", "period"]) {
    renderSelect(key, state.selects[key]);
  }
  if (state.survey.value && !controls.survey.value) controls.survey.value = state.survey.value;
  restoreDisabled(state);
  clearCachedReport();
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function escapeAttr(value = "") {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function multilineHtml(value = "") {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

async function api(path, payload = {}) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || "Request failed");
  return data;
}

async function getJson(path) {
  const response = await fetch(path);
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || "Request failed");
  return data;
}

function setExportAvailability() {
  controls.exportData.disabled = !cachedReport || activeWorkspace.id !== "fullLegalReport";
  const hasAnySavedData = Boolean(cachedReport || cachedAutoGenReport || cachedDailyMutations || cachedMrDownloader || cachedDownloadRtcs || cachedScanRtcs || cachedVillageScan || cachedKathaValidation || cachedScoreCard || Object.keys(cachedFeatureReports || {}).length);
  controls.saveReport.disabled = !hasAnySavedData;
  controls.downloadFolder.disabled = !hasAnySavedData;
}

function showLoggedIn(isLoggedIn) {
  controls.loginView.hidden = isLoggedIn;
  controls.appView.hidden = !isLoggedIn;
  controls.adminButton.hidden = !isLoggedIn || !isAdminUser();
  controls.loginError.textContent = "";
}

function renderCustomNotice() {
  const message = customNotice?.enabled && customNotice.message ? customNotice.message : "";
  controls.customNoticeTicker.hidden = !message;
  controls.customNoticeText.textContent = message;
  controls.customNoticeTextRepeat.textContent = message;
}

async function loadPublicState() {
  try {
    const state = await getJson("/api/public-state");
    customNotice = state.notice || { enabled: false, message: "" };
    renderCustomNotice();
  } catch {
    customNotice = { enabled: false, message: "" };
    renderCustomNotice();
  }
}

function saveCurrentUser(user) {
  currentUser = user;
  localStorage.setItem("ssvd-report-store-user", JSON.stringify(user));
  controls.adminButton.hidden = !isAdminUser();
}

function clearCurrentUser() {
  currentUser = null;
  adminState = null;
  localStorage.removeItem("ssvd-report-store-user");
  controls.adminButton.hidden = true;
}

async function activateWorkspace(workspace) {
  activeWorkspace = workspace;
  closeMainMenu();
  renderWorkspace();
  setStatus(workspace.status);
  if (usesLandDetails()) await start();
}

function renderMenu() {
  controls.menu.innerHTML = "";
  for (const report of reports) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = report.name;
    button.className = report.id === activeReport.id ? "active" : "";
    button.addEventListener("click", () => {
      activeReport = report;
      controls.activeReportName.textContent = report.name;
      renderMenu();
      if (cachedReport) {
        renderReport(cachedReport);
        setStatus(`${report.name} ready`);
      } else {
        renderEmptyService();
        setStatus(`${report.name} selected`);
      }
    });
    controls.menu.append(button);
  }
}

function isFullLegalWorkspace() {
  return activeWorkspace.id === "fullLegalReport";
}

function isAutoGenWorkspace() {
  return activeWorkspace.id === "landAutoGenReport";
}

function isDailyMutationsWorkspace() {
  return activeWorkspace.id === "dailyMutationsReport";
}

function isScoreCardWorkspace() {
  return activeWorkspace.id === "landScoreCard";
}

function isMrDownloaderWorkspace() {
  return activeWorkspace.id === "mrDownloader";
}

function isDownloadRtcsWorkspace() {
  return activeWorkspace.id === "downloadRtcs";
}

function isScanRtcsWorkspace() {
  return activeWorkspace.id === "scanRtcs";
}

function isVillageScanWorkspace() {
  return activeWorkspace.id === "villageScan";
}

function isKathaValidationWorkspace() {
  return activeWorkspace.id === "kathaValidation";
}

function isAdminWorkspace() {
  return activeWorkspace.id === "admin";
}

function renderWorkspaceMenu() {
  controls.mainMenuPanel.innerHTML = "";
  for (const workspace of permittedWorkspaces()) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = workspace.name;
    button.className = workspace.id === activeWorkspace.id ? "active" : "";
    button.addEventListener("click", () => activateWorkspace(workspace));
    controls.mainMenuPanel.append(button);
  }
}

function openMainMenu() {
  renderWorkspaceMenu();
  controls.mainMenuPanel.hidden = false;
  controls.mainMenuButton.setAttribute("aria-expanded", "true");
}

function closeMainMenu() {
  controls.mainMenuPanel.hidden = true;
  controls.mainMenuButton.setAttribute("aria-expanded", "false");
}

function renderWorkspacePlaceholder() {
  controls.activeReportName.textContent = activeWorkspace.name;
  controls.reportOutput.innerHTML = `
    <div class="workspace-placeholder">
      <p class="eyebrow">Report Workspace</p>
      <h3>${escapeHtml(activeWorkspace.name)}</h3>
      <p>${escapeHtml(activeWorkspace.hint)}</p>
      <div class="workspace-placeholder-grid">
        <span>Tabs and workflow for this report can be added here next.</span>
        <span>The existing Full Legal Report tabs and fetched data are kept unchanged.</span>
      </div>
    </div>
  `;
}

function currentLandLabel() {
  const selected = values();
  return [selected.villageLabel, selected.survey, selected.surnocLabel || selected.surnoc, selected.hissaLabel || selected.hissa]
    .filter(Boolean)
    .join(" / ") || "Selected land";
}

function latestReportSections() {
  return cachedReport?.sections || [];
}

function sectionRecordCount(title) {
  const section = latestReportSections().find((item) => item.title === title);
  return (section?.records || []).length;
}

function hasFetchedSection(title) {
  const section = latestReportSections().find((item) => item.title === title);
  return Boolean(section && !section.error && (section.records || []).some((record) => record.summary?.hasData || record.imageUrl || record.pdfUrl));
}

function currentReportDataStore() {
  return {
    fullLegalReport: cachedReport,
    autoGenReport: cachedAutoGenReport,
    mrDownloader: cachedMrDownloader,
    downloadRtcs: cachedDownloadRtcs,
    scanRtcs: cachedScanRtcs,
    villageScan: cachedVillageScan,
    dailyMutations: cachedDailyMutations,
    kathaValidation: cachedKathaValidation,
    scoreCard: cachedScoreCard,
    featureReports: cachedFeatureReports,
    exportPayload: cachedExportPayload,
  };
}

function recordKey(record = {}) {
  return JSON.stringify({
    label: record.label || "",
    rows: record.summary?.rows || [],
    imageUrl: record.imageUrl || "",
    pdfUrl: record.pdfUrl || "",
    attachmentError: record.attachmentError || "",
  });
}

function uniqueRecords(records = []) {
  const seen = new Set();
  return records.filter((record) => {
    const key = recordKey(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fetchedLabel(source = {}) {
  const value = source.fetchedAt || source.generatedAt || source.savedAt;
  return value ? `Fetched: ${new Date(value).toLocaleString()}` : "Not fetched yet";
}

function compareSavedWithCurrent(previous = {}, current = {}) {
  const prev = previous.reports || {};
  return [
    ["Full Legal Report", prev.fullLegalReport?.generatedAt, current.fullLegalReport?.generatedAt, (prev.fullLegalReport?.rtcRows || []).length, (current.fullLegalReport?.rtcRows || []).length],
    ["MR Downloader", prev.mrDownloader?.fetchedAt, current.mrDownloader?.fetchedAt, (prev.mrDownloader?.records || []).length, (current.mrDownloader?.records || []).length],
    ["RTC Downloads", prev.downloadRtcs?.fetchedAt, current.downloadRtcs?.fetchedAt, (prev.downloadRtcs?.records || []).length, (current.downloadRtcs?.records || []).length],
    ["Scan RTCs", prev.scanRtcs?.fetchedAt, current.scanRtcs?.fetchedAt, (prev.scanRtcs?.scans || []).length, (current.scanRtcs?.scans || []).length],
    ["Village Scan", prev.villageScan?.fetchedAt, current.villageScan?.fetchedAt, (prev.villageScan?.records || []).length, (current.villageScan?.records || []).length],
    ["Katha Validation", prev.kathaValidation?.fetchedAt, current.kathaValidation?.fetchedAt, (prev.kathaValidation?.records || []).length, (current.kathaValidation?.records || []).length],
  ].map(([name, oldDate, newDate, oldCount, newCount]) => [
    name,
    oldDate ? new Date(oldDate).toLocaleString() : "-",
    newDate ? new Date(newDate).toLocaleString() : "-",
    String(oldCount ?? 0),
    String(newCount ?? 0),
    oldCount === newCount ? "No count change" : "Changed - validate notes",
  ]);
}

function featureStatus(ok, partialText = "Needs validation") {
  return ok ? "Good" : partialText;
}

function featureTable(headers, rows) {
  return `
    <div class="table-scroll">
      <table class="wide-table feature-table">
        <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.map((row) => `<tr>${row.map((cell) => `<td>${multilineHtml(cell || "-")}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function manualEvidencePanel() {
  return `
    <section class="summary-block feature-manual-panel">
      <div class="section-title"><h3>Manual Evidence</h3><span>Optional notes for validation</span></div>
      <label><span>Paste observations, document numbers, EC notes or lawyer comments</span><textarea data-feature-notes rows="4" placeholder="Example: EC checked from 1995-2026, MR 49 linked with sale deed, boundary verified on site...">${escapeHtml(cachedFeatureReports[activeWorkspace.id]?.notes || "")}</textarea></label>
      <button type="button" data-feature-action="save-notes">Save Notes</button>
    </section>
  `;
}

function baseFeatureShell(title, subtitle, body) {
  return `
    <article class="feature-report">
      <section class="summary-block feature-hero">
        <div class="section-title"><h3>${escapeHtml(title)}</h3><span>${escapeHtml(subtitle)}</span></div>
        <table>${rowsPreview([
          ["Land", currentLandLabel()],
          ["Uses fetched report data", cachedReport ? "Yes" : "No - run Full Legal Report / AutoGen for stronger evidence"],
          ["Generated", new Date().toLocaleString()],
        ], 8)}</table>
      </section>
      ${body}
      ${manualEvidencePanel()}
    </article>
  `;
}

function renderDueDiligenceDashboard() {
  const readinessRows = [
    ["RTC Details", featureStatus(hasFetchedSection("Current Year RTC") || hasFetchedSection("Old Year RTC")), `${(cachedReport?.rtcRows || []).length} RTC row(s)`],
    ["Mutation Report", featureStatus(hasFetchedSection("Mutation Register")), `${sectionRecordCount("Mutation Register")} mutation section(s)`],
    ["Khatha Extract", featureStatus(hasFetchedSection("Khatha Number")), "Khatha owner/survey match needs manual confirmation"],
    ["Akarband / Survey", featureStatus(hasFetchedSection("Akarband")), "Akarband and sketch should match physical boundary"],
    ["eChawadi / RCCMS", featureStatus(hasFetchedSection("eChawadi")), "Pending cases and village risks need review"],
    ["Conversion / Land Use", "Needs validation", "Check conversion order, zoning and conditions"],
    ["EC / Sale Deed", "Needs upload", "Use EC / Sale Deed Match service"],
    ["Physical Site", "Needs validation", "Boundary, access road and possession check required"],
  ];
  const evidenceRows = [
    ["RTC", hasFetchedSection("Current Year RTC") ? "Available" : "Missing", "Current/old RTC rows and owner details"],
    ["MR", hasFetchedSection("Mutation Register") ? "Available" : "Missing", "MR extract and mutation history"],
    ["Khatha", hasFetchedSection("Khatha Number") ? "Available" : "Missing", "Khatha number and owner match"],
    ["Akarband", hasFetchedSection("Akarband") ? "Available" : "Missing", "Survey extent and map"],
    ["eChawadi", hasFetchedSection("eChawadi") ? "Available" : "Missing", "Pending cases, conversions, village activity"],
    ["Manual Notes", cachedFeatureReports.dueDiligenceDashboard?.notes ? "Available" : "Missing", cachedFeatureReports.dueDiligenceDashboard?.notes || "No manual evidence notes saved"],
  ];
  const gapRows = [
    ["Title chain / Mother deed", cachedReport ? "Manual check required" : "Missing Data", "Upload/paste sale deed and EC evidence."],
    ["EC 15-30 years", "Missing Data", "Fetch EC through Kaveri or upload text for comparison."],
    ["Old RTC coverage", (cachedReport?.rtcRows || []).filter((row) => row.type === "Old RTC").length ? "Good" : "Need to Check", "Confirm enough year coverage for title chain."],
    ["MR extracts", hasFetchedSection("Mutation Register") ? "Good" : "Need to Check", "Every ownership/extent change needs linked MR extract."],
    ["Conversion/zoning approval", "Need to Check", "Required if use differs from agricultural classification."],
  ];
  const comparisonRows = loadedSavedReportState ? compareSavedWithCurrent(loadedSavedReportState, currentReportDataStore()) : [];
  return baseFeatureShell("Evidence & Gaps Dashboard", "Readiness, evidence, gaps and saved-vs-refetched validation", `
    <section class="summary-block">${featureTable(["Area", "Status", "Notes"], readinessRows)}</section>
    <section class="summary-block">${featureTable(["Evidence", "Status", "Source / Notes"], evidenceRows)}</section>
    <section class="summary-block">${featureTable(["Document / Evidence", "Status", "Action"], gapRows)}</section>
    ${comparisonRows.length ? `<section class="summary-block">${featureTable(["Service", "Previous Fetch", "Current Fetch", "Previous Count", "Current Count", "Validation"], comparisonRows)}</section>` : ""}
  `);
}

function renderDocumentGapFinder() {
  const rows = [
    ["Title chain / Mother deed", cachedReport ? "Manual check required" : "Missing Data", "Upload/paste sale deed and EC evidence."],
    ["EC 15-30 years", "Missing Data", "Fetch EC through Kaveri or upload text for comparison."],
    ["Current RTC", hasFetchedSection("Current Year RTC") ? "Good" : "Missing Data", "Current RTC should identify owner, khatha and liabilities."],
    ["Old RTC coverage", (cachedReport?.rtcRows || []).filter((row) => row.type === "Old RTC").length ? "Good" : "Need to Check", "Confirm enough year coverage for title chain."],
    ["MR extracts", hasFetchedSection("Mutation Register") ? "Good" : "Need to Check", "Every ownership/extent change needs linked MR extract."],
    ["Khatha / tax", hasFetchedSection("Khatha Number") ? "Good" : "Need to Check", "Owner and survey should match RTC."],
    ["Akarband / survey sketch", hasFetchedSection("Akarband") ? "Good" : "Need to Check", "Verify extent and boundaries."],
    ["Conversion/zoning approval", "Need to Check", "Required if use differs from agricultural classification."],
  ];
  return baseFeatureShell("Document Gap Finder", "Missing documents and weak evidence links", `
    <section class="summary-block">${featureTable(["Document / Evidence", "Status", "Action"], rows)}</section>
  `);
}

function renderTitleChainTimeline() {
  const rows = ownershipChainRows(cachedReport?.rtcRows || []);
  return baseFeatureShell("Title Chain Timeline", "Owner and extent flow from RTC/MR evidence", `
    <section class="summary-block">
      ${rows.length ? featureTable(["Step", "Period", "Owner(s)", "Extent", "Khatha"], rows) : "<p>No RTC ownership rows are available yet. Generate Full Legal Report or Download RTCs first.</p>"}
    </section>
  `);
}

function deedMatchState() {
  cachedFeatureReports.deedUploadMatch ||= { deedText: "", notes: "" };
  return cachedFeatureReports.deedUploadMatch;
}

function extractDocSignals(text = "") {
  const value = (pattern) => (text.match(pattern) || [])[1]?.trim() || "";
  return {
    survey: value(/survey\s*(?:no|number)?\s*[:\-]?\s*([0-9/*A-Za-z-]+)/i),
    hissa: value(/hissa\s*(?:no|number)?\s*[:\-]?\s*([0-9/*A-Za-z-]+)/i),
    documentNo: value(/(?:document|doc)\s*(?:no|number)?\s*[:\-]?\s*([A-Za-z0-9/-]+)/i),
    date: value(/\bdate\s*[:\-]?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})/i),
    extent: value(/extent\s*[:\-]?\s*([0-9. -]+(?:acre|gunta|guntas|sq|sqm)?)/i),
  };
}

function renderDeedUploadMatch() {
  const state = deedMatchState();
  const signals = extractDocSignals(state.deedText || "");
  const selected = values();
  const rows = [
    ["Survey Number", selected.survey || "-", signals.survey || "Not found", signals.survey && selected.survey && signals.survey.includes(selected.survey) ? "Good" : "Need to Check"],
    ["Hissa", selected.hissaLabel || selected.hissa || "-", signals.hissa || "Not found", signals.hissa ? "Need to Check" : "Missing Data"],
    ["Extent", (cachedReport?.rtcRows || [])[0]?.extents?.join("; ") || "-", signals.extent || "Not found", signals.extent ? "Need to Check" : "Missing Data"],
    ["Document Number", "-", signals.documentNo || "Not found", signals.documentNo ? "Good" : "Missing Data"],
    ["Document Date", "-", signals.date || "Not found", signals.date ? "Good" : "Missing Data"],
  ];
  return `
    <article class="feature-report">
      <section class="summary-block feature-hero">
        <div class="section-title"><h3>EC / Sale Deed Match</h3><span>Paste EC or sale deed text for a conservative field match</span></div>
        <label><span>EC / sale deed text</span><textarea data-deed-text rows="8" placeholder="Paste text from EC, sale deed, OCR, or notes...">${escapeHtml(state.deedText || "")}</textarea></label>
        <button type="button" data-feature-action="save-deed">Compare Document</button>
      </section>
      <section class="summary-block">${featureTable(["Field", "Selected Land / RTC", "Uploaded Document", "Status"], rows)}</section>
    </article>
  `;
}

function renderKaveriReadiness() {
  const rows = [
    ["EC Form 15/16 collected", "Need to Check", "Kaveri EC should cover 15-30 years."],
    ["Stamp duty/registration fee estimate", "Need to Check", "Confirm market value, stamp duty, cess and registration fee."],
    ["Seller identity and authority", "Need to Check", "PAN/Aadhaar, GPA, company/partnership authority, heirs/co-owners."],
    ["Buyer identity and payment trail", "Need to Check", "PAN/Aadhaar, bank details, TDS/payment trail."],
    ["Appointment / biometric readiness", "Need to Check", "Confirm slot, witnesses and original documents."],
    ["Bank NOC / loan clearance", "Need to Check", "Needed when EC or seller history shows loan/mortgage."],
  ];
  return baseFeatureShell("Kaveri Readiness", "Registration and EC workflow checklist", `<section class="summary-block">${featureTable(["Checklist", "Status", "Validation"], rows)}</section>`);
}

function renderSurveyBoundaryReport() {
  const rows = [
    ["Akarband", hasFetchedSection("Akarband") ? "Good" : "Need to Check", "Compare official extent and sketch."],
    ["11E / podi / tippani", "Need to Check", "Fetch Mojini survey documents if subdivision exists."],
    ["Boundary stones / hissa boundary", "Need to Check", "Physical verification with surveyor recommended."],
    ["Access road", "Need to Check", "Confirm legal access and road width."],
    ["Neighbour boundary confirmation", "Need to Check", "Record local verification notes."],
    ["Map mismatch", "Need to Check", "Compare RTC, Akarband, Dishaank/Bhoomi Maps and site."],
  ];
  return baseFeatureShell("Survey & Boundary Report", "Survey document and physical boundary validation", `<section class="summary-block">${featureTable(["Item", "Status", "Action"], rows)}</section>`);
}

function renderVillageRiskRadar() {
  const echawadi = latestReportSections().find((section) => section.title === "eChawadi");
  const rows = (echawadi?.records || []).map((record) => [
    record.label || "-",
    record.summary?.hasData ? "Data Found" : "No selected-survey match",
    (record.summary?.rows || []).slice(0, 4).map((row) => row.join(" | ")).join("\n") || record.summary?.text || "-",
  ]);
  return baseFeatureShell("Village Risk Radar", "Village-level mutation, RCCMS and conversion signals", `
    <section class="summary-block">
      ${rows.length ? featureTable(["Risk Area", "Status", "Evidence"], rows) : "<p>No eChawadi data is loaded yet. Run Full Legal Report, Village Scan, or AutoGen first.</p>"}
    </section>
  `);
}

async function renderPortalHealthMonitor() {
  const report = cachedFeatureReports.portalHealthMonitor;
  if (!report) {
    controls.reportOutput.innerHTML = baseFeatureShell("Portal Health Monitor", "Official Karnataka portal availability", `
      <section class="summary-block"><p>Click Refresh Health to check Bhoomi, Mojini, eChawadi, Kaveri and related services.</p><button type="button" data-feature-action="portal-health">Refresh Health</button></section>
    `);
    return;
  }
  const rows = (report.results || []).map((item) => [item.name, item.ok ? "Online" : "Issue", item.status, `${item.responseMs || 0} ms`, item.url]);
  controls.reportOutput.innerHTML = baseFeatureShell("Portal Health Monitor", `Checked ${new Date(report.checkedAt).toLocaleString()}`, `
    <section class="summary-block"><button type="button" data-feature-action="portal-health">Refresh Health</button>${featureTable(["Portal", "Status", "Details", "Response", "URL"], rows)}</section>
  `);
}

function renderEvidenceSummary() {
  const rows = [
    ["RTC", hasFetchedSection("Current Year RTC") ? "Available" : "Missing", "Current/old RTC rows and owner details"],
    ["MR", hasFetchedSection("Mutation Register") ? "Available" : "Missing", "MR extract and mutation history"],
    ["Khatha", hasFetchedSection("Khatha Number") ? "Available" : "Missing", "Khatha number and owner match"],
    ["Akarband", hasFetchedSection("Akarband") ? "Available" : "Missing", "Survey extent and map"],
    ["eChawadi", hasFetchedSection("eChawadi") ? "Available" : "Missing", "Pending cases, conversions, village activity"],
    ["Manual Notes", cachedFeatureReports[activeWorkspace.id]?.notes ? "Available" : "Missing", cachedFeatureReports[activeWorkspace.id]?.notes || "No manual evidence notes saved"],
  ];
  return baseFeatureShell("AI Evidence Summary", "Evidence-linked summary, ready for LLM/legal review", `<section class="summary-block">${featureTable(["Evidence", "Status", "Source / Notes"], rows)}</section>`);
}

const buyerTasks = [
  "Collect mother deed and linked sale deeds",
  "Download EC for 15-30 years",
  "Verify current RTC and old RTC title chain",
  "Download all MR extracts and link document numbers",
  "Verify Khatha and latest tax paid receipt",
  "Check Akarband, sketch, 11E/podi/tippani",
  "Check RCCMS/court/revenue disputes",
  "Complete site inspection and boundary verification",
  "Get lawyer written opinion",
  "Prepare Kaveri registration documents and payment plan",
];

function trackerState() {
  cachedFeatureReports.buyerActionTracker ||= {
    tasks: Object.fromEntries(buyerTasks.map((task) => [task, "Pending"])),
    notes: "",
    savedAt: "",
  };
  cachedFeatureReports.buyerActionTracker.tasks ||= Object.fromEntries(buyerTasks.map((task) => [task, "Pending"]));
  return cachedFeatureReports.buyerActionTracker;
}

function renderBuyerActionTracker() {
  const state = trackerState();
  const verified = Object.values(state.tasks).filter((status) => status === "Verified" || status === "Not Applicable").length;
  const scoreRows = cachedScoreCard?.answers ? allScoreRows(cachedScoreCard.answers).slice(0, 20).map((row) => [row.section, row.question, row.status]) : [];
  return baseFeatureShell("Buyer Action Tracker", `${verified}/${buyerTasks.length} items verified or not applicable`, `
    <section class="summary-block">
      <table>
        <thead><tr><th>Task</th><th>Status</th></tr></thead>
        <tbody>
          ${buyerTasks.map((task) => `
            <tr>
              <td>${escapeHtml(task)}</td>
              <td><select data-tracker-task="${escapeAttr(task)}">${["Pending", "Collected", "Verified", "Mismatch", "Not Applicable"].map((status) => `<option value="${status}" ${state.tasks[task] === status ? "selected" : ""}>${status}</option>`).join("")}</select></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <label class="tracker-notes"><span>Tracker notes</span><textarea data-tracker-notes rows="4" placeholder="Add pending document notes, phone calls, lawyer comments or site verification status...">${escapeHtml(state.notes || "")}</textarea></label>
      <button type="button" data-feature-action="save-tracker">Save Tracker Status</button>
      ${state.savedAt ? `<p class="saved-report-note">Last saved in this session: ${escapeHtml(new Date(state.savedAt).toLocaleString())}</p>` : ""}
    </section>
    ${scoreRows.length ? `<section class="summary-block">${featureTable(["Score Section", "Checklist Item", "Score Status"], scoreRows)}</section>` : ""}
  `);
}

function renderFeatureWorkspace() {
  if (activeWorkspace.id === "portalHealthMonitor") {
    renderPortalHealthMonitor();
    return;
  }
  const htmlById = {
    dueDiligenceDashboard: renderDueDiligenceDashboard,
    documentGapFinder: renderDocumentGapFinder,
    titleChainTimeline: renderTitleChainTimeline,
    deedUploadMatch: renderDeedUploadMatch,
    kaveriReadiness: renderKaveriReadiness,
    surveyBoundaryReport: renderSurveyBoundaryReport,
    villageRiskRadar: renderVillageRiskRadar,
    buyerActionTracker: renderBuyerActionTracker,
  };
  controls.reportOutput.innerHTML = (htmlById[activeWorkspace.id] || (() => renderWorkspacePlaceholder()))();
}

async function handleFeatureAction(event) {
  if (!isFeatureWorkspace()) return;

  const trackerSelect = event.target.closest("select[data-tracker-task]");
  if (trackerSelect) {
    const state = trackerState();
    state.tasks[trackerSelect.dataset.trackerTask] = trackerSelect.value;
    setStatus("Buyer action tracker changed. Click Save Tracker Status to keep it with the report.");
    return;
  }

  const button = event.target.closest("[data-feature-action]");
  if (!button) return;

  const action = button.dataset.featureAction;
  if (action === "save-notes") {
    cachedFeatureReports[activeWorkspace.id] ||= {};
    cachedFeatureReports[activeWorkspace.id].notes = controls.reportOutput.querySelector("[data-feature-notes]")?.value || "";
    setExportAvailability();
    renderFeatureWorkspace();
    setStatus("Validation notes saved");
    return;
  }

  if (action === "save-deed") {
    const state = deedMatchState();
    state.deedText = controls.reportOutput.querySelector("[data-deed-text]")?.value || "";
    setExportAvailability();
    renderFeatureWorkspace();
    setStatus("Document text compared with selected land details");
    return;
  }

  if (action === "save-tracker") {
    const state = trackerState();
    for (const select of controls.reportOutput.querySelectorAll("select[data-tracker-task]")) {
      state.tasks[select.dataset.trackerTask] = select.value;
    }
    state.notes = controls.reportOutput.querySelector("[data-tracker-notes]")?.value || "";
    state.savedAt = new Date().toISOString();
    setExportAvailability();
    renderFeatureWorkspace();
    setStatus("Buyer action tracker saved");
    return;
  }

  if (action === "portal-health") {
    try {
      button.disabled = true;
      button.textContent = "Checking...";
      setStatus("Checking Karnataka portal availability...");
      cachedFeatureReports.portalHealthMonitor = await api("/api/portal-health");
      setExportAvailability();
      renderFeatureWorkspace();
      setStatus("Portal health check completed");
    } catch (error) {
      setStatus(error.message);
      renderFeatureWorkspace();
    }
  }
}

function renderWorkspace() {
  const allowed = permittedWorkspaces();
  if (!allowed.length) {
    controls.activeWorkspaceName.textContent = "No Reports Assigned";
    controls.activeWorkspaceHint.textContent = "Please contact admin for report access.";
    controls.landPanel.hidden = true;
    controls.reportActions.hidden = true;
    controls.menu.hidden = true;
    controls.reportOutput.innerHTML = `<div class="empty-state"><strong>No reports assigned</strong><span>Please contact admin to enable report access for your login.</span></div>`;
    return;
  }
  if (!hasWorkspaceAccess(activeWorkspace.id)) activeWorkspace = allowed[0];
  controls.activeWorkspaceName.textContent = activeWorkspace.name;
  controls.activeWorkspaceHint.textContent = activeWorkspace.hint;
  renderWorkspaceMenu();
  document.body.classList.toggle("secondary-workspace", !isFullLegalWorkspace());
  document.body.classList.toggle("village-workspace", isVillageScanWorkspace() || isDailyMutationsWorkspace());
  document.body.classList.toggle("hobli-workspace", isDailyMutationsWorkspace());
  const landDetailsVisible = usesLandDetails();
  controls.landPanel.hidden = !landDetailsVisible;
  controls.menu.hidden = !isFullLegalWorkspace();
  controls.reportActions.hidden = !(isFullLegalWorkspace() || isAutoGenWorkspace() || isDailyMutationsWorkspace() || isScoreCardWorkspace() || isFeatureWorkspace() || isMrDownloaderWorkspace() || isDownloadRtcsWorkspace() || isScanRtcsWorkspace() || isVillageScanWorkspace() || isKathaValidationWorkspace());
  controls.exportData.hidden = !isFullLegalWorkspace();
  controls.print.hidden = !(isFullLegalWorkspace() || isAutoGenWorkspace() || isDailyMutationsWorkspace() || isScoreCardWorkspace() || isFeatureWorkspace() || isMrDownloaderWorkspace() || isDownloadRtcsWorkspace() || isScanRtcsWorkspace() || isVillageScanWorkspace() || isKathaValidationWorkspace());
  controls.print.textContent = isAutoGenWorkspace() ? "Download Report" : "Print Report";
  controls.fetchReport.textContent = isAutoGenWorkspace() ? "Generate Automated Report" : (isDailyMutationsWorkspace() ? "Generate Daily Report" : (isVillageScanWorkspace() ? "Fetch Village Data" : (isKathaValidationWorkspace() ? "Validate Katha" : (isDownloadRtcsWorkspace() ? "Download RTCs" : (isScanRtcsWorkspace() ? "Scan RTCs" : "Fetch Data")))));
  controls.survey.required = !(isVillageScanWorkspace() || isDailyMutationsWorkspace());
  controls.surnoc.required = !(isVillageScanWorkspace() || isDailyMutationsWorkspace());
  controls.hissa.required = !(isVillageScanWorkspace() || isDailyMutationsWorkspace());
  if (currentState) restoreDisabled(currentState);
  setExportAvailability();

  if (isAdminWorkspace()) {
    controls.activeReportName.textContent = "Admin";
    if (!adminState) {
      controls.reportOutput.innerHTML = `<div class="loading-card">Loading admin panel...</div>`;
      loadAdminState()
        .then(() => renderWorkspace())
        .catch((error) => {
          controls.reportOutput.innerHTML = `<div class="error-card"><strong>Admin panel failed</strong><span>${escapeHtml(error.message)}</span></div>`;
        });
      return;
    }
    renderAdminPanel();
    return;
  }

  if (isFullLegalWorkspace()) {
    renderMenu();
    controls.activeReportName.textContent = activeReport.name;
    if (cachedReport) renderReport(cachedReport);
    else renderEmptyService();
    return;
  }

  if (isAutoGenWorkspace()) {
    controls.activeReportName.textContent = activeWorkspace.name;
    if (cachedAutoGenReport) renderAutoGenReport(cachedAutoGenReport);
    else renderAutoGenEmpty();
    return;
  }

  if (isDailyMutationsWorkspace()) {
    controls.activeReportName.textContent = activeWorkspace.name;
    if (cachedDailyMutations) renderDailyMutationsReport(cachedDailyMutations);
    else renderDailyMutationsEmpty();
    return;
  }

  if (isScoreCardWorkspace()) {
    controls.activeReportName.textContent = activeWorkspace.name;
    renderScoreCard();
    return;
  }

  if (isFeatureWorkspace()) {
    controls.activeReportName.textContent = activeWorkspace.name;
    renderFeatureWorkspace();
    return;
  }

  if (isMrDownloaderWorkspace()) {
    controls.activeReportName.textContent = activeWorkspace.name;
    if (cachedMrDownloader) renderMrDownloaderReport(cachedMrDownloader);
    else renderMrDownloaderEmpty();
    return;
  }

  if (isDownloadRtcsWorkspace()) {
    controls.activeReportName.textContent = activeWorkspace.name;
    if (cachedDownloadRtcs) renderDownloadRtcsReport(cachedDownloadRtcs);
    else renderDownloadRtcsEmpty();
    return;
  }

  if (isScanRtcsWorkspace()) {
    controls.activeReportName.textContent = activeWorkspace.name;
    if (cachedScanRtcs) renderScanRtcsReport(cachedScanRtcs);
    else renderScanRtcsEmpty();
    return;
  }

  if (isVillageScanWorkspace()) {
    controls.activeReportName.textContent = activeWorkspace.name;
    if (cachedVillageScan) renderVillageScanReport(cachedVillageScan);
    else renderVillageScanEmpty();
    return;
  }

  if (isKathaValidationWorkspace()) {
    controls.activeReportName.textContent = activeWorkspace.name;
    if (cachedKathaValidation) renderKathaValidationReport(cachedKathaValidation);
    else renderKathaValidationEmpty();
    return;
  }

  renderWorkspacePlaceholder();
}

function clearCachedReport() {
  cachedReport = null;
  cachedMrDownloader = null;
  cachedVillageScan = null;
  cachedDailyMutations = null;
  cachedKathaValidation = null;
  cachedDownloadRtcs = null;
  cachedScanRtcs = null;
  cachedAutoGenReport = null;
  cachedScoreCard = null;
  cachedFeatureReports = {};
  cachedExportPayload = null;
  loadedSavedReportState = null;
  localStorage.removeItem("ssvd-report-store-last-export");
  setExportAvailability();
  renderWorkspace();
}

function renderEmptyService() {
  if (activeReport.id === "fullLegal") {
    controls.reportOutput.innerHTML = `
      <div class="empty-state">
        <strong>Full Legal Report</strong>
        <span>Select the land details above and click Fetch Data. This tab will display the generated HTML analysis report from the exported JSON data.</span>
      </div>
    `;
    return;
  }
  if (activeReport.id === "advancedDetails") {
    renderAdvancedDetailsPlaceholder();
    return;
  }
  if (activeReport.id === "landIssues") {
    controls.reportOutput.innerHTML = `
      <div class="empty-state">
        <strong>Review Points</strong>
        <span>Select the land details above and click Fetch Data. This tab will show only land risks and key validation checks.</span>
      </div>
    `;
    return;
  }
  if (activeReport.id === "claudeReview") {
    controls.reportOutput.innerHTML = `
      <div class="empty-state">
        <strong>Claude Review</strong>
        <span>Select the land details above and click Fetch Data. This tab will show a Claude-style independent review of the same exported JSON data.</span>
      </div>
    `;
    return;
  }
  controls.reportOutput.innerHTML = `
    <div class="empty-state">
      <strong>${escapeHtml(activeReport.name)}</strong>
      <span>Select the land details above and click Fetch Data. The app will load all services once, then this tab will show the saved result.</span>
    </div>
  `;
}

async function start() {
  const locationSource = activeLocationSource();
  setBusy(true);
  setStatus(locationSource === "echawadi" ? "Connecting to eChawadi..." : "Connecting...");
  controls.reportOutput.innerHTML = "";
  try {
    const state = await api("/api/start", { locationSource });
    if (locationSource === "bhoomi") setPortalDownNotice(false);
    renderState(state);
    setStatus("Ready");
  } catch (error) {
    resetLandSelectors();
    setStatus(error.message);
    if (locationSource === "bhoomi" && isBhoomiPortalError(error)) {
      setPortalDownNotice(true);
      showPortalStatusPopup("Bhoomi portal is not working at this moment. Please try other reports or try again after some time.");
    }
  } finally {
    setBusy(false);
  }
}

async function selectField(field) {
  if (loading || !sessionId) return;
  const value = controls[field].value;
  if (!value || /^select\b/i.test(value)) return;
  for (const key of sequenceAfter[field]) {
    if (controls[key]) controls[key].innerHTML = "";
  }
  setBusy(true);
  setStatus(`Loading ${field} details...`);
  try {
    const state = await api("/api/select", { sessionId, field, value, values: values() });
    renderState(state);
    setStatus("Ready");
  } catch (error) {
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

async function loadSurnoc() {
  if (!sessionId || !controls.survey.value.trim()) {
    setStatus("Enter a survey number");
    return;
  }
  setBusy(true);
  setStatus("Loading Surnoc...");
  try {
    const state = await api("/api/go", { sessionId, values: values() });
    renderState(state);
    setStatus("Choose Surnoc and Hissa");
  } catch (error) {
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

function rowsPreview(rows = [], limit = 8) {
  return rows.slice(0, limit).map((row) => `
    <tr>${row.slice(0, 8).map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>
  `).join("");
}

function sectionStats(section) {
  const records = section.records || [];
  const found = records.filter((record) => record.summary?.hasData).length;
  return `${found}/${records.length || 1} records`;
}

function reportSections(report) {
  const selected = new Set(activeReport.sections);
  if (activeReport.id === "fullLegal") return report.sections || [];
  return (report.sections || []).filter((section) => selected.has(sectionKeyByTitle[section.title] || ""));
}

function renderReport(report) {
  if (activeReport.id === "fullLegal") {
    renderFullLegalReport(report);
    return;
  }
  if (activeReport.id === "landIssues") {
    renderReviewPointsReport(report);
    return;
  }
  if (activeReport.id === "claudeReview") {
    renderClaudeReviewReport(report);
    return;
  }
  if (activeReport.id === "advancedDetails") {
    renderAdvancedDetailsPlaceholder(report);
    return;
  }
  if (activeReport.id === "rtcDetails") {
    renderRtcDetailsReport(report);
    return;
  }
  if (activeReport.id === "ownersChangeLog") {
    controls.reportOutput.innerHTML = renderOwnershipChangeFlow(report.rtcRows || []);
    return;
  }
  if (activeReport.id === "mutationReport") {
    renderMutationReport(report);
    return;
  }

  const sections = reportSections(report);
  const issueSections = sections.filter((section) => /Mutation|Ownership|eChawadi|Advanced/i.test(section.title || ""));

  const issueRows = issueSections.map((section) => [
    section.title,
    section.status || "-",
    section.error || section.records?.[0]?.summary?.text || "-",
  ]);

  controls.reportOutput.innerHTML = `
    ${issueRows.length ? `
      <section class="summary-block">
        <div class="section-title"><h3>Land Issues Snapshot</h3><span>Mutation, ownership and village checks</span></div>
        <table>${rowsPreview([["Section", "Status", "Finding"], ...issueRows], 8)}</table>
      </section>
    ` : ""}
    ${sections.map(renderSection).join("")}
  `;
}

function renderFullLegalReport(report) {
  const analysis = report.legalAnalysis;
  const overview = report.overview || {};
  const currentRow = (report.rtcRows || []).find((row) => row.type === "Current RTC") || (report.rtcRows || [])[0] || {};
  const owners = ownerRowsFromRtcRow(currentRow);
  const mutationStatusSection = sectionByTitle(report, "Mutation Status");
  const ownershipNodes = ownershipChangeNodes(report.rtcRows || []);
  const pendingRccms = analysis?.pendingRccms?.length ? analysis.pendingRccms : pendingRccmsRecords(report);
  const finalOpinion = legalFinalOpinion(report, analysis, pendingRccms);

  controls.reportOutput.innerHTML = `
    <article class="legal-report">
      <header class="legal-report-hero">
        <p class="eyebrow">Full Legal Report</p>
        <h2>Land Report Summary — Survey No. ${escapeHtml([overview.survey, overview.surnoc, overview.hissa].filter(Boolean).join("/") || "-")}, ${escapeHtml([overview.village, overview.taluk, overview.district].filter(Boolean).join(", "))}</h2>
        <p>Based on the fetched Bhoomi, RTC, mutation, eChawadi, Akarband and related service data currently available in this application.</p>
        <div class="legal-meta">
          <span>${escapeHtml(analysis?.provider ? `Analysis: ${analysis.provider}` : "Analysis: local structured report")}</span>
          <span>${escapeHtml(report.generatedAt ? `Fetched: ${new Date(report.generatedAt).toLocaleString()}` : "Fetched data loaded")}</span>
        </div>
      </header>

      ${legalSection("1. Basic land details", legalTable([
        ["District", overview.district || "-"],
        ["Taluk", overview.taluk || "-"],
        ["Hobli", overview.hobli || "-"],
        ["Village", overview.village || "-"],
        ["Survey No.", overview.survey || "-"],
        ["Surnoc", overview.surnoc || "-"],
        ["Hissa", overview.hissa || "-"],
        ["Land ID", currentRow.landId || "-"],
        ["Current RTC period", currentRow.period || currentRow.year || overview.period || "-"],
        ["Current extent", (currentRow.extents || []).join("; ") || owners.map((owner) => owner.extent).filter(Boolean).join("; ") || "-"],
      ]))}

      ${legalSection("2. Current RTC ownership", `
        ${owners.length ? legalWideTable(["Owner", "Extent", "Khata"], owners.map((owner) => [owner.owner || "-", owner.extent || "-", owner.khata || currentRow.khataNumber || "-"])) : "<p>No structured owner rows were returned in the current RTC data.</p>"}
        <h4>Current RTC status</h4>
        ${legalTable([
          ["Owner category", currentRow.ownerCategory || "-"],
          ["Government restriction", currentRow.govRestriction || currentRow.governmentRestriction || "No structured value"],
          ["Court stay", currentRow.courtStay || "No structured value"],
          ["Alienated / converted", currentRow.alienated || "No structured value"],
          ["Ongoing mutation", currentRow.ongoingMutation || "No"],
        ])}
      `)}

      ${legalSection("3. Mutation status", `
        <p class="legal-callout">${escapeHtml(mutationStatusText(mutationStatusSection))}</p>
      `)}

      ${legalSection("4. Ownership / RTC history", `
        ${ownershipNodes.length ? legalWideTable(["Period / Stage", "Owner shown", "Extent"], ownershipNodes.map((node) => [
          node.years.length ? yearRangeText(node.years) : "Current stage",
          node.owners.join("; "),
          [...new Set(node.rows.flatMap((row) => row.extents || []))].filter(Boolean).join("; ") || "-",
        ])) : "<p>No structured RTC ownership chain was available.</p>"}
        <h4>Simple interpretation</h4>
        ${listItems(analysis?.ownershipSummary || ownershipInterpretation(report))}
      `)}

      ${legalSection("5. Important mutation history", renderImportantMutationHistory(report))}

      ${legalSection("6. Conversion / alienation position", `
        ${legalTable([
          ["Alienated / converted", currentRow.alienated || "No structured value"],
          ["Conversion-related mutation", conversionMutationText(report)],
          ["Practical note", /yes|true|converted|alien/i.test(currentRow.alienated || "") ? "The current RTC indicates alienation/conversion. Verify conversion order and approved layout/site documents before final decision." : "No clear conversion value was found in the current RTC data. Verify official conversion records separately."],
        ])}
      `)}

      ${legalSection("7. Court case / restriction check", `
        ${legalTable([
          ["Court stay", currentRow.courtStay || "No structured value"],
          ["Government restriction", currentRow.govRestriction || currentRow.governmentRestriction || "No structured value"],
          ["Pending RCCMS items", pendingRccms.length ? `${pendingRccms.length} pending/current item(s) found in eChawadi` : "No pending/current RCCMS items found in fetched eChawadi data"],
        ])}
      `)}

      ${legalSection("8. Gaps / issues in the report", listItems(analysis?.documentGaps || legalGaps(report, pendingRccms)))}
      ${legalSection("9. Positive points", listItems(legalPositivePoints(report, mutationStatusSection, currentRow, pendingRccms)))}
      ${legalSection("10. Documents to collect before final decision", listItems(legalDocumentsToCollect(report, pendingRccms)))}

      <section class="legal-final-opinion">
        <h3>Final opinion from this report</h3>
        <p>${escapeHtml(finalOpinion)}</p>
      </section>
    </article>
  `;
}

function legalSection(title, body) {
  return `
    <section class="legal-section">
      <h3>${escapeHtml(title)}</h3>
      ${body}
    </section>
  `;
}

function legalTable(rows = []) {
  return `
    <table class="legal-kv-table">
      <tbody>
        ${rows.map(([label, value]) => `
          <tr>
            <th>${escapeHtml(label)}</th>
            <td>${escapeHtml(value || "-")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function legalWideTable(headers = [], rows = []) {
  return `
    <div class="table-scroll">
      <table class="wide-table legal-wide-table">
        <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.map((row) => `
            <tr>${headers.map((_, index) => `<td>${escapeHtml(row[index] || "-")}</td>`).join("")}</tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function mutationHistoryTables(report) {
  const sections = (report.sections || []).filter((section) => section.title === "Mutation Register");
  const tables = [];
  const seen = new Set();
  for (const section of sections) {
    for (const record of section.records || []) {
      const rows = record.summary?.rows || [];
      if (rows.length <= 1 || /^status$/i.test(rows[0]?.[0] || "")) continue;
      const header = rows[0];
      for (const row of rows.slice(1)) {
        const key = JSON.stringify(row);
        if (!row.some(Boolean) || seen.has(key)) continue;
        seen.add(key);
        tables.push({ label: record.label || "Mutation", header, row });
      }
    }
  }
  return tables;
}

function renderImportantMutationHistory(report) {
  const entries = mutationHistoryTables(report);
  if (!entries.length) return "<p>No structured mutation-history table was returned.</p>";
  const headers = ["Source", ...entries[0].header.slice(0, 7)];
  const rows = entries.slice(0, 25).map((entry) => [entry.label, ...entry.row.slice(0, 7)]);
  return `
    ${legalWideTable(headers, rows)}
    ${entries.length > rows.length ? `<p class="legal-note">${entries.length - rows.length} additional mutation row(s) are available in the Mutation Report tab.</p>` : ""}
    <h4>Most important mutation</h4>
    <p>${escapeHtml(mostImportantMutationText(entries))}</p>
  `;
}

function mostImportantMutationText(entries = []) {
  const important = entries.find((entry) => /conversion|alien|site|sale|purchase|khata|partition|phodi|ಪೋಡಿ|ಕ್ರಯ|ಬದಲಾವಣೆ/i.test(entry.row.join(" "))) || entries[0];
  return important ? `${important.label}: ${important.row.filter(Boolean).join(" | ")}` : "No key mutation could be identified from the structured rows.";
}

function conversionMutationText(report) {
  const entry = mutationHistoryTables(report).find((item) => /conversion|alien|site|converted|ಭೂಪರಿವರ್ತನೆ/i.test(item.row.join(" ")));
  return entry ? entry.row.filter(Boolean).join(" | ") : "No specific conversion mutation row was identified in the structured mutation data.";
}

function ownershipInterpretation(report) {
  const nodes = ownershipChangeNodes(report.rtcRows || []);
  if (!nodes.length) return ["Ownership movement could not be interpreted from fetched RTC rows."];
  const first = nodes[0]?.owners.join("; ");
  const last = nodes[nodes.length - 1]?.owners.join("; ");
  return [
    `The RTC chain starts with ${first || "an earlier owner"} and currently ends with ${last || "the present owner"}.`,
    `The fetched data shows ${nodes.length} ownership stage(s). Verify each mutation and registered document before final legal reliance.`,
  ];
}

function legalGaps(report, pendingRccms = []) {
  const gaps = [];
  if (!sectionByTitle(report, "Akarband")) gaps.push("Akarband data was not available in the fetched report payload.");
  if (!sectionByTitle(report, "Old Year RTC")?.records?.length) gaps.push("Old RTC history is missing or limited.");
  if (!mutationHistoryTables(report).length) gaps.push("Mutation history is not available as a structured table.");
  if (pendingRccms.length) gaps.push("Pending/current RCCMS items exist and need case-order verification.");
  return gaps.length ? gaps : ["No major data gaps were identified from the fetched structured data."];
}

function legalPositivePoints(report, mutationStatusSection, currentRow, pendingRccms = []) {
  const points = [];
  const mutationText = mutationStatusText(mutationStatusSection);
  if (/no mutation|ಬಾಕಿ ಇರುವುದಿಲ್ಲ|not pending/i.test(mutationText)) points.push("Mutation status indicates no pending mutation.");
  if (/no|false|ಇಲ್ಲ/i.test(currentRow.courtStay || "")) points.push("Current RTC does not indicate a court stay.");
  if (/no|false|ಇಲ್ಲ/i.test(currentRow.govRestriction || currentRow.governmentRestriction || "")) points.push("Current RTC does not indicate a government restriction.");
  if (!pendingRccms.length) points.push("No pending/current RCCMS item was found in fetched eChawadi data.");
  if ((report.rtcRows || []).length) points.push("Current and historical RTC rows are available for ownership-chain review.");
  return points.length ? points : ["Positive points could not be conclusively identified from the structured data."];
}

function legalDocumentsToCollect(report, pendingRccms = []) {
  return [
    "Latest signed/current RTC copy for the selected survey, surnoc and hissa.",
    "All mutation extracts/MR copies listed in the mutation history.",
    "Registered sale deed and prior title deeds matching every ownership transfer.",
    "Akarband, Tippani/Phodi sketch and survey/hissa documents.",
    "Khatha extract and tax-paid receipts.",
    "Conversion/alienation order, layout/site approval and related conditions if land is converted.",
    pendingRccms.length ? "RCCMS case status, interim orders and final orders for every pending/current item." : "",
    "Encumbrance certificate and local legal opinion before final decision.",
  ].filter(Boolean);
}

function legalFinalOpinion(report, analysis, pendingRccms = []) {
  if (analysis?.finalOpinion) return analysis.finalOpinion;
  const risks = analysis?.risks || legalGaps(report, pendingRccms);
  if (pendingRccms.length) {
    return "The fetched data has useful ownership and RTC details, but pending/current RCCMS revenue case entries require review before treating the title as clear.";
  }
  if (risks.length && !/No major/i.test(risks[0])) {
    return "The land record appears reviewable, but the listed gaps and risks should be closed with official documents before final legal reliance.";
  }
  return "Based on fetched structured data, the record does not show major pending issues; however, final decision should be based on official copies, registered deeds, encumbrance search and professional legal review.";
}

function renderAdvancedDetailsPlaceholder() {
  controls.reportOutput.innerHTML = `
    <section class="summary-block">
      <div class="section-title">
        <h3>Advanced Details</h3>
        <span>Data retained for analysis</span>
      </div>
      <div class="empty-state">
        <strong>Advanced details are hidden in this tab</strong>
        <span>The fetched advanced RTC data remains available for export, legal report generation, and review analysis.</span>
      </div>
    </section>
  `;
}

function pendingRccmsRecords(report) {
  const echawadi = sectionByTitle(report, "eChawadi");
  const rccmsRecord = (echawadi?.records || []).find((record) => (record.label || "").trim().toLowerCase() === "rccms");
  const rows = rccmsRecord?.summary?.rows || [];
  if (rows.length <= 1) return [];
  const headers = rows[0];
  return rows.slice(1)
    .filter((row) => row.some(Boolean))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header || `Column ${index + 1}`, row[index] || ""])));
}

function listItems(items = []) {
  return items.length
    ? `<ul class="review-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : `<p>No items were identified from the fetched data.</p>`;
}

function renderRccmsTable(rows = []) {
  if (!rows.length) return `<p>No pending/current RCCMS items were found for this survey in eChawadi data.</p>`;
  const headers = Object.keys(rows[0]);
  return `
    <div class="table-scroll">
      <table class="wide-table">
        <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.map((row) => `
            <tr>${headers.map((header) => `<td>${escapeHtml(row[header] || "-")}</td>`).join("")}</tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderReviewPointsReport(report) {
  const analysis = report.legalAnalysis || {};
  const overview = report.overview || {};
  const rccmsRows = analysis.pendingRccms?.length ? analysis.pendingRccms : pendingRccmsRecords(report);
  const risks = reviewRiskPoints(report, analysis, rccmsRows);
  const validations = reviewValidationChecks(report, rccmsRows);
  const priorityRows = reviewPriorityRows(risks, validations);

  controls.reportOutput.innerHTML = `
    <article class="legal-report review-report">
      <header class="legal-report-hero review-report-hero">
        <p class="eyebrow">Review Points</p>
        <h2>Risk & Validation Checklist — Survey No. ${escapeHtml([overview.survey, overview.surnoc, overview.hissa].filter(Boolean).join("/") || "-")}</h2>
        <p>Focused review of land risks and key items to validate again before relying on the record.</p>
        <div class="legal-meta">
          <span>${escapeHtml([overview.village, overview.taluk, overview.district].filter(Boolean).join(", ") || "Selected land")}</span>
          <span>${escapeHtml(analysis.provider ? `Analysis: ${analysis.provider}` : "Analysis: structured data")}</span>
        </div>
      </header>

      ${legalSection("1. Priority risk snapshot", legalWideTable(["Priority", "Review point", "Why to check"], priorityRows))}
      ${legalSection("2. Risks with this land", listItems(risks))}
      ${legalSection("3. Key points to validate / double-check", listItems(validations))}
      ${legalSection("4. Pending RCCMS / revenue case check", renderRccmsTable(rccmsRows))}

      <section class="legal-final-opinion review-final-opinion">
        <h3>Review focus</h3>
        <p>${escapeHtml(reviewFocusText(risks, rccmsRows))}</p>
      </section>
    </article>
  `;
}

function renderClaudeReviewReport(report) {
  const review = report.claudeReview || {};
  const overview = report.overview || {};
  const pendingRccms = review.pendingRccms?.length ? review.pendingRccms : pendingRccmsRecords(report);
  const concerns = review.concerns?.length ? review.concerns : reviewRiskPoints(report, report.legalAnalysis || {}, pendingRccms);
  const validationQuestions = review.validationQuestions?.length ? review.validationQuestions : reviewValidationChecks(report, pendingRccms);
  controls.reportOutput.innerHTML = `
    <article class="legal-report claude-review-report">
      <header class="legal-report-hero claude-review-hero">
        <p class="eyebrow">Claude Review</p>
        <h2>Claude Review — Survey No. ${escapeHtml([overview.survey, overview.surnoc, overview.hissa].filter(Boolean).join("/") || "-")}</h2>
        <p>Independent review generated from the same exported JSON data used by the Full Legal Report.</p>
        <div class="legal-meta">
          <span>${escapeHtml([overview.village, overview.taluk, overview.district].filter(Boolean).join(", ") || "Selected land")}</span>
          <span>${escapeHtml(review.provider ? `Provider: ${review.provider}` : "Provider: local fallback")}</span>
          ${review.model ? `<span>${escapeHtml(`Model: ${review.model}`)}</span>` : ""}
        </div>
      </header>

      ${legalSection("1. Claude review summary", listItems(review.summary || []))}
      ${legalSection("2. Observations from JSON data", listItems(review.observations || []))}
      ${legalSection("3. Concerns / possible risks", listItems(concerns))}
      ${legalSection("4. Validation questions to ask", listItems(validationQuestions))}
      ${legalSection("5. Recommended next steps", listItems(review.recommendedNextSteps || legalDocumentsToCollect(report, pendingRccms)))}
      ${legalSection("6. Pending RCCMS / revenue case evidence", renderRccmsTable(pendingRccms))}

      <section class="legal-final-opinion claude-final-opinion">
        <h3>Claude review focus</h3>
        <p>${escapeHtml(claudeReviewFocusText(review, concerns, pendingRccms))}</p>
      </section>
    </article>
  `;
}

function claudeReviewFocusText(review = {}, concerns = [], pendingRccms = []) {
  if (review.llmError) return `Claude API was not available, so local fallback review was shown. Last error: ${review.llmError}`;
  if (pendingRccms.length) return "Claude review should focus first on pending/current RCCMS items, then title-chain and document consistency.";
  if (concerns.length && !/^No specific/i.test(concerns[0])) return "Claude review should focus on closing the listed concerns with official records before final reliance.";
  return "Claude review did not identify a major issue from structured data, but official copies and legal verification are still required.";
}

function reviewRiskPoints(report, analysis = {}, pendingRccms = []) {
  const currentRow = (report.rtcRows || []).find((row) => row.type === "Current RTC") || {};
  const risks = [
    ...(analysis.risks || []),
    ...legalGaps(report, pendingRccms).filter((item) => !/^No major/i.test(item)),
  ];
  if (pendingRccms.length) risks.unshift(`${pendingRccms.length} pending/current RCCMS revenue case item(s) found in eChawadi data.`);
  if (/yes|true|converted|alien/i.test(currentRow.alienated || "")) {
    risks.push("Current RTC indicates alienated/converted status; conversion order and conditions must be verified.");
  }
  if (mutationHistoryTables(report).some((entry) => /sale|purchase|ಕ್ರಯ|conversion|alien|site/i.test(entry.row.join(" ")))) {
    risks.push("Important sale/conversion mutation entries exist; every linked registered document must match the RTC and MR history.");
  }
  return [...new Set(risks.map((item) => item.trim()).filter(Boolean))]
    .slice(0, 12)
    .concat(risks.length ? [] : ["No specific risk point was identified from the structured data, but official documents must still be verified."]);
}

function reviewValidationChecks(report, pendingRccms = []) {
  const mutationStatusSection = sectionByTitle(report, "Mutation Status");
  const currentRow = (report.rtcRows || []).find((row) => row.type === "Current RTC") || {};
  const checks = [
    "Match survey number, surnoc, hissa, extent and owner names across RTC, mutation extract, sale deed and khatha.",
    "Verify the latest signed RTC directly from the official portal on the decision date.",
    "Verify all MR numbers in Mutation Report against registered deeds and mutation extract copies.",
    "Confirm old RTC ownership chain from earliest available year to current owner without unexplained gaps.",
    "Check Encumbrance Certificate for the full title period and compare with all mutation/sale entries.",
    "Verify Akarband, phodi/tippani sketch and survey boundaries for the exact hissa.",
    "Confirm khatha extract, tax paid receipts and local authority records match the current owner.",
    /yes|true|converted|alien/i.test(currentRow.alienated || "") ? "Verify conversion/alienation order, layout/site approval, conditions and whether the selected extent is covered." : "Check whether any conversion/alienation order exists even if current structured RTC value is unclear.",
    pendingRccms.length ? "For every RCCMS item, collect case status, interim order, final order and whether the selected survey/hissa is affected." : "Re-check eChawadi/RCCMS before final decision to confirm no new revenue case is pending.",
    /no mutation|ಬಾಕಿ ಇರುವುದಿಲ್ಲ|not pending/i.test(mutationStatusText(mutationStatusSection)) ? "Mutation status currently indicates no pending mutation; re-check before execution/registration." : "Mutation status needs manual verification because the fetched value is not a clean no-pending signal.",
  ];
  return [...new Set(checks.filter(Boolean))];
}

function reviewPriorityRows(risks = [], validations = []) {
  const rows = [];
  const highRisk = risks.filter((item) => /RCCMS|pending|court|restriction|conversion|alien|gap|missing|not available/i.test(item)).slice(0, 4);
  for (const item of highRisk) rows.push(["High", item, "Resolve this before treating the title as clear."]);
  for (const item of validations.slice(0, Math.max(0, 6 - rows.length))) rows.push(["Check", item, "Document validation item."]);
  return rows.length ? rows : [["Check", "Verify official RTC, MR, EC, Akarband and khatha copies.", "Minimum due diligence before final decision."]];
}

function reviewFocusText(risks = [], pendingRccms = []) {
  if (pendingRccms.length) {
    return "Primary focus should be pending/current RCCMS revenue cases and whether they affect the selected survey/hissa, followed by title-chain and conversion-document verification.";
  }
  if (risks.length && !/^No specific/i.test(risks[0])) {
    return "Primary focus should be closing the listed risks with official records, registered documents and mutation extracts before relying on the title.";
  }
  return "No major risk was identified from structured fetched data, but official portal copies, EC, title deeds and local authority records must still be verified.";
}

function reportCheckboxes(selected = [], prefix = "report") {
  const selectedSet = new Set(selected || []);
  return workspaces.filter((workspace) => !workspace.adminOnly).map((workspace) => `
    <label class="checkbox-line">
      <input type="checkbox" name="${escapeAttr(prefix)}" value="${escapeAttr(workspace.id)}" ${selectedSet.has(workspace.id) ? "checked" : ""}>
      <span>${escapeHtml(workspace.name)}</span>
    </label>
  `).join("");
}

function roleCheckboxes(selected = [], prefix = "role") {
  const selectedSet = new Set(selected || []);
  return (adminState?.roles || []).map((role) => `
    <label class="checkbox-line">
      <input type="checkbox" name="${escapeAttr(prefix)}" value="${escapeAttr(role.id)}" ${selectedSet.has(role.id) ? "checked" : ""}>
      <span>${escapeHtml(role.name)}</span>
    </label>
  `).join("") || "<p>No roles created yet.</p>";
}

function checkedValues(container, name) {
  return [...container.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

async function loadAdminState() {
  if (!isAdminUser()) return;
  adminState = await api("/api/admin/state", { adminUsername: currentUser.username });
}

function renderAdminPanel() {
  if (!isAdminUser()) {
    controls.reportOutput.innerHTML = `<div class="empty-state"><strong>Admin access required</strong><span>Please login as admin.</span></div>`;
    return;
  }
  const pending = (adminState?.registrations || []).filter((request) => request.status === "pending");
  controls.reportOutput.innerHTML = `
    <article class="admin-panel">
      <section class="summary-block">
        <div class="section-title"><h3>Admin Notice</h3><span>Scrolling message for all users</span></div>
        <label class="checkbox-line"><input id="adminNoticeEnabled" type="checkbox" ${adminState?.notice?.enabled ? "checked" : ""}><span>Enable notice</span></label>
        <label><span>Notice message</span><textarea id="adminNoticeMessage" rows="3">${escapeHtml(adminState?.notice?.message || "")}</textarea></label>
        <button type="button" data-admin-action="save-notice">Save Notice</button>
      </section>

      <section class="summary-block">
        <div class="section-title"><h3>Daily Mutations Schedules</h3><span>Runs around 6:00 AM IST every day</span></div>
        <div class="admin-card" data-daily-schedule-editor>
          <div class="admin-grid">
            <label><span>Schedule name</span><input data-daily-name placeholder="Example: Malur Lakkuru Hobli"></label>
            <label><span>District code</span><input data-daily-district placeholder="Example: 19"></label>
            <label><span>District label</span><input data-daily-district-label placeholder="Example: Kolar"></label>
            <label><span>Taluk code</span><input data-daily-taluk placeholder="Example: 9"></label>
            <label><span>Taluk label</span><input data-daily-taluk-label placeholder="Example: Malur"></label>
            <label><span>Hobli code</span><input data-daily-hobli placeholder="Example: 3"></label>
            <label><span>Hobli label</span><input data-daily-hobli-label placeholder="Example: Lakkuru"></label>
            <label><span>Email recipients</span><textarea data-daily-emails rows="3" placeholder="one@example.com, two@example.com"></textarea></label>
          </div>
          <label class="checkbox-line"><input data-daily-enabled type="checkbox" checked><span>Enabled</span></label>
          <button type="button" data-admin-action="save-daily-schedule">Create Schedule</button>
        </div>
        ${(adminState?.dailyMutationSchedules || []).map((schedule) => `
          <div class="admin-card" data-daily-schedule-id="${escapeAttr(schedule.id)}">
            <div class="section-title"><h4>${escapeHtml(schedule.name || schedule.hobliLabel || "Daily Mutations Report")}</h4><span>${schedule.enabled ? "Enabled" : "Disabled"}</span></div>
            <div class="admin-grid">
              <label><span>Schedule name</span><input data-daily-name value="${escapeAttr(schedule.name || "")}"></label>
              <label><span>District code</span><input data-daily-district value="${escapeAttr(schedule.district || "")}"></label>
              <label><span>District label</span><input data-daily-district-label value="${escapeAttr(schedule.districtLabel || "")}"></label>
              <label><span>Taluk code</span><input data-daily-taluk value="${escapeAttr(schedule.taluk || "")}"></label>
              <label><span>Taluk label</span><input data-daily-taluk-label value="${escapeAttr(schedule.talukLabel || "")}"></label>
              <label><span>Hobli code</span><input data-daily-hobli value="${escapeAttr(schedule.hobli || "")}"></label>
              <label><span>Hobli label</span><input data-daily-hobli-label value="${escapeAttr(schedule.hobliLabel || "")}"></label>
              <label><span>Email recipients</span><textarea data-daily-emails rows="3">${escapeHtml(schedule.emails || "")}</textarea></label>
            </div>
            <label class="checkbox-line"><input data-daily-enabled type="checkbox" ${schedule.enabled ? "checked" : ""}><span>Enabled</span></label>
            <p>${escapeHtml(schedule.lastRunAt ? `Last run: ${new Date(schedule.lastRunAt).toLocaleString()} | ${schedule.lastStatus || "-"}` : "Not run yet")}</p>
            ${schedule.lastReport?.pdf?.downloadUrl ? `<p><a class="download-link" href="${escapeAttr(schedule.lastReport.pdf.downloadUrl)}" download="${escapeAttr(schedule.lastReport.pdf.filename || "daily-mutations-report.pdf")}">Download latest report</a></p>` : ""}
            <div class="admin-actions-row">
              <button type="button" data-admin-action="save-daily-schedule">Update Schedule</button>
              <button type="button" data-admin-action="run-daily-schedule">Run Now</button>
              <button type="button" data-admin-action="delete-daily-schedule">Delete</button>
            </div>
          </div>
        `).join("") || "<p>No daily mutation schedules configured.</p>"}
      </section>

      <section class="summary-block">
        <div class="section-title"><h3>New Registration Requests</h3><span>${pending.length} pending</span></div>
        ${pending.length ? pending.map((request) => `
          <div class="admin-card" data-request-id="${escapeAttr(request.id)}">
            <strong>${escapeHtml(request.name)}</strong>
            <p>${escapeHtml(request.phone)} | ${escapeHtml(request.email)}</p>
            <label><span>Initial password</span><input data-approve-password value="Welcome@123"></label>
            <div class="admin-grid">
              <div><span class="admin-label">Roles</span>${roleCheckboxes([], `approve-role-${request.id}`)}</div>
              <div><span class="admin-label">Reports</span>${reportCheckboxes([], `approve-report-${request.id}`)}</div>
            </div>
            <button type="button" data-admin-action="approve-request">Approve User</button>
          </div>
        `).join("") : "<p>No pending registration requests.</p>"}
      </section>

      <section class="summary-block">
        <div class="section-title"><h3>Roles</h3><span>${adminState?.roles?.length || 0} role(s)</span></div>
        <div class="admin-card" data-role-editor>
          <label><span>Role name</span><input id="newRoleName" placeholder="Example: Village Reports"></label>
          <div><span class="admin-label">Reports allowed</span>${reportCheckboxes([], "new-role-report")}</div>
          <button type="button" data-admin-action="save-role">Create Role</button>
        </div>
        ${(adminState?.roles || []).map((role) => `
          <div class="admin-card" data-role-id="${escapeAttr(role.id)}">
            <label><span>Role name</span><input data-role-name value="${escapeAttr(role.name)}"></label>
            <div><span class="admin-label">Reports allowed</span>${reportCheckboxes(role.workspaceIds, `role-report-${role.id}`)}</div>
            <button type="button" data-admin-action="update-role">Update Role</button>
          </div>
        `).join("")}
      </section>

      <section class="summary-block">
        <div class="section-title"><h3>Users</h3><span>${adminState?.users?.length || 0} user(s)</span></div>
        ${(adminState?.users || []).map((user) => `
          <div class="admin-card" data-user-id="${escapeAttr(user.id)}">
            <div class="section-title"><h4>${escapeHtml(user.name || user.username)}</h4><span>${escapeHtml(user.status || "active")}</span></div>
            <p>${escapeHtml(user.phone || "-")} | ${escapeHtml(user.email || user.username)}</p>
            <label><span>Status</span><select data-user-status><option value="active" ${user.status !== "inactive" ? "selected" : ""}>Active</option><option value="inactive" ${user.status === "inactive" ? "selected" : ""}>Inactive</option></select></label>
            <div class="admin-grid">
              <div><span class="admin-label">Roles</span>${roleCheckboxes(user.roleIds, `user-role-${user.id}`)}</div>
              <div><span class="admin-label">Direct report permissions</span>${reportCheckboxes(user.workspaceIds, `user-report-${user.id}`)}</div>
              <label><span>New password</span><input data-reset-password placeholder="Enter new password"></label>
            </div>
            <div class="admin-actions-row">
              <button type="button" data-admin-action="update-user">Update Permissions</button>
              <button type="button" data-admin-action="reset-password">Reset Password</button>
            </div>
          </div>
        `).join("") || "<p>No approved users yet.</p>"}
      </section>
    </article>
  `;
}

async function refreshAdminPanel(message = "Admin updated") {
  await loadAdminState();
  renderAdminPanel();
  setStatus(message);
}

function dailySchedulePayload(card) {
  return {
    id: card.dataset.dailyScheduleId || "",
    name: card.querySelector("[data-daily-name]")?.value || "",
    enabled: Boolean(card.querySelector("[data-daily-enabled]")?.checked),
    district: card.querySelector("[data-daily-district]")?.value || "",
    districtLabel: card.querySelector("[data-daily-district-label]")?.value || "",
    taluk: card.querySelector("[data-daily-taluk]")?.value || "",
    talukLabel: card.querySelector("[data-daily-taluk-label]")?.value || "",
    hobli: card.querySelector("[data-daily-hobli]")?.value || "",
    hobliLabel: card.querySelector("[data-daily-hobli-label]")?.value || "",
    emails: card.querySelector("[data-daily-emails]")?.value || "",
  };
}

async function handleAdminAction(event) {
  const button = event.target.closest("[data-admin-action]");
  if (!button || !isAdminWorkspace()) return;
  const action = button.dataset.adminAction;
  const card = button.closest(".admin-card, .summary-block");
  try {
    if (action === "save-notice") {
      const result = await api("/api/admin/notice", {
        adminUsername: currentUser.username,
        enabled: controls.reportOutput.querySelector("#adminNoticeEnabled").checked,
        message: controls.reportOutput.querySelector("#adminNoticeMessage").value,
      });
      customNotice = result.notice;
      renderCustomNotice();
      await refreshAdminPanel("Notice saved");
    } else if (action === "approve-request") {
      const requestId = card.dataset.requestId;
      await api("/api/admin/approve-registration", {
        adminUsername: currentUser.username,
        requestId,
        password: card.querySelector("[data-approve-password]").value,
        roleIds: checkedValues(card, `approve-role-${requestId}`),
        workspaceIds: checkedValues(card, `approve-report-${requestId}`),
      });
      await refreshAdminPanel("User approved");
    } else if (action === "save-role") {
      await api("/api/admin/role", {
        adminUsername: currentUser.username,
        role: {
          name: controls.reportOutput.querySelector("#newRoleName").value,
          workspaceIds: checkedValues(card, "new-role-report"),
        },
      });
      await refreshAdminPanel("Role created");
    } else if (action === "update-role") {
      const roleId = card.dataset.roleId;
      await api("/api/admin/role", {
        adminUsername: currentUser.username,
        role: {
          id: roleId,
          name: card.querySelector("[data-role-name]").value,
          workspaceIds: checkedValues(card, `role-report-${roleId}`),
        },
      });
      await refreshAdminPanel("Role updated");
    } else if (action === "update-user") {
      const userId = card.dataset.userId;
      await api("/api/admin/update-user", {
        adminUsername: currentUser.username,
        userId,
        status: card.querySelector("[data-user-status]").value,
        roleIds: checkedValues(card, `user-role-${userId}`),
        workspaceIds: checkedValues(card, `user-report-${userId}`),
      });
      await refreshAdminPanel("User permissions updated");
    } else if (action === "reset-password") {
      await api("/api/admin/reset-password", {
        adminUsername: currentUser.username,
        userId: card.dataset.userId,
        password: card.querySelector("[data-reset-password]").value,
      });
      await refreshAdminPanel("Password reset");
    } else if (action === "save-daily-schedule") {
      await api("/api/admin/daily-mutations-schedule", {
        adminUsername: currentUser.username,
        schedule: dailySchedulePayload(card),
      });
      await refreshAdminPanel("Daily mutations schedule saved");
    } else if (action === "run-daily-schedule") {
      button.disabled = true;
      button.textContent = "Running...";
      await api("/api/admin/run-daily-mutations-schedule", {
        adminUsername: currentUser.username,
        scheduleId: card.dataset.dailyScheduleId,
      });
      await refreshAdminPanel("Daily mutations schedule completed");
    } else if (action === "delete-daily-schedule") {
      await api("/api/admin/delete-daily-mutations-schedule", {
        adminUsername: currentUser.username,
        scheduleId: card.dataset.dailyScheduleId,
      });
      await refreshAdminPanel("Daily mutations schedule deleted");
    }
  } catch (error) {
    setStatus(error.message);
  }
}

controls.reportOutput?.addEventListener("click", (event) => {
  if (!event.target.closest("[data-autogen-download]")) return;
  downloadAutoGenPdf().catch((error) => setStatus(error.message));
});
controls.reportOutput?.addEventListener("click", handleScoreCardAction);
controls.reportOutput?.addEventListener("change", handleScoreCardAction);
controls.reportOutput?.addEventListener("click", handleFeatureAction);
controls.reportOutput?.addEventListener("change", handleFeatureAction);
controls.reportOutput?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-saved-report-id]");
  if (!button) return;
  openSavedReport(button.dataset.savedReportId);
});
controls.reportOutput?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-rtc-action]");
  if (!button) return;
  if (button.dataset.rtcAction === "scan") fetchScanRtcsData();
});

function mutationStatusText(section) {
  if (!section) return "Mutation status was not returned.";
  if (section.error) return section.error;
  for (const record of section.records || []) {
    const statusRow = (record.summary?.rows || []).find((row) => /status|ಸ್ಥಿತಿ/i.test(row[0] || ""));
    if (statusRow) return statusRow.slice(1).filter(Boolean).join(" | ") || statusRow.join(" | ");
    if (record.summary?.text) return record.summary.text;
  }
  return "Mutation status was not returned.";
}

function renderMutationReport(report) {
  const sections = reportSections(report);
  const mutationStatusSection = sections.find((section) => section.title === "Mutation Status");
  const mutationRegisterSections = sections.filter((section) => section.title === "Mutation Register");
  const ownershipHistorySection = sections.find((section) => section.title === "Ownership Map");
  const mainMrHistoryRecord = (ownershipHistorySection?.records || []).find((record) => record.label === "Main MR history summary");
  controls.reportOutput.innerHTML = `
    <section class="summary-block">
      <div class="section-title"><h3>Ongoing MR Details</h3><span>Current mutation status</span></div>
      <table>
        <thead><tr><th>Mutation Status</th></tr></thead>
        <tbody><tr><td>${escapeHtml(mutationStatusText(mutationStatusSection))}</td></tr></tbody>
      </table>
    </section>
    ${mutationRegisterSections.map((section) => renderSection(section, { hideRecordStatus: true, rowLimit: Infinity })).join("")}
    ${mainMrHistoryRecord ? renderRecordGroup("Main MR history summary", [mainMrHistoryRecord], { hideRecordStatus: true, rowLimit: Infinity }) : ""}
  `;
}

function renderMrDownloaderEmpty() {
  controls.reportOutput.innerHTML = `
    <div class="empty-state">
      <strong>MR Downloader</strong>
      <span>Select land details above and click Fetch Data. This report will list all MR numbers from Service11 and display downloaded MR extracts below the table.</span>
    </div>
  `;
}

function renderVillageScanEmpty() {
  controls.reportOutput.innerHTML = `
    <div class="empty-state">
      <strong>Village Scan</strong>
      <span>Select district, taluk, hobli and village above, then click Fetch Village Data. This report will load village-level eChawadi mutations, land conversions and E-Pouti details.</span>
    </div>
  `;
}

function renderVillageTable(table = {}) {
  const header = table.header || [];
  const rows = table.rows || [];
  return `
    <section class="summary-block village-table-section">
      <div class="section-title">
        <h3>${escapeHtml(table.title || "Village table")}</h3>
        <span>${rows.length ? `${rows.length} item(s)` : "No records returned"}</span>
      </div>
      ${rows.length ? `
        <div class="table-scroll">
          <table class="wide-table village-scan-table">
            <thead><tr>${header.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr></thead>
            <tbody>
              ${rows.map((row) => `
                <tr>${header.map((_, index) => `<td>${escapeHtml(row[index] || "-")}</td>`).join("")}</tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : "<p>No records were returned from eChawadi for this category.</p>"}
    </section>
  `;
}

function renderVillageScanReport(report) {
  const overview = report.overview || {};
  const tables = report.tables || [];
  controls.reportOutput.innerHTML = `
    ${renderServiceRefreshStatus("Village Scan", report)}
    <section class="summary-block village-overview">
      <div class="section-title">
        <h3>Village Scan Summary</h3>
        <span>${escapeHtml(overview.source || "eChawadi")}</span>
      </div>
      <table>
        ${rowsPreview([
          ["District", overview.district || "-"],
          ["Taluk", overview.taluk || "-"],
          ["Hobli", overview.hobli || "-"],
          ["Village", overview.village || "-"],
          ["Total Items", overview.totalItems || 0],
          ["Generated", report.generatedAt ? new Date(report.generatedAt).toLocaleString() : "-"],
        ], 10)}
      </table>
    </section>
    ${tables.map(renderVillageTable).join("") || "<p>No village scan tables were returned.</p>"}
  `;
}

function renderDailyMutationsEmpty() {
  controls.reportOutput.innerHTML = `
    <div class="empty-state">
      <strong>Daily Mutations Report</strong>
      <span>Select district, taluk and hobli above, then click Generate Daily Report. The app will scan all villages in the hobli and list eChawadi mutations village-wise.</span>
    </div>
  `;
}

function renderDailyMutationRows(title, header, rows) {
  return `
    <section class="summary-block village-table-section">
      <div class="section-title">
        <h3>${escapeHtml(title)}</h3>
        <span>${rows.length ? `${rows.length} mutation(s)` : "No mutations returned"}</span>
      </div>
      ${rows.length ? `
        <div class="table-scroll">
          <table class="wide-table village-scan-table">
            <thead><tr>${header.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr></thead>
            <tbody>
              ${rows.map((row) => `
                <tr>${header.map((_, index) => `<td>${escapeHtml(row[index] || "-")}</td>`).join("")}</tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : "<p>No mutations were returned for this section.</p>"}
    </section>
  `;
}

function renderDailyMutationsReport(report) {
  const overview = report.overview || {};
  const combinedHeader = ["Village", "MR Number", "Transaction", "Survey Numbers", "Applicant", "Acquisition", "Status"];
  const villageHeader = combinedHeader.slice(1);
  controls.reportOutput.innerHTML = `
    ${renderServiceRefreshStatus("Daily Mutations Report", report)}
    <section class="summary-block village-overview">
      <div class="section-title">
        <h3>Daily Mutations Summary</h3>
        <span>${escapeHtml(overview.source || "eChawadi")}</span>
      </div>
      <table>
        ${rowsPreview([
          ["District", overview.district || "-"],
          ["Taluk", overview.taluk || "-"],
          ["Hobli", overview.hobli || "-"],
          ["Villages Scanned", overview.villagesScanned || 0],
          ["Mutations Found", overview.totalMutations || 0],
          ["Generated", report.generatedAt ? new Date(report.generatedAt).toLocaleString() : "-"],
        ], 10)}
      </table>
      ${report.pdf?.downloadUrl ? `<p><a class="download-link" href="${escapeAttr(report.pdf.downloadUrl)}" download="${escapeAttr(report.pdf.filename || "daily-mutations-report.pdf")}">Download generated PDF</a></p>` : ""}
    </section>
    ${renderDailyMutationRows("All Hobli Mutations", combinedHeader, report.combinedMutationRows || [])}
    ${(report.villages || []).map((item) => `
      ${item.error ? `
        <section class="summary-block village-table-section">
          <div class="section-title"><h3>${escapeHtml(item.villageName || "Village")}</h3><span>Fetch failed</span></div>
          <div class="error-card">${escapeHtml(item.error)}</div>
        </section>
      ` : renderDailyMutationRows(item.villageName || "Village", villageHeader, item.mutations || [])}
    `).join("")}
  `;
}

function renderKathaValidationEmpty() {
  controls.reportOutput.innerHTML = `
    <div class="empty-state">
      <strong>Katha Validation</strong>
      <span>Select land details above and click Validate Katha. This report will fetch RTC owners, locate the Khatha number, fetch Khatha entries, filter them to the selected survey, and compare owner names.</span>
    </div>
  `;
}

function renderKathaValidationReport(report) {
  const overview = report.overview || {};
  const isMatched = /matched/i.test(overview.validationStatus || "") && !/mismatch/i.test(overview.validationStatus || "");
  controls.reportOutput.innerHTML = `
    ${renderServiceRefreshStatus("Katha Validation", report)}
    <section class="summary-block katha-validation-result ${isMatched ? "is-match" : "is-mismatch"}">
      <div class="section-title">
        <h3>Katha Validation Result</h3>
        <span>${escapeHtml(overview.validationStatus || "Validation completed")}</span>
      </div>
      <table>
        ${rowsPreview([
          ["District", overview.district || "-"],
          ["Taluk", overview.taluk || "-"],
          ["Hobli", overview.hobli || "-"],
          ["Village", overview.village || "-"],
          ["Survey / Surnoc / Hissa", [overview.survey, overview.surnoc, overview.hissa].filter(Boolean).join(" / ")],
          ["Khatha Number", overview.khathaNumber || "Not found"],
          ["Validation", overview.validationStatus || "-"],
        ], 12)}
      </table>
    </section>
    <section class="summary-block">
      <div class="section-title"><h3>Source Fetch Status</h3><span>RTC and Khatha sources</span></div>
      <table>
        ${rowsPreview(Object.entries(report.sourceStatus || {}).map(([key, value]) => [key, value]), 12)}
      </table>
    </section>
    ${(report.records || []).map((record) => renderRecord(record, { hideRecordStatus: true, rowLimit: 40 })).join("") || "<p>No Katha validation records were returned.</p>"}
  `;
}

function renderAutoGenEmpty() {
  controls.reportOutput.innerHTML = `
    <div class="empty-state">
      <strong>Land AutoGen Report</strong>
      <span>Select land details above and click Generate Automated Report. The system will fetch each service step by step and append each completed section into one printable PDF-ready report.</span>
    </div>
  `;
}

const autoGenSteps = [
  { id: "rtcDetails", title: "RTC Details", status: "Fetch RTC Details", type: "fullLegal", sections: ["currentRtc", "oldRtc"], reportId: "rtcDetails" },
  { id: "mutationReport", title: "Mutation Report", status: "Fetch Mutation Report", type: "fullLegal", sections: ["mutationRecords", "mutationStatus", "ownershipMap"], reportId: "mutationReport" },
  { id: "ownersChangeLog", title: "Owners Change Log", status: "Fetch Owners Change Log", type: "fullLegal", sections: ["currentRtc", "oldRtc"], reportId: "ownersChangeLog" },
  { id: "akarband", title: "Akarband", status: "Fetch Akarband", type: "fullLegal", sections: ["akarband"], reportId: "akarband" },
  { id: "kathaExtract", title: "Katha Extract", status: "Fetch Katha Extract", type: "fullLegal", sections: ["khatha", "advancedDetails"], reportId: "kathaExtract" },
  { id: "echawadi", title: "eChawadi Report", status: "Fetch eChawadi Report", type: "fullLegal", sections: ["echawadi"], reportId: "echawadi" },
  { id: "reviewPoints", title: "Review Points", status: "Generate Review Points", type: "fullLegal", sections: ["advancedDetails", "mutationStatus", "ownershipMap", "echawadi"], reportId: "landIssues" },
  { id: "downloadRtcs", title: "RTC Downloads & Scan", status: "Download RTCs", type: "downloadRtcs" },
  { id: "mrDownloader", title: "MR Downloader", status: "Download MR Extracts", type: "mrDownloader" },
  { id: "scanRtcs", title: "Scan RTCs", status: "Prepare Scan RTCs", type: "scanRtcs" },
  { id: "kathaValidation", title: "Katha Validation", status: "Validate Katha", type: "kathaValidation" },
  { id: "villageScan", title: "Village Scan", status: "Fetch Village Scan", type: "villageScan" },
];

function renderWithOutput(renderer) {
  const originalOutput = controls.reportOutput.innerHTML;
  renderer();
  const html = controls.reportOutput.innerHTML;
  controls.reportOutput.innerHTML = originalOutput;
  return html;
}

function renderFullLegalStepHtml(report, reportId) {
  const previousCachedReport = cachedReport;
  cachedReport = report;
  const html = renderReportForPrint(reportId);
  cachedReport = previousCachedReport;
  return html;
}

function renderAutoGenServiceHtml(step, data) {
  if (step.type === "fullLegal") return renderFullLegalStepHtml(data, step.reportId);
  if (step.type === "downloadRtcs") return renderWithOutput(() => renderDownloadRtcsReport(data));
  if (step.type === "mrDownloader") return renderWithOutput(() => renderMrDownloaderReport(data));
  if (step.type === "scanRtcs") return renderWithOutput(() => renderScanRtcsReport(data));
  if (step.type === "kathaValidation") return renderWithOutput(() => renderKathaValidationReport(data));
  if (step.type === "villageScan") return renderWithOutput(() => renderVillageScanReport(data));
  return `<section class="print-section"><h2>${escapeHtml(step.title)}</h2><p>No renderer configured.</p></section>`;
}

function autoGenFileName(report = cachedAutoGenReport) {
  const overview = report?.overview || values();
  const village = overview.village || overview.villageLabel || "Village";
  const survey = overview.survey || "Survey";
  const hissa = overview.hissa || overview.hissaLabel || "Hissa";
  const safe = (value) => String(value || "").trim().replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "NA";
  return `SriSatVam_${safe(village)}_${safe(survey)}_${safe(hissa)}.pdf`;
}

function buildAutoGenPrintDocument(report) {
  const overview = report?.overview || {};
  return `
    <article class="print-document autogen-print-document">
      <header class="print-title">
        <h1>Sri SatVam Land AutoGen Report</h1>
        <p>${escapeHtml([overview.village, overview.survey, overview.surnoc, overview.hissa].filter(Boolean).join(" / ") || "Selected land details")}</p>
      </header>
      ${printLandDetails({ overview })}
      ${(report?.sections || []).map((section) => `
        <section class="autogen-print-section" data-step="${escapeAttr(section.id)}">
          ${section.html}
        </section>
      `).join("")}
    </article>
  `;
}

function renderAutoGenReport(report) {
  const completed = report.steps.filter((step) => step.state === "completed").length;
  const failed = report.steps.filter((step) => step.state === "failed").length;
  const total = report.steps.length;
  const percent = total ? Math.round(((completed + failed) / total) * 100) : 0;
  controls.reportOutput.innerHTML = `
    <section class="summary-block autogen-status-panel">
      <div class="section-title">
        <h3>Land AutoGen Report</h3>
        <span>${escapeHtml(report.message || "Ready")}</span>
      </div>
      <div class="autogen-progress" aria-label="Report progress">
        <div style="width:${percent}%"></div>
      </div>
      <ol class="autogen-step-list">
        ${report.steps.map((step) => `
          <li class="autogen-step is-${escapeAttr(step.state)}">
            <strong>${escapeHtml(step.title)}</strong>
            <span>${escapeHtml(step.message || step.state)}</span>
          </li>
        `).join("")}
      </ol>
      ${report.ready ? `
        <div class="autogen-download-action">
          <button type="button" data-autogen-download>Download ${escapeHtml(autoGenFileName(report))}</button>
        </div>
      ` : ""}
    </section>
    <section class="autogen-live-report">
      ${buildAutoGenPrintDocument(report)}
    </section>
  `;
}

async function fetchAutoGenStep(step, baseValues) {
  if (step.type === "fullLegal") {
    return api("/api/report", { sessionId, values: { ...baseValues, sections: step.sections } });
  }
  if (step.type === "downloadRtcs") return api("/api/download-rtcs", { sessionId, values: baseValues });
  if (step.type === "mrDownloader") return api("/api/mr-downloader", { sessionId, values: baseValues });
  if (step.type === "scanRtcs") return api("/api/scan-rtcs", { sessionId, values: baseValues });
  if (step.type === "kathaValidation") return api("/api/katha-validation", { sessionId, values: baseValues });
  if (step.type === "villageScan") return api("/api/village-scan", { sessionId, values: baseValues });
  throw new Error(`Unknown AutoGen step: ${step.title}`);
}

async function fetchAutoGenReport() {
  if (!hasRequiredInputs()) {
    setStatus("Select district, taluk, hobli, village, survey, surnoc and hissa first");
    return;
  }
  const baseValues = values();
  cachedAutoGenReport = {
    overview: {
      district: baseValues.districtLabel,
      taluk: baseValues.talukLabel,
      hobli: baseValues.hobliLabel,
      village: baseValues.villageLabel,
      survey: baseValues.survey,
      surnoc: baseValues.surnocLabel || baseValues.surnoc,
      hissa: baseValues.hissaLabel || baseValues.hissa,
      generated: new Date().toISOString(),
    },
    steps: autoGenSteps.map((step) => ({ ...step, state: "pending", message: "Waiting" })),
    sections: [],
    ready: false,
    message: "Starting automated report workflow...",
  };
  setBusy(true);
  renderAutoGenReport(cachedAutoGenReport);
  try {
    for (const step of cachedAutoGenReport.steps) {
      step.state = "running";
      step.message = `${step.status}...`;
      cachedAutoGenReport.message = step.message;
      setStatus(step.message);
      renderAutoGenReport(cachedAutoGenReport);
      try {
        const data = await fetchAutoGenStep(step, baseValues);
        const html = renderAutoGenServiceHtml(step, data);
        cachedAutoGenReport.sections.push({ id: step.id, title: step.title, html, data });
        step.state = "completed";
        step.message = "Completed";
        cachedAutoGenReport.message = `${step.title} completed`;
      } catch (error) {
        step.state = "failed";
        step.message = error.message;
        cachedAutoGenReport.sections.push({
          id: step.id,
          title: step.title,
          html: `<section class="print-section"><h2>${escapeHtml(step.title)}</h2><div class="error-card">${escapeHtml(error.message)}</div></section>`,
          error: error.message,
        });
        cachedAutoGenReport.message = `${step.title} failed, continuing next service`;
      }
      renderAutoGenReport(cachedAutoGenReport);
    }
    cachedAutoGenReport.ready = true;
    cachedAutoGenReport.message = "Final Report Ready";
    renderAutoGenReport(cachedAutoGenReport);
    setStatus("Final Report Ready");
  } finally {
    setBusy(false);
  }
}

async function downloadAutoGenPdf() {
  if (!cachedAutoGenReport?.ready) {
    setStatus("Generate AutoGen report before download");
    return;
  }
  setStatus("Generating downloadable PDF...");
  const result = await api("/api/render-pdf", {
    filename: autoGenFileName(cachedAutoGenReport),
    html: buildAutoGenPrintDocument(cachedAutoGenReport),
  });
  const link = document.createElement("a");
  link.href = result.downloadUrl;
  link.download = result.filename || autoGenFileName(cachedAutoGenReport);
  document.body.append(link);
  link.click();
  link.remove();
  setStatus("PDF downloaded");
}

const scoreChoices = [
  { id: "good", label: "Good", points: 1 },
  { id: "check", label: "Need to Check", points: 0.5 },
  { id: "missing", label: "Missing Data", points: 0 },
];

const scoreSections = [
  {
    id: "documents",
    title: "Documents Score",
    description: "Availability, age and continuity of official ownership and revenue documents.",
    items: [
      { id: "titleChain", label: "Clear title chain / mother deed and linked sale deeds available for 15-30 years", weight: 12, checklist: "Collect mother deed and all linked registered sale deeds for the title chain." },
      { id: "ec", label: "Encumbrance Certificate checked for at least 15-30 years", weight: 10, checklist: "Verify EC for loans, mortgages, attachments and missing registration links." },
      { id: "rtcYears", label: "Current RTC and old RTC records available across ownership changes", weight: 10, checklist: "Keep current RTC and old RTC copies for every major owner/year change." },
      { id: "mrExtracts", label: "Mutation register extracts available for every ownership/extent change", weight: 9, checklist: "Download MR extracts and match MR numbers with RTC title chain." },
      { id: "khatha", label: "Khatha / tax extract and latest tax-paid receipts match RTC owner", weight: 8, checklist: "Verify Khatha number, owner name, survey/hissa and tax payment status." },
      { id: "surveyDocs", label: "Akarband, survey sketch, phodi/tippani and boundary records available", weight: 8, checklist: "Match survey sketch and Akarband extent with physical boundaries." },
      { id: "conversion", label: "Land use, zoning and conversion approval documents available where required", weight: 8, checklist: "Verify agricultural/non-agricultural conversion and permitted land use." },
      { id: "idsApprovals", label: "Seller identity, authority, GPA/NOC/bank release documents are available where applicable", weight: 5, checklist: "Check ID, PAN, legal heir/GPA, NOC and bank loan closure/release documents." },
    ],
  },
  {
    id: "risks",
    title: "Risk Score",
    description: "Document gaps, mismatches, liabilities, disputes and boundary risks.",
    items: [
      { id: "nameMismatch", label: "Owner names match across RTC, MR, sale deed, Khatha and EC", weight: 10, checklist: "Resolve spelling, initials, relationship and entity-name mismatches." },
      { id: "extentMismatch", label: "Survey number, surnoc, hissa and extent match across documents", weight: 10, checklist: "Reconcile extent and hissa differences before decision." },
      { id: "missingLinks", label: "No missing link deed or unexplained ownership transfer in title chain", weight: 10, checklist: "Trace each sale, inheritance, partition, court order or MR link." },
      { id: "pendingCases", label: "No pending mutation, RCCMS, court case, stay, attachment or dispute found", weight: 12, checklist: "Check revenue cases, civil court search and portal pending case records." },
      { id: "liabilities", label: "No loan, mortgage, charge, tenancy, easement or other rights affecting land", weight: 9, checklist: "Validate EC, RTC column 11, bank NOC and local enquiry." },
      { id: "conversionRisk", label: "No land-use, conversion, zoning or layout-approval risk", weight: 8, checklist: "Confirm conversion order, conditions, approvals and permitted use." },
      { id: "boundaryRisk", label: "Physical boundary, access road and possession match official records", weight: 7, checklist: "Do site inspection, boundary measurement and access-road verification." },
      { id: "taxUtilityRisk", label: "No unpaid tax, revenue dues, utility dues or local authority objection", weight: 4, checklist: "Collect latest tax paid receipt and local authority clearance where applicable." },
    ],
  },
  {
    id: "decision",
    title: "Decisions Score",
    description: "Readiness for purchase after manual checks, local verification and expert review.",
    items: [
      { id: "lawyerReview", label: "Property lawyer reviewed title, EC, MR, RTC, Khatha and approvals", weight: 10, checklist: "Get written legal opinion with specific document gap list." },
      { id: "siteInspection", label: "Physical site inspection, boundaries, access and possession verified", weight: 10, checklist: "Record site photos, boundary points, access route and possession status." },
      { id: "sellerAuthority", label: "Seller authority, consent of co-owners/heirs and signing power verified", weight: 8, checklist: "Confirm all owners, heirs, directors/partners or GPA holders can sign." },
      { id: "localEnquiry", label: "Local enquiry with neighbours, village office and revenue office completed", weight: 7, checklist: "Check local possession, disputes, objections and informal claims." },
      { id: "financialPlan", label: "Payment, registration, tax/TDS/stamp duty and loan process are clear", weight: 6, checklist: "Confirm payment trail, stamp duty, registration cost and loan disbursement conditions." },
      { id: "conditions", label: "Pre-registration conditions and missing documents are listed and assigned", weight: 6, checklist: "Keep a condition tracker before agreement, advance or registration." },
      { id: "riskAcceptance", label: "Known risks are accepted, priced or resolved before final decision", weight: 5, checklist: "Document risk owner, resolution date and go/no-go decision." },
      { id: "finalApproval", label: "Final go/no-go decision reviewed with buyer/family/investment team", weight: 4, checklist: "Keep final sign-off notes and pending-condition summary." },
    ],
  },
];

function defaultScoreCardState() {
  const answers = {};
  for (const section of scoreSections) {
    for (const item of section.items) answers[item.id] = "check";
  }
  return {
    step: 0,
    answers,
    generatedAt: "",
  };
}

function scoreCardState() {
  if (!cachedScoreCard) cachedScoreCard = defaultScoreCardState();
  return cachedScoreCard;
}

function scoreSectionResult(section, answers) {
  const totalWeight = section.items.reduce((sum, item) => sum + item.weight, 0);
  const earned = section.items.reduce((sum, item) => {
    const choice = scoreChoices.find((option) => option.id === answers[item.id]) || scoreChoices[1];
    return sum + item.weight * choice.points;
  }, 0);
  return Math.round((earned / totalWeight) * 100);
}

function scoreBand(score) {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Needs Review";
  return "High Risk";
}

function allScoreRows(answers) {
  return scoreSections.flatMap((section) => section.items.map((item) => ({
    section: section.title,
    ...item,
    choice: answers[item.id] || "check",
  })));
}

function groupedScoreRows(answers, choice) {
  return allScoreRows(answers).filter((item) => item.choice === choice);
}

function renderScoreChoice(item, selected) {
  return `
    <div class="score-choice-group" role="radiogroup" aria-label="${escapeAttr(item.label)}">
      ${scoreChoices.map((choice) => `
        <label class="score-choice is-${escapeAttr(choice.id)} ${selected === choice.id ? "is-selected" : ""}">
          <input type="radio" name="score-${escapeAttr(item.id)}" value="${escapeAttr(choice.id)}" ${selected === choice.id ? "checked" : ""}>
          <span>${escapeHtml(choice.label)}</span>
        </label>
      `).join("")}
    </div>
  `;
}

function renderScoreCard() {
  const state = scoreCardState();
  const section = scoreSections[state.step] || scoreSections[0];
  const results = scoreSections.map((item) => ({ ...item, score: scoreSectionResult(item, state.answers) }));
  const overall = Math.round(results.reduce((sum, item) => sum + item.score, 0) / results.length);
  const isFinal = state.step >= scoreSections.length;
  controls.reportOutput.innerHTML = `
    <section class="summary-block scorecard-panel">
      <div class="section-title">
        <h3>Land Score Card</h3>
        <span>${isFinal ? "Final report ready" : `Step ${state.step + 1} of ${scoreSections.length}: ${section.title}`}</span>
      </div>
      <div class="score-summary-grid">
        ${results.map((item) => `
          <article class="score-summary-card">
            <span>${escapeHtml(item.title)}</span>
            <strong>${item.score}</strong>
            <em>${escapeHtml(scoreBand(item.score))}</em>
          </article>
        `).join("")}
        <article class="score-summary-card score-overall">
          <span>Overall Land Score</span>
          <strong>${overall}</strong>
          <em>${escapeHtml(scoreBand(overall))}</em>
        </article>
      </div>
    </section>
    ${isFinal ? renderScoreCardReport(state, results, overall) : `
      <section class="summary-block scorecard-step">
        <div class="section-title">
          <h3>${escapeHtml(section.title)}</h3>
          <span>${escapeHtml(section.description)}</span>
        </div>
        <div class="score-question-list">
          ${section.items.map((item) => `
            <article class="score-question" data-score-item="${escapeAttr(item.id)}">
              <div>
                <strong>${escapeHtml(item.label)}</strong>
                <span>Weight: ${item.weight}</span>
              </div>
              ${renderScoreChoice(item, state.answers[item.id] || "check")}
            </article>
          `).join("")}
        </div>
        <div class="score-actions">
          <button type="button" data-score-action="prev" ${state.step === 0 ? "disabled" : ""}>Previous</button>
          <button type="button" data-score-action="next">${state.step === scoreSections.length - 1 ? "Generate Score Report" : "Next"}</button>
        </div>
      </section>
    `}
  `;
}

function renderScoreRows(title, rows, emptyText) {
  return `
    <section class="summary-block score-report-section">
      <div class="section-title"><h3>${escapeHtml(title)}</h3><span>${rows.length ? `${rows.length} item(s)` : emptyText}</span></div>
      ${rows.length ? `
        <table>
          <thead><tr><th>Section</th><th>Item</th><th>Checklist</th></tr></thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.section)}</td>
                <td>${escapeHtml(row.label)}</td>
                <td>${escapeHtml(row.checklist)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : `<p>${escapeHtml(emptyText)}</p>`}
    </section>
  `;
}

function renderChecklist(title, rows) {
  return `
    <section class="summary-block score-checklist-section">
      <div class="section-title"><h3>${escapeHtml(title)}</h3><span>Printable tracking checklist</span></div>
      <table>
        <thead><tr><th>Done</th><th>Checklist Item</th><th>Source Section</th></tr></thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td class="print-checkbox">□</td>
              <td>${escapeHtml(row.checklist)}</td>
              <td>${escapeHtml(row.section)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
  `;
}

function renderScoreCardReport(state, results, overall) {
  const goodRows = groupedScoreRows(state.answers, "good");
  const checkRows = groupedScoreRows(state.answers, "check");
  const riskRows = groupedScoreRows(state.answers, "missing");
  const documentRows = allScoreRows(state.answers).filter((row) => /Documents/i.test(row.section));
  const verificationRows = allScoreRows(state.answers).filter((row) => !/Documents/i.test(row.section));
  const scoreTable = `
    <section class="summary-block score-report-hero">
      <div class="section-title"><h3>Final Land Score</h3><span>${escapeHtml(scoreBand(overall))}</span></div>
      <table>
        <thead><tr><th>Score</th><th>Value</th><th>Status</th></tr></thead>
        <tbody>
          ${results.map((row) => `<tr><td>${escapeHtml(row.title)}</td><td>${row.score}</td><td>${escapeHtml(scoreBand(row.score))}</td></tr>`).join("")}
          <tr><td><strong>Overall Land Score</strong></td><td><strong>${overall}</strong></td><td><strong>${escapeHtml(scoreBand(overall))}</strong></td></tr>
        </tbody>
      </table>
    </section>
  `;
  return `
    <article class="score-report">
      ${scoreTable}
      ${renderScoreRows("What looks good?", goodRows, "No item has been marked Good yet.")}
      ${renderScoreRows("Please double check?", checkRows, "No item needs additional checking.")}
      ${renderScoreRows("Risks", riskRows, "No item has been marked Missing Data.")}
      ${renderChecklist("Documents Checklist", documentRows)}
      ${renderChecklist("Verification Points Checklist", verificationRows)}
      <div class="score-actions">
        <button type="button" data-score-action="edit">Edit Score Card</button>
      </div>
    </article>
  `;
}

function handleScoreCardAction(event) {
  if (!isScoreCardWorkspace()) return;
  const input = event.target.closest("input[type='radio'][name^='score-']");
  if (input) {
    const itemId = input.name.replace(/^score-/, "");
    scoreCardState().answers[itemId] = input.value;
    renderScoreCard();
    return;
  }
  const button = event.target.closest("[data-score-action]");
  if (!button) return;
  const state = scoreCardState();
  if (button.dataset.scoreAction === "next") {
    state.step = Math.min(scoreSections.length, state.step + 1);
    if (state.step === scoreSections.length) state.generatedAt = new Date().toISOString();
  } else if (button.dataset.scoreAction === "prev") {
    state.step = Math.max(0, state.step - 1);
  } else if (button.dataset.scoreAction === "edit") {
    state.step = 0;
  }
  renderScoreCard();
}

function renderDownloadRtcsEmpty() {
  controls.reportOutput.innerHTML = `
    <div class="empty-state">
      <strong>Download RTCs</strong>
      <span>Select land details above and click Download RTCs. This report will fetch unique current and old RTC owner/year states, then display official RTC captures below the table.</span>
    </div>
  `;
}

function renderDownloadRtcsTable(report) {
  const header = report.table?.header || [];
  const seen = new Set();
  const rows = (report.table?.rows || []).filter((row) => {
    const key = JSON.stringify(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (!header.length || !rows.length) {
    return `
      <section class="summary-block">
        <div class="section-title"><h3>Unique RTC List</h3><span>No RTC rows returned</span></div>
        <p>No RTC records were returned for this selection.</p>
      </section>
    `;
  }
  return `
    <section class="summary-block rtc-download-table-section">
      <div class="section-title">
        <h3>Unique RTC List</h3>
        <span>${rows.length} unique RTC item(s)</span>
      </div>
      <div class="table-scroll">
        <table class="wide-table rtc-download-table">
          <thead><tr>${header.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows.map((row) => `
              <tr>${header.map((_, index) => `<td>${multilineHtml(row[index] || "-")}</td>`).join("")}</tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderDownloadRtcsReport(report) {
  const overview = report.overview || {};
  const records = uniqueRecords(report.records || []);
  const failures = report.failures || [];
  controls.reportOutput.innerHTML = `
    <section class="summary-block">
      <div class="section-title"><h3>RTC Downloads & Scan Summary</h3><span>${escapeHtml(fetchedLabel(report))}</span></div>
      <table>
        ${rowsPreview([
          ["District", overview.district || "-"],
          ["Taluk", overview.taluk || "-"],
          ["Hobli", overview.hobli || "-"],
          ["Village", overview.village || "-"],
          ["Survey / Surnoc / Hissa", [overview.survey, overview.surnoc, overview.hissa].filter(Boolean).join(" / ")],
          ["Unique RTCs", overview.totalUniqueRtcs || 0],
          ["Current RTCs", overview.currentRtcs || 0],
          ["Old RTCs", overview.oldRtcs || 0],
          ["Fetched Images", overview.fetchedImages || 0],
        ], 12)}
      </table>
      <button type="button" data-rtc-action="scan">Capture Important RTC Portions</button>
    </section>
    ${renderDownloadRtcsTable(report)}
    ${failures.length ? `
      <section class="summary-block rtc-failures">
        <div class="section-title"><h3>RTCs Not Able To Fetch</h3><span>${failures.length} item(s)</span></div>
        <table>
          <thead><tr><th>RTC</th><th>Reason</th></tr></thead>
          <tbody>
            ${failures.map((failure) => `
              <tr>
                <td>${escapeHtml(failure.label || "-")}</td>
                <td>${escapeHtml(failure.message || "Details Not Available or Not able to fetch RTC")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </section>
    ` : ""}
    <section class="summary-block rtc-documents-section">
      <div class="section-title"><h3>Downloaded RTCs</h3><span>${records.length ? `${records.length} RTC item(s)` : "No RTCs"}</span></div>
      ${records.map((record) => renderRecord(record, { hideRecordStatus: true, rowLimit: 6 })).join("") || "<p>No RTC documents were returned.</p>"}
    </section>
    ${cachedScanRtcs ? renderScanRtcsInline(cachedScanRtcs) : `
      <section class="summary-block">
        <div class="section-title"><h3>Important RTC Portions</h3><span>Not captured yet</span></div>
        <p>Use Capture Important RTC Portions to display the key RTC image area from every current and old RTC.</p>
      </section>
    `}
  `;
}

function renderScanRtcsInline(report) {
  const rtcRecords = uniqueRecords((report.scans || []).length ? report.scans : (report.downloadReport?.records || []));
  return `
    <section class="summary-block">
      <div class="section-title"><h3>Important RTC Portions</h3><span>${escapeHtml(fetchedLabel(report))}</span></div>
      <p>${rtcRecords.length} RTC image portion(s) captured for validation.</p>
    </section>
    <section class="scan-rtc-crops">
      ${rtcRecords.map((record, index) => renderRtcCropCard(record, index)).join("") || "<p>No RTC images were returned.</p>"}
    </section>
  `;
}

function renderScanRtcsEmpty() {
  controls.reportOutput.innerHTML = `
    <div class="empty-state">
      <strong>Scan RTCs</strong>
      <span>Select land details above and click Scan RTCs. This report will download current and old RTC images and show the key upper RTC portion from each image.</span>
    </div>
  `;
}

function renderRtcCropCard(record = {}, index = 0) {
  const title = record.label || `RTC ${index + 1}`;
  const imageUrl = record.imageUrl || "";
  return `
    <section class="summary-block rtc-crop-card">
      <div class="section-title">
        <h3>${escapeHtml(title)}</h3>
        <span>${imageUrl ? "RTC portion captured" : "Image not available"}</span>
      </div>
      ${imageUrl ? `
        <div class="rtc-crop-frame">
          <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)} upper RTC portion">
        </div>
      ` : `<p class="rtc-crop-error">${escapeHtml(record.attachmentError || "Details Not Available or Not able to fetch RTC")}</p>`}
    </section>
  `;
}

function renderKeyValueTable(table = {}, title = "Extracted RTC Key Values") {
  const header = table.header || [];
  const rows = table.rows || [];
  return `
    <section class="summary-block scan-table-section">
      <div class="section-title">
        <h3>${escapeHtml(title)}</h3>
        <span>${rows.length ? `${rows.length} row(s)` : "No extracted rows"}</span>
      </div>
      ${rows.length ? `
        <div class="table-scroll">
          <table class="wide-table scan-rtc-table">
            <thead><tr>${header.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr></thead>
            <tbody>
              ${rows.map((row) => `
                <tr>${header.map((_, index) => `<td>${multilineHtml(row[index] || "-")}</td>`).join("")}</tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : "<p>No key-value information was extracted.</p>"}
    </section>
  `;
}

function renderScanRtcsReport(report) {
  const overview = report.overview || {};
  const rtcRecords = (report.scans || []).length ? report.scans : (report.downloadReport?.records || []);
  controls.reportOutput.innerHTML = `
    <section class="summary-block">
      <div class="section-title"><h3>Scan RTCs</h3><span>${rtcRecords.length ? `${rtcRecords.length} RTC image(s)` : "No RTC images"}</span></div>
      <table>
        ${rowsPreview([
          ["District", overview.district || "-"],
          ["Taluk", overview.taluk || "-"],
          ["Hobli", overview.hobli || "-"],
          ["Village", overview.village || "-"],
          ["Survey / Surnoc / Hissa", [overview.survey, overview.surnoc, overview.hissa].filter(Boolean).join(" / ")],
          ["RTC Images", rtcRecords.length],
        ], 12)}
      </table>
    </section>
    <section class="scan-rtc-crops">
      ${rtcRecords.map((record, index) => renderRtcCropCard(record, index)).join("") || "<p>No RTC images were returned.</p>"}
    </section>
  `;
}

function renderServiceRefreshStatus(title, report) {
  return `
    <section class="summary-block refresh-summary">
      <div class="section-title"><h3>${escapeHtml(title)} Status</h3><span>${escapeHtml(fetchedLabel(report))}</span></div>
      <p>Use Fetch Data again to refresh this service for the selected land and compare it against saved notes.</p>
    </section>
  `;
}

function renderMrDownloaderTable(report) {
  const header = report.table?.header || [];
  const rows = report.table?.rows || [];
  if (!header.length || !rows.length) {
    return `
      <section class="summary-block">
        <div class="section-title"><h3>MR Extract by Survey Number</h3><span>No MR rows returned</span></div>
        <p>No MR records were returned for this survey selection.</p>
      </section>
    `;
  }
  return `
    <section class="summary-block mr-table-section">
      <div class="section-title">
        <h3>MR Extract by Survey Number</h3>
        <span>${rows.length} MR record(s), sorted by Tahsildar Approved Date</span>
      </div>
      <div class="table-scroll">
        <table class="wide-table">
          <thead><tr>${header.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows.map((row) => `
              <tr>${header.map((_, index) => `<td>${escapeHtml(row[index] || "-")}</td>`).join("")}</tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderMrDownloaderReport(report) {
  const records = uniqueRecords(report.records || []);
  const failures = report.failures || [];
  controls.reportOutput.innerHTML = `
    ${renderServiceRefreshStatus("MR Downloader", report)}
    ${renderMrDownloaderTable(report)}
    ${renderLinkDocumentsSection(report)}
    ${failures.length ? `
      <section class="summary-block mr-failures">
        <div class="section-title"><h3>MRs Not Able To Fetch</h3><span>${failures.length} item(s)</span></div>
        <table>
          <thead><tr><th>MR Number</th><th>Tahsildar Approved Date</th><th>Reason</th></tr></thead>
          <tbody>
            ${failures.map((failure) => `
              <tr>
                <td>${escapeHtml(failure.mrNumber || "-")}</td>
                <td>${escapeHtml(failure.approvedDate || "-")}</td>
                <td>${escapeHtml(failure.message || "Could not fetch MR preview")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </section>
    ` : ""}
    <section class="summary-block mr-documents-section">
      <div class="section-title"><h3>Downloaded MR Extracts</h3><span>${records.length ? `${records.length} MR item(s)` : "No MR extracts"}</span></div>
      ${records.map((record) => renderRecord(record, { hideRecordStatus: true, rowLimit: 4 })).join("") || "<p>No MR extracts were returned.</p>"}
    </section>
  `;
}

function renderLinkDocumentsSection(report) {
  const linkDocuments = report.linkDocuments || [];
  if (!linkDocuments.length) return "";
  return `
    <section class="summary-block mr-link-documents">
      <div class="section-title"><h3>Link Documents</h3><span>${linkDocuments.length} document(s)</span></div>
      <table>
        <thead><tr><th>MR Number</th><th>MR Date</th><th>Document Number</th><th>Document Date</th></tr></thead>
        <tbody>
          ${linkDocuments.map((document) => `
            <tr>
              <td>${escapeHtml(document.mrNumber || "-")}</td>
              <td>${escapeHtml(document.mrDate || "-")}</td>
              <td>${escapeHtml(document.documentNumber || "-")}</td>
              <td>${escapeHtml(document.documentDate || "-")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
  `;
}

function sectionByTitle(report, title) {
  return (report.sections || []).find((section) => section.title === title);
}

function renderRtcDetailsReport(report) {
  const currentSection = sectionByTitle(report, "Current Year RTC");
  const oldSection = sectionByTitle(report, "Old Year RTC");
  const officialViewRecords = (currentSection?.records || []).filter((record) => /official\s+View\s+page/i.test(record.label || ""));
  const currentRecords = (currentSection?.records || []).filter((record) => !/official\s+View\s+page/i.test(record.label || ""));

  controls.reportOutput.innerHTML = `
    ${renderRecordGroup("Current RTC official View page", officialViewRecords, { hideRecordStatus: true })}
    ${currentSection ? renderSection({ ...currentSection, records: currentRecords }, { hideRecordStatus: true }) : ""}
    ${renderRtcRows(report.rtcRows || [])}
    ${renderRtcChangesFlow(report.rtcRows || [])}
    ${oldSection ? renderSection(oldSection, { hideRecordStatus: true }) : ""}
  `;
}

function yearsFromValue(value = "") {
  return [...String(value || "").matchAll(/\b(?:19|20)\d{2}\s*-\s*(?:19|20)\d{2}\b/g)]
    .map((match) => match[0].replace(/\s+/g, ""));
}

function yearStart(year = "") {
  const start = Number(String(year).slice(0, 4));
  return Number.isFinite(start) ? start : 9999;
}

function yearEnd(year = "") {
  const end = Number(String(year).slice(-4));
  return Number.isFinite(end) ? end : yearStart(year);
}

function sortedYears(row) {
  return [...new Set([
    ...yearsFromValue(row.period),
    ...yearsFromValue(row.year),
  ])].sort((a, b) => yearStart(a) - yearStart(b));
}

function ownerRowsFromRtcRow(row) {
  const details = (row.ownerDetails || []).length
    ? row.ownerDetails.map((owner) => ({
      owner: owner.owner || "",
      extent: owner.extent || "",
      khata: owner.khata || row.khataNumber || "",
    }))
    : (row.owners || []).map((owner, index) => ({
      owner,
      extent: row.extents?.[index] || "",
      khata: row.khataNumber || "",
    }));
  const seen = new Set();
  return details.filter((item) => {
    const key = [item.owner, item.extent, item.khata].map((value) => String(value || "").trim()).join("|");
    if (!key.replace(/\|/g, "") || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function ownershipPeriodText(row, years) {
  if (!years.length) return row.type === "Current RTC" ? "Till Date" : "-";
  const first = years[0];
  const last = years[years.length - 1];
  if (row.type === "Current RTC" || /till\s+date/i.test(row.period || "")) return `${first} to Till Date`;
  return first === last ? first : `${first} to ${last}`;
}

function yearRangeText(years = []) {
  if (!years.length) return "";
  const starts = years.map(yearStart).filter(Number.isFinite);
  const ends = years.map(yearEnd).filter(Number.isFinite);
  if (!starts.length || !ends.length) return years.join("\n");
  const first = Math.min(...starts);
  const last = Math.max(...ends);
  return first === last ? String(first) : `${first} - ${last}`;
}

function rtcFlowNodes(rows) {
  return rows
    .map((row) => {
      const years = sortedYears(row);
      return {
        row,
        years,
        owners: ownerRowsFromRtcRow(row),
        fromYear: years.length ? Math.min(...years.map(yearStart)) : (row.type === "Current RTC" ? 9998 : 0),
        toYear: years.length ? Math.max(...years.map(yearEnd)) : (row.type === "Current RTC" ? 9999 : 0),
      };
    })
    .filter((node) => node.owners.length)
    .sort((a, b) => a.fromYear - b.fromYear || a.toYear - b.toYear);
}

function ownerNameKey(owners = []) {
  return [...new Set(owners.map((owner) => String(owner.owner || "").replace(/\s+/g, " ").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
    .join("|");
}

function mergeYearLists(...lists) {
  return [...new Set(lists.flat())].sort((a, b) => yearStart(a) - yearStart(b));
}

function ownershipChangeNodes(rows) {
  const nodes = [];
  for (const node of rtcFlowNodes(rows)) {
    const key = ownerNameKey(node.owners);
    if (!key) continue;
    const existing = nodes[nodes.length - 1];
    if (existing?.ownerKey === key) {
      existing.years = mergeYearLists(existing.years, node.years);
      existing.fromYear = Math.min(existing.fromYear, node.fromYear);
      existing.toYear = Math.max(existing.toYear, node.toYear);
      existing.rows.push(node.row);
      continue;
    }
    nodes.push({
      ownerKey: key,
      owners: key.split("|"),
      years: [...node.years],
      fromYear: node.fromYear,
      toYear: node.toYear,
      rows: [node.row],
    });
  }
  return nodes;
}

function ownershipChainRows(rows = []) {
  return ownershipChangeNodes(rows).map((node, index) => [
    String(index + 1),
    node.years.length ? yearRangeText(node.years) : "Current stage",
    node.owners.join("; ") || "-",
    [...new Set(node.rows.flatMap((row) => row.extents || []))].filter(Boolean).join("; ") || "-",
    [...new Set(node.rows.map((row) => row.khataNumber).filter(Boolean))].join("; ") || "-",
  ]);
}

function renderOwnershipChainTable(rows = []) {
  const chainRows = ownershipChainRows(rows);
  return chainRows.length ? featureTable(["Step", "Period", "Owner(s)", "Extent", "Khatha"], chainRows) : "<p>No ownership chain rows were available.</p>";
}

function renderRtcChangesFlow(rows) {
  const nodes = rtcFlowNodes(rows);
  if (!nodes.length) return "";
  return `
    <section class="summary-block">
      <div class="section-title">
        <h3>RTC/Ownership Changes Flow</h3>
        <span>${nodes.length} ownership state(s)</span>
      </div>
      <div class="rtc-flow">
        ${nodes.map((node, index) => `
          <article class="rtc-flow-node">
            <div class="flow-node-head">
              <strong>${escapeHtml(ownershipPeriodText(node.row, node.years))}</strong>
              <span>${escapeHtml(node.row.type || "RTC")}</span>
            </div>
            <table>
              <thead>
                <tr><th>Owner</th><th>Extent</th><th>Khata</th></tr>
              </thead>
              <tbody>
                ${node.owners.map((owner) => `
                  <tr>
                    <td>${escapeHtml(owner.owner || "-")}</td>
                    <td>${escapeHtml(owner.extent || "-")}</td>
                    <td>${escapeHtml(owner.khata || "-")}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </article>
          ${index < nodes.length - 1 ? '<div class="flow-arrow" aria-hidden="true">↓</div>' : ""}
        `).join("")}
      </div>
    </section>
  `;
}

function renderOwnershipChangeFlow(rows) {
  const nodes = ownershipChangeNodes(rows);
  if (!nodes.length) return "";
  return `
    <section class="summary-block">
      <div class="section-title">
        <h3>Owners Change Log</h3>
        <span>${nodes.length} owner change step(s)</span>
      </div>
      ${renderOwnershipChainTable(rows)}
      <div class="rtc-flow ownership-flow">
        ${nodes.map((node, index) => `
            <article class="rtc-flow-node ownership-flow-node">
              <ul class="owner-list">
                ${node.owners.map((owner) => `<li>${escapeHtml(owner)}</li>`).join("")}
              </ul>
            </article>
            ${index < nodes.length - 1 ? '<div class="flow-arrow" aria-hidden="true">↓</div>' : ""}
          `).join("")}
      </div>
    </section>
  `;
}

function renderRtcRows(rows) {
  if (!rows.length) return "";
  return `
    <section class="summary-block">
      <div class="section-title"><h3>RTC Details</h3><span>${rows.length} row(s)</span></div>
      <div class="table-scroll">
        <table class="wide-table">
          <thead>
            <tr>
              <th>Type</th><th>Period</th><th>Survey</th><th>Khata</th><th>Owners</th><th>Extent</th><th>Mutation</th><th>Land ID</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.type)}</td>
                <td class="multiline-cell">${multilineHtml(row.period || row.year || "-")}</td>
                <td>${escapeHtml([row.survey, row.surnoc, row.hissa].filter(Boolean).join(" / "))}</td>
                <td>${escapeHtml(row.khataNumber || "-")}</td>
                <td>${escapeHtml((row.owners || []).join("; ") || "-")}</td>
                <td>${escapeHtml((row.extents || []).join("; ") || "-")}</td>
                <td>${escapeHtml(row.ongoingMutation || "-")}</td>
                <td>${escapeHtml(row.landId || "-")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderRecord(record, options = {}) {
  const rows = rowsPreview(record.summary?.rows || [], options.rowLimit ?? 10);
  const attachment = record.imageUrl
    ? `<img class="${escapeAttr(record.imageClass || "report-image")}" src="${escapeAttr(record.imageUrl)}" alt="${escapeAttr(record.label || "Report attachment")}">`
    : record.pdfUrl
      ? `<a class="download-link" href="${escapeAttr(record.pdfUrl)}" download="${escapeAttr(record.filename || "report.pdf")}">Download attachment</a>`
      : record.attachmentError
        ? `<div class="mr-extract-error">${escapeHtml(record.attachmentError)}</div>`
        : "";
  return `
    <article class="record-card">
      <header>
        <strong>${multilineHtml(record.label || "Record")}</strong>
        ${options.hideRecordStatus ? "" : `<span>${record.summary?.hasData ? "Information found" : "No structured data"}</span>`}
      </header>
      ${rows ? `<table>${rows}</table>` : `<p>${escapeHtml(record.summary?.text || "No details returned.")}</p>`}
      ${attachment}
    </article>
  `;
}

function renderRecordGroup(title, records, options = {}) {
  const visibleRecords = uniqueRecords(records || []);
  return `
    <section class="summary-block">
      <div class="section-title">
        <h3>${escapeHtml(title)}</h3>
        <span>${visibleRecords.length ? `${visibleRecords.length} unique record(s)` : "No records returned"}</span>
      </div>
      ${visibleRecords.map((record) => renderRecord(record, options)).join("") || "<p>No records were returned.</p>"}
    </section>
  `;
}

function renderSection(section, options = {}) {
  const records = uniqueRecords(section.records || []).map((record) => renderRecord(record, options)).join("");

  return `
    <section class="summary-block">
      <div class="section-title">
        <h3>${escapeHtml(section.title || "Report Section")}</h3>
        <span>${escapeHtml(section.error || `${sectionStats(section)} | ${fetchedLabel(cachedReport || {})}`)}</span>
      </div>
      ${section.error ? `<p class="error">${escapeHtml(section.error)}</p>` : ""}
      ${records || "<p>No records were returned.</p>"}
    </section>
  `;
}

function printLandDetails(report) {
  const overview = report?.overview || {};
  const selected = values();
  return `
    <section class="print-section print-land-details">
      <h2>Land Details</h2>
      ${legalTable([
        ["District", overview.district || selected.districtLabel || "-"],
        ["Taluk", overview.taluk || selected.talukLabel || "-"],
        ["Hobli", overview.hobli || selected.hobliLabel || "-"],
        ["Village", overview.village || selected.villageLabel || "-"],
        ["Survey Number", overview.survey || selected.survey || "-"],
        ["Surnoc", overview.surnoc || selected.surnocLabel || selected.surnoc || "-"],
        ["Hissa", overview.hissa || selected.hissaLabel || selected.hissa || "-"],
        ["Generated", new Date().toLocaleString()],
      ])}
    </section>
  `;
}

function renderReportForPrint(reportId) {
  const originalReport = activeReport;
  const originalName = controls.activeReportName.textContent;
  const originalOutput = controls.reportOutput.innerHTML;
  const reportConfig = reports.find((item) => item.id === reportId);
  if (!reportConfig) return "";
  activeReport = reportConfig;
  controls.activeReportName.textContent = reportConfig.name;
  renderReport(cachedReport);
  const html = controls.reportOutput.innerHTML;
  activeReport = originalReport;
  controls.activeReportName.textContent = originalName;
  controls.reportOutput.innerHTML = originalOutput;
  return `
    <section class="print-section">
      <h2>${escapeHtml(reportConfig.name)}</h2>
      ${html}
    </section>
  `;
}

function buildPrintReport() {
  const printOrder = [
    "rtcDetails",
    "mutationReport",
    "akarband",
    "kathaExtract",
    "echawadi",
    "ownersChangeLog",
    "claudeReview",
    "fullLegal",
    "landIssues",
    "advancedDetails",
  ];
  return `
    <article class="print-document">
      <header class="print-title">
        <h1>SSVD Land Report</h1>
        <p>Combined printable report generated from fetched service data.</p>
      </header>
      ${printLandDetails(cachedReport)}
      ${printOrder.map(renderReportForPrint).join("")}
    </article>
  `;
}

function printMrDownloaderReport() {
  if (!cachedMrDownloader) {
    setStatus("Fetch MR data before printing");
    return;
  }
  const overview = cachedMrDownloader.overview || {};
  controls.printOutput.innerHTML = `
    <article class="print-document mr-print-document">
      <header class="print-title">
        <h1>MR Downloader Report</h1>
        <p>${escapeHtml([overview.village, overview.taluk, overview.district].filter(Boolean).join(", ") || "Selected land details")}</p>
      </header>
      ${printLandDetails({ overview })}
      ${renderMrDownloaderTable(cachedMrDownloader)}
      ${renderLinkDocumentsSection(cachedMrDownloader)}
      <section class="print-section mr-print-extracts">
        <h2>Downloaded MR Extracts</h2>
        ${(cachedMrDownloader.records || []).map((record) => renderRecord(record, { hideRecordStatus: true, rowLimit: 4 })).join("") || "<p>No MR extracts were returned.</p>"}
      </section>
    </article>
  `;
  document.body.classList.add("print-mode");
  setStatus("Preparing MR printable report...");
  requestAnimationFrame(() => window.print());
}

function printDownloadRtcsReport() {
  if (!cachedDownloadRtcs) {
    setStatus("Download RTCs before printing");
    return;
  }
  const overview = cachedDownloadRtcs.overview || {};
  controls.printOutput.innerHTML = `
    <article class="print-document rtc-print-document">
      <header class="print-title">
        <h1>Download RTCs Report</h1>
        <p>${escapeHtml([overview.village, overview.survey, overview.surnoc, overview.hissa].filter(Boolean).join(" / ") || "Selected land details")}</p>
      </header>
      ${printLandDetails({ overview })}
      ${renderDownloadRtcsTable(cachedDownloadRtcs)}
      <section class="print-section rtc-print-extracts">
        <h2>Downloaded RTCs</h2>
        ${(cachedDownloadRtcs.records || []).map((record) => renderRecord(record, { hideRecordStatus: true, rowLimit: 6 })).join("") || "<p>No RTC documents were returned.</p>"}
      </section>
    </article>
  `;
  document.body.classList.add("print-mode");
  setStatus("Preparing RTC printable report...");
  requestAnimationFrame(() => window.print());
}

function printScanRtcsReport() {
  if (!cachedScanRtcs) {
    setStatus("Scan RTCs before printing");
    return;
  }
  const overview = cachedScanRtcs.overview || {};
  const originalOutput = controls.reportOutput.innerHTML;
  renderScanRtcsReport(cachedScanRtcs);
  const scanHtml = controls.reportOutput.innerHTML;
  controls.reportOutput.innerHTML = originalOutput;
  controls.printOutput.innerHTML = `
    <article class="print-document scan-rtc-print-document">
      <header class="print-title">
        <h1>Scan RTCs Report</h1>
        <p>${escapeHtml([overview.village, overview.survey, overview.surnoc, overview.hissa].filter(Boolean).join(" / ") || "Selected land details")}</p>
      </header>
      <section class="print-section">
        ${scanHtml}
      </section>
    </article>
  `;
  document.body.classList.add("print-mode");
  setStatus("Preparing Scan RTCs printable report...");
  requestAnimationFrame(() => window.print());
}

function printVillageScanReport() {
  if (!cachedVillageScan) {
    setStatus("Fetch Village Scan data before printing");
    return;
  }
  const overview = cachedVillageScan.overview || {};
  const originalOutput = controls.reportOutput.innerHTML;
  renderVillageScanReport(cachedVillageScan);
  const villageHtml = controls.reportOutput.innerHTML;
  controls.reportOutput.innerHTML = originalOutput;
  controls.printOutput.innerHTML = `
    <article class="print-document village-print-document">
      <header class="print-title">
        <h1>Village Scan Report</h1>
        <p>${escapeHtml([overview.village, overview.hobli, overview.taluk, overview.district].filter(Boolean).join(", ") || "Selected village")}</p>
      </header>
      <section class="print-section">
        ${villageHtml}
      </section>
    </article>
  `;
  document.body.classList.add("print-mode");
  setStatus("Preparing Village Scan printable report...");
  requestAnimationFrame(() => window.print());
}

function printDailyMutationsReport() {
  if (!cachedDailyMutations) {
    setStatus("Generate Daily Mutations Report before printing");
    return;
  }
  const overview = cachedDailyMutations.overview || {};
  const originalOutput = controls.reportOutput.innerHTML;
  renderDailyMutationsReport(cachedDailyMutations);
  const reportHtml = controls.reportOutput.innerHTML;
  controls.reportOutput.innerHTML = originalOutput;
  controls.printOutput.innerHTML = `
    <article class="print-document village-print-document">
      <header class="print-title">
        <h1>Daily Mutations Report</h1>
        <p>${escapeHtml([overview.hobli, overview.taluk, overview.district].filter(Boolean).join(", ") || "Selected hobli")}</p>
      </header>
      <section class="print-section">
        ${reportHtml}
      </section>
    </article>
  `;
  document.body.classList.add("print-mode");
  setStatus("Preparing Daily Mutations printable report...");
  requestAnimationFrame(() => window.print());
}

function printKathaValidationReport() {
  if (!cachedKathaValidation) {
    setStatus("Validate Katha before printing");
    return;
  }
  const overview = cachedKathaValidation.overview || {};
  const originalOutput = controls.reportOutput.innerHTML;
  renderKathaValidationReport(cachedKathaValidation);
  const kathaHtml = controls.reportOutput.innerHTML;
  controls.reportOutput.innerHTML = originalOutput;
  controls.printOutput.innerHTML = `
    <article class="print-document katha-print-document">
      <header class="print-title">
        <h1>Katha Validation Report</h1>
        <p>${escapeHtml([overview.village, overview.survey, overview.surnoc, overview.hissa].filter(Boolean).join(" / ") || "Selected land details")}</p>
      </header>
      <section class="print-section">
        ${kathaHtml}
      </section>
    </article>
  `;
  document.body.classList.add("print-mode");
  setStatus("Preparing Katha Validation printable report...");
  requestAnimationFrame(() => window.print());
}

function printScoreCardReport() {
  const state = scoreCardState();
  if (state.step < scoreSections.length) {
    state.step = scoreSections.length;
    state.generatedAt = state.generatedAt || new Date().toISOString();
    renderScoreCard();
  }
  const results = scoreSections.map((item) => ({ ...item, score: scoreSectionResult(item, state.answers) }));
  const overall = Math.round(results.reduce((sum, item) => sum + item.score, 0) / results.length);
  controls.printOutput.innerHTML = `
    <article class="print-document scorecard-print-document">
      <header class="print-title">
        <h1>Land Score Card</h1>
        <p>Manual land due-diligence score report generated on ${escapeHtml(new Date().toLocaleString())}</p>
      </header>
      <section class="print-section">
        ${renderScoreCardReport(state, results, overall)}
      </section>
    </article>
  `;
  document.body.classList.add("print-mode");
  setStatus("Preparing Land Score Card printable report...");
  requestAnimationFrame(() => window.print());
}

function printFeatureWorkspaceReport() {
  renderFeatureWorkspace();
  const featureHtml = controls.reportOutput.innerHTML;
  controls.printOutput.innerHTML = `
    <article class="print-document feature-print-document">
      <header class="print-title">
        <h1>${escapeHtml(activeWorkspace.name)}</h1>
        <p>${escapeHtml(activeWorkspace.hint || "Land validation report generated by Sri SatVam.")}</p>
      </header>
      <section class="print-section">
        ${featureHtml}
      </section>
    </article>
  `;
  document.body.classList.add("print-mode");
  setStatus(`Preparing ${activeWorkspace.name} printable report...`);
  requestAnimationFrame(() => window.print());
}

function printCombinedReport() {
  if (isAutoGenWorkspace()) {
    downloadAutoGenPdf().catch((error) => setStatus(error.message));
    return;
  }
  if (isDailyMutationsWorkspace()) {
    printDailyMutationsReport();
    return;
  }
  if (isScoreCardWorkspace()) {
    printScoreCardReport();
    return;
  }
  if (isFeatureWorkspace()) {
    printFeatureWorkspaceReport();
    return;
  }
  if (isMrDownloaderWorkspace()) {
    printMrDownloaderReport();
    return;
  }
  if (isDownloadRtcsWorkspace()) {
    printDownloadRtcsReport();
    return;
  }
  if (isScanRtcsWorkspace()) {
    printScanRtcsReport();
    return;
  }
  if (isVillageScanWorkspace()) {
    printVillageScanReport();
    return;
  }
  if (isKathaValidationWorkspace()) {
    printKathaValidationReport();
    return;
  }
  if (!cachedReport) {
    setStatus("Fetch data before printing report");
    return;
  }
  controls.printOutput.innerHTML = buildPrintReport();
  document.body.classList.add("print-mode");
  setStatus("Preparing printable report...");
  requestAnimationFrame(() => window.print());
}

async function fetchMrDownloaderData() {
  if (!hasRequiredInputs()) {
    setStatus("Select district, taluk, hobli, village, survey, surnoc and hissa first");
    return;
  }
  setBusy(true);
  setStatus("Fetching MR list and downloading MR extracts...");
  controls.reportOutput.innerHTML = `<div class="loading-card">Fetching Service11 MR list, selecting each MR and preparing previews. This can take some time for surveys with many MRs.</div>`;
  try {
    cachedMrDownloader = await api("/api/mr-downloader", { sessionId, values: values() });
    cachedMrDownloader.fetchedAt = new Date().toISOString();
    renderMrDownloaderReport(cachedMrDownloader);
    const failures = cachedMrDownloader.failures?.length || 0;
    setStatus(failures ? `MR data ready with ${failures} failed item(s)` : "MR data ready");
  } catch (error) {
    cachedMrDownloader = null;
    controls.reportOutput.innerHTML = `<div class="error-card">${escapeHtml(error.message)}</div>`;
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

async function fetchDownloadRtcsData() {
  if (!hasRequiredInputs()) {
    setStatus("Select district, taluk, hobli, village, survey, surnoc and hissa first");
    return;
  }
  setBusy(true);
  setStatus("Downloading unique RTCs...");
  controls.reportOutput.innerHTML = `<div class="loading-card">Fetching current and old RTC details, removing duplicate owner/year states, and capturing official RTC images. This can take some time.</div>`;
  try {
    cachedDownloadRtcs = await api("/api/download-rtcs", { sessionId, values: values() });
    cachedDownloadRtcs.fetchedAt = new Date().toISOString();
    renderDownloadRtcsReport(cachedDownloadRtcs);
    const failures = cachedDownloadRtcs.failures?.length || 0;
    setStatus(failures ? `RTC data ready with ${failures} failed image(s)` : "RTC data ready");
  } catch (error) {
    cachedDownloadRtcs = null;
    controls.reportOutput.innerHTML = `<div class="error-card">${escapeHtml(error.message)}</div>`;
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

async function fetchScanRtcsData() {
  if (!hasRequiredInputs()) {
    setStatus("Select district, taluk, hobli, village, survey, surnoc and hissa first");
    return;
  }
  setBusy(true);
  setStatus("Capturing RTC image portions...");
  controls.reportOutput.innerHTML = `<div class="loading-card">Downloading current and old RTC images and preparing the upper RTC portion from each image. This can take some time.</div>`;
  try {
    cachedScanRtcs = await api("/api/scan-rtcs", { sessionId, values: values() });
    cachedScanRtcs.fetchedAt = new Date().toISOString();
    if (isDownloadRtcsWorkspace()) renderDownloadRtcsReport(cachedDownloadRtcs || cachedScanRtcs.downloadReport || {});
    else renderScanRtcsReport(cachedScanRtcs);
    setStatus(`Scan RTCs ready: ${cachedScanRtcs.scans?.length || 0} RTC image(s) prepared`);
  } catch (error) {
    cachedScanRtcs = null;
    controls.reportOutput.innerHTML = `<div class="error-card">${escapeHtml(error.message)}</div>`;
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

async function fetchVillageScanData() {
  if (!hasRequiredInputs()) {
    setStatus("Select district, taluk, hobli and village first");
    return;
  }
  setBusy(true);
  setStatus("Fetching village-level eChawadi data...");
  controls.reportOutput.innerHTML = `<div class="loading-card">Fetching village-level mutations, land conversions and E-Pouti details from eChawadi...</div>`;
  try {
    cachedVillageScan = await api("/api/village-scan", { sessionId, values: values() });
    cachedVillageScan.fetchedAt = new Date().toISOString();
    renderVillageScanReport(cachedVillageScan);
    setStatus("Village Scan data ready");
  } catch (error) {
    cachedVillageScan = null;
    controls.reportOutput.innerHTML = `<div class="error-card">${escapeHtml(error.message)}</div>`;
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

async function fetchDailyMutationsData() {
  if (!hasRequiredInputs()) {
    setStatus("Select district, taluk and hobli first");
    return;
  }
  setBusy(true);
  setStatus("Generating hobli-level daily mutations report...");
  controls.reportOutput.innerHTML = `<div class="loading-card">Scanning all villages in the selected hobli and fetching eChawadi mutation rows. This can take time for large hoblis.</div>`;
  try {
    cachedDailyMutations = await api("/api/daily-mutations-report", { sessionId, values: values() });
    cachedDailyMutations.fetchedAt = new Date().toISOString();
    setExportAvailability();
    renderDailyMutationsReport(cachedDailyMutations);
    setStatus(`Daily Mutations Report ready: ${cachedDailyMutations.overview?.totalMutations || 0} mutation(s) found`);
  } catch (error) {
    cachedDailyMutations = null;
    controls.reportOutput.innerHTML = `<div class="error-card">${escapeHtml(error.message)}</div>`;
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

async function fetchKathaValidationData() {
  if (!hasRequiredInputs()) {
    setStatus("Select district, taluk, hobli, village, survey, surnoc and hissa first");
    return;
  }
  setBusy(true);
  setStatus("Validating Katha owner details...");
  controls.reportOutput.innerHTML = `<div class="loading-card">Fetching RTC owners, Khatha number and Khatha entries for comparison...</div>`;
  try {
    cachedKathaValidation = await api("/api/katha-validation", { sessionId, values: values() });
    cachedKathaValidation.fetchedAt = new Date().toISOString();
    renderKathaValidationReport(cachedKathaValidation);
    setStatus(cachedKathaValidation.overview?.validationStatus || "Katha validation ready");
  } catch (error) {
    cachedKathaValidation = null;
    controls.reportOutput.innerHTML = `<div class="error-card">${escapeHtml(error.message)}</div>`;
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

async function fetchAllData(event) {
  event.preventDefault();
  if (isAutoGenWorkspace()) {
    await fetchAutoGenReport();
    return;
  }
  if (isDailyMutationsWorkspace()) {
    await fetchDailyMutationsData();
    return;
  }
  if (isMrDownloaderWorkspace()) {
    await fetchMrDownloaderData();
    return;
  }
  if (isDownloadRtcsWorkspace()) {
    await fetchDownloadRtcsData();
    return;
  }
  if (isScanRtcsWorkspace()) {
    await fetchScanRtcsData();
    return;
  }
  if (isVillageScanWorkspace()) {
    await fetchVillageScanData();
    return;
  }
  if (isKathaValidationWorkspace()) {
    await fetchKathaValidationData();
    return;
  }
  if (!hasRequiredInputs()) {
    setStatus("Select district, taluk, hobli, village, survey, surnoc and hissa first");
    return;
  }
  setBusy(true);
  setStatus("Fetching all service data...");
  controls.reportOutput.innerHTML = `<div class="loading-card">Fetching RTC, MR, Khatha, Akarband, eChawadi, ownership and legal data from official services...</div>`;
  try {
    const report = await api("/api/report", { sessionId, values: values() });
    cachedReport = report;
    cachedReport.fetchedAt = cachedReport.generatedAt || new Date().toISOString();
    cachedExportPayload = buildExportPayload(report);
    rememberExportPayload(cachedExportPayload);
    setExportAvailability();
    renderWorkspace();
    setStatus("All service data ready");
    await generateLegalReport();
    await generateClaudeReview();
  } catch (error) {
    cachedReport = null;
    cachedExportPayload = null;
    setExportAvailability();
    controls.reportOutput.innerHTML = `<div class="error-card">${escapeHtml(error.message)}</div>`;
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

async function generateLegalReport() {
  if (!cachedReport) return;
  setStatus("Generating legal report summary...");
  try {
    const payload = cachedExportPayload || buildExportPayload(cachedReport);
    const generated = await api("/api/legal-report", { payload });
    cachedReport = {
      ...cachedReport,
      fullLegalPdfUrl: generated.pdfUrl,
      legalAnalysis: generated.analysis,
      legalReportFilename: generated.filename,
    };
    cachedExportPayload = buildExportPayload(cachedReport);
    rememberExportPayload(cachedExportPayload);
    renderWorkspace();
    setStatus("Legal report summary ready");
  } catch (error) {
    setStatus(`Fetched data ready. Legal report failed: ${error.message}`);
  }
}

async function generateClaudeReview() {
  if (!cachedReport) return;
  setStatus("Generating Claude review...");
  try {
    const payload = cachedExportPayload || buildExportPayload(cachedReport);
    const generated = await api("/api/claude-review", { payload });
    cachedReport = {
      ...cachedReport,
      claudeReview: generated.review,
    };
    cachedExportPayload = buildExportPayload(cachedReport);
    rememberExportPayload(cachedExportPayload);
    renderWorkspace();
    setStatus("Claude review ready");
  } catch (error) {
    setStatus(`Fetched data ready. Claude review failed: ${error.message}`);
  }
}

function buildExportPayload(report) {
  return {
    exportedAt: new Date().toISOString(),
    exportVersion: 1,
    purpose: "Raw fetched Bhoomi service data for AI analysis and PDF legal report generation.",
    landDetails: values(),
    rawFetchedData: report,
  };
}

function exportFilename(payload) {
  const overview = payload.rawFetchedData?.overview || payload.landDetails || {};
  const parts = [
    "ssvd-bhoomi-raw-data",
    overview.district,
    overview.taluk,
    overview.village,
    overview.survey,
    overview.surnoc,
    overview.hissa,
  ].filter(Boolean);
  return `${parts.join("-").replace(/[^a-z0-9_-]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "ssvd-bhoomi-raw-data"}.json`;
}

function reportNameParts() {
  const selected = values();
  const overview = cachedReport?.overview || cachedAutoGenReport?.overview || cachedDailyMutations?.overview || cachedMrDownloader?.overview || cachedDownloadRtcs?.overview || cachedScanRtcs?.overview || cachedVillageScan?.overview || cachedKathaValidation?.overview || {};
  return {
    village: selected.villageLabel || overview.village || "Village",
    survey: selected.survey || overview.survey || "Survey",
    hissa: selected.hissaLabel || selected.hissa || overview.hissa || "Hissa",
  };
}

function savedReportName() {
  const parts = reportNameParts();
  return `${parts.village}_Survey${parts.survey}_${parts.hissa}`
    .replace(/[^a-z0-9._-]+/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "") || "Saved_Land_Report";
}

function collectReportState() {
  return {
    savedAt: new Date().toISOString(),
    appVersion: 2,
    activeWorkspaceId: activeWorkspace.id,
    activeReportId: activeReport.id,
    landDetails: values(),
    reports: currentReportDataStore(),
  };
}

function applySavedReportState(saved) {
  const state = saved?.state || saved;
  if (!state?.reports) throw new Error("Saved report payload is invalid.");
  cachedReport = state.reports.fullLegalReport || null;
  cachedAutoGenReport = state.reports.autoGenReport || null;
  cachedDailyMutations = state.reports.dailyMutations || null;
  cachedMrDownloader = state.reports.mrDownloader || null;
  cachedDownloadRtcs = state.reports.downloadRtcs || null;
  cachedScanRtcs = state.reports.scanRtcs || null;
  cachedVillageScan = state.reports.villageScan || null;
  cachedKathaValidation = state.reports.kathaValidation || null;
  cachedScoreCard = state.reports.scoreCard || null;
  cachedFeatureReports = state.reports.featureReports || {};
  cachedExportPayload = state.reports.exportPayload || (cachedReport ? buildExportPayload(cachedReport) : null);
  loadedSavedReportState = state;
  if (cachedExportPayload) rememberExportPayload(cachedExportPayload);

  const land = state.landDetails || {};
  for (const key of ["survey"]) {
    if (controls[key]) controls[key].value = land[key] || "";
  }
  const workspace = workspaces.find((item) => item.id === state.activeWorkspaceId && hasWorkspaceAccess(item.id));
  if (workspace) activeWorkspace = workspace;
  const report = reports.find((item) => item.id === state.activeReportId);
  if (report) activeReport = report;
  setExportAvailability();
  renderWorkspace();
}

function downloadFromUrl(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "";
  document.body.append(link);
  link.click();
  link.remove();
}

function rememberExportPayload(payload) {
  try {
    localStorage.setItem("ssvd-report-store-last-export", JSON.stringify(payload));
  } catch {
    localStorage.removeItem("ssvd-report-store-last-export");
  }
}

function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function exportData() {
  if (!cachedReport) {
    setStatus("Fetch data before exporting");
    return;
  }
  const payload = cachedExportPayload || buildExportPayload(cachedReport);
  const filename = exportFilename(payload);
  setStatus("Preparing JSON export...");
  try {
    const stored = await api("/api/export-data", { filename, payload });
    payload.applicationExport = stored;
    rememberExportPayload(payload);
    downloadJson(payload, filename);
    setStatus(`Export data ready: ${filename}`);
  } catch (error) {
    downloadJson(payload, filename);
    setStatus(`Downloaded JSON. App copy failed: ${error.message}`);
  }
}

async function saveCurrentReport() {
  const state = collectReportState();
  const name = savedReportName();
  try {
    setStatus(`Saving ${name}...`);
    const saved = await api("/api/saved-reports/save", {
      username: currentUser?.username || "guest",
      name,
      state,
    });
    setStatus(`Saved report: ${saved.name}`);
  } catch (error) {
    setStatus(error.message);
  }
}

async function showSavedReports() {
  try {
    setStatus("Loading saved reports...");
    const result = await api("/api/saved-reports/list", { username: currentUser?.username || "guest" });
    controls.activeReportName.textContent = "Saved Reports";
    controls.menu.innerHTML = "";
    controls.reportOutput.innerHTML = `
      <section class="summary-block saved-reports-panel">
        <div class="section-title"><h3>Saved Reports</h3><span>${result.reports.length} saved item(s)</span></div>
        ${result.reports.length ? `
          <table class="wide-table">
            <thead><tr><th>Report Name</th><th>Saved At</th><th>Village</th><th>Survey</th><th>Hissa</th><th>Action</th></tr></thead>
            <tbody>
              ${result.reports.map((report) => `
                <tr>
                  <td>${escapeHtml(report.name)}</td>
                  <td>${escapeHtml(report.savedAt ? new Date(report.savedAt).toLocaleString() : "-")}</td>
                  <td>${escapeHtml(report.village || "-")}</td>
                  <td>${escapeHtml(report.survey || "-")}</td>
                  <td>${escapeHtml(report.hissa || "-")}</td>
                  <td><button type="button" data-saved-report-id="${escapeAttr(report.id)}">Open</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        ` : `<div class="empty-state"><strong>No saved reports yet</strong><span>Fetch or update a report, then use Save Report.</span></div>`}
      </section>
    `;
    setStatus("Saved reports loaded");
  } catch (error) {
    setStatus(error.message);
  }
}

async function openSavedReport(reportId) {
  try {
    setStatus("Opening saved report...");
    const saved = await api("/api/saved-reports/load", { username: currentUser?.username || "guest", id: reportId });
    applySavedReportState(saved);
    setStatus(`Opened saved report: ${saved.name}`);
  } catch (error) {
    setStatus(error.message);
  }
}

async function downloadCurrentReportFolder() {
  const state = collectReportState();
  const name = savedReportName();
  try {
    setStatus("Preparing report ZIP folder...");
    const archive = await api("/api/saved-reports/archive", {
      username: currentUser?.username || "guest",
      name,
      state,
    });
    downloadFromUrl(archive.downloadUrl, archive.filename);
    setStatus(`Downloaded folder: ${archive.filename}`);
  } catch (error) {
    setStatus(error.message);
  }
}

for (const field of ["district", "taluk", "hobli", "village", "surnoc", "hissa", "period"]) {
  controls[field].addEventListener("change", () => selectField(field));
}

controls.survey.addEventListener("input", () => {
  controls.survey.value = controls.survey.value.replace(/\D/g, "").slice(0, 4);
  clearCachedReport();
  if (currentState) restoreDisabled(currentState);
});
controls.go.addEventListener("click", loadSurnoc);
controls.form.addEventListener("submit", fetchAllData);
controls.exportData.addEventListener("click", exportData);
controls.saveReport.addEventListener("click", saveCurrentReport);
controls.savedReports.addEventListener("click", showSavedReports);
controls.downloadFolder.addEventListener("click", downloadCurrentReportFolder);
controls.print.addEventListener("click", printCombinedReport);
controls.mainMenuButton.addEventListener("click", (event) => {
  event.stopPropagation();
  if (controls.mainMenuPanel.hidden) openMainMenu();
  else closeMainMenu();
});
controls.adminButton.addEventListener("click", () => {
  const adminWorkspace = workspaces.find((workspace) => workspace.id === "admin");
  if (adminWorkspace) activateWorkspace(adminWorkspace);
});
controls.portalStatusOk.addEventListener("click", hidePortalStatusPopup);
controls.reportOutput.addEventListener("click", handleAdminAction);
document.addEventListener("click", (event) => {
  if (!controls.mainMenuPanel.hidden && !controls.mainMenuPanel.contains(event.target) && event.target !== controls.mainMenuButton) {
    closeMainMenu();
  }
});
window.addEventListener("afterprint", () => {
  document.body.classList.remove("print-mode");
  controls.printOutput.innerHTML = "";
  if (cachedMrDownloader && isMrDownloaderWorkspace()) {
    setStatus("MR data ready");
    return;
  }
  if (cachedDownloadRtcs && isDownloadRtcsWorkspace()) {
    setStatus("RTC data ready");
    return;
  }
  if (cachedScanRtcs && isScanRtcsWorkspace()) {
    setStatus("Scan RTCs ready");
    return;
  }
  if (cachedVillageScan && isVillageScanWorkspace()) {
    setStatus("Village Scan data ready");
    return;
  }
  if (cachedDailyMutations && isDailyMutationsWorkspace()) {
    setStatus("Daily Mutations Report ready");
    return;
  }
  if (cachedKathaValidation && isKathaValidationWorkspace()) {
    setStatus(cachedKathaValidation.overview?.validationStatus || "Katha validation ready");
    return;
  }
  if (cachedReport) setStatus("Report ready");
});
controls.logout.addEventListener("click", () => {
  clearCurrentUser();
  showLoggedIn(false);
  resetLandSelectors();
  setStatus("Logged out");
});

controls.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const result = await api("/api/auth/login", {
      username: controls.username.value.trim(),
      password: controls.password.value,
    });
    customNotice = result.notice || customNotice;
    renderCustomNotice();
    saveCurrentUser(result.user);
    controls.loginError.textContent = "";
    showLoggedIn(true);
    renderWorkspace();
    if (usesLandDetails()) await start();
    else setStatus(activeWorkspace.status || "Ready");
  } catch (error) {
    controls.loginError.textContent = error.message || "Invalid user name or password.";
  }
});

controls.showRegister.addEventListener("click", () => {
  controls.loginForm.hidden = true;
  controls.registerForm.hidden = false;
  controls.registerMessage.textContent = "";
  controls.registerName.focus();
});

controls.showLogin.addEventListener("click", () => {
  controls.registerForm.hidden = true;
  controls.loginForm.hidden = false;
  controls.loginError.textContent = "";
  controls.username.focus();
});

controls.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  controls.registerMessage.textContent = "";
  try {
    const result = await api("/api/register", {
      name: controls.registerName.value.trim(),
      phone: controls.registerPhone.value.trim(),
      email: controls.registerEmail.value.trim(),
    });
    controls.registerMessage.textContent = result.message || "Registration submitted. Admin approval is required.";
    controls.registerForm.reset();
  } catch (error) {
    controls.registerMessage.textContent = error.message;
  }
});

await loadPublicState();
renderWorkspaceMenu();
renderWorkspace();
setExportAvailability();
try {
  const savedUser = JSON.parse(localStorage.getItem("ssvd-report-store-user") || "null");
  if (savedUser?.username) {
    saveCurrentUser(savedUser);
    showLoggedIn(true);
    renderWorkspace();
    if (usesLandDetails()) await start();
    else setStatus(activeWorkspace.status || "Ready");
  } else {
    showLoggedIn(false);
  }
} catch {
  clearCurrentUser();
  showLoggedIn(false);
}
