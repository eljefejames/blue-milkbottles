'use strict';

var Reflux = require('reflux');
var CommentListActions = require('../../actions/Tutorial/CommentListActions.js');

var defaultModel = {
  url: '/comments.json'
};

var CommentListStore = Reflux.createStore({
    model: defaultModel,
    listenables: CommentListActions,

    onProbeAction: function() {
        this.trigger(this.model);
    },
    onLoadCommentsFromServer: function() {
   $.ajax({
     url: this.model.url,
     dataType: 'json',
     cache: false,
     success: function(data) {
       this.model.commentsData = data;
       this.trigger(this.model);
     }.bind(this),
     error: function(xhr, status, err) {
       console.error(this.model.url, status, err.toString());
     }.bind(this)
   });
 },
    onHandleCommentSubmit: function(comment) {
     $.ajax({
       url: this.model.url,
       dataType: 'json',
       type: 'POST',
       data: comments,
       success: function(data) {
         this.model.commentsData = data;
         this.trigger(this.model);
       }.bind(this),
       error: function(xhr, status, err) {
         console.error(this.model.url, status, err.toString());
       }.bind(this)
     });
  }
});

module.exports = CommentListStore;
