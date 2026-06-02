import { readFile } from "node:fs/promises";
import { csvParse, autoType } from "d3-dsv";

const csv = await readFile("src/data/ebay.csv", "utf8");
const rows = csvParse(csv, autoType);

process.stdout.write(JSON.stringify(rows));
