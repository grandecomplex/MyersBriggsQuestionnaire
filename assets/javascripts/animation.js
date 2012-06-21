define(function() {
  var slide = function(parent, direction) {
    var $parent = $(parent),
        i = 0,
        getChildren = function() {
          return $parent.find("li");
        },
        length = getChildren().length;

    function animate() {
      getChildren().eq(i).attr("class",direction);

      var timer = setTimeout(function() {
        i++;
        animate();
      }, 200); 
    
      if (length === i) {
        clearTimeout(timer);
      }
    }
    animate();
  };
  
  return slide;
});