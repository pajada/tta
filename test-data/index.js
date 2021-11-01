"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var cheerio_1 = __importDefault(require("cheerio"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
/**
 * Extracts all the games from a batch
 */
function parseBatch(elem, $) {
    var allGames = [];
    $(".card", elem).each(function (_ix, card) {
        $(".details-container", card).each(function (_ix, det) {
            var _a;
            var tds = $("td", det);
            var name = $(".editable-text-label", tds.eq(0))
                .text()
                .replace(/\s+/gi, " ");
            var match = (_a = tds
                .eq(1)
                .html()) === null || _a === void 0 ? void 0 : _a.match(/session-code(&quot;|")>(\w+)<\/span>/);
            var replayCode = match ? match[2] : "";
            var scores = [];
            $("div", tds.eq(2)).each(function (_ix, el) {
                scores.push($(el)
                    .text()
                    .replace(/\s+/g, " ")
                    .trim()
                    .replace("TIMED OUT", "TIMED_OUT")
                    .split(" "));
            });
            var date = $(tds.eq(3))
                .text()
                .replace(/\s+/g, " ")
                .replace("finished", "")
                .trim();
            allGames.push({
                name: name,
                replayCode: replayCode,
                scores: scores,
                date: date,
            });
        });
    });
    return allGames;
}
function extractRaw(file) {
    var $ = cheerio_1.default.load(fs_1.default.readFileSync(path_1.default.join(__dirname, file)));
    var batch = 0;
    var parsed = [];
    while (1) {
        var elem = $("#batch" + batch);
        if (elem.length) {
            parsed = parsed.concat(parseBatch(elem, $));
        }
        else {
            break;
        }
        batch += 1;
    }
    return parsed;
}
var scoring = {
    3: { 1: 5, 2: 2, 3: 0 },
    4: { 1: 6, 2: 3, 3: 1, 4: 0 },
};
function processRaw(parsed) {
    var result = {};
    var _loop_1 = function (item) {
        var _a = item.name.match(/\s(\w+)\s(\d+)\sgame\s(\d+)/), _ = _a[0], le = _a[1], gr = _a[2], ga = _a[3];
        var league = le.toLowerCase();
        var groupNumber = parseInt(gr, 10);
        var gameNumber = parseInt(ga, 10);
        result[league] = result[league] || {};
        var group = (result[league][groupNumber] = result[league][groupNumber] || {
            number: groupNumber,
            games: [],
            standings: [],
        });
        var game = {
            name: "Game " + gameNumber,
            code: item.replayCode,
            date: item.date,
            scores: item.scores.map(function (score) {
                var player = score.length === 2 ? score[0] : score[1];
                var points = score.length === 2 ? score[1] : parseInt(score[2], 10);
                return {
                    player: player,
                    score: points === "TIMED_OUT"
                        ? "TIMED OUT"
                        : points,
                };
            }),
        };
        game.scores.forEach(function (score, index) {
            var standing = group.standings.find(function (s) { return s.player === score.player; });
            if (!standing) {
                group.standings.push((standing = { player: score.player, points: 0 }));
            }
            if (score.score === "TIMED OUT") {
                // No points for timing out
                return;
            }
            // Find all players that have the same score, resignations included
            // Take their ranking and then assign and divide points
            var shared = game.scores
                .map(function (sc, ix) { return (sc.score === score.score ? ix + 1 : 0); })
                .filter(function (rank) { return rank; });
            standing.points +=
                shared.reduce(function (acc, rank) { return acc + scoring[game.scores.length][rank]; }, 0) / shared.length;
        });
        group.games.push(game);
    };
    for (var _i = 0, parsed_1 = parsed; _i < parsed_1.length; _i++) {
        var item = parsed_1[_i];
        _loop_1(item);
    }
    return result;
}
var r = processRaw(extractRaw("international-season-14.html"));
console.log(JSON.stringify(r, null, 2));
// processRaw(extractRaw("test-data/intermezzo-season-11.html").slice(4, 5));
