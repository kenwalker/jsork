var activeParks = [];
var parksToOutput = [];
var today = moment();
var twoYearsAgo = moment(today).subtract(24, 'months');;
var output = "Freehold\tLast Attendance\tDays Inactive\tAttendance Last Two Years\t"
output += "This report was run on " + today.format("YYYY-MM-DD");
output += "\r\n";

var getParkAttendance = function() {
    if (activeParks.length === 0) {
        displayResults();
        return;
    }
    $('.working').text('Number of Freeholds left to check ' + activeParks.length);
    var nextPark = activeParks.pop();
    jsork.park.getAllAttendance(nextPark.ParkId).then(function(attendances) {
        attendances.reverse();
        var lastTwoYears = attendances.filter(function(anAttendance) { return moment(anAttendance.Date) > twoYearsAgo });
        nextPark.lastTwoYears = lastTwoYears;
        if (attendances.length === 0) {
            nextPark.LastSignin = "1900-01-01";
        } else {
            nextPark.LastSignin = attendances[attendances.length - 1].Date;
        }
        parksToOutput.push(nextPark);
        getParkAttendance();
    });
}

function startUp() {
    jsork.kingdom.getParks(8).then(function(allParks) {
        // allParks = allParks.slice(1, 12);
        allParks.forEach(function(aPark) {
            if (aPark.Active === "Active") {
                activeParks.push(aPark);
            }
        });
        getParkAttendance();
    });            
}

function displayResults() {
    parksToOutput.sort(function (a, b) {
        return a.Name.toLowerCase().localeCompare(b.Name.toLowerCase());
    });

    parksToOutput.forEach(function(nextPark){
        var parkHTMLLine = '<tr>';
        parkHTMLLine += '<td><a href="https://ork.amtgard.com/orkui/index.php?Route=Park/index/' + nextPark.ParkId + '" target="_blank">' + nextPark.Name + '</a></td>';
        output += nextPark.Name + "\t";
        parkHTMLLine += '<td> ' + nextPark.LastSignin + '</td>';
        output += nextPark.LastSignin + "\t";
        var difference = moment(today).diff(moment(nextPark.LastSignin), 'days');
        if (nextPark.LastSignin === "1900-01-01") {
            difference = "999999";
        }
        parkHTMLLine += '<td> ' + difference + '</td>';
        output += difference + "\t";
        parkHTMLLine += '<td> ' + nextPark.lastTwoYears.length + '</td>';
        output += nextPark.lastTwoYears.length;
        parkHTMLLine += '</tr>';
        output += "\r\n";
        $('#freeholdActivity').append(parkHTMLLine);
    });
  $('.generateddate').text('Generated on ' + new Date().toDateString());
  $('.working').attr('hidden', true);
  $('.allresults').attr('hidden', false);
}

copyResultsToClipboard = function() {
    var el = document.createElement('textarea');
    el.value = output;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

$(document).ready(function() {
  startUp();
});