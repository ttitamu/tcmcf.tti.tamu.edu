if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, '');
  };
}

if (typeof TTI ==  "undefined") { var TTI = {}; }

TTI.storage = TTI.Storage('local'); //has IE shim.

TTI.chunkify = function(ary,chunkSize) {
  var chunks = [];
  var aryCopy = ary.select(function(o){ return true; }); 
  while (aryCopy.length > chunkSize) {
    chunks.push(aryCopy.splice(0,chunkSize));
  }
  chunks.push(aryCopy);
  return chunks;
};



  TTI.wrapName = function(str) {
    //console.log('wrap?',str);
    var map = {
      'Business Processes':      'Business<br />Processes',
      'Systems and Technology': 'Systems and<br />Technology',
      'Performance Measurement': 'Performance<br />Measurement',
      'Organization and Workforce': 'Organization<br />and Workforce',
      'Culture': 'Culture',
      'Collaboration': 'Collaboration'
    };
    
    if (map[str]) { 
      return map[str]; 
    }
    return str;
  };
  
  

  TTI.wrap = function(str,len) {
    function helper(accum,len) {
      if (str.length < len) { return [str]; }
      var lastLine = accum.pop();
      var words = lastLine.split(/\ +/);
      var remainder = [];
      
      while (words.join(" ").length > len) {
        remainder.unshift(words.pop());
      }
      var part1 = words.join(" ");
      var part2 = remainder.join(" "); 
      accum.push(part1);
      accum.push(part2);
      
      if (part2.length > len) {
        helper(accum,len);
      }
    }
    var lines = [str];
    helper(lines,len);  
    return lines;
  };
  

TTI.dimensionBox = function(dimension,opts) {

    var box = DOM.a().addClass('box dimension-box').attr('href','javascript:void(0);');
    var icon = DOM.div().addClass('icon');
    var img = DOM.img().attr('alt',dimension.name);
    img.attr('src', 'images/' + dimension.slug + '_c.png');
    icon.append(img);
    box.append(icon);

    
    box.append(DOM.div().addClass('clear-both'));

    if (opts.showBlips) {
      box.hover(
      function(){
        campfire.publish('blip-hover-start',function(wrap){
          wrap.append(DOM.h4(dimension.name));
          wrap.append(dimension.description);
        });
      },
      function(){
        campfire.publish('blip-hover-end',null);
      });
    
    }
    return box;
};

TTI.replaceWordChars = function(text) {
    var s = text;
    // smart single quotes and apostrophe
    s = s.replace(/[\u2018\u2019\u201A]/g, "\'");
    // smart double quotes
    s = s.replace(/[\u201C\u201D\u201E]/g, "\"");
    // ellipsis
    s = s.replace(/\u2026/g, "...");
    // dashes
    s = s.replace(/[\u2013\u2014]/g, "-");
    // circumflex
    s = s.replace(/\u02C6/g, "^");
    // open angle bracket
    s = s.replace(/\u2039/g, "<");
    // close angle bracket
    s = s.replace(/\u203A/g, ">");
    // spaces
    s = s.replace(/[\u02DC\u00A0]/g, " ");


    //91 ec 236, left single quote
    //92 ed 237, right single quote
    
    //single quotes
    s = s.replace(/\u00ec/,"'");
    s = s.replace(/\u00ed/,"'");

    //93 ee 238, left double quote
    //94 ef 239, right double quote

    //double quotes
    s = s.replace(/\u00ee/,"\"");
    s = s.replace(/\u00ef/,"\"");
    
    
   //another right apos 
    s = s.replace(/\u2018/,"'");
    s = s.replace(/\u2019/,"'");

    
    return s;
};



TTI.inspectMSText = function(raw) {
  console.log('inspecting!!');
  var thresh = 128;
  var map = {
    '\u00ed': ""
  };
  for (var i = 0; i < raw.length; i++) { 
    var charCode = raw.charCodeAt(i);
    var char = raw.charAt(i);    
    if (charCode > thresh) {
      console.log('raw',raw[i],char,charCode);   
    }
  }
};


TTI.scrollTop = function() {
  var doc = document.documentElement, body = document.body;
  var left = (doc && doc.scrollLeft || body && body.scrollLeft || 0);
  var top = (doc && doc.scrollTop  || body && body.scrollTop  || 0);

  /////console.log('scrollTop, top is',top);

  return top;
};


TTI.documentWidth = function() {
var w=window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth;

/*
var h=window.innerHeight
|| document.documentElement.clientHeight
|| document.body.clientHeight;
*/
  return w;
}



TTI.slugify = function(str) {
  var result = str.toLowerCase();
  result = result.replace(/\//g,'_');
  result = result.replace(/\./g,'_');
  result = result.replace(/\:/g,'_');
  result = result.replace(/\ /g,'_');
  result = result.replace(/-/g,'_');
  result = result.replace(/--/g,'_');
  result = result.replace(/__/g,'_');
  result = result.replace(/\_\_/g,'_');

  result = result.substr(0,12);

  return result;  
};



TTI.Importer = function(callback) {
    jQuery.ajax({
      type: 'GET',
      url: 'qa.csv',
      success: callback
    });
};


TTI.toDataURI = function(content) {
    var result = 'data:text/html;base64,' + Base64.encode(content);
    return result;
};

TTI.fromDataURI = function(s) {
  var parts = s.split(/base64,/);
  if (parts.length < 2) { return "cannot parse"; }
  var base64 = parts[1];
  var content = Base64.decode(base64);
  return content;
};


TTI.getAddenda = function(dimensionName) {

  var slug = TTI.slugify(dimensionName);

  var foo = jQuery.ajax({
      type: 'GET',
      url: 'data/' + slug + '.jsn',
      async: false
    }).responseText;

  var result = eval('(' + foo + ')');  

  ///////console.log('result',result);
  return result;
};


TTI.CartAction = function(spec) {
  var self = TTI.PubSub({});
  self.spec = spec;
  
  self.hash = function() {
    var result = spec.dimension.name + '::SD' + spec.action.subdimensionID + '::L' + spec.action.level + '::A' + spec.action.actionID;
    return result;
  }
  
  
  return self;
};



TTI.Score = function(spec) {
  var self = TTI.PubSub({});

  return self;
};

TTI.scrollToTop = function() {
 $("html, body").animate({ scrollTop: 0 }, "slow");
};


  function highlightNavButton(o) {
    jQuery('#navbar .btn.active').removeClass('active');  
    jQuery(o).addClass('active');
  }




