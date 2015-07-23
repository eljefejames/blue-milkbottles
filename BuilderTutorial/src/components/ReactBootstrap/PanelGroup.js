var React = require('react/addons');
var ReactBootstrap = require('react-bootstrap');


var PanelGroup = React.createClass({

    _renderChildren(){
        var eventKeyCount = 0;
        return React.Children.map(this.props.children, function(child){
            return React.addons.cloneWithProps(child, {eventKey: ++eventKeyCount});
        });
    },

    render: function(){
        return (
            <ReactBootstrap.PanelGroup {...this.props}>
                {this._renderChildren()}
            </ReactBootstrap.PanelGroup>
        );
    }
});

module.exports = PanelGroup;