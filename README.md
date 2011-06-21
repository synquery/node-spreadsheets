node-spreadsheets
=

An adaptor for Google Spreadsheets API.

Install
-

    npm install spreadsheets


Usage
-

require `spreadsheets`

```js
var authenticate = require("spreadsheets");

```

authenticate with Google Client Login & get your spreadsheets list

```js
authenticate({
    Email: your email for google account,
    Passwd: password
        
}, function(err, spreadsheets) {
    if(err)
        // handle error
    spreadsheets.list(function(err, list) {
        if(err)
            // handle error
        ........
    });
});
```

choose a spreadsheet and a worksheet

```js
var spreadsheet = list[ spreadsheet key ];
spreadsheet.worksheet(function(err, sheets) {
    if(err))
        // handle error
    var worksheet = sheets[ *worksheet key* ];
});
```

get cells and change value

```js
worksheet.cell({
    "min-row": 2,
    "min-col": 4,
    "max-col": 4
    
}, function(err, cells) {
    if(err)
        // handle error
    var cell = cells[ cell key ]; // for example R3C4
    
    cell.changeValue("any value", function(err) {
        if(err)
            // handle error
        ......
    });
});
```

change styles

```js
worksheet.style({
    scol: 2,
    ecol: 3,
    srow: 2,
    erow: 4

}, function(err, style) {
    if(err)
        // handle error
    style.color("#ff0000", function() {});
    style.bgColor("#ff0000", function() {});
    style.fontsize("10pt", function() {});
    style.align("right", function() {});
});
```

Dependency
=
* [node-jQuery](https://github.com/praized/node-jquery)

