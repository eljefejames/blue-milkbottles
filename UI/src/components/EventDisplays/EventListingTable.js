'use strict';

var React = require('react');
var EventListingTableStore = require('../../stores/EventDisplays/EventListingTableStore.js');
var EventListingTableActions = require('../../actions/EventDisplays/EventListingTableActions.js');
var ReactBootstrap = require('react-bootstrap');
var Table = ReactBootstrap.Table;


var EventListingTable = React.createClass({

    getInitialState: function() {
        return EventListingTableStore.model;
    },

    onModelChange: function(model) {
        this.setState(model);
    },

    componentDidMount: function() {
        this.unsubscribe = EventListingTableStore.listen(this.onModelChange);
    },

    componentWillUnmount: function() {
        this.unsubscribe();
    },

    _handleProbeEvent: function(e) {
        e.stopPropagation();
        EventListingTableActions.probeAction();
    },

    getDefaultProps: function() {
        return {
            striped: false,
            bordered: true,
            condensed: false,
            hover: true
        };
    },

    render: function() {
        return (
            <Table {...this.props}>
                <thead>
                    <tr>
                        <th>
                            <span>Text in th</span>
                        </th>
                        <th>
                            <span>Text in th</span>
                        </th>
                        <th>
                            <span>Text in th</span>
                        </th>
                        <th>
                            <span>Text in th</span>
                        </th>
                        <th>
                            <span>Text in th</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <span>Text in td</span>
                        </td>
                        <td>
                            <span>Text in td</span>
                        </td>
                        <td>
                            <span>Text in td</span>
                        </td>
                        <td>
                            <span>Text in td</span>
                        </td>
                        <td>
                            <span>Text in td</span>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span>Text in td</span>
                        </td>
                        <td>
                            <span>Text in td</span>
                        </td>
                        <td>
                            <span>Text in td</span>
                        </td>
                        <td>
                            <span>Text in td</span>
                        </td>
                        <td>
                            <span>Text in td</span>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span>Text in td</span>
                        </td>
                        <td>
                            <span>Text in td</span>
                        </td>
                        <td>
                            <span>Text in td</span>
                        </td>
                        <td>
                            <span>Text in td</span>
                        </td>
                        <td>
                            <span>Text in td</span>
                        </td>
                    </tr>
                </tbody>
            </Table>
            );
    }

});

module.exports = EventListingTable;