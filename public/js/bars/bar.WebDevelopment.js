Bar.load('#header', function(bar, addon){
  $('#header').bar({
    _items: [{
      text: 'child',
      css:{ cursor: "pointer" },
      click: function(e){
        alert("my father is " + addon.toolbox.name);
      }
    }]
  });
}, FILE);
