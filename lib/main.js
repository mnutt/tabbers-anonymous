var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");
var ui = require("sdk/ui");
var getFavicon = require("sdk/places/favicon").getFavicon;
var preferences = require('sdk/simple-prefs');
var prefs = preferences.prefs
let { Bookmark, Group, save } = require("sdk/places/bookmarks");
let {setTimeout, clearTimeout } = require("sdk/timers");

var scheduled, snoozeTime;

scheduleAutoOpen();
preferences.on('autoOpen', scheduleAutoOpen);
preferences.on('autoOpenTime', scheduleAutoOpen);

function tooManyTabs() {
  return tabs.length > prefs.maxTabs;
}

function scheduleAutoOpen() {
  // Reset existing schedule
  if(scheduled) { clearTimeout(scheduled); scheduled = null; }

  // Only set timer if we intend to auto-open
  if(!prefs.autoOpen) { return; }

  var autoOpenTime = new Date();
  autoOpenTime.setHours(prefs.autoOpenTime);
  autoOpenTime.setMinutes(0);
  autoOpenTime.setSeconds(0);
  autoOpenTime.setMilliseconds(0);

  if(autoOpenTime < new Date()) {
    autoOpenTime = new Date(autoOpenTime.getTime() + 24 * 60 * 60 * 1000);
  }

  var delta = autoOpenTime - new Date();
  delta = 10000;
  scheduled = setTimeout(function() {
    if(tooManyTabs()) { openSidebar(true); } else {
      setTimeout(scheduleAutoOpen, 1000);
    }
  }, delta);
}

var button = buttons.ActionButton({
  id: "mozilla-link",
  label: "Visit Mozilla",
  icon: {
    "16": "./icon-16.png",
    "32": "./icon-32.png",
    "64": "./icon-64.png"
  },
  onClick: handleButtonClick
});

function handleButtonClick(state) {
  openSidebar(false);
}

function serializeTab(tab) {
  return {
    title: tab.title,
    url: tab.url,
    id: tab.id,
    favicon: getFavicon(tab).toString()
  };
}

function openSidebar(autoOpened) {
  var sidebar = ui.Sidebar({
    id: 'tabbers-anonymous',
    title: 'Tabbers Anonymous',
    url: require("sdk/self").data.url("index.html"),

    onAttach: function(worker) {
      var window = require('sdk/window/utils').getMostRecentBrowserWindow();
      window.document.getElementById('sidebar').style.width = "400px";

      worker.port.on('ready', function(cmd) {
        for each (tab in tabs) {
          worker.port.emit('tab', serializeTab(tab));
        }

        if(autoOpened) { worker.port.emit('showSnooze'); };
      });

      worker.port.on('select', function(selectedTab) {
        for each (tab in tabs) {
          if(selectedTab.id == tab.id) {
            tab.activate();
          }
        }
      });

      worker.port.on('done', function(lists) {
        for each (tab in tabs) {
          if(lists.toSave.indexOf(tab.id) >= 0) {
            var bookmark = Bookmark({title: tab.title, url: tab.url, tags: lists.bookmarks[tab.id]});
            save(bookmark);
            worker.port.emit('removeTab', serializeTab(tab));
            tab.close();
          }
          if(lists.toRemove.indexOf(tab.id) >= 0) {
            worker.port.emit('removeTab', serializeTab(tab));
            tab.close();
          }
        }
        sidebar.hide();
      });

      worker.port.on('snooze', function(time) {
        snoozeTime = time;
        sidebar.hide();
      });

      tabs.on('open', function(tab) {
        var serialized = serializeTab(tab);
        worker.port.emit('tab', serialized);

        tab.on('close', function() {
          worker.port.emit('removeTab', serialized);
        });
      });

      tabs.on('ready', function(tab) {
        worker.port.emit('tab', serializeTab(tab));
      });

    },
    onHide: function() {
      sidebar.dispose();

      if(snoozeTime) {
        scheduled = setTimeout(function() {
          if(tooManyTabs()) { openSidebar(true); } else {
            scheduleAutoOpen();
          }
        }, snoozeTime);
      } else {
        scheduleAutoOpen();
      }
    }
  });

  sidebar.show();
}
