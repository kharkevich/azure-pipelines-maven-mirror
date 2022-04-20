import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'index.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);
tmr.setInput('inputId', 'feed-name');
tmr.setInput('inputName', 'feed-name mirror');
tmr.setInput('inputMirrorOf', 'central');
tmr.run();
