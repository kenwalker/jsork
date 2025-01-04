var sixthLevelCount = JSON.parse('[{"Class":"Anti-Paladin","Count":0},{"Class":"Archer","Count":0},{"Class":"Assassin","Count":0},{"Class":"Barbarian","Count":0},{"Class":"Bard","Count":0},{"Class":"Color","Count":0},{"Class":"Druid","Count":0},{"Class":"Healer","Count":0},{"Class":"Monk","Count":0},{"Class":"Monster","Count":0},{"Class":"Paladin","Count":0},{"Class":"Peasant","Count":0},{"Class":"Reeve","Count":0},{"Class":"Scout","Count":0},{"Class":"Warrior","Count":0},{"Class":"Wizard","Count":0}]');;
var startID = 1;
var endID = 174540;
endID = 200;
var currentID = startID;
var lastConsole = -1000;

function doNextID() {
    if (currentID > (lastConsole + 10)) {
        console.log("On " + currentID);
        lastConsole = currentID;
    }
    if (currentID > endID) {
        console.log("Done");
        return;
    }
    jsork.player.getClasses(currentID).then(function(allClasses) {
        allClasses.forEach(aClass => {
            if (aClass.level >= 6) {
                var foundClass = sixthLevelCount.find(function(checkClass) { return checkClass.Class === aClass.class });
                if (foundClass) {
                    foundClass.Count++;
                }
            }
        });
        currentID++;
        doNextID();
    });
}
doNextID();
