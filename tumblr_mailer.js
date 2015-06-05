var fs = require('fs');
var ejs = require('ejs');
var tumblr = require('tumblr.js');
var mandrill = require('mandrill-api/mandrill');

var mandrill_client = new mandrill.Mandrill('W7Hruxt2RCIZ_yCEAI2h5A');

//----------PROGRAM START--------------

var csvFile = fs.readFileSync("friend_list.csv","utf8");
var templateFile = fs.readFileSync("email_template.html","utf8");

var contactsArray = csvParse(csvFile);
//console.log(contactsArray);

var client = tumblr.createClient({
                                 consumer_key: 'iCdqHZglRkMee8q2Qyb0TSkcC5cM4m9o7tbeYRD6GF445G3V7F',
                                 consumer_secret: 'eQ0LkH5icg14q8TxdBJ8FcFIFNrdmm1x31zdEsBkMth1OsiqcA',
                                 token: 'WGgNyiFZZyTgVxtEaiM8BPVys46SHScqiCuiO93V6Uq1HrlyHF',
                                 token_secret: 'HjXK39XqmIGJQmDFnorV2CCgI0fVDZVHNnHCAXbLYj3Id9E1oK'
                                 });

var latestPosts = [];
client.posts('coayscue.tumblr.com', function(err, blog){
    var postsArray = blog["posts"];
    //add every post in prev 7 days
    for (var i = 0; i < postsArray.length; i++){
        var postObj = postsArray[i];
        //filters out the bad emails
        var postDate = new Date(postObj.date);
        if (isRecent(postDate)){
            var preview = "";
            if (postObj.body.length > 200){
                preview = postObj.body.substring(0, 200)+"..."
            }else{
                preview = postObj.body;
            }
            var ourPostObj = { href: postObj.post_url, title: postObj.title, preview: preview}
            latestPosts.push(ourPostObj);
        }
        console.log(latestPosts);
    }
             
    console.log(latestPosts)
    for (var i = 0; i < contactsArray.length; i++){
        var contact = contactsArray[i];
        var HTMLemail = ejs.render(templateFile, { firstName: contact.firstName, numMonthsSinceContact: contact.numMonthsSinceContact, latestPosts: latestPosts});
        sendEmail((contact.firstName+contact.lastName), contact.emailAddress, "Christian Ayscue", "coayscue@gmail.com", "Check out my blog! (Atomated Email)", HTMLemail);
    }
       
})

//------------Helper Methods----------

//returns an array of contact objects
function csvParse(csvFile){
    var csvString = csvFile.toString();
    //split into lines
    var stringArray = csvString.split("\n");
    var useless = stringArray.pop();
    //get column names
    var colsArray = stringArray[0].split(",");
    //create an array with objects
    //for each subsequent line, create an object and add it to an array
    var contactsArray = [];
    for (var i = 1; i < stringArray.length; i++){
        //fill a new object with properties
        var newContact = {};
        var itemArray = stringArray[i].split(",");
        for (var j = 0; j < colsArray.length; j++){
            newContact[colsArray[j]] = itemArray[j];
        }
        //push the contact onto the array
        contactsArray.push(newContact);
    }
    return contactsArray;
}

function fillTemplate(tempFile, contact){
    var tempString = tempFile.toString();
    tempString = tempString.replace("FIRST_NAME", contact["firstName"]);
    tempString = tempString.replace("NUM_MONTHS_SINCE_CONTACT", contact["numMonthsSinceContact"]);
    return tempString;
}


 function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
    var message = {
        "html": message_html,
        "subject": subject,
        "from_email": from_email,
        "from_name": from_name,
        "to": [{
                "email": to_email,
                "name": to_name
            }],
        "important": false,
        "track_opens": true,    
        "auto_html": false,
        "preserve_recipients": true,
        "merge": false,
        "tags": [
            "Fullstack_Tumblrmailer_Workshop"
        ]    
    };
    var async = false;
    var ip_pool = "Main Pool";
    mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
         console.log(message);
         console.log(result);   
    }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
 }

//checks if the post occured within 7 days
var isRecent = function(postDate){
    //get the date of seven days ago to the day
    var nowDate = new Date();
    //make that date in into num days
    //this works because it's short term comparison - this date is not close to the actual date in days
    var days = nowDate.getDate() - 7 + nowDate.getMonth()*30+nowDate.getFullYear()*365;
    //convert the postDate to days
    var postDateDays = postDate.getDate() + postDate.getMonth()*30+postDate.getFullYear()*365;
    //compare the postDate to the 7daysAgoDate
    if (postDateDays >= days){
        return true;
    }else{
        return false;
    }
}






