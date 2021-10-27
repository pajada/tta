import { fileURLToPath } from "url";
import cheerio from "cheerio";
import fs from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const $ = cheerio.load(
  fs.readFileSync(path.join(__dirname, "test-data/test-1.html"))
);

$("table.tournaments-games .details-container").each((ix, el) =>
  console.log($(el).html())
);
