require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const {urlencoded} = require("express");
const {Schema} = mongoose;
const app = express();

//#region server setup
const port = process.env.PORT || 3000;

//allow cors to pass FCC tests
app.use(cors());
//serve static files (for css)
app.use('/public', express.static(`${process.cwd()}/public`));
//add the body parser middleware for parsing POST requests' body
app.use(bodyParser.urlencoded({extended:true}))

//#endregion

//#region DB Setup

//DB connection
mongoose.connect(
  process.env.MONGO_URI,
  { autoIndex: false },
    (err) => {
    if(err){
      console.log(err)
      process.exit(1)
    }
  }
)
//setup mongoose auto increment
const AutoIncrement = require('mongoose-sequence')(mongoose);

UrlSchema = new Schema({
  original_url: String
},{
  versionKey: false,
  toJSON: {
    transform: (doc, ret, options) => {
      let output = Object.assign({}, ret);
      delete output._id
      return output
    }
  }
});
UrlSchema.plugin(AutoIncrement, {inc_field: 'short_url'});
const Url = mongoose.model('short_url', UrlSchema);
//#endregion

//#region routes
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/shorturl/:code', async (req, res) => {
  const short_url = req.params.code;
  const url_object = await Url.findOne({short_url}).exec()

  if(url_object){
    res.redirect(url_object.original_url)
  }else {
    res.json({error: 'invalid url'})
  }
})


app.post('/api/shorturl', async (req, res) => {
  let original_url = req.body.url

  //checking if the url is not valid
  if (/^https?:\/{2}([a-z0-9-.]+)\/?/i.test(original_url) === false) {
    res.json({error: 'invalid url'})
    return;
  }

  //checking if it already exists on the DB, if it doesn't exist, create it
  const outputUrl = await Url.findOne({original_url}) ?? await Url.create({original_url})
  res.json(outputUrl)

});
//#endregion

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
