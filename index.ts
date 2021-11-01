import cheerio from "cheerio";
import fs from "fs";
import path from "path";

type RawParsed = {
  name: string;
  replayCode: string;
  scores: string[][];
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

type League =
  | "wood"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "master"
  | "grandmaster";

type Group = {
  number: number;
  games: Game[];
  standings: Standing[];
};

type Game = {
  name: string;
  code: string;
  date: string;
  scores: { player: string; score: number | "RESIGNED" | "TIMED OUT" }[];
};

type Standing = {
  player: string;
  points: number;
};

const scoring: { [key: number]: { [key: number]: number } } = {
  3: { 1: 5, 2: 2, 3: 0 },
  4: { 1: 6, 2: 3, 3: 1, 4: 0 },
};

function processRaw(parsed: RawParsed[]) {
  const result: { [key in League]?: { [key: number]: Group } } = {};

  for (let item of parsed) {
    const [_, le, gr, ga] = item.name.match(/\s(\w+)\s(\d+)\sgame\s(\d+)/)!;

    const league = le.toLowerCase() as League;
    const groupNumber = parseInt(gr, 10);
    const gameNumber = parseInt(ga, 10);

    result[league] = result[league] || {};

    const group = (result[league]![groupNumber] = result[league]![
      groupNumber
    ] || {
      number: groupNumber,
      games: [],
      standings: [],
    });

    const game = {
      name: `Game ${gameNumber}`,
      code: item.replayCode,
      date: item.date,
      scores: item.scores.map((score) => {
        const player = score.length === 2 ? score[0] : score[1];
        const points = score.length === 2 ? score[1] : parseInt(score[2], 10);
        return {
          player,
          score:
            points === "TIMED_OUT"
              ? "TIMED OUT"
              : (points as number | "RESIGNED" | "TIMED OUT"),
        };
      }),
    };

    game.scores.forEach((score, index) => {
      let standing = group.standings.find((s) => s.player === score.player);
      if (!standing) {
        group.standings.push((standing = { player: score.player, points: 0 }));
      }

      if (score.score === "TIMED OUT") {
        // No points for timing out
        return;
      }

      // Find all players that have the same score, resignations included
      // Take their ranking and then assign and divide points
      const shared = game.scores
        .map((sc, ix) => (sc.score === score.score ? ix + 1 : 0))
        .filter((rank) => rank);

      standing.points +=
        shared.reduce(
          (acc, rank) => acc + scoring[game.scores.length][rank],
          0
        ) / shared.length;
    });

    group.games.push(game);
  }

  return result;
}

const r = processRaw(extractRaw("test-data/international-season-14.html"));

console.log(JSON.stringify(r, null, 2));

// processRaw(extractRaw("test-data/intermezzo-season-11.html").slice(4, 5));
