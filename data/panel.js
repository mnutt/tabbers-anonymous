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

addon.port.on('showSnooze', function() {
  $("#snooze").show();
});

addon.port.on('tab', function(tab) {
  var existing = getTabElement(tab);
  var el = $("<div></div>").attr("id", tabId(tab)).addClass('tab');
  el.data('id', tab.id);
  var link = $("<a></a>").attr("href", tab.url).text(tab.title).appendTo(el);
  var save = $("<button>Save</button>").addClass('save-button').appendTo(el);
  var remove = $("<button>Remove</button>").appendTo(el);
  var tags = $("<div class='tags'>Tags:</div>").appendTo(el);
  var tagInput = $("<input type='text'/>").appendTo(tags);

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
  if(!selected.next().length) {
    selected.siblings(':first').addClass('selected');
  }
}

function previousItem(selected) {
  selected.removeClass('selected');
  selected.prev().addClass('selected');
  if(!selected.prev().length) {
    selected.siblings(':last').addClass('selected');
  }
}

function done() {
  var bookmarkList = {};
  var saveList = $(".tab.to-save").map(function() {
    var bookmarks = $(this).find('input').val();
    if(bookmarks.length > 0) {
      bookmarkList[$(this).data('id')] = bookmarks.split(/,\s+/);
    }
    return $(this).data('id');
  }).get();

  var removeList = $(".tab.to-remove").map(function() {
    return $(this).data('id');
  }).get();

  addon.port.emit('done', {
    toRemove: removeList,
    toSave: saveList,
    bookmarks: bookmarkList
  });
}

addon.port.on('removeTab', function(tab) {
  var existing = getTabElement(tab);
  if(existing.length > 0) { existing.remove(); }
});

$(document).on('keypress', function(e) {
  if($(".tags input:focus").length) {
    if(e.which == 0) {
      e.preventDefault();
      var selected = $(".tab.selected");
      nextItem(selected);
    } else {
      return;
    }
  }

  if(e.which == 115 || e.which == 114 || e.which == 110 || e.which == 112 || e.which == 116) {
    var selected = $(".tab.selected");
    if(e.which == 115) { // s
      setSave(selected);
      nextItem(selected);
    } else if(e.which == 114) { // r
      setRemove(selected);
      nextItem(selected);
    } else if(e.which == 110) { // n
      nextItem(selected);
    } else if(e.which == 112) { // p
      previousItem(selected);
    } else if(e.which == 116) { // t
      setSave(selected);
      selected.find('input').focus();
    }
  }

  if(e.which == 102) { // f
    done();
  }
});

$("#done").on('click', function(e) {
  e.preventDefault();

  done();
});

$("#snooze .15m").on('click', function(e) {
  e.preventDefault();
  addon.port.emit('snooze', 15 * 60 * 1000);
});

$("#snooze .1h").on('click', function(e) {
  e.preventDefault();
  addon.port.emit('snooze', 60 * 60 * 1000);
});

addon.port.emit('ready');
