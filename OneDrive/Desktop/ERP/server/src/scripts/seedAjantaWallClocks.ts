import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { connectDb } from "../config/db.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { productFingerprint } from "../utils/productFields.js";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = join(__dirname, "../data/ajanta-wall-clocks.csv");

type Row = { brand: string; modelNumber: string; colorVariant: string };

function parseCsv(content: string): Row[] {
  const lines = content.trim().split(/\r?\n/).slice(1);
  const rows: Row[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (!line.trim()) continue;
    const comma1 = line.indexOf(",");
    const comma2 = line.indexOf(",", comma1 + 1);
    if (comma1 < 0 || comma2 < 0) continue;

    const brand = line.slice(0, comma1).trim();
    const modelNumber = line.slice(comma1 + 1, comma2).trim();
    const colorVariant = line.slice(comma2 + 1).trim().replace(/\|/g, " / ");

    const key = productFingerprint({
      category: "Wall Clocks",
      brand,
      modelNumber,
      colorVariant
    });
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({ brand, modelNumber, colorVariant });
  }
  return rows;
}

const rows = parseCsv(readFileSync(csvPath, "utf8"));

await connectDb();

let inserted = 0;
let skipped = 0;
const errors: string[] = [];

for (const row of rows) {
  const duplicateKey = productFingerprint({
    category: "Wall Clocks",
    brand: row.brand,
    modelNumber: row.modelNumber,
    colorVariant: row.colorVariant
  });

  const exists = await InventoryItem.findOne({ duplicateKey });
  if (exists) {
    skipped++;
    continue;
  }

  try {
    await InventoryItem.create({
      category: "Wall Clocks",
      brand: row.brand,
      modelNumber: row.modelNumber,
      colorVariant: row.colorVariant,
      purchasePrice: 0,
      sellingPrice: 0,
      currentStock: 0,
      minimumStock: 5,
      batteryType: "",
      accessoryType: "",
      strapType: "",
      watchDisplay: "",
      supplierName: "Ajanta",
      duplicateKey
    });
    inserted++;
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) {
      skipped++;
    } else {
      errors.push(`${row.modelNumber} — ${(err as Error).message}`);
    }
  }
}

console.log(`Ajanta Wall Clocks seed complete`);
console.log(`  Parsed (unique): ${rows.length}`);
console.log(`  Inserted:        ${inserted}`);
console.log(`  Skipped:         ${skipped}`);
if (errors.length) {
  console.log(`  Errors:          ${errors.length}`);
  errors.slice(0, 10).forEach((e) => console.log(`    - ${e}`));
}

process.exit(0);
