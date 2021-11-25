// Javascript for parsing the audit log JSON
// Put the following in index.html to load the report then paste the rest of this into lastsignin.js
// <script src="assets/js/report.json"></script>


var stringResults = "";
var runAudit = function() {
  var allReports = report.slice(1, 11);
  allReports = report;
  allReports.forEach(function(anAudit) {
    switch (anAudit.method_call) {
      case "Player::UpdatePlayer":
        updatePlayerChanges(anAudit);
        break;
      case "Player::AddAward":
        addAwardChanges(anAudit);
        break;
      case "Player::MovePlayer":
        movePlayer(anAudit);
        break;
      case "Player::RemoveAward":
        removeAward(anAudit);
        break;
      case "Attendance::RemoveAttendance":
        removeAttendance(anAudit);
          break;
      default: 
        // console.log(anAudit.method_call);
    }
  });
}

var removeAttendance = function(anAudit) {
  var changedFields = JSON.parse(anAudit.parameters);
  var priorFields = JSON.parse(anAudit.prior_state);
  var output = "";
  output += moment(anAudit.modified_at).toString() + " Remove attendance credits " + priorFields.credits + " from " + priorFields.date + " of player " + priorFields.mundane_id;
  console.log(output);  
  stringResults += output + "\r\n\r\n";
}

var removeAward = function(anAudit) {
  var changedFields = JSON.parse(anAudit.parameters);
  var priorFields = JSON.parse(anAudit.prior_state);
  var output = "";
  output += moment(anAudit.modified_at).toString() + " Remove award " + priorFields.awards_id + " given on " + priorFields.date + " to " + priorFields.mundane_id;
  console.log(output);  
  stringResults += output + "\r\n\r\n";
}

var movePlayer = function(anAudit) {
  var changedFields = JSON.parse(anAudit.parameters);
  var priorFields = JSON.parse(anAudit.prior_state);
  var output = "";
  output += moment(anAudit.modified_at).toString() + " Move player " + changedFields.MundaneId + " park " + changedFields.ParkId;
  console.log(output);  
  stringResults += output + "\r\n\r\n";
}

var addAwardChanges = function(anAudit) {
  var changedFields = JSON.parse(anAudit.parameters);
  console.log(changedFields);
  var output = "";
  output += moment(anAudit.modified_at).toString() + " recipient " + changedFields.RecipientId + " ";
  output += "add award KingdomAwardId: " + changedFields.KingdomAwardId + " ";
  output += "rank: " + changedFields.Rank;
  console.log(output);
  stringResults += output + "\r\n\r\n";
}


var updatePlayerChanges = function(anAudit) {
  // var anAudit = report[0];
  var priorFields = JSON.parse(anAudit.prior_state);
  var changedFields = JSON.parse(anAudit.parameters);
  var showID = true;
  delete(changedFields.Token);
  delete(priorFields.Token);
  delete(changedFields.HasImage);
  delete(priorFields.HasImage);
  priorFields.Active = parseInt(priorFields.Active);
  priorFields.Restricted = parseInt(priorFields.Restricted);
  priorFields.HasImage = parseInt(priorFields.HasImage);
  priorFields.Waivered = priorFields.Waivered === 1 ? true : false;
  changedFields.Heraldry = priorFields.Heraldry;
  changedFields.Image = priorFields.Image;
  changedFields.Waiver = priorFields.Waiver;
  priorFields.WaiverMimeType = '';
  priorFields.ImageMimeType = '';
  priorFields.HeraldryMimeType = '';

  Object.keys(changedFields).forEach(function(aField) {
    if (changedFields[aField] !== undefined && priorFields[aField] !== undefined && changedFields[aField] !== priorFields[aField]) {
      if (showID) {
        stringResults += moment(anAudit.modified_at).toString() + " changing " + anAudit.entity_id + " (" + priorFields.UserName + ")\r\n";
        console.log(moment(anAudit.modified_at).toString() + " changing " + anAudit.entity_id + " (" + priorFields.UserName + ")");
        showID = false;
      }
      if (aField === "Password") {
        console.log("Change Password");
        stringResults += "Change Password\r\n";
      } else {
        stringResults += aField + " from " + priorFields[aField] + " to " + changedFields[aField] + '\r\n';
        console.log(aField + " from " + priorFields[aField] + " to " + changedFields[aField]);
      }
    }
  });
  if (!showID) {
    stringResults += "\r\n";
  }
}

setTimeout(runAudit, 10);
