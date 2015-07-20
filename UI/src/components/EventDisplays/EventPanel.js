'use strict';

var React = require('react');
var EventPanelStore = require('../../stores/EventDisplays/EventPanelStore.js');
var EventPanelActions = require('../../actions/EventDisplays/EventPanelActions.js');
var ReactBootstrap = require('react-bootstrap');
var Panel = ReactBootstrap.Panel;


var EventPanel = React.createClass({

    getInitialState: function() {
        return EventPanelStore.model;
    },

    onModelChange: function(model) {
        this.setState(model);
    },

    componentDidMount: function() {
        this.unsubscribe = EventPanelStore.listen(this.onModelChange);
    },

    componentWillUnmount: function() {
        this.unsubscribe();
    },

    _handleProbeEvent: function(e) {
        e.stopPropagation();
        EventPanelActions.probeAction();
    },

    getDefaultProps: function() {
        return {};
    },

    render: function() {
        return (
            <Panel {...this.props}>
                <p>
                    <img width={700}
                         height={400}
                         src={ 'http://placehold.it/700x400'}></img><a href={ '#'}><span >Link text</span></a>
                    <p>
                        <span>Empty p</span>
                    </p>
                </p>
            </Panel>
            );
    }

});

module.exports = EventPanel;