import tl = require('azure-pipelines-task-lib/task');
import util = require('./xmlutils');
import * as path from 'path';

const M2FolderName: string = ".m2";
const SettingsXmlName: string = "settings.xml";
const backupSettingsXmlName: string = "_settings_bak.xml";

async function run(): Promise<void> {
  let newMirror = {}
  try {
    const inputId: string | undefined = tl.getInput('inputId', true);
    const inputName: string | undefined = tl.getInput('inputName', true);
    const inputUrl: string | undefined = tl.getInput('inputUrl', true);
    const inputMirrorOf: string | undefined = tl.getInput('inputMirrorOf', true);
    newMirror = {
      id: inputId,
      name: inputName,
      url: inputUrl,
      mirrorOf: inputMirrorOf
    }
  } catch (err) {
    if (err instanceof Error) {
      tl.setResult(tl.TaskResult.Failed, err.message);
      return;
    } else {
      tl.setResult(tl.TaskResult.Failed, "Unknown error");
      return;
    }
  }
  try {
    let userM2FolderPath: string = "";
    // tl.getPlatform.toString().match()
    if (tl.osType().match(/^Win/)) {
      userM2FolderPath = path.join(process.env.USERPROFILE!, M2FolderName);
    } else {
      userM2FolderPath = path.join(process.env.HOME!, M2FolderName);
    }
    if (!tl.exist(userM2FolderPath)) {
      // tl.debug(tl.loc("Info_M2FolderDoesntExist", userM2FolderPath));
      tl.debug('.m2 folder not found at location ' + userM2FolderPath + ', creating new folder.');
      tl.mkdirP(userM2FolderPath);
    }
    let userSettingsXmlPath: string = path.join(userM2FolderPath, SettingsXmlName);
    let backupSettingsXmlPath: string = path.join(userM2FolderPath, backupSettingsXmlName);
    let settingsJson: any;
    tl.setTaskVariable('userM2SettingsXmlPath', userSettingsXmlPath);
    if (tl.exist(userSettingsXmlPath)) {
      // tl.debug(tl.loc("Info_SettingsXmlRead", userSettingsXmlPath));
      tl.debug('Adding authentication to settings file ' + userSettingsXmlPath);
      tl.cp(userSettingsXmlPath, backupSettingsXmlPath);
      tl.setTaskVariable("backupUserM2SettingsFilePath", backupSettingsXmlPath);
      settingsJson = await util.readXmlFileAsJson(userSettingsXmlPath);
    }
    else {
      // tl.debug(tl.loc("Info_CreatingSettingsXml", userSettingsXmlPath));
      tl.debug('Creating new settings.xml at path ' + userSettingsXmlPath);
    }
    settingsJson = util.addMirrorsEntryToSettingsJson(settingsJson, newMirror);

    // tl.debug(tl.loc("Info_WritingToSettingsXml"));
    tl.debug('Writing new settings.xml with added mirror.');
    await util.jsonToXmlConverter(userSettingsXmlPath, settingsJson);

  } catch (err: unknown) {
    if (err instanceof Error) {
      tl.setResult(tl.TaskResult.Failed, err.message);
    } else {
      tl.setResult(tl.TaskResult.Failed, "Unknown error");
    }
  }
}

run();
