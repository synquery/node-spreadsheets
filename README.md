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
    Email: *your google account email*,
    Passwd: *password*
        
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
var spreadsheet = list[ *spreadsheet key* ];
spreadsheet.worksheet(function(err, sheets) {
    if(err))
        // handle error
    var worksheet = sheets[ *worksheet key* ];
});
```
