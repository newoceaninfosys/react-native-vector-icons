/*
1. Convert ttf to svg: https://everythingfonts.com/ttf-to-svg
2. Get list of glyph-name from tff
3. Get unicode string by glyph-name from svg file
4. Map glyph-name and unicode string to json map
*/

var fs = require('fs');
var opentype  = require('opentype.js');
var xml2js = require('xml2js');

function formatUnicode(unicode) {
    unicode = unicode.toString(16);
    if (unicode.length > 4) {
        return ("000000" + unicode.toUpperCase()).substr(-6)
    } else {
        return ("0000" + unicode.toUpperCase()).substr(-4)
    }
}

function writeFile(data, fontName){
    fs.writeFile("./glyphmaps/" + fontName + ".json", JSON.stringify(data), function(err) {
        if(err) {
            return console.log('Failed to write file', err);
        }

        console.log("Parsed " + fontName + " Successful!");
    }); 
}

function convertToGlyphmaps(glyphs, map, fontName) {
    const result = {};

    Object.keys(map).forEach(function(key, idx) {
        var g = glyphs.find(function(g) { return 'uni' + g.name === key });
        if(g) {
            result[map[key]] = g.unicode;
        }
    });

    writeFile(result, fontName);
}

function parse(fontName){
    opentype.load('./Fonts/' + fontName + '.ttf', function(err, font) {
        if (err) {
            console.log(err);
            return;
        }

        var glyphs = [];

        for (var i = 0 ; i < font.numGlyphs; i++){
            var glyph = font.glyphs.get(i);
            if(glyph.unicodes.length > 0) {
                var u = glyph.unicodes[0]
                var glyphName = formatUnicode(u);
                if(/^E/.test(glyphName)){
                    glyphs.push({
                        unicode: u,
                        name: glyphName
                    });
                }
            }
        }

        var parser = new xml2js.Parser();
        fs.readFile('./Fonts/' + fontName + '.svg', function(err, data) {
            parser.parseString(data, function (err, result) {
                try {
                    var map = {};
                    for(var i = 0; i < result.svg.defs[0].font[0].glyph.length; i++){
                        var glyph = result.svg.defs[0].font[0].glyph[i];
                        var gName = glyph.$['glyph-name'];
                        if(/^uni/.test(gName)){
                            map[gName] = glyph.$['unicode'];
                        }
                    }
                    convertToGlyphmaps(glyphs, map, fontName);
                } catch(e){
                    console.log('Failed to parse SVG');
                }
            });
        });
    });
}


fs.readdir('./Fonts', (err, files) => {
  files.forEach(file => {
    if(/\.ttf$/.test(file)) {
        var fileName = file.substring(0, file.lastIndexOf('.'));
        if(fs.existsSync('./Fonts/' + fileName + '.svg')) {
            parse(fileName);
        }
    }
  });
})
