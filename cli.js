#!/usr/bin/env node

const path = require('path');
const opn = require('opn');

const port = 9991;

async function main() {
    await require('./server')(port);
    await opn(`http://localhost:${port}`);
}

main().catch(error => console.log(error));

