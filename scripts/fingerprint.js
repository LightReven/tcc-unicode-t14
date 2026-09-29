'use strict';
const crypto=require('crypto');
const {readRuntimeMetadata}=require('@tcc/runtime-metadata');
const target=process.argv[2] || 'src/runtime-config.js';
const m=readRuntimeMetadata(target);
if(!m){console.error('No metadata found');process.exit(1);}
const c=JSON.stringify({operation:m.operation,endpoint:m.endpoint,marker:m.marker});
console.log(crypto.createHash('sha256').update(c,'utf8').digest('hex').toUpperCase());
