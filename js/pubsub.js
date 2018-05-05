if (typeof TTI ==  "undefined") { var TTI = {}; }
TTI.PubSub = function(spec) {
  var self = {};
  var callbacks = {};
  self.subscribe = function(topic,callback) {
    if (typeof callbacks[topic] == "undefined") {
      callbacks[topic] = [];
    }  
    callbacks[topic].push(callback);
  };
  self.publish = function(topic,payload) {
    ////console.log('Huggy: publish',topic,payload);
    if (typeof callbacks[topic] == "undefined") {
      ///console.log('no subscribers to ' + topic);
      return false;
    }


  
    callbacks[topic].each(function(cb) {
      cb(payload);
    });   
  };
  return self;
};
