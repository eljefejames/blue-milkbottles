'use strict';

var Reflux = require('reflux');

var CommentListActions = Reflux.createActions([
    'probeAction',
    'loadCommentsFromServer',
    'handleCommentSubmit'
]);

module.exports = CommentListActions;
