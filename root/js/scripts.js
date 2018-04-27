var currentTest = null;
var currentAssignmentIndex = 0;
var maxAssignmentIndex = 0;
var currentAssignmentSolution = [];
var aktivita = null;

function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      var result = decodeURIComponent(pair[1]);
      currentTest = result;
      currentAssignmentIndex = 0;
      return result
    }
  }
}

function getTest(testName) {
  var content = document.getElementById('assignment');
  if (content != null) {
    content.outerHTML = "";
  }
  if (testName == null) {
    testName = currentTest;
  }

  $.ajax({
    url: "tests/" + testName + ".json",
    type: "GET",
    dataType: "json",
    success: function(data) {
        $('div.container').remove();
        $('body').append('<div class="container"><div class="row"><h1 class="col-lg-12 text-center nunito"><a href="index" class="btn btn-link" style="text-decoration: none; font-size: 1em;">Žiacky mód</a></h1></div> <div class="row"  id="ziak_test"> <canvas id="canvas" style="background: beige; width: 100%; overflow-x: scroll">Váš prehliadač nepodporuje element Canvas</canvas> </div></div>');
        maxAssignmentIndex = data.assignments.length - 1;
        getAssignment(data.assignments[currentAssignmentIndex].name);
    }
  });
}

function getAssignment(assignment) {
  $.ajax({
    url: "assignments/" + assignment,
    type: "GET",
    dataType: "json",
    success: function(data) {

        var img = new Image();

        img.onload = function(){

            console.log("IN GET ASSIGNEMENT ");
            console.log(img);
            console.log(img.url);
            console.log("W:" + img.naturalWidth + " H:" + img.naturalHeight);

            drawAssignment(data, img.naturalHeight, img.naturalWidth);
        };

        var path = "file-upload/" + data.path + "/";

        var maxW = 0;
        var maxH = 0;
        for(var i = 0; i < data.cards.length; i++){
            img.src = path + data.cards[i];
            if(img.naturalHeight > maxH) maxH = img.naturalHeight;
            if(img.naturalWidth > maxW) maxW = img.naturalWidth;
        }
        console.log("MAX DIMENSIONS: ");
        console.log("W: " + maxW);
        console.log("H: " + maxH);

    }
  });
}

function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  while (0 !== currentIndex) {

    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function drawAssignment(test, maxImageHeight, maxImageWidth){

    var cesta = "file-upload/" + test.path + "/";
    var cards = [];

    currentAssignmentSolution = test.cards.slice();

    test.cards = shuffle(test.cards); //pre rozne zadania

    var nav = $('<div />', {
        "id": "navigation",
        "class": "row"
    });

    var left = $('<a />', {
        "class": "btn btn-success pull-left",
        "type": "button",
        "onclick": "currentAssignmentIndex--; if (currentAssignmentIndex < 0) {currentAssignmentIndex = maxAssignmentIndex}; getTest()"
    });
    left.wrapInner("<span class='glyphicon glyphicon-chevron-left'></span>");

    var right = $('<a />', {
        "class": "btn btn-success pull-right",
        "type": "button",
        "onclick": "currentAssignmentIndex++; if (currentAssignmentIndex > maxAssignmentIndex) {currentAssignmentIndex = 0}; getTest()"
    });
    right.wrapInner("<span class='glyphicon glyphicon-chevron-right'></span>");

    nav.append(left);
    nav.append(right);

    var row = $('<div />', {
        "id": 'assignment',
        "exercise_type": test.type,
        "class": "row"
    });
    row.append(nav);

    var header = $('<h2 />');
    header.css({
        "font-weight": "bold"
    });
    header.text(test.name);

    row.append(header);

    var text = $('<h2 />');
    text.text(test.text);

    row.append(text);

    var typ = $('<h3 />');
    typZadania = '';
    if (test.type == 'exchange') {
        typZadania = "Kartičky môžeš medzi sebou ľubovoľne prehadzovať.";
    } else if (test.type == 'drag') {
        typZadania = "Ťahaj kartičky zo zadania do výsledného usporiadania.";
    } else if (test.type == 'restricted') {
        typZadania = "Môžes prehadzovať len kartičky, ktoré sú hneď vedľa seba!";
    }
    typ.wrapInner(typZadania);
    row.append(typ);

    $("div.container div:eq(0)").after(row);

    if(maxImageWidth < 51){
        maxImageWidth = 100;
    }

    if(maxImageHeight < 51){
        maxImageHeight = 100;
    }

    if (test.type == 'exchange') {
        aktivita = new Activity("canvas", true);
        var ciele = [];
        aktivita.onDragDrop = function(sprite) {
            var i, ciel;
            ciel = sprite.findOverlapped(aktivita.sprites.slice(0, test.cards.length));
            if (ciel == null) return;
            sprite.placeAt(ciel);
            for (i = 0; i < test.cards.length; i++) {
                if (ciele[i].item == null || ciele[i].item.cislo.indexOf(i) > -1) {
                    aktivita.onPaintForeground = null;
                    return;
                }
            }
        };

        var y = 51;
        var x = 51;

        for (var i = 0; i < test.cards.length; i++) {
            ciele[i] = new Sprite(aktivita, cesta + "prazdne.png", 51, 51, null);
        }

        var n = test.cards.slice();
        for(var i = 0; i < test.cards.length; i++){
            var r = Math.floor((test.cards.length - i) * Math.random());
            cards.push(new Sprite(aktivita, cesta + test.cards[i], 51, 51, dragSprite));
            cards[i].cislo = n[r];
            cards[i].placeAt(aktivita.sprites[i]);
            n[r] = n[(test.cards.length - 1) - i];
        }


        console.table(aktivita.sprites);

        for(var i = aktivita.sprites.length / 2; i < aktivita.sprites.length; i++){
            if(aktivita.sprites[i].image.naturalWidth > maxImageWidth) {
                console.log("MAX IMAGE WIDTH " + maxImageWidth);
                console.log("MAX AKTIVITA WIDTH " + aktivita.sprites[i].image.naturalWidth);
                maxImageWidth = aktivita.sprites[i].image.naturalWidth;
            }
            if(aktivita.sprites[i].image.naturalHeight > maxImageHeight) maxImageHeight = aktivita.sprites[i].image.naturalHeight;
        }
        if(aktivita.sprites[0].image.naturalHeight > maxImageHeight) maxImageHeight = aktivita.sprites[0].image.naturalHeight;
        if(aktivita.sprites[0].image.naturalWidth > maxImageWidth) maxImageWidth = aktivita.sprites[0].image.naturalWidth;

        console.log("maxwidth " + maxImageWidth + " maxheight " + maxImageHeight);
        var canvasWidth = $("#canvas").width();
        var perLine = Math.floor(canvasWidth/maxImageWidth);
        var totalLines = Math.ceil(test.cards.length/perLine) * 2;
        document.getElementById("canvas").height = totalLines * maxImageHeight;

        y = 51; x = 51;
        for (var i = 0; i < test.cards.length; i++) {
            ciele[i].setHome(maxImageWidth / 2 + i * maxImageWidth, maxImageHeight);
            cards[i].setHome(maxImageWidth / 2 + i * maxImageWidth, maxImageHeight);
        }

        console.table(aktivita.sprites);
    }

    if (test.type == 'drag') {
        aktivita = new Activity("canvas", true);
        var ciele = [];
        aktivita.onDragDrop = function (sprite) {
            var i, ciel;
            ciel = sprite.findOverlapped(aktivita.sprites.slice(0, test.cards.length));
            if (ciel == null) return;
            sprite.placeAt(ciel);
            for (i = 0; i < test.cards.length; i++) {
                if (ciele[i].item == null || ciele[i].item.cislo.indexOf(i) > -1) {
                    aktivita.onPaintForeground = null;
                    return;
                }
            }
        };

        var y = 51;
        var x = 51;

        for (var i = 0; i < test.cards.length; i++) {
            ciele[i] = new Sprite(aktivita, cesta + "prazdne.png", 51, 51, null);
        }

        var n = test.cards.slice();
        for(var i = 0; i < test.cards.length; i++){
            var r = Math.floor((test.cards.length - i) * Math.random());
            cards.push(new Sprite(aktivita, cesta + test.cards[i], 51, 51, dragSprite));
            cards[i].cislo = n[r];
            n[r] = n[(test.cards.length - 1) - i];
        }




        for(var i = aktivita.sprites.length / 2; i < aktivita.sprites.length; i++){
            if(aktivita.sprites[i].image.naturalWidth > maxImageWidth) maxImageWidth = aktivita.sprites[i].image.naturalWidth;
            if(aktivita.sprites[i].image.naturalHeight > maxImageHeight) maxImageHeight = aktivita.sprites[i].image.naturalHeight;
        }
        if(aktivita.sprites[0].image.naturalHeight > maxImageHeight) maxImageHeight = aktivita.sprites[0].image.naturalHeight;
        if(aktivita.sprites[0].image.naturalWidth > maxImageWidth) maxImageWidth = aktivita.sprites[0].image.naturalWidth;

        console.log("maxwidth " + maxImageWidth + " maxheight " + maxImageHeight);

        var canvasWidth = $("#canvas").width();
        var perLine = Math.floor(canvasWidth/maxImageWidth);
        var totalLines = Math.ceil(test.cards.length/perLine) * 2;
        document.getElementById("canvas").height = totalLines * maxImageHeight;

        y = 51; x = 51;
        for (var i = 0; i < test.cards.length; i++) {
            ciele[i].setHome(maxImageWidth / 2 + i * maxImageWidth, maxImageHeight / 2 + maxImageHeight);
            cards[i].setHome(maxImageWidth / 2 + i * maxImageWidth, maxImageHeight / 2);

        }

        console.table(aktivita.sprites);
    }

    if (test.type == 'restricted') {
        aktivita = new Activity("canvas", true);
        var ciele = [];

        aktivita.onDragDrop = function (sprite) {
            var i, ciel;
            ciel = sprite.findOverlapped(aktivita.sprites.slice(0, test.cards.length));
            if (ciel == null) return;

           if(!(sprite.getFinalX() + (maxImageWidth + 1) < ciel.getFinalX() || sprite.getFinalX() - (maxImageWidth + 1) > ciel.getFinalX())){
                sprite.placeAt(ciel);
                for (i = 0; i < test.cards.length; i++) {
                    if (ciele[i].item == null || ciele[i].item.cislo.indexOf(i) > -1) {
                        aktivita.onPaintForeground = null;
                        return;
                    }
                }
            }
        };

        var y = 51;
        var x = 51;

        for (var i = 0; i < test.cards.length; i++) {
            ciele[i] = new Sprite(aktivita, cesta + "prazdne.png", 51, 51, null);
        }

        var n = test.cards.slice();
        for(var i = 0; i < test.cards.length; i++){
            var r = Math.floor((test.cards.length - i) * Math.random());
            cards.push(new Sprite(aktivita, cesta + test.cards[i], 51, 51, dragSprite));
            cards[i].cislo = n[r];
            cards[i].placeAt(aktivita.sprites[i]);
            n[r] = n[(test.cards.length - 1) - i];
        }




        for(var i = aktivita.sprites.length / 2; i < aktivita.sprites.length; i++){
            if(aktivita.sprites[i].image.naturalWidth > maxImageWidth) maxImageWidth = aktivita.sprites[i].image.naturalWidth;
            if(aktivita.sprites[i].image.naturalHeight > maxImageHeight) maxImageHeight = aktivita.sprites[i].image.naturalHeight;
        }
        if(aktivita.sprites[0].image.naturalHeight > maxImageHeight) maxImageHeight = aktivita.sprites[0].image.naturalHeight;
        if(aktivita.sprites[0].image.naturalWidth > maxImageWidth) maxImageWidth = aktivita.sprites[0].image.naturalWidth;

        console.log("maxwidth " + maxImageWidth + " maxheight " + maxImageHeight);

        var canvasWidth = $("#canvas").width();
        var perLine = Math.floor(canvasWidth/maxImageWidth);
        var totalLines = Math.ceil(test.cards.length/perLine) * 2;
        document.getElementById("canvas").height = totalLines * maxImageHeight;

        y = 51; x = 51;
        for (var i = 0; i < test.cards.length; i++) {
            ciele[i].setHome(maxImageWidth / 2 + i * maxImageWidth, maxImageHeight);
            cards[i].setHome(maxImageWidth / 2 + i * maxImageWidth, maxImageHeight);

        }

    }

    console.log("canvasWidth: " + $("#canvas").width() + " canvasHeight: " + $("#canvas").height());

    var bottom = $('<div />', {
        "id": "bottom",
        "class": "row"
    });
    var bottomUpper = $('<div />', {
        "id": "bottomUpper",
        "class": "row"
    });
    var skontroluj = $('<a />', {
        "class": "btn btn-primary pull-right",
        "type": "button",
        "onclick": "checkSolution()"
    });
    skontroluj.wrapInner("<span style='font-family: Nunito;'>&nbsp;Skontroluj</span>");
    skontroluj.wrapInner("<span class='glyphicon glyphicon-check'></span>");
    bottomUpper.append(skontroluj);

    var spat = $('<a />', {
        "class": "btn btn-primary pull-left",
        "type": "button",
        "href": "ziak.html"
    });
    spat.wrapInner("<span style='font-family: Nunito;'>&nbsp;Testy</span>");
    spat.wrapInner("<span class='glyphicon glyphicon-chevron-left'></span>");

    var znovu = $('<a />', {
        "class": "btn btn-success pull-right",
        "type": "button",
        "onclick": "getTest()"
    });
    znovu.wrapInner("<span style='font-family: Nunito;'>&nbsp;Znovu</span>");
    znovu.wrapInner("<span class='glyphicon glyphicon-repeat'></span>");

    bottom.append(bottomUpper);
    bottom.append($('<br />'));
    bottom.append(spat);
    bottom.append(znovu);
    $('div.container').append(bottom);

    console.log("test cards: " + test.cards);
    console.log("test name: " + test.name);
    console.log("test id: " + test.id);
    console.log("test text: " + test.text);
    console.log("test type: " + test.type);
    console.log("test: " + test);
}

$.fn.exists = function() {
  return this.length !== 0;
};

function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length)
    return false;
  for (var i = arr1.length; i--;) {
    if (arr1[i] !== arr2[i])
      return false;
  }

  return true;
};

function checkSolution() {
  var proposedSolution = [];
  for(var i = 0; i < aktivita.sprites.length / 2; i++){
      if(aktivita.sprites[i].item != null) {
          var splittedSrc = aktivita.sprites[i].item.image.currentSrc.split("/");
          proposedSolution.push(splittedSrc[splittedSrc.length - 1]);
      }
  }

  console.log("proposed solution:")
  console.log(proposedSolution);

  console.log("current solution:")
    console.log(currentAssignmentSolution);

    if (arraysEqual(proposedSolution, currentAssignmentSolution)) {
    $('<div class="alert alert-success"><strong>Gratulujem, riešenie je správne!</strong></div>').insertBefore('#ziak_test').delay(3000).fadeOut(function () {
        $(this).remove();
    });
  } else {
        $('<div class="alert alert-danger"><strong>Bohužiaľ, riešenie je nesprávne. Skús to znova.</strong></div>').insertBefore('#ziak_test').delay(3000).fadeOut(function () {
            $(this).remove();
        });
  }
};

function saveAssignment(path) {
  var fileName = document.getElementById('fileName').value;
  if (fileName.trim() == '') {
      $('#fileName').css( {"box-shadow": "0 0 3px #CC0000", "margin" : "10px"});
    return;
  }
  var comment = document.getElementById('comment').value;
  if (comment.trim() == '') {
      $('#comment').css( {"box-shadow": "0 0 3px #CC0000", "margin" : "10px"});
    return;
  }

  var type;
  if (document.getElementsByName('typ')[0].checked) {
    type = 'drag';
  } else if (document.getElementsByName('typ')[1].checked) {
    type = 'exchange';
  } else if (document.getElementsByName('typ')[2].checked) {
    type = 'restricted';
  }

  var result = Object();

  result.id = +new Date();
  result.name = fileName.trim();
  result.text = comment.trim();
  result.type = type;
  result.path = path.trim();

  var order = [];

  for (var i = 0; i < zadanie.length; i++) {
    if (zadanie[i].item != null) {
      order.push(zadanie[i].item.kind);
    }
  }
  if (order.length < 1) {
      $('#jstree').css( {"box-shadow": "0 0 3px #CC0000", "margin" : "10px"});
    return;
  }
  result.cards = order;
  saveToServer(result, fileName, 'assignments/', '#vytvorenie_zadania');
};

function saveToServer(data, file, path, id) {
    $.post('save.php', {
        json: JSON.stringify(data),
        fileName: file,
        path: path,
        success: function(data) {
            $('<div class="alert alert-success"><strong>Test úspešne uložený!</strong></div>').insertBefore(id).delay(3000).fadeOut(function () {
        $(this).remove();
        location.reload();
        $('#creation_form')[0].reset();
    });
}
})
};

function saveTest() {
  var fileName = document.getElementById('fileName').value;
  if (fileName == '') {
      $('#fileName').css( {"box-shadow": "0 0 3px #CC0000", "margin" : "10px"});
    return;
  }

  var result = Object();
  result.name = fileName;
  var assgnments = [];

  var selected = document.getElementsByClassName('ms-elem-selection ms-selected');
  for (var i = 0; i < selected.length; i++) {
    var tmp = {};
    if (selected[i].innerText == '') {
      continue;
    }
    tmp.name = selected[i].innerText.trim() + '.json';
    assgnments.push(tmp);
  }
  result.assignments = assgnments;
  saveToServer(result, fileName, 'tests/' ,'#vytvorenie_testu');
};
