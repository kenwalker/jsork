jsork.player.getLastAttendance(43232).then(function(attendance) {
  var signedInText = "For example, Kismet last played " + attendance[0].ClassName + " on " +  attendance[0].Date + " at " + attendance[0].ParkName + " in " +  attendance[0].KingdomName + ".";
  $(".kismetsignin").text(signedInText);
})