const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INPUT_DIR = path.join(ROOT, "assets", "json");
const OUTPUT_DIR = path.join(ROOT, "assets", "csv", "vehicle-catalog");

const TABLES = [
  {
    name: "vehicleMakes",
    sourceFile: "vehicleMakes.json",
    outputFile: "vehicleMakes.csv",
    columns: ["make_id", "make_name", "make_slug", "country_of_origin"],
    requiredOutput: ["make_id", "make_name", "make_slug"],
    map: (row) => ({
      make_id: row.makeId ?? "",
      make_name: row.makeName ?? "",
      make_slug: row.makeSlug ?? "",
      country_of_origin: row.countryOfOrigin ?? "",
    }),
    sortBy: ["make_name", "make_id"],
  },
  {
    name: "vehicleModels",
    sourceFile: "vehicleModels.json",
    outputFile: "vehicleModels.csv",
    columns: [
      "model_id",
      "make_id",
      "model_name",
      "model_slug",
      "model_year",
      "is_hybrid",
      "is_electric",
      "powertrain_type",
    ],
    requiredOutput: ["model_id", "make_id", "model_name", "model_slug", "model_year", "powertrain_type"],
    map: (row) => ({
      model_id: row.modelId ?? "",
      make_id: row.makeId ?? "",
      model_name: row.modelName ?? "",
      model_slug: row.modelSlug ?? "",
      model_year: row.modelYear ?? "",
      is_hybrid: row.isHybrid ?? false,
      is_electric: row.isElectric ?? false,
      powertrain_type: row.powertrainType ?? "",
    }),
    sortBy: ["model_name", "model_year", "model_id"],
  },
  {
    name: "vehicleTrims",
    sourceFile: "vehicleTrims.json",
    outputFile: "vehicleTrims.csv",
    columns: ["trim_id", "model_id", "trim_name", "trim_slug"],
    requiredOutput: ["trim_id", "model_id", "trim_name", "trim_slug"],
    map: (row) => ({
      trim_id: row.trimId ?? "",
      model_id: row.modelId ?? "",
      trim_name: row.trimName ?? "",
      trim_slug: row.trimSlug ?? slugify(row.trimName ?? ""),
    }),
    sortBy: ["model_id", "trim_name", "trim_id"],
  },
  {
    name: "vehicleEngines",
    sourceFile: "vehicleEngines.json",
    outputFile: "vehicleEngines.csv",
    columns: [
      "engine_spec_id",
      "model_id",
      "model_year",
      "engine_code",
      "cylinder_count",
      "is_diesel",
      "is_hybrid",
      "is_electric",
      "powertrain_type",
    ],
    requiredOutput: ["engine_spec_id", "model_id", "model_year", "powertrain_type"],
    map: (row) => ({
      engine_spec_id: row.engineSpecId ?? "",
      model_id: row.modelId ?? "",
      model_year: row.modelYear ?? "",
      engine_code: row.engineCode ?? "",
      cylinder_count: row.cylinderCount ?? "",
      is_diesel: row.isDiesel ?? "",
      is_hybrid: row.isHybrid ?? false,
      is_electric: row.isElectric ?? false,
      powertrain_type: row.powertrainType ?? "",
    }),
    sortBy: ["model_id", "model_year", "engine_spec_id"],
  },
  {
    name: "vehicleTransmissions",
    sourceFile: "vehicleTransmissions.json",
    outputFile: "vehicleTransmissions.csv",
    columns: ["transmission_spec_id", "model_id", "model_year", "transmission_type"],
    requiredOutput: ["transmission_spec_id", "model_id", "model_year", "transmission_type"],
    map: (row) => ({
      transmission_spec_id: row.transmissionSpecId ?? "",
      model_id: row.modelId ?? "",
      model_year: row.modelYear ?? "",
      transmission_type: row.transmissionType ?? "",
    }),
    sortBy: ["model_id", "model_year", "transmission_spec_id"],
  },
  {
    name: "vehicleFluids",
    sourceFile: "vehicleFluids.json",
    outputFile: "vehicleFluids.csv",
    columns: ["fluid_spec_id", "model_id", "model_year", "engine_oil_type", "engine_oil_sump"],
    requiredOutput: ["fluid_spec_id", "model_id", "model_year"],
    map: (row) => ({
      fluid_spec_id: row.fluidSpecId ?? "",
      model_id: row.modelId ?? "",
      model_year: row.modelYear ?? "",
      engine_oil_type: row.engineOilType ?? "",
      engine_oil_sump: row.engineOilSump ?? "",
    }),
    sortBy: ["model_id", "model_year", "fluid_spec_id"],
  },
];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(rows, columns) {
  const header = columns.join(",");
  const body = rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")).join("\n");
  return `${header}\n${body}${body ? "\n" : ""}`;
}

function safeReadJson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return Array.isArray(parsed) ? parsed : [];
}

function sortRows(rows, sortBy) {
  return rows.slice().sort((a, b) => {
    for (const key of sortBy) {
      const av = a[key] ?? "";
      const bv = b[key] ?? "";
      if (av === bv) continue;
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
    }
    return 0;
  });
}

function validateRequired(mappedRows, config) {
  const failures = [];
  mappedRows.forEach((row, index) => {
    const missing = (config.requiredOutput || []).filter(
      (key) => row[key] === null || row[key] === undefined || row[key] === ""
    );
    if (missing.length > 0) {
      failures.push({ table: config.name, index, missing });
    }
  });
  return failures;
}

function validateRelations(mappedByTable) {
  const makeIds = new Set(mappedByTable.vehicleMakes.map((r) => r.make_id));
  const modelIds = new Set(mappedByTable.vehicleModels.map((r) => r.model_id));
  const issues = [];

  for (const row of mappedByTable.vehicleModels) {
    if (row.make_id && !makeIds.has(row.make_id)) {
      issues.push(`vehicleModels: missing make_id ${row.make_id}`);
    }
  }
  for (const row of mappedByTable.vehicleTrims) {
    if (row.model_id && !modelIds.has(row.model_id)) {
      issues.push(`vehicleTrims: missing model_id ${row.model_id}`);
    }
  }
  for (const row of mappedByTable.vehicleEngines) {
    if (row.model_id && !modelIds.has(row.model_id)) {
      issues.push(`vehicleEngines: missing model_id ${row.model_id}`);
    }
  }
  for (const row of mappedByTable.vehicleTransmissions) {
    if (row.model_id && !modelIds.has(row.model_id)) {
      issues.push(`vehicleTransmissions: missing model_id ${row.model_id}`);
    }
  }
  for (const row of mappedByTable.vehicleFluids) {
    if (row.model_id && !modelIds.has(row.model_id)) {
      issues.push(`vehicleFluids: missing model_id ${row.model_id}`);
    }
  }

  return issues;
}

function main() {
  ensureDir(OUTPUT_DIR);

  const mappedByTable = {};
  const missingFiles = [];
  const requiredFailures = [];
  const summary = [];

  for (const config of TABLES) {
    const sourcePath = path.join(INPUT_DIR, config.sourceFile);
    const sourceRows = safeReadJson(sourcePath);
    if (!fs.existsSync(sourcePath)) {
      missingFiles.push(config.sourceFile);
    }

    const mappedRows = sortRows(sourceRows.map(config.map), config.sortBy);
    requiredFailures.push(...validateRequired(mappedRows, config));
    mappedByTable[config.name] = mappedRows;

    const csv = toCsv(mappedRows, config.columns);
    const outputPath = path.join(OUTPUT_DIR, config.outputFile);
    fs.writeFileSync(outputPath, csv, "utf8");
    summary.push({ table: config.name, csv: config.outputFile, rows: mappedRows.length });
  }

  const relationIssues = validateRelations(mappedByTable);
  console.log("Vehicle catalog CSV export complete.");
  for (const item of summary) {
    console.log(`${item.table}: ${item.rows} row(s) -> assets/csv/vehicle-catalog/${item.csv}`);
  }
  if (missingFiles.length > 0) {
    console.log(`Missing JSON sources (exported as header-only CSV): ${missingFiles.join(", ")}`);
  }
  if (requiredFailures.length > 0) {
    console.log(`Validation warning: ${requiredFailures.length} required-field issue(s) found.`);
    for (const issue of requiredFailures.slice(0, 20)) {
      console.log(`- ${issue.table}[${issue.index}] missing: ${issue.missing.join(", ")}`);
    }
  }
  if (relationIssues.length > 0) {
    console.log(`Validation warning: ${relationIssues.length} relation issue(s) found.`);
    for (const issue of relationIssues.slice(0, 20)) {
      console.log(`- ${issue}`);
    }
  }
}

main();
