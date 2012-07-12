define(function() {
  var slide = function(parent, direction) {
    var $parent = $(parent),
        i = 0,
        $children = $parent.find("li"),
        length = $children.length;
        
    $children.attr("class", "");

    function animate() {
      $children.eq(i).attr("class",direction);

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