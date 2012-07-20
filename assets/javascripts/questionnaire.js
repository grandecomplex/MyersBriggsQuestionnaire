define(["animation", "utils", "../data/questions", "signals", "hasher", "crossroads"], function(slide, utils, questions, signals, hasher, crossroads) {
  var hasTouch = 'ontouchstart' in window,
      resizeEvent = 'onorientationchange' in window ? 'orientationchange' : 'resize',
      startEvent = hasTouch ? 'touchstart' : 'mousedown',
      moveEvent = hasTouch ? 'touchmove' : 'mousemove',
      endEvent = hasTouch ? 'touchend' : 'mouseup',
      cancelEvent = hasTouch ? 'touchcancel' : 'mouseup';
  
  var TOTAL_QUESTIONS = questions.questions.length;

  function getPercentage(number) {
    return Math.round( ( number / 20 ) * 100 );
  }
  
  function getPercentages(metrics) {
    var percentages = [];
    for (var metric in metrics) {
      if (metrics.hasOwnProperty(metric)) {
        percentages.push( getPercentage(metrics[metric]) );
      }
    }
    
    return percentages;
  }
  
  function getStringResults(metrics) {
    var map = {
      e: "Extraversion",
      i: "Introversion",
      n: "Intuition",
      s: "Sensing",
      f: "Feeling",
      t: "Thinking",
      p: "Perception",
      j: "Judging"
    };
    
    var result = "";
    
    for (var metric in metrics) {
      if (metrics.hasOwnProperty(metric)) {
        result += map[metric] +": "+ getPercentage( metrics[metric] ) +"%0D%0A";
      }
    }
    
    return result;
  }
  
  function getType(data) {
    var type = "";
    if (data.e > data.i) {
      type += "e";
    } else {
      type += "i";
    }
    
    if (data.n > data.s) {
      type += "n";
    } else {
      type += "s";
    }
    
    if (data.t > data.f) {
      type += "t";
    } else {
      type += "f";
    }
    
    if (data.j > data.p) {
      type += "j";
    } else {
      type += "p";
    }
    
    return type.toUpperCase();
  }

  var Q = function() {
    var url = window.location.href;
    var index = url.lastIndexOf("?metrics=");
    var that = this;
    
    this.itemCount = 0;
    
    this.$currentSlide = [];
    
    this.counter = {
      current: $("#count-current"), 
      total: $("#count-total"),
      wrapper: $("#counter")
    };
        
    this.counter.total.text(TOTAL_QUESTIONS);
    
    if (index > 0) {
      var data = window.location.href.substring(index+9, window.location.href.length);
      data = data.replace(/%22/g, '"');
      data = JSON.parse(data);
      this.userMetrics = data;
      this.finish();
    } else {
      this.resetMetrics();
    }
    
    var timer = setTimeout(function() {
      window.scrollTo( 0, 1 );
    }, 50);
    
    
    
    var panel = document.createElement("section");
    var $panel = this.$panel = $(panel);
    
    this.goToSection($panel);

    $(document.body).append(panel);
    
    utils.render(questions, "assets/partials/question-card.html", function(compiledHTML) {
      $panel.append(compiledHTML);
      that.$currentSlide = $panel.children().first();
      that.transition(that.$currentSlide);
      if (callback) {
        callback();
      }
    });
    
    
    
    this.addEvents();
    
    this.addRoutes();
  };
  
  Q.prototype.addRoutes = function() {
    var that = this;
    
    crossroads.addRoute('/questions/{id}', function(id){
      if ( (this.itemCount - 1) === id) {
        that.prev();
      } else if ( (this.itemCount + 1) === id) {
        that.next();
      } else {
        that.goToQuestion(id);
      }
    });
    
    //setup hasher
    function parseHash(newHash, oldHash){
      crossroads.parse(newHash);
    }
    hasher.initialized.add(parseHash); // parse initial hash
    hasher.changed.add(parseHash); //parse hash changes
    hasher.init(); //start listening for history change
  };
  
  Q.prototype.resetMetrics = function() {
    this.userMetrics = {
      "e": 0,
      "i": 0,
      "n": 0,
      "s": 0,
      "f": 0,
      "t": 0,
      "p": 0,
      "j": 0
    };
  };
  
  Q.prototype.addEvents = function() {
    var that = this;
    var $body = $("body");
    
    $body.on(endEvent, ".panel li", function() {
      var $this = $(this);
      var letterType = $(".slide-current").attr("data-type");
      
      that.userMetrics[letterType] += $this.index();
      
      $this.addClass("highlighted");
      
      var timer = setTimeout(function() {
        if (this.itemCount === that.$panel.children().length) {
          that.finish();
        } else {
          that.next();
        }
      }, 300);
    });
        
    $body.on(endEvent, "#start", function() {
      that.start();
    });
    
    $(window).bind("unload", function() {
      that.removeEvents();
    });
    
    $(".out").live("webkitTransitionEnd", function() {
      $(this).css("display", "none");
    });
    $(".in").live("webkitTransitionEnd", function() {
      $(this).css("display", "block");
    });
    
    $body.on(endEvent, "#mockResults", function() {
      that.mockResults();
    });
    
    $body.on(endEvent, "#startOver", function() {
      that.resetMetrics();
      $(".s-*").attr("class", "");
      
      that.goToSection($("#introduction"));
    });
  };
  
  Q.prototype.removeEvents = function() {
    $("body").off(endEvent);
  };
  
  Q.prototype.start = function(callback) {
    var that = this;
        
    this.counter.wrapper.show();
    
    this.goToQuestion(0);
    return this.goToSection(this.$panel);
  };
  
  Q.prototype.goToQuestion = function(number) {
    var panels = this.$panel.find(".panel");
    this.itemCount = number;
    this.transition(panels.eq(number), this.$currentSlide);
  };
  
  Q.prototype.next = function() {        
    var $outgoing = this.$currentSlide,
        $incoming = $outgoing.next();
    
    if (TOTAL_QUESTIONS === this.itemCount+1) {
      return this.finish();
    }
    
    this.itemCount++;

    this.transition($incoming, $outgoing);
  };
  
  Q.prototype.previous = function() {    
    var $outgoing = this.$currentSlide,
        $incoming = $outgoing.prev();
    
    if (this.itemCount > 0) {
      this.itemCount--;
    }
    
    if (!$incoming.length) {
      this.counter.wrapper.hide();
      return this.goToSection($("#introduction"));
    }

    this.transition($incoming, $outgoing, "reverse");
  };
  
  Q.prototype.transition = function($incoming, $outgoing, direction) {
    var outClass = "s-out";
    var inClass = (direction === "reverse") ? "s-in-reverse" : "s-in";
    
    this.updateCounter();
    
    $incoming.addClass("slide-current");
    
    if ($outgoing && $outgoing.length) {
      $outgoing.removeClass("slide-current");
      $outgoing.find("h2").fadeOut();
    }

    $incoming.find("h2").fadeIn();

    slide($outgoing, outClass);

    slide($incoming, inClass);
        
    this.$currentSlide = $incoming;
  };
  
  Q.prototype.finish = function() {    
    var that = this;
    var percentages = getPercentages(this.userMetrics);
    var type = getType(this.userMetrics);
    var stringResults = getStringResults(this.userMetrics);
    var metricsJson = JSON.stringify(this.userMetrics);
    
    this.counter.wrapper.hide();
    
    var content = {
      metrics: this.userMetrics,
      percentages: percentages,
      type: type,
      results: stringResults,
      metricsJson: metricsJson
    };
    
    utils.render(content, "assets/partials/final-card.html", function(compiledHTML) {
      var $final = that.$final;
      var $html = $(compiledHTML);
      
      if ($final && $final.length) {
        $final.html( $html.children() );
      } else {
        that.$final = $html;
        $(document.body).append(that.$final);
      }
      
      that.goToSection(that.$final);
    });
  };
  
  Q.prototype.mockResults = function() {
    this.userMetrics = {
      e: 9,
      i: 18,
      n: 1,
      s: 0,
      f: 20,
      t: 5.00001,
      p: 10.303040,
      j: 15.999
    };
    this.finish();
  };
  
  Q.prototype.updateCounter = function() {
    this.counter.current.text(this.itemCount+1);
  };
  
  Q.prototype.goToSection = function($section) {
    $("body > section").addClass("out").removeClass("in");
    $section.show().addClass("in").removeClass("out");
  };
  
  Q.prototype.save = function() {
    
  };
  
  return window.q = new Q();

});