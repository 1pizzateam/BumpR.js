import fs from 'node:fs';

const options = {   recursive: true, 
                    force: true
                };
fs.rmSync('./build/', options);
fs.rmSync('./dist/', options);
