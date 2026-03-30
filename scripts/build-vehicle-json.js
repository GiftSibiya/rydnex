const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_SQL = path.join(ROOT, "apiuatmichanicco_uat.sql");
const OUTPUT_DIR = path.join(ROOT, "assets", "json");
const MAKE_COMPAT_PATH = path.join(OUTPUT_DIR, "vehicleMakes.json");
const UUID_NAMESPACE = "f6f59f6e-084b-4b96-b3a5-b23f6f380dc7";

function parseUuidToBytes(uuid) {
  const hex = uuid.replace(/-/g, "");
  return Buffer.from(hex, "hex");
}

function bytesToUuid(bytes) {
  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

function uuidv5(name, namespace = UUID_NAMESPACE) {
  const ns = parseUuidToBytes(namespace);
  const hash = crypto.createHash("sha1").update(ns).update(name, "utf8").digest();
  const out = Buffer.from(hash.slice(0, 16));
  out[6] = (out[6] & 0x0f) | 0x50;
  out[8] = (out[8] & 0x3f) | 0x80;
  return bytesToUuid(out);
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function canonical(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function cleanString(value) {
  if (value == null) return null;
  const cleaned = String(value).replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.length ? cleaned : null;
}

function parseSqlValue(token) {
  const t = token.trim();
  if (!t.length) return null;
  if (t.toUpperCase() === "NULL") return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return t;
}

function splitTupleValues(tuple) {
  const values = [];
  let buf = "";
  let inQuote = false;
  let escaped = false;

  for (let i = 0; i < tuple.length; i += 1) {
    const ch = tuple[i];

    if (escaped) {
      if (ch === "r") buf += "\r";
      else if (ch === "n") buf += "\n";
      else if (ch === "t") buf += "\t";
      else buf += ch;
      escaped = false;
      continue;
    }

    if (inQuote && ch === "\\") {
      escaped = true;
      continue;
    }

    if (ch === "'") {
      inQuote = !inQuote;
      continue;
    }

    if (ch === "," && !inQuote) {
      values.push(parseSqlValue(buf));
      buf = "";
      continue;
    }

    buf += ch;
  }

  if (buf.length || tuple.endsWith(",")) {
    values.push(parseSqlValue(buf));
  }

  return values;
}

function parseValuesBlock(valuesBlock) {
  const rows = [];
  let i = 0;

  while (i < valuesBlock.length) {
    const ch = valuesBlock[i];
    if (ch !== "(") {
      i += 1;
      continue;
    }

    let inQuote = false;
    let escaped = false;
    let depth = 1;
    let j = i + 1;
    let tuple = "";

    while (j < valuesBlock.length && depth > 0) {
      const c = valuesBlock[j];

      if (escaped) {
        tuple += `\\${c}`;
        escaped = false;
        j += 1;
        continue;
      }

      if (inQuote && c === "\\") {
        escaped = true;
        j += 1;
        continue;
      }

      if (c === "'") {
        inQuote = !inQuote;
        tuple += c;
        j += 1;
        continue;
      }

      if (!inQuote) {
        if (c === "(") depth += 1;
        else if (c === ")") depth -= 1;
      }

      if (depth > 0) tuple += c;
      j += 1;
    }

    rows.push(splitTupleValues(tuple));
    i = j;
  }

  return rows;
}

function extractCarsRows(sql) {
  const rows = [];
  const insertStart = "INSERT INTO `cars`";
  let cursor = 0;

  while (true) {
    const start = sql.indexOf(insertStart, cursor);
    if (start === -1) break;

    const openParen = sql.indexOf("(", start);
    const closeParen = sql.indexOf(")", openParen);
    const columnsRaw = sql.slice(openParen + 1, closeParen);
    const columns = columnsRaw
      .split(",")
      .map((c) => c.replace(/`/g, "").trim())
      .filter(Boolean);

    const valuesPos = sql.indexOf("VALUES", closeParen);
    const blockStart = valuesPos + "VALUES".length;

    let i = blockStart;
    let inQuote = false;
    let escaped = false;
    while (i < sql.length) {
      const ch = sql[i];
      if (escaped) {
        escaped = false;
      } else if (inQuote && ch === "\\") {
        escaped = true;
      } else if (ch === "'") {
        inQuote = !inQuote;
      } else if (!inQuote && ch === ";") {
        break;
      }
      i += 1;
    }

    const valuesBlock = sql.slice(blockStart, i);
    const tuples = parseValuesBlock(valuesBlock);

    for (const tuple of tuples) {
      if (tuple.length !== columns.length) continue;
      const item = {};
      for (let idx = 0; idx < columns.length; idx += 1) {
        item[columns[idx]] = tuple[idx];
      }
      rows.push(item);
    }

    cursor = i + 1;
  }

  return rows;
}

function readExistingMakeMetadata() {
  if (!fs.existsSync(MAKE_COMPAT_PATH)) return new Map();

  try {
    const makes = JSON.parse(fs.readFileSync(MAKE_COMPAT_PATH, "utf8"));
    const map = new Map();
    for (const item of makes) {
      const makeName = item?.makeName || item?.name;
      if (!makeName) continue;
      map.set(canonical(makeName), {
        slug: item.makeSlug || item.slug || item.id || null,
        country: item.countryOfOrigin || item.country || "",
      });
    }
    return map;
  } catch {
    return new Map();
  }
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeJson(fileName, payload) {
  fs.writeFileSync(path.join(OUTPUT_DIR, fileName), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function validateRelations({
  makesArr,
  modelsArr,
  trimsArr,
  enginesArr,
  transmissionsArr,
  fluidsArr,
}) {
  const makeIds = new Set(makesArr.map((m) => m.makeId));
  const modelIds = new Set(modelsArr.map((m) => m.modelId));

  const missingModelMake = modelsArr.filter((m) => !makeIds.has(m.makeId));
  const missingTrimModel = trimsArr.filter((t) => !modelIds.has(t.modelId));
  const missingEngineModel = enginesArr.filter((e) => !modelIds.has(e.modelId));
  const missingTransModel = transmissionsArr.filter((t) => !modelIds.has(t.modelId));
  const missingFluidModel = fluidsArr.filter((f) => !modelIds.has(f.modelId));

  const failures = [
    missingModelMake.length,
    missingTrimModel.length,
    missingEngineModel.length,
    missingTransModel.length,
    missingFluidModel.length,
  ].reduce((acc, n) => acc + n, 0);

  if (failures > 0) {
    throw new Error(
      [
        `Integrity validation failed (${failures} issues)`,
        `models without make: ${missingModelMake.length}`,
        `trims without model: ${missingTrimModel.length}`,
        `engines without model: ${missingEngineModel.length}`,
        `transmissions without model: ${missingTransModel.length}`,
        `fluids without model: ${missingFluidModel.length}`,
      ].join("\n")
    );
  }
}

function buildData(rawRows) {
  const existingMakeMeta = readExistingMakeMetadata();

  const makes = new Map();
  const models = new Map();
  const trims = new Map();
  const engines = new Map();
  const transmissions = new Map();
  const fluids = new Map();

  for (const row of rawRows) {
    const makeName = cleanString(row.model_make_id);
    const modelName = cleanString(row.model_name);
    const trimName = cleanString(row.model_trim) || "Unspecified";
    const yearNum = Number(row.model_year);
    const maxYear = new Date().getFullYear() + 1;

    if (!makeName || !modelName || !Number.isFinite(yearNum) || yearNum < 1886 || yearNum > maxYear) {
      continue;
    }

    const makeKey = canonical(makeName);
    const modelKey = canonical(modelName);
    const trimKey = canonical(trimName);

    if (!makes.has(makeKey)) {
      const existing = existingMakeMeta.get(makeKey);
      const fallbackSlug = slugify(makeName);
      const slug = existing?.slug || fallbackSlug;
      makes.set(makeKey, {
        makeId: uuidv5(`make:${makeKey}`),
        makeName: makeName,
        makeSlug: slug,
        countryOfOrigin: existing?.country || "",
      });
    }

    const make = makes.get(makeKey);
    const modelComposite = `${makeKey}|${modelKey}|${yearNum}`;
    if (!models.has(modelComposite)) {
      const modelId = uuidv5(`model:${make.makeId}:${modelKey}:${yearNum}`);
      models.set(modelComposite, {
        modelId,
        makeId: make.makeId,
        makeKey,
        modelName,
        modelSlug: slugify(modelName),
        modelYear: yearNum,
        isHybrid: false,
        isElectric: false,
        powertrainType: "ice",
      });
    }

    const model = models.get(modelComposite);
    const trimComposite = `${makeKey}|${modelKey}|${yearNum}|${trimKey}`;
    if (!trims.has(trimComposite)) {
      trims.set(trimComposite, {
        trimId: uuidv5(`trim:${model.modelId}:${trimKey}`),
        modelId: model.modelId,
        modelComposite,
        trimName,
        trimSlug: slugify(trimName),
      });
    }

    const engineNumber = cleanString(row.enginenumber);
    const cylinders =
      row.cylinders == null || row.cylinders === "" || Number.isNaN(Number(row.cylinders))
        ? null
        : Number(row.cylinders);
    const dieselFlag =
      row.DieselFlag == null || row.DieselFlag === "" || Number.isNaN(Number(row.DieselFlag))
        ? null
        : Number(row.DieselFlag);
    const engineSig = `${model.modelId}|${yearNum}|${engineNumber || ""}|${cylinders ?? ""}|${dieselFlag ?? ""}`;
    if (!engines.has(engineSig) && (engineNumber || cylinders != null || dieselFlag != null)) {
      const isDiesel = dieselFlag == null ? null : dieselFlag === 1;
      engines.set(engineSig, {
        engineSpecId: uuidv5(`engine:${engineSig}`),
        modelId: model.modelId,
        modelYear: yearNum,
        engineCode: engineNumber || null,
        cylinderCount: cylinders,
        isDiesel,
        isHybrid: false,
        isElectric: false,
        powertrainType: "ice",
      });
    }

    const transmissionType = cleanString(row.transmission_type);
    if (transmissionType) {
      const transSig = `${model.modelId}|${yearNum}|${transmissionType}`;
      if (!transmissions.has(transSig)) {
        transmissions.set(transSig, {
          transmissionSpecId: uuidv5(`trans:${transSig}`),
          modelId: model.modelId,
          modelYear: yearNum,
          transmissionType,
        });
      }
    }

    const oilType = cleanString(row.oilType);
    const oilSump = cleanString(row.oilSamp);
    if (oilType || oilSump) {
      const fluidSig = `${model.modelId}|${yearNum}|${oilType || ""}|${oilSump || ""}`;
      if (!fluids.has(fluidSig)) {
        fluids.set(fluidSig, {
          fluidSpecId: uuidv5(`fluid:${fluidSig}`),
          modelId: model.modelId,
          modelYear: yearNum,
          engineOilType: oilType || null,
          engineOilSump: oilSump || null,
        });
      }
    }
  }

  const makesArr = Array.from(makes.values()).sort((a, b) => a.makeName.localeCompare(b.makeName));
  const modelsArr = Array.from(models.values())
    .map(({ makeKey, ...rest }) => rest)
    .sort(
      (a, b) =>
        a.modelName.localeCompare(b.modelName) ||
        b.modelYear - a.modelYear ||
        a.makeId.localeCompare(b.makeId)
    );
  const trimsArr = Array.from(trims.values())
    .map(({ modelComposite, ...rest }) => rest)
    .sort((a, b) => a.trimName.localeCompare(b.trimName) || a.modelId.localeCompare(b.modelId));
  const enginesArr = Array.from(engines.values()).sort(
    (a, b) => a.modelId.localeCompare(b.modelId) || a.modelYear - b.modelYear
  );
  const transmissionsArr = Array.from(transmissions.values()).sort((a, b) =>
    a.modelId.localeCompare(b.modelId) || a.modelYear - b.modelYear
  );
  const fluidsArr = Array.from(fluids.values()).sort(
    (a, b) => a.modelId.localeCompare(b.modelId) || a.modelYear - b.modelYear
  );

  return {
    makesArr,
    modelsArr,
    trimsArr,
    enginesArr,
    transmissionsArr,
    fluidsArr,
  };
}

function main() {
  const sqlPath = process.argv[2] ? path.resolve(ROOT, process.argv[2]) : DEFAULT_SQL;
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`SQL file not found: ${sqlPath}`);
  }

  ensureDir(OUTPUT_DIR);
  const sql = fs.readFileSync(sqlPath, "utf8");
  const rows = extractCarsRows(sql);
  if (!rows.length) {
    throw new Error("No rows found in INSERT INTO `cars` statements.");
  }

  const data = buildData(rows);
  validateRelations(data);

  // Relational JSON outputs (no `.rel.json` siblings).
  writeJson("vehicleMakes.json", data.makesArr);
  writeJson("vehicleModels.json", data.modelsArr);
  writeJson("vehicleTrims.json", data.trimsArr);
  writeJson("vehicleEngines.json", data.enginesArr);
  writeJson("vehicleTransmissions.json", data.transmissionsArr);
  writeJson("vehicleFluids.json", data.fluidsArr);

  // Ensure we don't generate legacy years file.
  const compatYearsPath = path.join(OUTPUT_DIR, "vehicleYears.json");
  if (fs.existsSync(compatYearsPath)) {
    fs.rmSync(compatYearsPath);
  }

  console.log(`Parsed ${rows.length} source rows.`);
  console.log(`Makes: ${data.makesArr.length}`);
  console.log(`Models: ${data.modelsArr.length}`);
  console.log(`Trims: ${data.trimsArr.length}`);
}

main();
