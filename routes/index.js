
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', {
    title: 'Socket.IO'
  });
};

/*
 * GET about page.
 */

exports.about = function(req, res){
  res.render('main', {
    title: 'About',
    subtitle: 'All about my Express app',
    description: 'I built this app using Node and the Express framework'
  });
};

/*
 * GET contact page.
 */

exports.contact = function(req, res){
  res.render('contact', {
    title: 'Contact Us',
    description: 'Send us a message and we\'ll get back to you'
  });
};

/*
 * POST contact page.
 */

exports.contact_post_handler = function(req, res) {
    // validate required fields
    function validateRequired(field) {
        if ( typeof field === 'undefined' || field == '' ) return false;
        return true;
    }
    
    // validate email address
    function validateEmail(email) { 
        var regEx = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return regEx.test(email);
    } 
    
    var error = false;
    
    // check required fields
    if ( !validateRequired( req.body.name ) || !validateRequired( req.body.email ) || !validateRequired( req.body.message ) ) {
        error = 'Please fill out all required fields';
    }
    
    // check email
    else if ( !validateEmail( req.body.email ) ) {
        error = 'Please enter a valid email address';
    }
    
    // build the template variables for error output
    if ( error ) {
        console.log( error );
        
        var templateVars = {
            title: 'Contact Us',
            error: error,
            name: req.body.name,
            email: req.body.email,
            message: req.body.message
        };
        
        // render the template
        res.render('contact', templateVars);
    }
    
    // else success message
    else {
        // connect to your smtp server
        var emailjs = require('emailjs');
        var server = emailjs.server.connect({
            user: 'jon.raasch',
            password: 'asdf',
            host: 'smtp.gmail.com',
            ssl: true
        });

        // build the email body with a datestamp
        var emailBody = 'From: ' + req.body.name + ' <' + req.body.email + '>' + "\n";
        emailBody += 'Message: ' + req.body.message + "\n\n";
        emailBody += 'Sent automatically from Node server on ' + Date();
        
        // send the email to the server admin
        server.send({
           from:    'Node Server <no-reply@localhost>', 
           to:      'Server Admin <admin@localhost>',
           subject: 'Contact form submission',
           text: emailBody
        }, function(err, message) {
            console.log(err || message);
            
            // if smtp error
            if ( err ) {
                res.send('Sorry, there was an error sending your message, please try again later');
            }
            // otherwise show success message
            else {
                var templateVars = {
                    title: 'Message Sent Successfully',
                    success: 'Thank you for contacting us, we will get back to you as soon as possible'
                };
                
                // render the template
                res.render('contact', templateVars);
            }
        });
    }
};