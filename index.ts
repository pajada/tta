import cheerio from "cheerio";
import fs from "fs";
import path from "path";

type RawParsed = {
  name: string;
  replayCode: string;
  results: string[][];
  date: string;
};

/**
 * Extracts all the games from a batch
 */
function parseBatch(elem: cheerio.Cheerio, $: cheerio.Root) {
  const allGames: RawParsed[] = [];

  $(".card", elem).each((_ix, card) => {
    $(".details-container", card).each((_ix, det) => {
      const tds = $("td", det);
      const name = $(".editable-text-label", tds.eq(0))
        .text()
        .replace(/\s+/gi, " ");

      const match = tds
        .eq(1)
        .html()
        ?.match(/session-code(&quot;|")>(\w+)<\/span>/);
      const replayCode = match ? match[2] : "";

      const scores: string[][] = [];
      $("div", tds.eq(2)).each((_ix, el) => {
        scores.push(
          $(el)
            .text()
            .replace(/\s+/g, " ")
            .trim()
            .replace("TIMED OUT", "TIMED_OUT")
            .split(" ")
        );
      });

      const date = $(tds.eq(3))
        .text()
        .replace(/\s+/g, " ")
        .replace("finished", "")
        .trim();

      allGames.push({
        name,
        replayCode,
        scores,
        date,
      });
    });
  });

  return allGames;
}

function extractRaw(file: string) {
  const $ = cheerio.load(fs.readFileSync(path.join(__dirname, file)));

  let batch = 0;
  let parsed: RawParsed[] = [];
  while (1) {
    const elem = $("#batch" + batch);
    if (elem.length) {
      parsed = parsed.concat(parseBatch(elem, $));
    } else {
      break;
    }
    batch += 1;
  }

  return parsed;
}

type League = {
  division: number;
  games: Game[];
  standings: Score[];
};

{
  master: [
    {
      division: 1,
      games: [
        {
          name: "Game 1",
          code: "BLABLA",
          result: [
            { player: "red", score: 225 },
            { player: "blue", score: "RESIGNED" },
            { player: "green", score: "TIMED OUT" },
          ],
          finished: "ISO-DATE",
        },
      ],
      standing: [
        { player: "red", points: 24.5 },
        { player: "yellow", points: 37.2 },
        { player: "blue", points: 11.5 },
        { player: "green", points: 8.5 },
      ],
    },
  ];
}

function processRaw(parsed: RawParsed[]) {}

console.log(extractRaw("test-data/international-season-14.html").length);
