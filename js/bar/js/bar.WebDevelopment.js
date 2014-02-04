Bar.load('#header', function(bar, addon){
  $('#header').bar({
    _items: [{
      text: 'slave',
      css:{ cursor: "pointer" },
      click: function(e){
        alert("my master is "+addon.toolbox.name);
      }
    }]
  });
});
