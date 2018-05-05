TTI.ShoppingCart = function(spec) {
  var self = TTI.PubSub({});
  



  var dimensionSelect = DOM.div().addClass('dimension-select');

  var dragAndDropWrap = DOM.div().addClass('drag-and-drop');
  
  var chosenWrap = DOM.div().attr('id','chosen-wrap').addClass('column');    //jQuery('#chosen-wrap');
  var chosenList = DOM.ul().addClass('chosen contacts-ul');

  var unchosenWrap = DOM.div().attr('id','unchosen-wrap').addClass('column');    ///jQuery('#unchosen-wrap');
  var unchosenList = DOM.ul().addClass('unchosen contacts-ul');

  /////
  var actionLink = DOM.a().addClass('action-link printer-link').attr('href','javascript:void(0);');
  var allPrinterImg = DOM.img().attr('src','images/printer.png').attr('alt','All Actions All Levels');
  actionLink.append(allPrinterImg);
  actionLink.append('&nbsp;');
  actionLink.append('All Actions All Levels');


  var reportColumnDimName = DOM.h5().addClass('report-column-dimension-name');



  ////////
  var btnCheckout = DOM.a().addClass('checkout-link printer-link').attr('href','javascript:void(0);');
  var myPrinterImg = DOM.img().attr('src','images/printer.png').attr('alt','My Selected Actions');
  btnCheckout.append(myPrinterImg);
  btnCheckout.append('&nbsp;');
  btnCheckout.append('My Selected Actions');

  var preview = DOM.div().addClass('report-preview');

  var sorted = {};
  
  
  var cartActions = {};
  
  
  self.cartActions = cartActions;
  

  eachify(TTI.quizData.dimensions).eachPCN(function(o) {
    var current = o.current;
    
    
    current.next = o.next;
    current.prev = o.next;
    current.addenda = TTI.getAddenda(current.name);  
  });


  TTI.quizData.dimensions.each(function(o){ //init empty
    cartActions[o.name] = [];
  });


  var level = spec.level;
  var dimension = spec.dimension;


  /*********
  function obsoleteActionListItem(action) {
    var li = DOM.li().addClass('ui-corner-all');    

    var dlaKey = dimension.name + '::SD' + action.subdimensionID + '::L' + action.level + '::A' + action.actionID;
    
    li.attr('id',dlaKey);
    var handle = DOM.div().addClass('handle');
    //////handle.append(DOM.span(dlaKey).addClass('dla-key')); //for debugging filtering logic
    handle.append(DOM.span(action.statement));
    handle.append(DOM.div().css('clear','both'));
    li.append(handle);    
    return li;
  }
  ******/  
  
  
  function otherList(elem) {
    var parents = elem.parents('.ui-sortable');
    ///console.log('parents',parents);
    //var otherSelector = ['chosen','unchosen'].select(function)
    var unchosenMatch = parents.attr('class').match('unchosen');
    var other = false;
    
    if (unchosenMatch) { 
      other = jQuery('.chosen'); 
    } else { 
      other = jQuery('.unchosen'); 
    }
    /////console.log('otherList::other',other);
    return other;
  }
  
  function cartActionListItem(cartAction,linkText) {
    var li = DOM.li().addClass('ui-corner-all');    
    var dlaKey = cartAction.hash(); /////////dimension.name + '::SD' + action.subdimensionID + '::L' + action.level + '::A' + action.actionID;
    li.attr('id',dlaKey);
    var handle = DOM.div().addClass('handle');
    //handle.append(DOM.span(dlaKey).addClass('dla-key')); //for debugging filtering logic
    handle.append(DOM.span(cartAction.spec.action.statement));
    handle.append(DOM.div().css('clear','both'));
    
    var linkTextMap = {
      'select': 'unselect',
      'unselect': 'select'
    };
    
    
    var link = DOM.button(linkText).addClass('btn btn-sm cartaction-selection');
    link.click(function(e){
      e.stopPropagation();
      var parent = li.parent();

      var other = otherList(li);  
      other.append(li);
      other.trigger('sortupdate');
      other.trigger('sortstop');
      
            
      parent.trigger('sortupdate');
      parent.trigger('sortstop');
      
      setTimeout(function(){
        parent.find('li:first-child button').focus();        
      },200);
    });
    
    handle.append(link);
    
    
    li.append(handle);    
    return li;
  };


  ///SAME DIMENSION

  self.sameDimensionActions = function() {
    var result = dimension.addenda.actions;
    return result;
  };
  self.sameDimensionCartActions = function() {
    var result = self.sameDimensionActions().map(function(action){
      var levelMatchingThisAction = dimension.levels.detect(function(lvl){
        return lvl.id == action.level;
      });
      return TTI.CartAction({ 
          dimension: dimension,
          action: action,
          level: levelMatchingThisAction
      });
    });    
    return result;
  };

  //SAME DIMENSION AND LEVEL
  

  self.sameDimensionLevelActions = function() {
    var result = dimension.addenda.actions.select(function(action) {
      return action.level == level.id;  
    });
    return result;
  };



  
  self.sameDimensionLevelCartActions = function() {
    var result = self.sameDimensionLevelActions().map(function(o){
      return TTI.CartAction({ 
          dimension: dimension,
          action: o,
          level: level
      });
    });    
    return result;
  };
  
  
  self.chosenCartActions = function() {
    var result = cartActions[dimension.name];
    if (!result) { return []; }
    return result;
  };


  self.chosenCartActions = function() {
    var result = cartActions[dimension.name];
    if (!result) { return []; }
    return result;
  };
  
  
  self.unchosenCartActions = function() {
    var chosenHashes = self.chosenCartActions().map(function(o){  return o.hash(); });
    ////console.log('chosenHashes',chosenHashes);    
    //all CartActions minus those whose hashes can be detected in the chosenHashes list
    var result = self.sameDimensionLevelCartActions().reject(function(o){
      
    
      return chosenHashes.detect(function(hash) { 
        //////console.log('o.hash',o.hash,'hash',hash);
        return o.hash() == hash; 
      });
      
      
    });
    
    
    return result;  
  };
  
  self.availableCartActions = function() {  
    var candidates = sameDimensionLevelCartActions();
    /////console.log('candidates',candidates);
    return candidates;
  };

  self.elongate = function() {
    var shorter, longer = false;
    var total = unchosenList.height() + chosenList.height();
    if (total == 0) { return false; }
    
    if (unchosenList.height() > chosenList.height()) {
      shorter = chosenList;
      longer = unchosenList;
    }
    else {
      shorter = unchosenList;
      longer = chosenList;
    }
    shorter.animate({
      height: longer.height()
    },100);

 
 
 
 
 
    
    if (unchosenList.height() > chosenList.height()) {
      shorter = chosenList;
      longer = unchosenList;
    }
    else {
      shorter = unchosenList;
      longer = chosenList;
    }
    shorter.animate({
      height: longer.height()
    },100);
  };


  self.redraw = function() {
    var actions = self.sameDimensionLevelActions();
    /////console.log(actions.map(function(o){ return o.level; }));
    unchosenList.empty();
    chosenList.empty();

   
    self.unchosenCartActions().each(function(cartAction){
      var li = cartActionListItem(cartAction,'select');
      unchosenList.append(li);
    });
    
    
    self.chosenCartActions().each(function(cartAction){
      var li = cartActionListItem(cartAction,'unselect');
      chosenList.append(li);
    });
    
    
    var reportWrap = jQuery('.report-wrap');
    if (level.id == 4) {
      self.renderLevel4On(unchosenList);
    }
    else {
      dragAndDropWrap.show();
      reportWrap.empty();
    }
    

    self.elongate();


    var populated = unchosenList;
    if (populated.children().length == 0) {
      populated = chosenList;
    }
    populated.find('li:first-child button').focus();
    
  };
  

  function refreshActionLink() {
  
    //////console.log('refreshActionLink, dimension is',dimension);
  

    var briefName = dimension.name + ' Level ' + level.id;
    if (level.id != 4) {
      briefName += ' to Level ' + (parseInt(level.id,10) + 1);
    }
    var msg = "To view a complete list of actions for " + briefName + ", click here";

    ////oldActionDescription.empty();
    ///////oldActionDescription.html(msg);
  
    actionLink.attr('target','_blank');
    ///actionLink.attr('href',level.action);
    
    
    var allFile = TTI.slugify(dimension.name) + '_all.htm';
    
    actionLink.attr('href',allFile);
    
    
    
    
    ///actionLink.empty();
    ///////actionLink.append(DOM.img().attr('src','images/pdficon_large.png'));

    reportColumnDimName.html(dimension.name);

  };


  function refreshActionLinkV1() {
  
    //////console.log('refreshActionLink, dimension is',dimension);
  

    var briefName = dimension.name + ' Level ' + level.id;
    if (level.id != 4) {
      briefName += ' to Level ' + (parseInt(level.id,10) + 1);
    }
    var msg = "To view a complete list of actions for " + briefName + ", click here";

    ////oldActionDescription.empty();
    ///oldActionDescription.html(msg);
  
    actionLink.attr('target','_blank');
    actionLink.attr('href',level.action);
    actionLink.empty();
    actionLink.append(DOM.img().attr('src','images/pdficon_large.png'));
    return actionLink;
  };



  
  
  self.recenterTo = function(dim) {
    
    //////console.log('item/dim',dim);
    dimension = dim;
    
    level = dimension.levels[0];
    ///console.log('old style level',level);
    level = spec.map[dimension.name];
    ////console.log('level?!',level);
    self.publish('level-change',level);
    self.publish('tested-at-level',level);
    
    cartActions[dim.name] = self.loadCartActions(dim.name);
    
    chosenList.empty();
    
    ////jQuery('ul.chosen').height(jQuery('ul.unchosen').height())
    
    refreshActionLink();
    self.redraw();

    ////console.log('sorted??',sorted);

  };

  self.renderOn = function(wrap) {

    highlightNavButton(jQuery('#navbar .btn-actions'));



    var dimensionItems = TTI.quizData.dimensions.map(function(o) {
    return { label: o.name, object: o };
    });

    var dropdownWrap = DOM.div().addClass('dropdown-wrap');
    
    var levelColumn = DOM.div().addClass('level-column');
    var reportColumn = DOM.div().addClass('report-column');
    

    
    
    var assessedLabel = DOM.label('Assessed:').addClass('lbl-assessed');
    levelColumn.append(assessedLabel);
    
    var testedAtLevel = DOM.span().addClass('tested-at-level');
    self.subscribe('tested-at-level',function(o){
      testedAtLevel.html(o.name);
    });
    levelColumn.append(testedAtLevel);
    levelColumn.append(DOM.div('&nbsp;').addClass('clear-both'));

    var viewingLabel = DOM.label('Viewing:').addClass('lbl-viewing');  
    levelColumn.append(viewingLabel);
    
    ///DOM.label('Level - Define actions to help you progress from:').addClass('input-label'));    
  
    
    TTI.quizData.dimensions.each(function(item){

      var box = TTI.dimensionBox(item,{ showBlips: false });
      if (item.name == dimension.name) {
        box.addClass('selected');
      }
      box.click(function(){
        box.siblings().removeClass('selected');
        box.addClass('selected');
        //////dimension = item;
        self.recenterTo(item);
      });
  
      dimensionSelect.append(box);
    });



    /////console.log('dd level',level);
    
    


    //NOTE: this enumerates through the levels for the active dimension, which may change through user interaction with the previous dropdown. However, in practice, those levels are the same for each dimension, so the levels don't _really_ have to rerender or refresh along with the dimension changes.
    
    
    
    var levelItems = dimension.levels.select(function(o){
      return o.id != 4;
    }).map(function(o) { 
     
      var msg = 'Level ' + o.id;
      
      if (o.id != 4) {
        msg = msg + ' to Level ' + (parseInt(o.id,10) + 1);
      }
     
      return { label: msg, object: o };
    });

    
    /////console.log('levelItems',levelItems);
    
    var select = DOM.select();
    levelItems.each(function(o){
      var option = DOM.option();
      option.html(o.label);
    
      select.append(option);
      
      
    });
    select.change(function(){
      ////console.log('selectedIIIIINDEEX',this.selectedIndex);
      var chosen = levelItems[this.selectedIndex].object;
      self.publish('level-change',chosen);
    });
    levelColumn.append(select);


    dropdownWrap.append(levelColumn);
    dropdownWrap.append(reportColumn);
    
    self.subscribe('level-change',function(o){
    
      /////console.log('i heard level change!!',o);
    
      level = o;
      select[0].selectedIndex = level.id - 1;
      refreshActionLink();
      self.redraw();
    });
    
    /////self.publish('level-change',level); //initial setting of UI


    self.recenterTo(dimension);//initial kickoff

    wrap.append(dropdownWrap);


    refreshActionLink();
    
    reportColumn.append(reportColumnDimName);
    
    reportColumn.append(actionLink);
    
    reportColumn.append(btnCheckout);
    

    wrap.append(DOM.div().css('clear','both'));
    
    ///dragAndDropWrap.append(DOM.label('Pull desired actions from the left box to the right box').addClass('input-label'));    
    dragAndDropWrap.append(DOM.div().css('clear','both'));
    
    

    btnCheckout.click(function(){
      /////console.log('dimension!!',dimension);
    
        var containerFluid = DOM.div().addClass('container-fluid');
        var rowFluid = DOM.div().addClass('row-fluid');
        var spacer = DOM.div().addClass('col-md-2');
        var instruction = DOM.div().addClass('instruction col-md-8 report-wrap');
        
        
        if (cartActions[dimension.name].length == 0){
          //possibly alert that there's nothing selected!
          
          /////btnCheckout.addClass('disabled');
          return false; 
        }
        
        self.renderCartActionsOn(instruction);
        
        rowFluid.append(spacer);
        rowFluid.append(instruction);
        containerFluid.append(rowFluid);
    
        var datauri = TTI.toDataURI(containerFluid.html());
    
        
        TTI.storage.reportDataURI = datauri;
        window.open('report.htm');
    });
 

    //chosen
    chosenWrap.append(DOM.label('My Selected Actions'));
    chosenWrap.append(chosenList);
    
    chosenList.sortable({ 
      handle: ".handle", 
      connectWith:'.contacts-ul' //allows dragging between separate UL containers (assigned, unnassigned)
    });

    chosenList.bind('sortstop',function(event,ui) {
      console.log('sortstop?',event,ui);
      var order = chosenList.sortable('toArray');  
      sorted[dimension.name] = order;
      ///////////self.saveSorted();
      ////////console.log('sortstop, sorted =',sorted,'ui=',ui);
    });

    chosenList.bind('sortupdate',function(event,ui) {
      console.log('sortupdate?',event,ui);
      var order = chosenList.sortable('toArray');  
      sorted[dimension.name] = order;
      ////////self.saveSorted();
      
      /////console.log('sortupdate, sorted =',sorted);
      cartActions[dimension.name] = sorted[dimension.name].map(function(o){    
        var parts = o.split(/::/);
        /////console.log('parts',parts);

        var dimName = parts[0];
        var dimension = TTI.quizData.dimensions.detect(function(d){ return d.name == dimName; });
        var subdimensionID = parts[1].split(/[a-z|A-Z]+/).pop();
        var levelID = parts[2].split(/[a-z|A-Z]+/).pop();
        var actionID = parts[3].split(/[a-z|A-Z]+/).pop();

        //console.log('levelID',levelID);
        var level = dimension.levels.detect(function(o){  return o.id == levelID; });
        /////console.log('level name',level.name);
        var action = dimension.addenda.actions.detect(function(a){
          ///console.log('a',a,actionID,levelID,subdimensionID);
          return a.actionID == actionID && a.level == levelID && a.subdimensionID == subdimensionID;
        });                
                
        return TTI.CartAction({
          dimension: dimension,
          action: action,
          level: level
        });
      });
      
      self.saveCartActions(dimension.name);
      
    });

    chosenList.bind('sortupdate',function(event,ui){
      ///console.log('chosenList okay!',ui);
      chosenList.find('.cartaction-selection').text('unselect');
    });
    
    unchosenList.bind('sortupdate',function(event,ui){
      ////console.log('unchosenList okay! >#>#>',ui);
      unchosenList.find('.cartaction-selection').text('select');
    });
      
      
 


    
    //unchosen
    unchosenWrap.append(DOM.label('Available Actions'));
    unchosenWrap.append(unchosenList);

    unchosenList.sortable({ 
      handle: ".handle", 
      connectWith:'.contacts-ul' 
    });
    
    dragAndDropWrap.append(unchosenWrap);
    dragAndDropWrap.append(chosenWrap);
    
    
    wrap.append(dimensionSelect);
    wrap.append(dragAndDropWrap);
    
    
    wrap.append(DOM.div().addClass('clear-both'));
    wrap.append(preview);
    
    self.redraw();
    
  };
  
  self.loadCartActions = function(dimName) {
    var loadedHashes = TTI.storage['cartaction-hashes-' + dimName];
    if (!loadedHashes) { return []; }
    
    var hashes = JSON.parse(loadedHashes);

    /////console.log('hashes',hashes);
    
    var all = self.sameDimensionCartActions();
    /////console.log('all',all);
    
    var subset = hashes.map(function(hash){
      return all.detect(function(o){ return o.hash() == hash });
    });
    
    ////////console.log('subset',subset);
    return subset;
    //////return "NARF";
  };

  self.saveCartActions = function(dimName) {
    var hashes = cartActions[dimension.name].map(function(o){
        return o.hash();
    });
    TTI.storage['cartaction-hashes-' + dimName] = JSON.stringify(hashes); 
  };
  
  
  
  
  self.renderLevel4On = function(wrap) {
    wrap.empty();



    wrap.append('You have scored a Level 4 in this dimension.  Please refer to listings from the Levels 1, 2, and 3, to see if there are additional actions your agency would benefit from implementing.');
  
  
  };
  
  
  self.obsoleteRenderLevel4On = function(wrap) {



    wrap.append(DOM.link().attr('href',location.href + '/lib/bootstrap/css/bootstrap.min.css').attr('rel','stylesheet').attr('media','screen,print'));    
    wrap.append(DOM.link().attr('href',location.href + '/css/instruction.css').attr('rel','stylesheet').attr('media','screen'));    


      wrap.append(DOM.h3('Traffic Management Capability Maturity Model').addClass('header'));
      
      

      var titleHeader = DOM.h1();
      titleHeader.append(dimension.name + ' - Level ');
      titleHeader.append(DOM.span('4').addClass('levelnum'));
    
    
      wrap.append(titleHeader);    
      
      var isAre = 'is';
      
      if (dimension.name.substr(-1,1) == 's') {
        isAre = 'are';
      }
      
      
      wrap.append(DOM.h2('Why ' + isAre + ' ' + dimension.name + ' important?')); 

      var whyLines = [];
      var why = '';
            
      whyLines.push('The use of formal, collaborative and performance- and objective driven approach to Planning, Programming and Budgeting of Traffic Management');
      whyLines.push('initiatives will allow agencies to invest, prioritize and implement the right systems required to support mobility, reliability and safety-related goals.');
      why = whyLines.join(" ");
      wrap.append(DOM.p(why)); 

      wrap.append(DOM.h2('Future Improvements'));
    
      whyLines = [];
      whyLines.push('The results of the evaluation show that your agency has achieved a Level ' + level.id + ' status in ' + dimension.name + '.');
      why = whyLines.join(" ");
      wrap.append(DOM.p(why)); 
      
      
      
      whyLines = [];
      whyLines.push("This means that within your agency, Traffic Management has been established as a core and sustainable program priority. Your agency's efforts");
      whyLines.push('in traffic management represent a continuous improvement process supported by top level management and formal partnerships with other agencies.');
      why = whyLines.join(" ");
      wrap.append(DOM.p(why)); 
      
      
      whyLines = [];
      whyLines.push('Your agency likely has significant experience with the action plans encompassed by the transition documents between Levels 1, 2, 3, and 4.');
      whyLines.push('Few agencies however, have documented the continuing steps that should be taken to maintain and continually improve at a Level 4 status.');
      why = whyLines.join(" ");
      wrap.append(DOM.p(why)); 

      whyLines = [];
      whyLines.push('Compiling that information and expanding the guidance is a key desire of the Federal Highway Administration (FHWA).');
      whyLines.push('Your feedback on both the tool and the Level 4 action items are critical to share.');
      why = whyLines.join(" ");
      wrap.append(DOM.p(why)); 

      whyLines = [];
      whyLines.push('Please consider providing information from your agency and the continual improvement process for Level 4 to <a href="mailto:Jim.hunt@dot.gov">Jim.hunt@dot.gov</a>');
      why = whyLines.join(" ");
      wrap.append(DOM.p(why)); 
  };
  
  self.renderCartActionsOn = function(wrap) {
    
    ///console.log('cartActions',cartActions);

    ///wrap.append(DOM.link().attr('href',location.href + '/lib/bootstrap/css/bootstrap.min.css').attr('rel','stylesheet').attr('media','screen,print'));    
    ////wrap.append(DOM.link().attr('href',location.href + '/css/instruction.css').attr('rel','stylesheet').attr('media','screen,print'));    
    
    var hit = cartActions[dimension.name];
    
    if (!hit) { return false; }
    
    
    
    var sortedWee = cartActions[dimension.name].sort(function(a,b){
      var keyA =  + a.spec.action.level + '::' + a.spec.action.actionID;
      var keyB =  + b.spec.action.level + '::' + b.spec.action.actionID;

      if (keyA < keyB) { return -1; }
      if (keyA > keyB) { return 1; }
      return 0;
    });

    var sets = [];
    var set = [];
    
    //console.log('sortedWee',sortedWee);
    var save = false;
    sortedWee.each(function(o){
      var level = o.spec.action.level; 
      
      if (save != level) {
        if (set.length > 0) {
          sets.push(set);
        }
        set = [];
      }
      set.push(o);
      save = level;
    });

    if (set.length > 0) {
      sets.push(set);
    }
    //console.log('sets',sets);
    sets.each(function(set){ //set of cartactions belonging to the same level.
    

      var row; //going to be used a lot.
        
      var firstAction = set[0];
      var dimension = firstAction.spec.dimension;      
      var level = firstAction.spec.level;

      ///console.log('set',set);
      var actionsForThisLevelSet = set.map(function(o){ return o.spec.action; });
      ///console.log('actionsForThisLevelSet',actionsForThisLevelSet);

      var subdimensionIDs = [];      
      set.each(function(o){  
        var id = o.spec.action.subdimensionID;
        if (subdimensionIDs.indexOf(id) == -1 ) {
          subdimensionIDs.push(id);
        }
      });

      var subdimensions = subdimensionIDs.sort().map(function(id){
        return dimension.addenda.subdimensions.detect(function(sd){
          return sd.subdimensionID == id;
        });      
      });


      ///console.log('encountered subdimensions',subdimensions);

      ///console.log('firstAction',firstAction);


      //////////////
      
      
      var header = DOM.h3('Traffic Management Capability Maturity Model').addClass('header');
      
      wrap.append(header);
      
      var fromLevelID = parseInt(firstAction.spec.level.id,10);

      var titleHeader = DOM.h1();
      titleHeader.append(dimension.name + ' Guidance - Level ');
      titleHeader.append(DOM.span(fromLevelID ).addClass('levelnum'));
      titleHeader.append(' to Level ');      
      titleHeader.append(DOM.span(fromLevelID + 1).addClass('levelnum'));
    
    
      wrap.append(titleHeader);    
      
      
      var beingVerb = 'is';
      
      /////if (dimension.name.match(/\ and\ /)) { beingVerb = 'are'; }
      if (dimension.name.match(/es$/)) { beingVerb = 'are'; }
      
      
      
      wrap.append(DOM.h2('Why ' + beingVerb + ' ' + dimension.name + ' important?')); 
      wrap.append(DOM.p(dimension.addenda.why)); 
    
      wrap.append(DOM.h2('Improvement Target'));
      
      
      var thisLevelTargetText = dimension.addenda['level' + fromLevelID + 'TargetText'];
      var nextLevelTargetText = '';
      if (fromLevelID != 4) {
        nextLevelTargetText = dimension.addenda['level' + (fromLevelID + 1) + 'TargetText'];
      }
      
      var improvementTable = DOM.table().addClass('instruction');
      
      row = DOM.tr();
      row.append(DOM.th('From:'));
      row.append(DOM.td(thisLevelTargetText));
      improvementTable.append(row);      

      row = DOM.tr();
      row.append(DOM.th('To:'));
      row.append(DOM.td(nextLevelTargetText));
      improvementTable.append(row);      
    
      wrap.append(improvementTable);
      
      wrap.append(DOM.h2('Key Sub-dimensions'));
      
      var subUL = DOM.ul();
      
      subdimensions.each(function(sd){
      
        var sdSlug = TTI.slugify('level-' + fromLevelID + '-' + sd.name);
        //////////console.log('sdSlug',sdSlug);
      
        var link = DOM.a(sd.name).attr('href','#' + sdSlug);
      
        subUL.append(DOM.li(link));
      });    
      //subUL.append(DOM.li());
      wrap.append(subUL);


      var levelFromToText = '(level ' + fromLevelID + ' To Level ' + (fromLevelID + 1) + ')';

      subdimensions.each(function(sd){
        
        var sdSlug = TTI.slugify('level-' + fromLevelID + '-' + sd.name);
        
        var theH3 = DOM.h3(sd.name + ' action plan ' + levelFromToText).addClass('plan').attr('id',sdSlug);
        wrap.append(theH3);    
        
          
        wrap.append(DOM.h4('Sub-Dimension Summary'));
        wrap.append(DOM.p(sd.text));
        wrap.append(DOM.h4('Key Actions'));
        var sdCartActions = set.select(function(o){
          return o.spec.action.subdimensionID == sd.subdimensionID; 
        });
        /////console.log('sdCartActions',sdCartActions);
        var keyActionsList = DOM.ol();
        
        sdCartActions.each(function(sdca){
          keyActionsList.append(DOM.li(sdca.spec.action.statement));
        });
        wrap.append(keyActionsList);


        sdCartActions.each(function(sdca){
          var action = sdca.spec.action;
          
          var msg = 'Action: ';
          msg += action.statement;
          
          wrap.append(DOM.p(msg).addClass('action'));
          
          wrap.append(DOM.p().append(DOM.span('Definition:').addClass('term')).append(action.definition));          
          wrap.append(DOM.p().append(DOM.span('Rationale:').addClass('term')).append(action.rationale));          
          wrap.append(DOM.p().append(DOM.span('Responsible Party:').addClass('term')).append(action.responsibility));
        });



        
      });
    });
    
    
    
    
    
    
    
    //<h1>Business Process Guidance - Level <span class="levelnum">1</span> to Level <span class="levelnum">2</span></h1>
    
  };
  
  ////self.loadSorted();
  
  
  return self;
};
