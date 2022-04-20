import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

const M2FolderName: string = ".m2";
const SettingsXmlName: string = "settings.xml";
const testHomedir = path.join(__dirname, "USER_HOME");
const userM2FolderPath = path.join(testHomedir, M2FolderName);
const settingsXmlPath = path.join(userM2FolderPath, SettingsXmlName);


let taskPath = path.join(__dirname, '..', 'index.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);
tmr.setAnswers({
    getPlatform: { getPlatform: 1 },
    osType: { osType: 'Linux' },
    exist: {
        [userM2FolderPath]: false,
        [settingsXmlPath]: false
    }
})
tmr.setInput('inputId', 'feed-name');
tmr.setInput('inputName', 'feed-name mirror');
tmr.setInput('inputUrl', 'https://pkgs.dev.azure.com/organization/project/_packaging/feed-name/maven/v1');
tmr.setInput('inputMirrorOf', 'central');

tmr.run();
