var allKingdoms = [];

function startUp() {
    jsork.kingdom.getKingdoms().then(function(kingdoms) {
        allKingdoms = kingdoms;
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