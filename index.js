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
            var replayCode = match && match[2];
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
console.log(extractRaw("test-data/international-season-14.html").length);
