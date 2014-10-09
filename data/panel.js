var container = $("#tab-list");

function tabId(tab) {
  return "tab-" + tab.id
}

function getTabElement(tab) {
  return $("#" + tabId(tab));
}

function select(tab) {
  container.find(".tab").removeClass("selected");
  getTabElement(tab).addClass("selected");
}

addon.port.on('tab', function(tab) {
  var existing = getTabElement(tab);
  var el = $("<div></div>").attr("id", tabId(tab)).addClass('tab');
  el.data('id', tab.id);
  var link = $("<a></a>").attr("href", tab.url).text(tab.title).appendTo(el);
  var save = $("<button>Save</button>").appendTo(el);
  var remove = $("<button>Remove</button>").appendTo(el);

  link.on('click', function(e) {
    e.preventDefault();
    select(tab);

    addon.port.emit('select', tab);
  });

  save.on('click', function(e) {
    e.preventDefault();

    setSave(el);
    nextItem(el);
  });

  remove.on('click', function(e) {
    e.preventDefault();

    setRemove(el);
    nextItem(el);
  });

  if(container.find('.tab').length == 0) {
    el.addClass('selected');
  }

  if(existing.length > 0) {
    existing.replaceWith(el);
  } else {
    container.append(el);
  }
});

function setSave(el) {
  el.removeClass('to-remove');
  el.addClass('to-save');
}

function setRemove(el) {
  el.removeClass('to-save');
  el.addClass('to-remove');
}

function nextItem(selected) {
  selected.removeClass('selected');
  selected.next().addClass('selected');
}

function done() {
  var saveList = $(".tab.to-save").map(function() { return $(this).data('id'); }).get();
  var removeList = $(".tab.to-remove").map(function() { return $(this).data('id'); }).get();

  addon.port.emit('done', {
    toRemove: removeList,
    toSave: saveList
  });
}

addon.port.on('removeTab', function(tab) {
  var existing = getTabElement(tab);
  if(existing.length > 0) { existing.remove(); }
});

$(document).on('keypress', function(e) {
  if(e.which == 115 || e.which == 114) {
    var selected = $(".tab.selected");
    if(e.which == 115) { // s
      setSave(selected);
    } else { // r
      setRemove(selected);
    }
    nextItem(selected);
  }
  if(e.which == 102) { // f
    done();
  }
});

$("#done").on('click', function(e) {
  e.preventDefault();

  done();
});

addon.port.emit('ready');
