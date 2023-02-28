const express = require('express');
const path = require('path')
const app = express();

/*
const fcl = require("@onflow/fcl")

fcl
  .config()
  .put("accessNode.api", "https://rest-testnet.onflow.org")
  .put("discovery.wallet", "https://fcl-discovery.onflow.org/testnet/authn")
  .put("app.detail.title", "FlovaMineSweeper");

  await fcl.authenticate()
*/

app.use(express.json());
app.use(express.static('public'))

const router = express.Router();


app.use('/', express.static(path.join(__dirname, '/index.html')));

app.use(router)

app.use((err, req, res, next) => {
  console.log(`Error: ${err.message || JSON.stringify(err)}`);
});

app.listen(10000, () => {
  console.log(`HTTP Server listening on port 10000`);
});

