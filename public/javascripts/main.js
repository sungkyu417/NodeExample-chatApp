var socket,
    Chat = {};

// Models & Collections

Chat.Message = Backbone.Model.extend({
  defaults: {
    text: ''
  }
});

Chat.Messages = Backbone.Collection.extend({
  model: Chat.Message
});

// Views

Chat.MessageView = Backbone.View.extend({
  tagName: 'p',
  
  template: _.template('<strong><%=name %> [<%=timestamp %>]:</strong> <%=text %>'),
  
  render: function() {
    // add the message html
    this.$el.html(this.template(this.model.toJSON()));
    
    // append the new message to the parent view
    this.parentView.$el.append(this.$el);
    
    return this;
  }
});

Chat.MessagesView = Backbone.View.extend({
  el: '#chatroom',
  
  initialize: function() {
    // bind "this" context to the render function 
    _.bindAll(this, 'render');
    
    // add various events for the collection
    this.collection.on('change', this.render);
    this.collection.on('add', this.render);
    this.collection.on('remove', this.render);
    
    // render the initial state
    this.render();
  },
  
  render: function() {
    // empty out the wrapper
    this.$el.empty();

    // loop through the messages in the collection
    this.collection.each(function(message) {
      var messageView = new Chat.MessageView({
        model: message
      });
      
      // save a reference to this view within the child view
      messageView.parentView = this;
      
      // render it
      messageView.render();
    }, this);
    
    // scroll to the bottom
    this.$el.animate({ scrollTop: this.$el.height() }, 100);
    
    return this;
  }
});

// init function
Chat.init = function(setup) {
  // connect to the socket
  socket = new io.connect(setup.host);

  // when data is received, update the user count
  socket.on('message', function(data) {
    setup.dom.count.text(data.clients);
  });

  // get username
  Chat.username = Chat.getUsername();
  
  // initialize the collection & views
  Chat.messages = new Chat.Messages();
  
  Chat.messagesView = new Chat.MessagesView({
    collection: Chat.messages
  });

  // bind submit for chat box
  setup.dom.form.submit(Chat.submit);
  
  // handle new chats
  Chat.$chatroom = setup.dom.room;
  socket.on('chat', Chat.addMessage);
};

// submit a new chat to the server
Chat.submit = function(e) {
  e.preventDefault();
  
  // get the text of the input and empty it
  var $message = $(e.target.message),
  text = $message.val();
  
  $message.val('');
  
  // send the message over the socket
  socket.emit('newchat', {
    name: Chat.username,
    text: text
  });
};
  
// add a new message to the chat room
Chat.addMessage = function(data) {
  Chat.messages.add(data);
};

// get the user's name
Chat.getUsername = function() {
  return prompt("What's your name?", '') || 'Anonymous';
};

$(function() {
  // initialize the chat app
  Chat.init({
    host: 'http://localhost:3000',
    dom: {
      count: $('#client-count'),
      form: $('.chatbox'),
      room: $('#chatroom')
    }
  });
});