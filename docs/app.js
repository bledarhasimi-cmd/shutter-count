const rawExtensions = new Set([
  "3fr", "ari", "arw", "bay", "cr2", "cr3", "crw", "dcr", "dng", "erf", "fff", "gpr",
  "iiq", "k25", "kdc", "mef", "mos", "mrw", "nef", "nrw", "orf", "pef", "raf", "raw",
  "rw2", "rwl", "sr2", "srf", "srw", "x3f"
]);

const totalTags = [
  "ShutterCount", "Shutter Count", "Image Count", "ImageCount", "Camera Actuations",
  "Camera Actuations Count", "Actuations", "Shutter Releases", "Image Number",
  "File Number", "Canon File Number", "CameraInfo Unknown 0x0d29"
];

const mechanicalTags = [
  "MechanicalShutterCount", "Mechanical Shutter Count", "Mechanical Shutter",
  "Mechanical Shutter Release Count", "Mechanical Shutter Releases",
  "MechanicalShutterReleaseCount"
];

const electronicTags = [
  "ElectronicShutterCount", "Electronic Shutter Count", "Electronic Shutter",
  "Electronic Shutter Release Count", "Electronic Shutter Releases",
  "ElectronicShutterReleaseCount", "Silent Shooting Count", "SilentShootingCount"
];

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const dropTitle = document.getElementById("dropTitle");
const clearButton = document.getElementById("clearButton");
const resultsBody = document.getElementById("resultsBody");
const fileCount = document.getElementById("fileCount");
const readCount = document.getElementById("readCount");
const foundCount = document.getElementById("foundCount");

fileInput.addEventListener("change", () => analyzeFiles([...fileInput.files]));
clearButton.addEventListener("click", resetResults);

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("is-dragging");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  analyzeFiles([...event.dataTransfer.files]);
});

async function analyzeFiles(files) {
  const rawFiles = files.filter(isRawFile);
  const rejected = files.length - rawFiles.length;

  if (!rawFiles.length) {
    renderRows([{ fileName: "-", status: "Zgjidh vetem RAW files.", rejected: true }]);
    updateSummary(files.length, 0, 0);
    clearButton.disabled = false;
    return;
  }

  dropTitle.textContent = rawFiles.length === 1 ? rawFiles[0].name : `${rawFiles.length} RAW files`;
  renderRows(rawFiles.map((file) => ({ fileName: file.name, status: "Duke lexuar..." })));
  updateSummary(rawFiles.length + rejected, 0, 0);
  clearButton.disabled = false;

  const results = [];
  for (const file of rawFiles) {
    results.push(await analyzeFile(file));
    renderRows(results.concat(rawFiles.slice(results.length).map((pending) => ({
      fileName: pending.name,
      status: "Ne pritje..."
    }))));
    updateSummary(rawFiles.length + rejected, results.length, results.filter(hasAnyShutterCount).length);
  }
}

async function analyzeFile(file) {
  try {
    if (!window.ExifReader) {
      throw new Error("ExifReader nuk u ngarkua.");
    }

    const tags = await ExifReader.load(file, { expanded: false });
    const total = pickTag(tags, totalTags);
    const mechanical = pickTag(tags, mechanicalTags);
    const electronic = pickTag(tags, electronicTags);
    const camera = pickTag(tags, ["Model", "Camera Model Name", "Make"]);
    const status = total || mechanical || electronic
      ? "U gjet metadata"
      : "Nuk u gjet shutter count ne metadata";

    return {
      fileName: file.name,
      camera: camera?.value || "-",
      total: total?.value || "-",
      mechanical: mechanical?.value || "-",
      electronic: electronic?.value || "-",
      status,
      tagNames: [total?.name, mechanical?.name, electronic?.name].filter(Boolean).join(", ")
    };
  } catch (error) {
    return {
      fileName: file.name,
      camera: "-",
      total: "-",
      mechanical: "-",
      electronic: "-",
      status: error?.message || "Nuk u lexua dot RAW file"
    };
  }
}

function pickTag(tags, names) {
  const normalizedNames = names.map(normalize);
  for (const [name, tag] of Object.entries(tags)) {
    const normalized = normalize(name);
    if (!normalizedNames.includes(normalized)) continue;
    const value = extractValue(tag);
    if (value !== "") return { name, value };
  }

  for (const [name, tag] of Object.entries(tags)) {
    const normalized = normalize(name);
    if (!normalizedNames.some((candidate) => normalized.includes(candidate))) continue;
    const value = extractValue(tag);
    if (value !== "") return { name, value };
  }

  return null;
}

function extractValue(tag) {
  const raw = tag?.description ?? tag?.value ?? tag;
  if (Array.isArray(raw)) return raw.join(", ");
  if (raw === undefined || raw === null) return "";
  return String(raw).trim();
}

function normalize(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isRawFile(file) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return rawExtensions.has(ext || "");
}

function hasAnyShutterCount(result) {
  return result.total !== "-" || result.mechanical !== "-" || result.electronic !== "-";
}

function renderRows(results) {
  resultsBody.innerHTML = "";
  for (const result of results) {
    const row = document.createElement("tr");
    if (result.rejected) row.className = "warning";
    row.innerHTML = `
      <td>${escapeHtml(result.fileName)}</td>
      <td>${escapeHtml(result.camera || "-")}</td>
      <td>${escapeHtml(result.total || "-")}</td>
      <td>${escapeHtml(result.mechanical || "-")}</td>
      <td>${escapeHtml(result.electronic || "-")}</td>
      <td title="${escapeHtml(result.tagNames || "")}">${escapeHtml(result.status || "-")}</td>
    `;
    resultsBody.appendChild(row);
  }
}

function updateSummary(files, read, found) {
  fileCount.textContent = String(files);
  readCount.textContent = String(read);
  foundCount.textContent = String(found);
}

function resetResults() {
  fileInput.value = "";
  dropTitle.textContent = "Zgjidh ose terhiq RAW files ketu";
  clearButton.disabled = true;
  updateSummary(0, 0, 0);
  resultsBody.innerHTML = '<tr><td colspan="6" class="empty">Asnje file i zgjedhur.</td></tr>';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
