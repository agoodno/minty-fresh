const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(bodyParser.json()); // support json encoded bodies

const { Client } = require('pg');

var types = require('pg').types;
types.setTypeParser(17, function(val) {
  return '*-binary-*';
});

var servers = require('./data/server_templates.json');
var queryTemplates = require('./data/query_templates.json');

app.post('/results', function (request, response) {
  const client = new Client({ connectionString: request.body.connection_string });
  client.connect();

  const query_text = request.body.query_text;
  // console.log("query_text="); console.log(query_text);

  client.query('SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY;', (err, res) => {
    if (err) {
      response.send([err.message]);
    }
  });

  client.query(request.body.query_text, (err, res) => {
    function makeResp(rows) {
      if (rows != undefined && rows.length > 0)
        return { columns: Object.keys(rows[0]), rows: rows };
      else
        return { columns: [], rows: [] };
    }

    if (err) {
      response.send([err.message]);
    } else {
      response.send(makeResp(res.rows));
    }
  });
});

app.get('/server_templates', function (request, response) {
  var env = request.query.env;
  // console.log(env);
  var byEnv = (env === 'inhouse') ? (it) => it.inhouse : (it) => !it.inhouse;
  var filteredServerTemplates = servers.filter(byEnv);
  // console.log(filteredServerTemplates.length);
  response.send(filteredServerTemplates);
});

app.get('/query_templates', function (request, response) {
  var env = request.query.env;
  // console.log(env);
  var filteredQueryTemplates = env ? queryTemplates.filter((it) => it.environment.includes(env)) : queryTemplates;
  // console.log(filteredQueryTemplates.length);
  response.send(filteredQueryTemplates);
});

app.listen(3001, function () {
  console.log('Example app listening on port 3001!');
});
