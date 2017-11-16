# jsork

## (Pronounced J-Sork) JSON APIs to the Amtgard ORK ##

This is work in progress so not all APIs have been implemented yet.

Additionally, read-only APIs will be coming first.

There's a requirement for [jQuery](https://jquery.com/download/) to be present.  There is a copy in the
lib directory of this project.

So at a minimum you need the Jsork APIs and jQuery loaded in your page as follows:

```javascript
  <script src="lib/jquery.min.js"></script>
  <script src="jsork-min.js"></script>
```

If you're developing you can use the non-minified version to debug if necessary.


The APIs are grouped into categores like _kingdom_, _park_, _player_, etc.  To use the API you
get to it through the global _jsork_ namespace.

All the API calls take whatever arguments are required plus a callback that will be invoked with a single parameter that is the data from the call.

```javascript
jsork.kingdom.getKingdoms(function (data) {
    console.log("There are " + data.length + " Kingdoms in Amtgard")}
};
```

Would print out _There are 26 Kingdoms in Amtgard_

```javascript
jsork.player.getInfo(43232, function(data) {
    console.log("Ken's persona is " + data.Persona);}
);
```
Would print out _Ken's persona is Lord Kismet Shenchu_

Some APIs have additional parameters like getting a players awards.  You can ask for them all using _jsork.awardIDs.ALL_ or like the following example just as for the one you want.

```javascript
jsork.player.getAwards(43232, jsork.awardIDs.ORDER_OF_THE_SMITH, function(data) {
    console.log("Ken has " + data.length + " Orders of the Smith");}
);
```

Would print out _Ken has 3 Orders of the Smith_

## More examples to come ##

This page has the APIs loaded in it so you can open up the console and try them.