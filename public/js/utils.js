app.utils = {

  iframeResizeToFit: function(id){
    var elem = $('#' + id);
    elem.css('width', '100%');
    var height = elem[0].contentWindow.document.body.offsetHeight;
    elem.css('height', (height + 10) + 'px');
  }

};
