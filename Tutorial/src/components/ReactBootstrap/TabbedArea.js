var React = require('react/addons');
var ReactBootstrap = require('react-bootstrap');

var TabbedArea = React.createClass({

    _renderChildren(){
        var eventKeyCount = 0;
        return React.Children.map(this.props.children, function(child){
            return React.addons.cloneWithProps(child, {eventKey: ++eventKeyCount});
        });
    },

    render: function(){
        return (
            <div style={{marginTop: '10px'}} {...this.props}>
                <ReactBootstrap.TabbedArea {...this.props}>
                    {this._renderChildren()}
                </ReactBootstrap.TabbedArea>
            </div>
        );
    }
});


module.exports = TabbedArea;