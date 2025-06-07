var allKingdoms = [];

function startUp() {
    jsork.kingdom.getKingdoms().then(function(kingdoms) {
        allKingdoms = kingdoms;
        allKingdoms.sort(function (kingdomA, kingdomB) {
            var a = kingdomA.KingdomName;
            var b = kingdomB.KingdomName;
            if (a.startsWith("Kingdom of the ")) {
                a = a.slice("Kingdom of the ".length)
            }
            if (a.startsWith("The Kingdom of the ")) {
                a = a.slice("The Kingdom of the ".length)
            }
            if (a.startsWith("The Empire of the ")) {
                a = a.slice("The Empire of the ".length)
            }
            if (a.startsWith("The Kingdom of ")) {
                a = a.slice("The Kingdom of ".length)
            }
            if (a.startsWith("The Principality of the ")) {
                a = a.slice("The Principality of the ".length)
            }
            if (a.startsWith("The ")) {
                a = a.slice("The ".length)
            }
            if (b.startsWith("Kingdom of the ")) {
                b = b.slice("Kingdom of the ".length)
            }
            if (b.startsWith("The Kingdom of the ")) {
                b = b.slice("The Kingdom of the ".length)
            }
            if (b.startsWith("The Empire of the ")) {
                b = b.slice("The Empire of the ".length)
            }
            if (b.startsWith("The Kingdom of ")) {
                b = b.slice("The Kingdom of ".length)
            }
            if (b.startsWith("The Principality of the ")) {
                b = b.slice("The Principality of the ".length)
            }
            if (b.startsWith("The ")) {
                b = b.slice("The ".length)
            }
            return b.toLowerCase().localeCompare(a.toLowerCase());
        });
        nextKingdom();
    });
}

function nextKingdom() {
    if (allKingdoms.length === 0) {
        done();
        return;
    }
    var aKingdom = allKingdoms.pop();
    jsork.kingdom.getParks(aKingdom.KingdomId).then(function(kingdomParks) {
        kingdomParks.sort(function (a, b) {
            return a.Name.toLowerCase().localeCompare(b.Name.toLowerCase());
        });
        kingdomParks.forEach(function(aPark) {
            var abbreviationsHTMLLine = '<tr>';
            abbreviationsHTMLLine += '<td> ' + aKingdom.KingdomName || '' + '</td>';
            abbreviationsHTMLLine += '<td> ' + (aPark.Name === null ? '' : aPark.Name) + '</td>';
            abbreviationsHTMLLine += '<td> ' + aKingdom.Abbreviation + ":" + aPark.Abbreviation + '</td>';
            abbreviationsHTMLLine += "</tr>";
            $('#abbreviationsTable').append(abbreviationsHTMLLine);
        });
        nextKingdom();
    });
}

function done() {
    $('.working').attr('hidden', true);
    $('.allresults').attr('hidden', false);
}

$(document).ready(function() {
  startUp();
});