var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");
var ui = require("sdk/ui");
var getFavicon = require("sdk/places/favicon").getFavicon;

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
