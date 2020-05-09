var players = {};
var start = 1;
var allParks = [77, 79, 494, 615, 277, 609];
allParks.forEach(function(aPark) {
    for (var start = 0; start < 31; start++) { 
        jsork.park.getAttendance(aPark, new Date("04/" + start + "/2020")).then(
            function(attendance) {
                if (attendance.length > 0) {
                    attendance.forEach(function(persona) {
                        if (!players[persona.Persona]) { players[persona.Persona] = 0; }
                        players[persona.Persona]++;
                    });
                }
            }
        );
    }
});
var results = [];
// Wait until above has completed. 

Object.keys(players).forEach(function(aKey) { results.push({player: aKey, times: players[aKey]}); });
results.sort(function(a, b) { return b.times - a.times });
