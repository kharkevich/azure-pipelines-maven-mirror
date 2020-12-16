import fs = require('fs');
import Q = require('q');
import tl = require('azure-pipelines-task-lib/task');
import path = require('path');
import stripbom = require('strip-bom');

import * as xml2js from 'xml2js';
import * as os from 'os';
import * as fse from 'fs-extra';

// ready
export function readXmlFileAsJson(filePath: string): Q.Promise<any> {
    return readFile(filePath, 'utf-8')
        .then(convertXmlStringToJson);
}

// ready
export function jsonToXmlConverter(filePath: string, jsonContent: any): Q.Promise<void> {
    return writeJsonAsXmlFile(filePath, jsonContent.settings, 'settings');
}

// ready
export function addMirrorsEntryToSettingsJson(json: any, mirrorJson:any): any {
    if (!json) {
        json = {};
    }
    if (!json.settings || typeof json.settings === "string") {
        json.settings = {};
    }
    if (!json.settings.$) {
        json.settings.$ = {};
        json.settings.$['xmlns'] = 'http://maven.apache.org/SETTINGS/1.0.0';
        json.settings.$['xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';
        json.settings.$['xsi:schemaLocation'] = 'http://maven.apache.org/SETTINGS/1.0.0' + os.EOL + 'https://maven.apache.org/xsd/settings-1.0.0.xsd';
    }
    if (!json.settings.mirrors) {
        json.settings.mirrors = {};
    }
    addPropToJson(json.settings.mirrors, 'mirror', mirrorJson);
    return json;
}


function addPropToJson(obj: any, propName:string, value: any): void {
    if (!obj) {
        obj = {};
    }

    // If the root 'obj' already contains a 'server' property set it as the root object.
    if (obj instanceof Array) {
        let propNode = obj.find(o => o[propName]);
        if (propNode) {
            obj = propNode;
        }
    }

    // Checks if an arry contains a key
    let containsId: (o) => boolean = function(o) {
        if (value && value.id) {
            if (o.id instanceof Array) {
                return o.id.find((v) => {
                    return v === value.id;
                });
            } else {
                return value.id === o.id;
            }
        }
        return false;
    };

    if (propName in obj) { // If the 'server' property is a key within this object
        if (obj[propName] instanceof Array) { // if the 'server' value is an array, append our value to this array
            let existing = obj[propName].find(containsId);
            if (existing) { // Skip replaing existing value.
                // tl.warning(tl.loc('Warning_FeedEntryAlreadyExists', value.id));
                tl.warning('The settings for the feed or repository '+ value.id +' already exists in the users settings.xml file');
                tl.debug('Entry: ' + value.id);
            } else {
                obj[propName].push(value);
            }
        } else if (typeof obj[propName] !== 'object') { // If the 'server' element is not an 'object', destroy it
                                                        // and replace with a server element with our value.
            obj[propName] = [obj[propName], value];
        } else { // If 'server' value is an object, combine our and their value into an array and assign it to 'server'
            let prop = {};
            prop[propName] = value;
            obj[propName] = [obj[propName], value];
        }
    } else if (obj instanceof Array) { // If we simply get an array of 'server' objects
        let existing = obj.find(containsId);
        if (existing) {  // Don't replace existing value.
            // tl.warning(tl.loc('Warning_FeedEntryAlreadyExists', value.id));
            tl.warning('The settings for the feed or repository '+ value.id +' already exists in the users settings.xml file');
            tl.debug('Entry: ' + value.id);
        } else { // Append our value to the 'server' array.
            let prop = {};
            prop[propName] = value;
            obj.push(prop);
        }
    } else { // The root object was empty, simply assign our value to it.
        obj[propName] = value;
    }
}

// ready
function writeJsonAsXmlFile(filePath: string, jsonContent: any, rootName:string): Q.Promise<void> {
    let builder = new xml2js.Builder({
        pretty: true,
        headless: true,
        rootName: rootName
    });
    let xml = builder.buildObject(jsonContent);
    xml = xml.replace(/&#xD;/g, '');
    return writeFile(filePath, xml);
}

// ready
function writeFile(filePath: string, fileContent: string): Q.Promise<void> {
    fse.mkdirpSync(path.dirname(filePath));
    return Q.nfcall<void>(fs.writeFile, filePath, fileContent, { encoding: 'utf-8' });
}

// ready
function readFile(filePath: string, encoding: string): Q.Promise<string> {
    return Q.nfcall<string>(fs.readFile, filePath, encoding);
}

// ready
async function convertXmlStringToJson(xmlContent: string): Promise<any> {
    return Q.nfcall<any>(xml2js.parseString, stripbom(xmlContent));
}
