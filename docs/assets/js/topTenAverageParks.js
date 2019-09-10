function startUp() {
  jsork.kingdom.getKingdoms().then(function(kingdoms) {
    var numLeft = kingdoms.length;
    var allResults = [];
    kingdoms.forEach(function(kingdom) {
      jsork.kingdom.parkAverages(kingdom.KingdomId).then(function(results) {
        results.forEach(function(park) {
          park.KingdomName = kingdom.KingdomName;
          park.KingdomId = kingdom.KingdomId;
        });
        allResults = allResults.concat(results);
        if (--numLeft === 0) {
          allResults.sort(function(a, b) {
            return b.AttendanceCount - a.AttendanceCount;
          });
          displayResults(allResults);
        }
      });
    });
  });
}

function displayResults(allResults) {
  var i = 1;
  while (i <= 10) {
    var averagesHTMLLine = '<tr>';
    averagesHTMLLine = averagesHTMLLine + '<td> ' + i + '</td>';
    averagesHTMLLine = averagesHTMLLine + '<td> ' + (allResults[i - 1].AttendanceCount / 26).toFixed(2) + '</td>';
    averagesHTMLLine = averagesHTMLLine + '<td> ' + allResults[i - 1].ParkName + '</td>';
    averagesHTMLLine = averagesHTMLLine + '<td> ' + allResults[i - 1].KingdomName + '</td>';
    averagesHTMLLine = averagesHTMLLine + '</tr> ';
    $('#topTenTable').append(averagesHTMLLine);
    i++;
  }
  $('.working').attr('hidden', true);
  $('.allresults').attr('hidden', false);
}

$(document).ready(function() {
  startUp();
});