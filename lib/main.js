var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");
var ui = require("sdk/ui");
var getFavicon = require("sdk/places/favicon").getFavicon;
let { Bookmark, Group, save } = require("sdk/places/bookmarks");

var button = buttons.ActionButton({
  id: "mozilla-link",
  label: "Visit Mozilla",
  icon: {
    "16": "./icon-16.png",
    "32": "./icon-32.png",
    "64": "./icon-64.png"
  },
  onClick: handleClick
});

function serializeTab(tab) {
  return {
    title: tab.title,
    url: tab.url,
    id: tab.id,
    favicon: getFavicon(tab).toString()
  };
}

function handleClick(state) {
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
            var bookmark = Bookmark({title: tab.title, url: tab.url});
            save(bookmark);
            worker.port.emit('removeTab', serializeTab(tab));
            tab.close();
          }
          if(lists.toRemove.indexOf(tab.id) >= 0) {
            worker.port.emit('removeTab', serializeTab(tab));
            tab.close();
          }
        }
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

    }
  });

  sidebar.show();
}
