var results = [];
var allParks;
var currentPark;
var currentResult;
var currentMonarch;
var currentPM;
var stringResults = "";

jsork.kingdom.getParks(8).then(function(parks) {
    allParks = parks;
    doNextPark();
});

function doNextPark(){
    // debugger;
    if (allParks.length === 0) {
        done();
        return;
    }
    var aPark = allParks.pop();
    if (aPark.Active === "Retired") {
        doNextPark();
        return;
    }
    currentPark = {};
    results.push(currentPark);
    // debugger;
    currentPark.ParkName = aPark.Name;
    jsork.park.getOfficers(aPark.ParkId).then(function(officers) {
        currentMonarch = officers.find(function(anOfficer) { return anOfficer.OfficerRole === "Monarch" });
        currentPM = officers.find(function(anOfficer) { return anOfficer.OfficerRole === "Prime Minister" });
        getMonarchInfo();
    });
}

function getMonarchInfo() {
    if (!currentMonarch || currentMonarch.MundaneId === null) {
        currentPark.Monarch = "No Monarch Set\t";
        getPMInfo();
        return;
    }
    jsork.player.getInfo(currentMonarch.MundaneId).then(function(aPlayer) {
        // debugger;
        currentPark.Monarch = aPlayer.UserName + "\t" + (aPlayer.Email ? aPlayer.Email : "No Email");
        getPMInfo();
    });
}

function getPMInfo() {
    if (!currentPM || currentPM.MundaneId === null) {
        currentPark.PM = "No PM Set\t";
        doNextPark();
        return;
    }
    jsork.player.getInfo(currentPM.MundaneId).then(function(aPlayer) {
        currentPark.PM = aPlayer.UserName + "\t" + (aPlayer.Email ? aPlayer.Email : "No Email");
        doNextPark();
    });
}

function done() {
    results.reverse();
    stringResults += "Park\tMonarch\tMonarch email\tPM\tPM Email\r\n";
    results.forEach(function(aPark) {
        stringResults += aPark.ParkName + "\t" + aPark.Monarch + "\t" + aPark.PM + "\r\n";
    })
    console.log("done");
}
