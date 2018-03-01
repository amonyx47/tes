var currentTest = null;
var currentAssignmentIndex = 0;
var maxAssignmentIndex = 0;
var currentAssignmentSolution = [];

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
      drawAssignment(data);
    }
  });
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  console.log(ev.target);
  ev.dataTransfer.setData("text/plain", ev.target.id);
}

function drop(ev) {
  ev.preventDefault();
  var data = ev.dataTransfer.getData("text");
  console.log(ev.target);
  ev.target.appendChild(document.getElementById(data));
}

function handleDropEvent(event, ui) {
  var dropped = ui.draggable;
  var droppedOn = $(this);
  $(dropped).detach().css({
    top: 0,
    left: 0
  }).appendTo(droppedOn);
  ui.draggable.draggable('disable');
  $(this).droppable('disable');
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

function drawAssignment(test) {
  currentAssignmentSolution = test.cards;
  var randomIndexes = shuffle([...Array(test.cards.length).keys()])

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

  var cards = [];
  var rowCards = $('<ul />', {
    "id": "rowCards",
    "class": "row well"
  });
  rowCards.css({
    "height": "130px"
  })
  if (test.type == 'restricted') {
    rowCards.sortable({
      revert: true,
      scroll: false,
      stop: function(event, ui) {
        var width = event.toElement.width
        if (Math.abs(ui.position.left - ui.originalPosition.left) > 2.35 * width) {
          rowCards.sortable("cancel");
        }
      }
    });
    rowCards.disableSelection();
  }

  if (test.type == 'exchange') {
    rowCards.sortable({
      revert: true,
      scroll: false
    });
    rowCards.disableSelection();
  }

  for (var i = 0; i < randomIndexes.length; i++) {

    var card = $('<img />', {
      "class": "col-lg-2 card",
      "src": "images/" + test.cards[randomIndexes[i]],
      "alt": test.cards[randomIndexes[i]],
      "id": test.cards[randomIndexes[i]]
    });
    if (test.type == 'drag') {
      card.draggable({
        cursor: 'move',
        stack: '#rowCards',
        revert: true
      });
    }

    card.css({
      "width": "100px",
      "height": "100px",
      "cursor": "move"
    });
    cards.push(card);
  }
  rowCards.append(cards);
  row.append(rowCards);
  blanks = [];
  if (test.type == 'drag') {
    var rowBlanks = $('<div />', {
      "id": "rowBlanks",
      "class": "row well"
    });
    rowBlanks.css({
      "height": "140px"
    })
    for (var i = 0; i < test.cards.length; i++) {
      var blankCard = $('<div />', {
        "class": "col-lg-2"
      });
      blankCard.css({
        "width": "100px",
        "height": "100px"
      });
      blankCard.droppable({
        accept: '.card',
        drop: handleDropEvent
      });
      blanks.push(blankCard);
    }
    rowBlanks.append(blanks);
    row.append(rowBlanks);
  }

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

  bottom.append(spat);
  bottom.append(znovu);
  row.append(bottomUpper);
  row.append($('<br />'));
  row.append(bottom);
  $('div.container').append(row);
}

$.fn.exists = function() {
  return this.length !== 0;
}

function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length)
    return false;
  for (var i = arr1.length; i--;) {
    if (arr1[i] !== arr2[i])
      return false;
  }

  return true;
}

function checkSolution() {
  var proposedSolution = [];
  if ($('#rowBlanks').exists()) {
    proposedSolution = $('#rowBlanks').children();
    var listValues = [];

    try {
      for (var i = 0; i < proposedSolution.length; i++) {
        var toAdd = proposedSolution[i].innerHTML.split('<img')[1].split('id=')[1].split(' ')[0];
        listValues.push(toAdd.substring(1, toAdd.length - 1));
      }
    } catch (err) {}
    proposedSolution = listValues;
  } else {
    proposedSolution = $('#rowCards').sortable("toArray");
  }
  if (arraysEqual(proposedSolution, currentAssignmentSolution)) {
    alert("Gratulujem, riešenie je správne!");
  } else {
    alert("Bohužiaľ, riešenie je nesprávne. Skús to znova.");
  }
}

function saveAssignment() {
  var fileName = document.getElementById('fileName').value;
  if (fileName.trim() == '') {
    alert('Nezadali ste meno súboru!');
    return;
  }
  var comment = document.getElementById('comment').value;
  if (comment.trim() == '') {
    alert('Nezadali ste komentár k zadaniu!');
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
  result.name = fileName;
  result.text = comment;
  result.type = type;

  var order = [];

  for (var i = 0; i < zadanie.length; i++) {
    if (zadanie[i].item != null) {
      order.push(zadanie[i].item.kind);
    }
  }
  if (order.length < 1) {
    alert('Nevybrali ste žiadne obrázky!');
    return;
  }
  result.cards = order;
  saveToServer(result, fileName, 'assignments/');
  alert('Zadanie úspešne uložené');
  location.reload();
}

function saveToServer(data, file, path) {
  $.post('save.php', {
    json: JSON.stringify(data),
    fileName: file,
    path: path
  });
}

function saveTest() {
  var fileName = document.getElementById('fileName').value;
  if (fileName == '') {
    alert('Nezadali ste meno súboru!');
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
  saveToServer(result, fileName, 'tests/');
  alert('Test úspešne uložený');
  location.reload();
}
