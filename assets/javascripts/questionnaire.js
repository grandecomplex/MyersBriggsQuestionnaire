define(["animation", "utils", "../data/questions"], function(slide, utils, questions) {
  var hasTouch = 'ontouchstart' in window,
      resizeEvent = 'onorientationchange' in window ? 'orientationchange' : 'resize',
      startEvent = hasTouch ? 'touchstart' : 'mousedown',
      moveEvent = hasTouch ? 'touchmove' : 'mousemove',
      endEvent = hasTouch ? 'touchend' : 'mouseup',
      cancelEvent = hasTouch ? 'touchcancel' : 'mouseup';

  var itemCount = 0;
  
  var userMetrics = {
    E: 0,
    I: 0,
    N: 0,
    S: 0,
    F: 0,
    T: 0,
    P: 0,
    J: 0
  };
  
  var score = 0;

  var Q = function() {
    this.addEvents();
  };
  
  Q.prototype.addEvents = function() {
    var that = this;
    var $body = $("body");
    $body.on(endEvent, ".panel li", function() {
      var $this = $(this);
      
      score += $this.index();
      
      $this.addClass("highlighted");
      var timer = setTimeout(function() {
        $this.removeClass("highlighted");
        if (itemCount === that.$panel.children().length) {
          that.finish();
        } else {
          that.next();
        }
      }.bind(this), 300);
    });
        
    $body.on(endEvent, "#start", function() {
      that.start();
    });
    
    $(window).bind("unload", this.removeEvents.bind(this));
  };
  
  Q.prototype.removeEvents = function() {
    $("body").off(endEvent);
  };
  
  Q.prototype.start = function() {
    var panel = document.createElement("section");
    var $panel = this.$panel = $(panel);
    
    $("#introduction").addClass("out");
    
    $("#header").after(panel);

    utils.render(questions, "assets/partials/question-card.html", function(compiledHTML) {
      $panel.append(compiledHTML);
      this.next();
    }.bind(this));
  };
  
  Q.prototype.next = function() {
    var $panels = this.$panel.find(".panel"),
        shouldEnter = false;
        
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
  };
  
  Q.prototype.previous = function() {};
  
  Q.prototype.finish = function() {
    utils.render(score, "assets/partials/final-card.html", function(compiledHTML) {
      this.$panel.addClass("out");
      this.$panel.after(compiledHTML);
    }.bind(this));
  };

  return new Q();

});

