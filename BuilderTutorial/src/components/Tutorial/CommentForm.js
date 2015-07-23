'use strict';

var React = require('react');

var ReactBootstrap = require('react-bootstrap');
var Panel = ReactBootstrap.Panel;
var Input = ReactBootstrap.Input;
var Button = ReactBootstrap.Button;


var CommentForm = React.createClass({


    getDefaultProps: function() {
        return {};
    },

    render: function() {
        return (
            <form {...this.props}>
                <Panel>
                    <h3><span >Your Name</span></h3>
                    <Input type={ 'text'}
                           hasFeedback={true}
                           placeholder={ 'Enter your name'}
                           label={ 'Your name'}></Input>
                    <Input type={ 'text'}
                           hasFeedback={true}
                           placeholder={ 'Say something..'}></Input>
                    <Button bsStyle={ 'default'}>
                        <span>Default</span>
                    </Button>
                </Panel>
            </form>
            );
    }

});

module.exports = CommentForm;