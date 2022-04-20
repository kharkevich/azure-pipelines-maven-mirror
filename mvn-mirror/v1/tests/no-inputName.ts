import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'index.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);
tmr.setInput('inputId', 'feed-name');
tmr.setInput('inputUrl', 'https://pkgs.dev.azure.com/oragnization/project/_packaging/feed-name/maven/v1');
tmr.setInput('inputMirrorOf', 'central');
tmr.run();
