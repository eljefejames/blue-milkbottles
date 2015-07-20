var React = require('react/addons');
var ReactBootstrap = require('react-bootstrap');


var Nav = React.createClass({

    _renderChildren(){
        var eventKeyCount = 0;
        return React.Children.map(this.props.children, function(child){
            return React.addons.cloneWithProps(child, {eventKey: ++eventKeyCount});
        });
    },

    render: function(){
        return (
            <ReactBootstrap.Nav {...this.props}>
                {this._renderChildren()}
            </ReactBootstrap.Nav>
        );
    }
});

module.exports = Nav;