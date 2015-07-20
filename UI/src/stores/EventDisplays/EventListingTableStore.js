'use strict';

var Reflux = require('reflux');
var EventListingTableActions = require('../../actions/EventDisplays/EventListingTableActions.js');

var defaultModel = {
};

var EventListingTableStore = Reflux.createStore({
    model: defaultModel,
    listenables: EventListingTableActions,

    onProbeAction: function() {
        this.trigger(this.model);
    }

});

module.exports = EventListingTableStore;