

TTI.Question = function(spec) {

  var gossip = spec.gossip;

  var choiceKey = 'question-' + spec.id + '-choice';
  var notesKey = 'question-' + spec.id + '-notes';


  //get some ids established
  spec.answers.eachPCN(function(o){
    o.current.id = o.c;
  });
  //console.log('answers',spec.answers);

  ////var blipBox = DOM.div().addClass('blip-box');


  var self = TTI.PubSub({});

  self.spec = spec; //fixme
  self.choice = false;





  var allowFade = true;
  var hovering = false;
  
  /**
  function maybeFade() {
    if (hovering) { return false;}
    blipBox.fadeOut();
  }
  **/


  self.hash = function() {
    return 'Question#' + spec.id + spec.question;
  };

  self.dimensionName = function() {
  
    var result = false;
    var firstAnswer = spec.answers[0];
    for(var key in firstAnswer.points) {
      if (firstAnswer.points[key] > 0) {
        result = key;
      }
    }
    return result;
  };

  self.loadYourself = function() {
    var savedNotes = TTI.storage[notesKey] || '';
    //console.log("i loaded",savedNotes,'for',notesKey);

    var savedChoiceID = TTI.storage[choiceKey] || -1;
    TTI.storage[choiceKey] = savedChoiceID;
    
    ///console.log('savedChoiceID',savedChoiceID);
    
    self.choice = spec.answers.detect(function(a) { return a.id == savedChoiceID; });
    ////console.log('loaded choice',self.choice);

    self.notes = savedNotes;
  };

  self.saveYourself = function() {
    //////console.log('saving',notesKey,self.notes,'choiceID',self.choice.id);
  
    TTI.storage[notesKey] = self.notes;
    TTI.storage[choiceKey] = self.choice.id;
  };

 
  self.renderOn = function(wrap,opts) {
    self.loadYourself(); // notes!
    ////wrap.empty();
    //////console.log('renderOn',spec);



    
    var h2 = DOM.h2(spec.question);
    wrap.append(h2);
    
    ////var ul = DOM.ul();
    var table = DOM.table().addClass('table table-bordered table-condensed');
    spec.answers.each(function(a) {
      //var li = DOM.li();
      var tr = DOM.tr();
      
      var tdRadio = DOM.td().addClass('td-radio');
      var tdAnswer = DOM.td().addClass('td-answer');
      
      if (opts.readOnly) { tdAnswer.addClass('read-only'); }
      
      var radio = DOM.input().attr('type','radio').attr('name','question-' + spec.id);
      
      if (self.choice == a) {
        radio.attr('checked','checked');
        tdAnswer.addClass('chosen');
      }



      tdRadio.append(radio);

      tdAnswer.append(a.answer);
      
      
      
      
      var aChoiceWasMade = function(){
        self.choice = a;
        /////console.log('wowowowowowo',self.choice);
        
        self.saveYourself();        
        
        ///console.log('get here?',self);
        
        self.publish('question-answered',{ question: self, answer: a, id: spec.id, notes: self.notes });      
      };
      
      radio.click(aChoiceWasMade);
      tdAnswer.click(function() { radio.trigger('click'); });
      
      
      
      if (!opts || !opts.readOnly) {
        tr.append(tdRadio);
      }

      tr.append(tdAnswer);
      table.append(tr);
      
    });
    
    wrap.append(table);

    var notesLabel = DOM.h5('Notes');
    var notesTA = DOM.textarea().addClass('notes');
    notesTA.html(self.notes);
    notesTA.on('change',function(e) {
      self.notes = this.value;
      self.saveYourself();
      ///console.log('TA CHANGE!!!!!' + spec.id,'notes',notes);
    });
    
    ///notesLabel.append(notesTA);
    wrap.append(notesLabel);
    wrap.append(notesTA);
    
    self.publish('question-rendered',{ question: self, wrap: wrap });  
  };

  return self;
};




TTI.questionsForDimensionName = function(dimensionName){
  var result = TTI.getQuestions().select(function(q){
    return q.dimensionName() == dimensionName; 
  });
  return result;
};

TTI.questionsForDimensionNameV1 = function(dimensionName){

  var result = TTI.getQuestions().select(function(q){
  
    var pointyAnswer = q.spec.answers.detect(function(a){
      return a.points[dimensionName] > 0;
    });
    /////////console.log('pointyAnswer',pointyAnswer);  
    return pointyAnswer;
  });
  
  return result;
  ///var conjured = result.map(function(o){  return TTI.Question(o); });
  ///return conjured;
};

TTI.getQuestions = function() {
  var questions = TTI.quizData.questions.map(function(q){
    return TTI.Question(q);
  });
  return questions;
};

TTI.Quiz = function(spec) {

  var stats = {};
  var totals = {};

  var gossip = spec.gossip;

  //var self = {};
  
  var self = TTI.PubSub({});
  
  self.stats = stats;
  
  self.getQuestions = TTI.getQuestions;
  
  var questions = TTI.getQuestions();
  var lastQustion = questions[questions.length-1];
  
  questions.each(function(q){ 
    q.loadYourself(); 
  });
  
  
  /*** 
  var questions = TTI.quizData.questions.map(function(q){
    q.gossip = spec.gossip; //hook up to PubSub
    return TTI.Question(q);
  });
  
  **/
  
  /**
  var sortedQuestions = TTI.dimensions.map(function(o){
  })
  **/  
  var batches = TTI.quizData.dimensions.map(function(o) { 
    return TTI.questionsForDimensionName(o.name); 
  });

  

  /**
  var currentQuestionIndex = 0;
  var currentQuestion = questions[currentQuestionIndex];
  **/
  var currentBatchIndex = 0;
  var currentBatch = batches[currentBatchIndex];/////////Questions

  batches.eachPCN(function(o){
    o.current.next = o.next;
    o.current.prev = o.prev; 
    if (o.current == batches[0]) { o.current.prev = false; }
    if (o.current == batches[batches.length-1]) { o.current.next = false; }
  });

  ///console.log('batches',batches);

  var transport = DOM.div().attr('id','transport');
  var btnPrev = DOM.button('Previous').addClass('btn prev');
  var btnNext = DOM.button('Next').addClass('btn next');
  var btnSummary = DOM.button('Show Summary').addClass('btn btn-info btn-summary');

  var indicator = DOM.div().addClass('indicator');



  var beginButton = jQuery('.begin-button');
  beginButton.addClass('btn-take-full-quiz btn-full-assessment');
   
  var btnOME = jQuery('.btn-one-minute-assessment');


  
  transport.append(btnPrev);
  transport.append(indicator);
  transport.append(btnNext);
  transport.append(btnSummary);
  btnSummary.css('visibility','hidden'); //by default, hide this one
  
  
  ///////btnNext.css('visibility','hidden'); //also hide by default, only show after answering questions


  /**
  questions.eachPCN(function(o){
    o.current.gossip = spec.gossip;
    o.current.prev = o.prev;
    o.current.next = o.next;
    if (o.current == questions[0]) { o.current.prev = false; }
    if (o.current == questions[questions.length -1]) { o.current.next = false; }
  });
  ***/
  
  ///////console.log('questions?',questions);
  


  self.percentScore = function(dimensionName,earnedPoints) {
    var dimHit = TTI.quizData.dimensions.detect(function(d) { return d.name == dimensionName });
    var max = self.maxPointsPossibleForDimension(dimensionName);
    var score = (earnedPoints == 0) ? 0 : earnedPoints / max;
    return Math.round(score * 10000) / 100;
  };

  self.lookupLevel = function(dimensionName,points) {
  
    var dimHit = TTI.quizData.dimensions.detect(function(d) { return d.name == dimensionName });
    var max = self.maxPointsPossibleForDimension(dimensionName);
    
    var score = self.percentScore(dimensionName,points);
    ////console.log('score',score);
    var levelHit = dimHit.levels.detect(function(l){
      //////console.log('ell',l);
    
      var low = l.range[0];
      var high = l.range[1];      
      ///console.log(low,high,'points',points);      
      return score >= low && score <= high;
      ////console.log('elll',l);
      /////return true;
    });

    return levelHit;
  };

  self.checkTransport = function() {  
    //////console.log('cb curr',currentQuestion);
    if (currentBatch.prev == false) {  
      btnPrev.css('visibility','hidden'); }
    else { 
      btnPrev.css('visibility','visible'); 
    }

    if (currentBatch.next == false) {  
      btnNext.css('visibility','hidden'); 
      btnSummary.css('visibility','visible');
    }
    else { 
      btnNext.css('visibility','visible'); 
      btnSummary.css('visibility','hidden');
    }


    indicator.html((currentBatchIndex + 1) + ' / ' + batches.length);
    
    
    
  };

  self.checkTransportV1 = function() {  
    
    if (currentQuestion.prev == false) {  btnPrev.css('visibility','hidden'); }
    else { btnPrev.css('visibility','visible') }

    ///////console.log('currentQuestion',currentQuestion);
    
    
    if (currentQuestion.choice == false) {
      ////console.log('hiding!!!!');
      btnNext.css('visibility','hidden');
    }

    indicator.html((currentQuestionIndex + 1) + ' / ' + questions.length);
  };
  
  
  self.getDimensionLevelsByScore = function() {
    var result = {}; 
    totals = self.getTotals();
    ///console.log('totals',totals);
    
    TTI.quizData.dimensions.each(function(dimension) {
      var dimensionName = dimension.name;
      var points = totals[dimensionName] || 0;     
      var myScore = self.percentScore(dimensionName,points) + ' (' + points + '/' + self.maxPointsPossibleForDimension(dimensionName) + ')';
      var myLevel = self.lookupLevel(dimensionName,points);
      result[dimensionName] = myLevel;
    });
    
    return result;
  };
  
  
  self.renderSummaryGridOn = function(wrap,dimensionLevelMap,msg) {
    
    var summary = DOM.div().addClass('summary summary-grid');  
    var disclaimer = DOM.p();
    var latestMethod = TTI.storage['latestScoringMethod'];

    //////console.log('latestMethod',latestMethod);

    if (!latestMethod) {
      disclaimer.append('No scoring data available. Results shown below represent a Level 1 default score.');    
    }
    else if (latestMethod == 'one-minute') {
      disclaimer.append('Results shown below represent your selections from the 1-Minute Assessment option.');    
    }
    else if (latestMethod == 'full-quiz') {
      disclaimer.append('Results shown below represent your selections from the Full Assessment option.');    
    }
    

    
    var table = DOM.table().addClass('table table-bordered table-condensed');

    var headerRow = DOM.tr();
    headerRow.append(DOM.th('Dimension').addClass('th-inverse dimension'));
    headerRow.append(DOM.th('% score').addClass('th-inverse score'));
    ////headerRow.append(DOM.th('Your Result').addClass('th-inverse'));

    ////*** *** ***     headerRow.append(DOM.th('Description').addClass('th-inverse'));
    headerRow.append(DOM.th('Level 1').addClass('th-inverse'));
    headerRow.append(DOM.th('Level 2').addClass('th-inverse'));
    headerRow.append(DOM.th('Level 3').addClass('th-inverse'));
    headerRow.append(DOM.th('Level 4').addClass('th-inverse'));

 


    table.append(headerRow);
    
    totals = self.getTotals();
    ///////console.log('totals',totals);
        
    TTI.quizData.dimensions.each(function(dimension) {
      var dimensionName = dimension.name;
      var points = totals[dimensionName] || 0;     
      var myScore = Math.round(self.percentScore(dimensionName,points)) + ' (' + points + '/' + self.maxPointsPossibleForDimension(dimensionName) + ')';

      ///var myLevel = self.lookupLevel(dimensionName,points);
      
      var myLevel = dimension.levels[0];
      if (typeof dimensionLevelMap[dimensionName] != "undefined") {
        myLevel = dimensionLevelMap[dimensionName];
      }
      
      ////console.log('myLevel',myLevel);
      
      
      
      var tr = DOM.tr();
        
      var slug = TTI.slugify(dimension.name);
      //////console.log('slug',slug);
      var img = DOM.img().addClass('dimension-badge slug');
      img.attr('src','images/' + slug + '.png');
      
      tr.append(DOM.td(TTI.dimensionBox(dimension,{ showBlips: true })));
      tr.append(DOM.td(myScore));     
    
    
      ////*** *** ***tr.append(DOM.td(dimension.description).addClass('description'));
           
        [1,2,3,4].each(function(n){ // was [1,2,3,4] prior to 8/28/2013


          var levelN = dimension.levels.detect(function(level) { return level.id == n; });    

          var hit = (levelN.id == myLevel.id);


          var td = DOM.td().addClass('dim-level-cell');
          var radioLabel = DOM.label().addClass('radio-label');
          if (hit) {
            var actionLink = DOM.a('Choose Actions').attr('href','javascript:void(0);');
            actionLink.addClass('btn btn-warning pretest-action-link');
            //actionLink.attr('href',levelN.action);
            //actionLink.attr('target','_blank');
            ////actionLink.css('display','none');
            
            actionLink.click(function(){
            
              //done with summary for now
              summary.empty();
              var payload = { dimension: dimension, level: myLevel, map: dimensionLevelMap };
              self.publish('custom-action',payload);
            
            });
            
            radioLabel.append(actionLink);
          }
          
          
          
          radioLabel.append(levelN.text);


          if (hit) { td.addClass('selected'); }

          td.append(radioLabel);

          
          tr.append(td);
        });
      
      table.append(tr);
    
    });
      /////////var actionLink = DOM.a('We Suggest').addClass('btn btn-warning').attr('href',level.action).attr('target','_blank');
    
    
    summary.append(disclaimer);
    summary.append(table);
    
    
    




    wrap.append(summary);
  };
   
  self.headerBoxForDimension = function(dimension) {

    var slug = TTI.slugify(dimension.name);
    //////console.log('slug',slug);
    var img = DOM.img().addClass('dimension-badge slug');
    img.attr('src','images/' + slug + '.png');


  
    var headerBox = DOM.div().addClass('dimension-header');
    var dimensionRight = DOM.div().addClass('description dimension-header-right');
    var dimensionLeft = DOM.div().addClass('image dimension-header-left');
    dimensionRight.append(dimension.description);

    dimensionLeft.append(img);
    headerBox.append(dimensionLeft);
    headerBox.append(dimensionRight);
    return headerBox;
  };
   
   
  self.renderBatchOn = function(wrap,batch,opts) {
  

    var firstQ = batch[0];
    var activeDimensionName = firstQ.dimensionName();

    var activeDimension = TTI.quizData.dimensions.detect(function(o){ return o.name == activeDimensionName; });
    ////console.log('activeDimension',activeDimension);
    wrap.append(self.headerBoxForDimension(activeDimension));
    wrap.append(DOM.br());


    /*****
    var blips = DOM.ul().addClass('blips');

    TTI.quizData.dimensions.each(function(d) {
      var li = DOM.li(d.name);
      var hit = d.name == activeDimensionName; 
      if (hit) {
        li.addClass('active');      
      }
      li.hover(function(){
        self.publish('blip-hover-start',function(wrap){
          wrap.append(DOM.h4(d.name));
          wrap.append(d.description);
        });
      },
      function(){
        self.publish('blip-hover-end',null);  
      });
      blips.append(li);
    });
    wrap.append(blips);
    **/

    //wrap.append(blipBox);

    var readOnly = opts && opts.readOnly;

    wrap.append(DOM.div().css('clear','both'));
    batch.each(function(q){
      q.renderOn(wrap,{
        readOnly: readOnly
      });
      q.subscribe('question-answered',function(o){
        console.log('aha there is an answer',o);
        self.publish('question-answered',o);
      });

    });
    
    
  };
   
  self.renderQuestionsOn = function(wrap) {
    var content = DOM.div().addClass('question');
    //FIXME!!

    btnPrev.click(function() {

      if (currentBatchIndex == 0) { return false; }

      currentBatchIndex -= 1;
      
      currentBatch = currentBatch.prev;
      content.empty();
      self.renderBatchOn(content,currentBatch);
      self.checkTransport();
      TTI.scrollToTop();
      /***      
      currentQuestion.saveYourself();
      currentQuestion = currentQuestion.prev;
      currentQuestion.renderOn(content);
      currentQuestionIndex -= 1;
      self.checkTransport();
      ****/


    });

    btnNext.click(function() {

      currentBatchIndex += 1;

      currentBatch = currentBatch.next;
      content.empty();
      self.renderBatchOn(content,currentBatch);
      self.checkTransport();
      TTI.scrollToTop();
      
      /****
      currentQuestion.saveYourself();
    
      currentQuestion = currentQuestion.next;
      currentQuestion.renderOn(content);
      currentQuestionIndex += 1;
      self.checkTransport();
      
      ***/
    });
    
    btnSummary.click(function() {
      wrap.empty();
      var map = self.getDimensionLevelsByScore(); //compute fresh from the quiz
      
      TTI.latestMap = map;
      TTI.storage['latest-map'] = JSON.stringify(TTI.latestMap);
      TTI.latestScoringMethod = 'full-quiz';
      TTI.storage.latestScoringMethod = TTI.latestScoringMethod;
      
      
      self.renderSummaryGridOn(wrap,TTI.latestMap);
    });
    
    wrap.append(content);
    wrap.append(DOM.br());
    wrap.append(transport);
    
    
    //render current batch on content...
    content.empty();
    self.renderBatchOn(content,currentBatch);
    self.checkTransport();
    ///currentQuestion.renderOn(content);
    
    
    self.checkTransport();

  };

  self.saveIntro = function() {
    ['name','email','agency','department'].each(function(fieldName) {
      var value = jQuery('#' + fieldName).val();
      TTI.storage[fieldName] = value; 
    });
  };


  self.renderOn = function(wrap) {
  
    //wrap.append(DOM.h1('Welcome to the Quiz!'));
    ///wrap.append(DOM.p('This is the schmooze paragraph where we get to know each other a little'));
    
    //var beginButton = DOM.button('Take Full Quiz').addClass('btn btn-large btn-info');
    
    ///var beginButton = DOM.img().addClass('btn-take-full-quiz btn-full-assessment');
    
    
    
    
    
    beginButton.click(function() {
      TTI.currentHelp = 'full';
      self.saveIntro();
      wrap.empty();
      self.renderQuestionsOn(wrap);
    });    
    
    //var btnOME = DOM.button('1-Minute Evaluation').addClass('btn btn-large btn-info');
    

    
    btnOME.click(function() {
      TTI.currentHelp = 'ome';

      shoppingWrap.empty();
      quizWrap.empty();
      var pretestWrap = jQuery('#pretest-wrap');   
      var pretest = TTI.OneMinuteEvaluation({
        picks: self.getDimensionLevelsByScore()
      });
      pretest.renderOn(quizWrap);
      TTI.pretest = pretest;
      
      pretest.subscribe('ome-show-summary',function(picks){
      
        TTI.currentHelp = 'score';
      
      
        //console.log('omg, picks',picks);
        shoppingWrap.empty();
        quizWrap.empty();
        
        TTI.latestMap = picks;
        TTI.storage['latest-map'] = JSON.stringify(TTI.latestMap);
        TTI.latestScoringMethod = 'one-minute';
        TTI.storage.latestScoringMethod = TTI.latestScoringMethod;
        
 
        if (TTI.storage['latest-map']) {
          TTI.latestMap = JSON.parse(TTI.storage['latest-map']);
        }
        if (!TTI.latestMap || Object.keys(TTI.latestMap).length == 0) {
          /////alert('getting fresh map');
          TTI.latestMap = quiz.getDimensionLevelsByScore();
          TTI.storage['latest-map'] = JSON.stringify(TTI.latestMap);
        }

 
 
 
        quiz.renderSummaryGridOn(quizWrap,TTI.latestMap,'OME');  
      });
    });    

  };

  self.answeredQuestions = function() {
    var answered =  questions.select(function(q) { return q.choice != false; });
    return answered;
  };

  self.maxPointsPossibleForDimension = function(dimensionName) {
    //var answeredQuestions = self.answeredQuestions();
    //TTI.aq = answeredQuestions;
    var accum = questions.inject(0,function(tot,q){      
      //if they've picked N/A, this question is off the record and out of influence to the test taker's final score
      if (q.choice != false && q.choice.answer == "N/A") { return tot + 0; }
    
      var justThisDim = q.spec.answers.collect(function(a) {  return parseInt(a.points[dimensionName],10); });
      ///console.log('jtd',justThisDim);
      
      var sorted = justThisDim.sort().reverse();
      var answerMax = sorted.shift();      
      return tot + answerMax; 
    });
    ///console.log('accum',accum);    
    return accum;    
  };
  
  self.getTotals = function() {
    var tots = {};
    
    //console.log('stats',stats);
    
    
    
    for (x in stats) { 
      var answer = stats[x];
      for (y in answer.points) {
        if (typeof tots[y] == "undefined") {
          tots[y] = 0;
        }
        tots[y] += parseInt(answer.points[y],10);
      } 
    }
    
    //console.log('tots',tots);
    return tots;
  
  };

  self.subscribe('question-answered',function(payload) {
    ////////console.log('payload!!',payload);
    console.log('question-answered!! zeee',payload);
    stats[payload.id] = payload.answer;
    self.saveYourself();
  });



  self.loadYourself = function() {
    
    TTI.getQuestions().each(function(q) {
      q.loadYourself();
    });
    
    if (typeof TTI.storage.stats != "undefined") {
      stats = JSON.parse(TTI.storage.stats);
    }
  };
  
  self.saveYourself = function() {
    //questions get saved elsewhere, just save quiz-level stuff here
    TTI.storage.stats = JSON.stringify(stats);
  };
  
  
  
  
  self.textSummary = function() {
  
    var result = '';  
  
  
    result += 'TEST TAKER\n\n';
  
    ['name','email','agency','department'].each(function(fieldName) {
      var value = TTI.storage[fieldName];
      if (typeof value != "undefined") {
        result += fieldName + ': ' + value + '\n';
      }
    });
  
  
    
    result += '\n';
    
    
        
    batches.each(function(batch){
      var questions = batch;
      var firstQ = batch[0];
      var activeDimensionName = firstQ.dimensionName();
  
      var activeDimension = TTI.quizData.dimensions.detect(function(o){ return o.name == activeDimensionName; });

      console.log('batch',batch);

      result += '\n\n' + activeDimensionName.toUpperCase() + '\n\n';


      questions.each(function(q) {
        q.loadYourself();

        result += '\n';
        
        
        var qLines = TTI.wrap(q.spec.question,120);
        var firstQLine = true;
        qLines.each(function(line){
          if (firstQLine) {
            firstQLine = false;
            result += 'Q: ' + line + '\n';
          }
          else {
            result += '   ' + line + '\n';
          }
        
        });
        
        result += '\n';
        
        q.spec.answers.each(function(answer){
          var lines = TTI.wrap(answer.answer,120);
          var first = true;
          var answerText = '';
          
          lines.each(function(line){
            if (first) {
              first = false;
              if (q.choice == answer) {
                answerText += '* A: ' + line + '\n';
              }
              else {
                answerText += '  A: ' + line + '\n';
              }
            }
            else {
              answerText += '     ' + line + '\n';          
            }          
          });
          result += answerText + '\n';
        });
        /////q.renderOn(wrap);
        
        
        if (q.notes.length > 0) {
          var notesLines = TTI.wrap(q.notes,120);
          result += self.textBlock(notesLines,'NOTES: ');  
        }
        
      });
    });
    result += '\n';
    return result;
  };
  
  
  self.textBlock = function(lines,prefix) {
    var result = '';
    var spacer = '';
    for (var i = 0; i < prefix.length; i += 1) { spacer += ' '; }
    var first = true;
    lines.each(function(line){
      if (first) {
        first = false;
          result += prefix + line + '\n';
      }
      else {
        result += spacer + line + '\n';          
      }          
    });
    return result;
  };
  

  self.printableQASummary = function() {
    var wrap = DOM.div();
    


    var btnGroup = DOM.div().addClass('btn-group');


    var btnPrint = DOM.a('Print').addClass('btn btn-success btn-print');
    btnPrint.click(function() {
      window.print();
    });
    
    
    
    var btnClipboard = DOM.a('Text-only Version').addClass('btn btn-success btn-clipboard');
    btnClipboard.click(function() {
      //////window.print();
      /////alert('clipboard!!');
      
      TTI.storage.textSummary = self.textSummary();
      window.open('text.htm');
    });
    
    
    btnGroup.append(btnPrint);
    btnGroup.append(btnClipboard);
    
    wrap.append(btnGroup);
    wrap.append(DOM.br());



    if (TTI.storage.name) {
        var h3 = DOM.h3('Assessment Taker');
        wrap.append(h3);
        var ul = DOM.ul().addClass('final-summary-test-taker-info');
        ['name','email','agency','department'].each(function(fieldName) {
          var value = TTI.storage[fieldName];
          if (typeof value != "undefined") {
            var li = DOM.li(value);
            ul.append(li);
          }
        });
        wrap.append(ul);
    }

    
    
    
    
    batches.each(function(batch){
      self.renderBatchOn(wrap,batch,{ readOnly: true });
    });
    
    
    
    /***
    questions.each(function(q) {
      q.loadYourself();
      var qdiv = DOM.div();
      
      q.renderOn(qdiv);
      wrap.append(qdiv);
      /////q.renderOn(wrap);
    });
    ******/
    
  
    return wrap;  
  };

  self.renderPrintableSummaryOn = function(wrap) {
    wrap.empty();
    wrap.append(self.printableQASummary());
  };
   
  return self;
};

  TTI.OneMinuteEvaluation = function(spec) {
    var self = TTI.PubSub({});
    var backplane = self;
    
    var picks = spec.picks;
    self.picks = picks;
    
    
    self.selectedDimensions = function() {
      var keys = [];
      
      for (var key in picks) {
        keys.push(key);
      }
      
      var result = TTI.quizData.dimensions.select(function(dim){ 
        return keys.detect(function(key) { return key == dim.name; });
      });
      
      return result;
    };
  
    self.renderOn = function(wrap) {
      var summary = DOM.div().addClass('summary one-minute');  
      var table = DOM.table().addClass('table table-bordered table-condensed');
      var headerRow = DOM.tr();
      headerRow.append(DOM.th('Dimension').addClass('th-inverse dimension'));

      headerRow.append(DOM.th('Level 1').addClass('th-inverse'));
      headerRow.append(DOM.th('Level 2').addClass('th-inverse'));
      headerRow.append(DOM.th('Level 3').addClass('th-inverse'));
      headerRow.append(DOM.th('Level 4').addClass('th-inverse'));
      table.append(headerRow);
      
      //var totals = self.totals();
      ///console.log('totals',totals);
          
      TTI.quizData.dimensions.each(function(dimension) {
        var dimensionName = dimension.name;
        //var points = totals[dimensionName] || 0;     
        var points = 100;
        //var myScore = self.percentScore(dimensionName,points) + ' (' + points + '/' + self.maxPointsPossibleForDimension(dimensionName) + ')';
        var myScore = 100;
        ///var myLevel = self.lookupLevel(dimensionName,points);
        var myLevel = dimension.levels[dimension.levels.length-1];
        
        var tr = DOM.tr();
      
        ////////tr.append(DOM.td(dimensionName).addClass('dimension'));
      
        var dimCell = DOM.td().addClass('dimension');
        dimCell.append(TTI.dimensionBox(dimension,{ showBlips: true }));
        tr.append(dimCell);
      
        
        //*** *** *** tr.append(DOM.td(dimension.description).addClass('description'));
           
        [1,2,3,4].each(function(n){ // was [1,2,3,4] prior to 8/28/2013
          var levelN = dimension.levels.detect(function(level) { return level.id == n; });    
                    
          var td = DOM.td().addClass('dim-level-cell');

          var radioLabel = DOM.label();
          radioLabel.append(levelN.text);

          ///td.append(levelN.text);
          td.click(function(e){            
            var dimHash = dimension.name;
            
            if (typeof picks[dimHash] == "undefined") {
              picks[dimHash] = false;
            }
            picks[dimHash] = levelN;
                        
            td.siblings().removeClass('selected');
            td.addClass('selected');
            
            ///////radio.attr('checked',true);
          });

          td.append(radioLabel);
          
          tr.append(td);
        });
        table.append(tr);
      });
      
      var lastRow = DOM.tr();
      var lastCell = DOM.td().attr('colspan',6);
      
      var omeShowSummary = DOM.button('Show Summary').addClass('btn btn-info');
      omeShowSummary.click(function(){
        self.publish('ome-show-summary',picks);      
      });
      lastCell.append(omeShowSummary);
      lastRow.append(lastCell);

      table.append(lastRow);
        
        /////////var actionLink = DOM.a('We Suggest').addClass('btn btn-warning').attr('href',level.action).attr('target','_blank');
        
      summary.append(table);    
      wrap.append(summary);
    };
    return self;  
  };
