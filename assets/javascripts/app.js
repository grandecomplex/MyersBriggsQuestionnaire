define(["animation"], function(slide) {
  
  var CLICK = "click";

  var date1 = 0;
  
  $("h2").fadeOut();

  var $panels = $("#panels > .panel"),
      shouldEnter = false,
      itemCount = 0,
      time = 0;


  var nextQuestion = function() {
    var getItem = function(index) {
      return $panels.eq(index);
    };
    
    var $outgoing = getItem(itemCount + -1),
        $incoming = getItem(itemCount++);

    $incoming.addClass("slide-current");
    $outgoing.removeClass("slide-current");

    $outgoing.find("h2").fadeOut();

    $incoming.find("h2").fadeIn();

    if (itemCount !== 1) {
      slide($outgoing, "s-out");
    }

    slide($incoming, "s-in");

    if (itemCount === $panels.length) {
      var date2 = new Date();
      $("#time").text(date2.getTime() - date1.getTime());
    }
  };

  nextQuestion();
  
  
  $(".panel li").live(CLICK, function() {
    var that = this;
    $(this).addClass("highlighted");
    var timer = setTimeout(function() {
      $(that).removeClass("highlighted");
    }, 300);
      nextQuestion();
  });
});

