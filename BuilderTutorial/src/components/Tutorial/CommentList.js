'use strict';

var React = require('react');
var CommentListStore = require('../../stores/Tutorial/CommentListStore.js');
var CommentListActions = require('../../actions/Tutorial/CommentListActions.js');
var ReactBootstrap = require('react-bootstrap');
var Panel = ReactBootstrap.Panel;


var CommentList = React.createClass({

    getInitialState: function() {
        return CommentListStore.model;
    },

    onModelChange: function(model) {
        this.setState(model);
    },

    componentDidMount: function() {
        this.unsubscribe = CommentListStore.listen(this.onModelChange);
        CommentListActions.loadCommentsFromServer();
    },

    componentWillUnmount: function() {
        this.unsubscribe();
    },



    getDefaultProps: function() {
        return {};
    },

    render: function() {

      var commentNodes =  this.state.commentsData.map(function (comment) {
        return (
        <Comment author= {comment.author}>
          {comment.text}
        </Comment>
      );
  });
        return (
            <div {...this.props}>
                {commentNodes}
            </div>
            );
    }

});

module.exports = CommentList;
