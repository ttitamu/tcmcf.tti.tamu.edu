if (typeof TTI ==  "undefined") { var TTI = {}; }
if (typeof TTI.Widgets ==  "undefined") { TTI.Widgets = {}; }

TTI.Widgets.DropdownField = function(spec) {
  var wrap = jQuery('<div class="tti-dropdown-field"></div>');
  if (spec.id) {
    wrap.attr('id',spec.id);
  }

  var select = DOM.select();

  var self = {};

  self.selected = spec.selected;
  self.options = spec.options;

  self.redraw = function() {
    ////console.log('redraw...wrap is',wrap,'options are',self.options);
  
    self.selected = false;
    wrap.empty();
    select.empty();
    self.renderInnardsOn(wrap);
    
    if (self.options.length > 0) {
      self.selected = self.options[0].object;   

    }
    select.trigger('change');
  };

  self.renderInnardsOn = function(html) {
    var label = jQuery('<label></label>');

    self.options.each(function(item){
      var opt = DOM.option();

      opt.html(item.label);
      
      //////console.log('comparing',item.object, ' to ',self.selected);
      
      if (item.object == self.selected) {
      
        ///////console.log('***MMMMMmaaatch');
        opt.attr('selected','selected');
      }
      opt.click(function() {
        //console.log('click');
      });     
      opt.change(function() {
        //console.log('opt-change');
      });     
      
      select.append(opt);
    });
    
    if (spec.label) {
      label.html(spec.label);
    }    
   
    if (spec.cssClass) {
      editBox.addClass(spec.cssClass);       
    }
    select.change(function() {
      var selectedObject;
      
      if (self.options.length == 0) {
        selectedObject = false;
      }
      else {
        var idx = this.selectedIndex;
        selectedObject = self.options[idx].object;      
        ///////console.log('idx',idx,'options',self.options);      
      } 
      spec.onChange(selectedObject);
    });
    
    //label.append('<br />');
    label.append(select);
    //label.append('<br />');
    
    html.append(label);
  };

  self.renderOn = function(html) {
    self.renderInnardsOn(wrap);
    html.append(wrap);
  };
  
  self.hide = function() {
    wrap.empty();  
  };
  
  self.show = function() {
    self.renderInnardsOn(wrap);
  };

  return self;
};