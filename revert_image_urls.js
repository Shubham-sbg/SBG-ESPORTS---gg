const fs = require('fs');
const execSync = require('child_process').execSync;
execSync('git checkout -- artifacts/sbg-army/src/components/ artifacts/sbg-army/src/pages/');
