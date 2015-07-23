'use strict';

var React = require('react');

var ReactBootstrap = require('react-bootstrap');
var Panel = ReactBootstrap.Panel;


var Comment = React.createClass({


    getDefaultProps: function() {
        return {
            author: "NoAuthor"
            
        };
    },

    render: function() {
        return (
            <div {...this.props}>
                <Panel>
                    <p></p>
                    <p>
                        <span>{this.props.author}</span>
                    </p>
                    <Panel>
                        <p>
                            <span>{this.props.children}</span>
                        </p>
                    </Panel>
                </Panel>
            </div>
            );
    }

});

module.exports = Comment;