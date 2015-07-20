'use strict';

var Reflux = require('reflux');
var EventPanelActions = require('../../actions/EventDisplays/EventPanelActions.js');

var defaultModel = {
};

var EventPanelStore = Reflux.createStore({
    model: defaultModel,
    listenables: EventPanelActions,

    onProbeAction: function() {
        this.trigger(this.model);
    }

});

module.exports = EventPanelStore;