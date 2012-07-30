define(["animation", "utils", "../data/questions", "signals", "hasher", "crossroads"], function(slide, utils, questions, signals, hasher, crossroads) {
  var hasTouch = 'ontouchstart' in window,
      resizeEvent = 'onorientationchange' in window ? 'orientationchange' : 'resize',
      startEvent = hasTouch ? 'touchstart' : 'mousedown',
      moveEvent = hasTouch ? 'touchmove' : 'mousemove',
      endEvent = hasTouch ? 'touchend' : 'mouseup',
      cancelEvent = hasTouch ? 'touchcancel' : 'mouseup';
  
  var TOTAL_QUESTIONS = questions.questions.length;
  
  var DATA_NAMESPACE = "questionnaire";

  function getPercentage(number) {
    return Math.round( ( number / 30 ) * 100 );
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
  
  function toggleToolbarControls(shouldShow) {
    var $controls = $(".toolbar-controls");
    if (shouldShow) {
      $controls.show();
    } else {
      $controls.hide();
    }
  }
  
  function getCurrentLetterIndex(index, letter) {
    var degree = {
      e: 0,
      i: 10,
      n: 30,
      s: 20,
      f: 50,
      t: 40,
      p: 70,
      j: 60
    };
    
    degree = degree[letter];
    
    return parseFloat(index) - degree;
  }
  
  function setQuestionHash(id) {
    hasher.setHash("questions/"+id);
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
    // TODO use hasher and crossroads
    var url = window.location.href;
    var index = url.lastIndexOf("?metrics=");
    var that = this;
    var savedData = localStorage.getItem(DATA_NAMESPACE);
    
    this.itemCount = 0;
    
    this.$currentSlide = [];
    
    this.counter = {
      current: $("#count-current"), 
      total: $("#count-total"),
      wrapper: $("#counter")
    };
        
    this.counter.total.text(TOTAL_QUESTIONS);
    
    // TODO Use crossroads to route this.
    if (index > 0) {
      var data = window.location.href.substring(index+9, window.location.href.length);
      data = data.replace(/%22/g, '"');
      data = JSON.parse(data);
      this.userMetrics = data;
      this.finish();
    } else if (savedData) {
      this.userMetrics = JSON.parse(savedData);
    } else {
      this.resetMetrics();
    }
    
    var timer = setTimeout(function() {
      window.scrollTo( 0, 1 );
    }, 50);
    
    this.createQuestionnaire(function() {
      that.addRoutes();
      
    });
    
    this.addEvents();
    
  };
  
  Q.prototype.createQuestionnaire = function(callback) {
    var panel = document.createElement("section");
    var $panel = this.$panel = $(panel);
    var that = this;
    
    $(document.body).append(panel);
        
    utils.render(questions, "assets/partials/question-card.html", function(compiledHTML) {
      $panel.append(compiledHTML);
      that.$questions = $panel.find(".panel");
      
      if (callback) {
        callback();
      }
    });
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
    
    crossroads.addRoute("", function() {
      toggleToolbarControls(false);

      that.goToSection($("#introduction"));
    });
    
    crossroads.addRoute("results", function() {
      toggleToolbarControls(false);
      that.finish();
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
    var that = this;
    
    this.userMetrics = {};
  
    ["e", "i", "n", "s", "f", "t", "p", "j"].forEach(function(letter) {
      that.userMetrics[letter] = [null,null,null,null,null,null,null,null,null,null];
    });
  };
  
  Q.prototype.addEvents = function() {
    var that = this;
    var $body = $("body");
    
    $body.on(endEvent, ".panel li", function() {
      var $this = $(this);
      var letterType = that.$currentSlide.attr("data-type");
      
      var letterArrayIndex = getCurrentLetterIndex(  that.$currentSlide.index(), letterType  );

      that.userMetrics[letterType][letterArrayIndex] = $this.index();
      
      // TODO: Should do this via an event
      that.save();
      
      $this.siblings().removeClass("highlighted");
      
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
      hasher.setHash("");
      that.goToSection($("#introduction"));
    });
  };
  
  Q.prototype.removeEvents = function() {
    $("body").off(endEvent);
  };
  
  Q.prototype.start = function(callback) {
    var that = this;
        
    toggleToolbarControls(true);
    
    setQuestionHash(this.itemCount);
    
    return this.goToSection(this.$panel);
  };
  
  Q.prototype.goToQuestion = function(number) {
    var letter, currentPoint, currentQuestionIndex;

    if (TOTAL_QUESTIONS <= (parseFloat(number)+1)) {
      return this.finish();
    }
    this.itemCount = number;
    if (this.$currentSection !== this.$panel) {
      this.start();
    }
    this.transition(this.$questions.eq(number), this.$currentSlide);

    // To highlight an already chosen answer
    if (this.$currentSlide.length) {
      letter = this.$currentSlide.attr("data-type");
      
      currentQuestionIndex = getCurrentLetterIndex(number, letter);
      currentPoint = this.userMetrics[ letter ][ currentQuestionIndex ];
  
      if (currentPoint !== null && typeof currentPoint !== "undefined") {      
        var $questions = this.$currentSlide.find(".form li");
        $questions.eq(currentPoint).addClass("highlighted");
      }
    }
  };
  
  Q.prototype.next = function() {        
    var $outgoing = this.$currentSlide,
        $incoming = $outgoing.next();
    
    if (TOTAL_QUESTIONS === this.itemCount+1) {
      return this.finish();
    }
    
    this.itemCount++;
    
    setQuestionHash(this.itemCount);
    
  //  this.transition($incoming, $outgoing);
  };
  
  Q.prototype.previous = function() {    
    var $outgoing = this.$currentSlide,
        $incoming = $outgoing.prev();
    
    if (this.itemCount > 0) {
      this.itemCount--;
    }
    
    if (!$incoming.length) {
      toggleToolbarControls(false);
      this.goToSection($("#introduction"));
    } else {
      setQuestionHash(this.itemCount);
    }

  //  this.transition($incoming, $outgoing, "reverse");
  };
  
  /* Change Questions */
  Q.prototype.transition = function($incoming, $outgoing, direction) {
    var outClass = "s-out";
    var inClass = (direction === "reverse") ? "s-in-reverse" : "s-in";
    
    /*  TODO: Use events instead  */
    this.updateCounter();
    
    $incoming.addClass("slide-current");
    
    if ($outgoing && $outgoing.length && $outgoing[0] !== $incoming[0]) {
      $outgoing.removeClass("slide-current");
      $outgoing.find("h2").fadeOut();
      slide($outgoing, outClass);
    }

    $incoming.find("h2").fadeIn();


    slide($incoming, inClass);
        
    this.$currentSlide = $incoming;
  };
  
  Q.prototype.finish = function() {    
    var that = this;
    var computedMetrics = [];
    
    // TODO Move out into a helper
    
    for (var letter in this.userMetrics) {
      var letterArray = this.userMetrics[letter];
      var totalPoints = 0;
      
      
      letterArray.forEach(function(point) {
        if (point !== null) {
          totalPoints += parseFloat(point);
        }
      });
      
      computedMetrics[letter] = totalPoints;
    }
    
    
    var percentages = getPercentages(computedMetrics);
    var type = getType(computedMetrics);
    var stringResults = getStringResults(computedMetrics);
    var metricsJson = JSON.stringify(this.userMetrics);
    
    toggleToolbarControls(false);

    var content = {
      percentages: percentages,
      type: type,
      results: stringResults,
      metricsJson: metricsJson
    };
    
    hasher.setHash("results");
    
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
      e: [3, 3, 3, 1, 0, 0, 3, 2, 1, 0],
      i: [3, 0, 2, 1, 0, 0, 3, 1, 1, 0],
      n: [0, 1, 3, 1, 0, 0, 3, 1, 1, 0],
      s: [0, 1, 3, 3, 3, 0, 3, 1, 1, 0],
      f: [3, 0, 3, 3, 2, 2, 3, 3, 1, 0],
      t: [2, 2, 3, 1, 0, 0, 2, 3, 1, 0],
      p: [2, 1, 3, 1, 0, 0, 0, 3, 1, 0],
      j: [3, 1, 3, 1, 0, 0, 0, 0, 0, 0]
    };
    this.finish();
  };
  
  Q.prototype.updateCounter = function() {
    this.counter.current.text(parseFloat(this.itemCount)+1);
  };
  
  Q.prototype.goToSection = function($section) {
    $("body > section").addClass("out").removeClass("in");
    $section.show().addClass("in").removeClass("out");
    this.$currentSection = $section;
  };
  
  Q.prototype.save = function() {
    localStorage.setItem( DATA_NAMESPACE, JSON.stringify( this.userMetrics ) );
  };
  
  return window.q = new Q();

});