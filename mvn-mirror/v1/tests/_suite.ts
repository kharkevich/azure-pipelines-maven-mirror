import fs = require("fs");
import * as path from 'path';
import * as assert from 'assert';
import * as ttm from 'azure-pipelines-task-lib/mock-test';
import * as tl from "azure-pipelines-task-lib/task";

const M2FolderName: string = ".m2";
const settingsXmlName: string = "settings.xml";
const settingsXmlNameBackup: string = "_settings_bak.xml";
const testHomedir = path.join(__dirname, "USER_HOME");
const userM2FolderPath = path.join(testHomedir, M2FolderName);
const settingsXmlPath = path.join(userM2FolderPath, settingsXmlName);
const settingsXmlBackupPath = path.join(userM2FolderPath, settingsXmlNameBackup);

const mirrorsRegex = /<mirrors>/mig;
const mirrorRegex = /<mirror>/mig;

describe('Configure Maven Mirror Tests', function () {
    this.timeout(parseInt(process.env.TASK_TEST_TIMEOUT!) || 20000);

    var env: NodeJS.ProcessEnv;

    this.beforeAll(() => {
        env = Object.assign({}, process.env);
        process.env["USERPROFILE"] = testHomedir;
        process.env["HOME"] = testHomedir;
    });

    beforeEach(() => {
        tl.mkdirP(testHomedir);
    })

    this.afterAll(() => {
        process.env = env;
    })

    afterEach(() => {
        tl.rmRF(testHomedir);
    });

    it('validate input parameters', function (done: Mocha.Done) {
        this.timeout(1000);

        let tp = path.join(__dirname, 'no-inputs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        assert.strictEqual(tr.succeeded, false, 'should have failed');
        assert.strictEqual(tr.warningIssues.length, 0, "should have no warnings");
        assert.strictEqual(tr.errorIssues.length, 1, "should have 1 error issue");
        assert.strictEqual(tl.ls("", [settingsXmlPath]).length, 0, "Settings.xml file should not be created.");
        done();
    });

    it('validate that inputId is required', function (done: Mocha.Done) {
        this.timeout(1000);

        let tp = path.join(__dirname, 'no-inputId.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        assert.strictEqual(tr.succeeded, false, 'should have failed');
        assert.strictEqual(tr.warningIssues.length, 0, "should have no warnings");
        assert.strictEqual(tr.errorIssues.length, 1, "should have 1 error issue");
        assert.strictEqual(tr.createdErrorIssue("Input required: inputId"), true, "should have error issue Input required: inputId");
        assert.strictEqual(tl.ls("", [settingsXmlPath]).length, 0, "Settings.xml file should not be created.");
        done();
    });

    it('validate that inputName is required', function (done: Mocha.Done) {
        this.timeout(1000);

        let tp = path.join(__dirname, 'no-inputName.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        assert.strictEqual(tr.succeeded, false, 'should have failed');
        assert.strictEqual(tr.warningIssues.length, 0, "should have no warnings");
        assert.strictEqual(tr.errorIssues.length, 1, "should have 1 error issue");
        assert.strictEqual(tr.createdErrorIssue("Input required: inputName"), true, "should have error issue Input required: inputId");
        assert.strictEqual(tl.ls("", [settingsXmlPath]).length, 0, "Settings.xml file should not be created.");
        done();
    });

    it('validate that inputUrl is required', function (done: Mocha.Done) {
        this.timeout(1000);

        let tp = path.join(__dirname, 'no-inputUrl.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        assert.strictEqual(tr.succeeded, false, 'should have failed');
        assert.strictEqual(tr.warningIssues.length, 0, "should have no warnings");
        assert.strictEqual(tr.errorIssues.length, 1, "should have 1 error issue");
        assert.strictEqual(tr.createdErrorIssue("Input required: inputUrl"), true, "should have error issue Input required: inputId");
        assert.strictEqual(tl.ls("", [settingsXmlPath]).length, 0, "Settings.xml file should not be created.");
        done();
    });

    it('validate that inputMirrorOf is required', function (done: Mocha.Done) {
        this.timeout(1000);

        let tp = path.join(__dirname, 'no-inputMirrorOf.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        assert.strictEqual(tr.succeeded, false, 'should have failed');
        assert.strictEqual(tr.warningIssues.length, 0, "should have no warnings");
        assert.strictEqual(tr.errorIssues.length, 1, "should have 1 error issue");
        assert.strictEqual(tr.createdErrorIssue("Input required: inputMirrorOf"), true, "should have error issue Input required: inputId");
        assert.strictEqual(tl.ls("", [settingsXmlPath]).length, 0, "Settings.xml file should not be created.");
        done();
    });

    it('create new .m2/settings.xml', function (done: Mocha.Done) {
        this.timeout(1000);

        let tp = path.join(__dirname, 'add-mirror.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        assert.strictEqual(tr.succeeded, true, 'should have succeeded');
        assert.strictEqual(tr.warningIssues.length, 0, "should have no warnings");
        assert.strictEqual(tr.errorIssues.length, 0, "should have no errors");
        assert.strictEqual(tl.ls("", [userM2FolderPath]).length, 1, "Should have one file.");

        const settingsXmlStats = tl.stats(settingsXmlPath);
        assert(settingsXmlStats && settingsXmlStats.isFile(), "settings.xml file should be created.");

        const mirrorIdRegex = /<id>feed-name<\/id>/mig;
        const mirrorNameRegex = /<name>feed-name mirror<\/name>/mig;
        const mirrorUrlRegex = /<url>https:\/\/pkgs.dev.azure.com\/organization\/project\/_packaging\/feed-name\/maven\/v1<\/url>/mig;
        const mirrorMirrorOfRegex = /<mirrorOf>central<\/mirrorOf>/mig;

        const data = fs.readFileSync(settingsXmlPath, 'utf-8');
        assert.strictEqual(data.match(mirrorsRegex)!.length, 1, "Only one <mirrors> entry should be created.");
        assert.strictEqual(data.match(mirrorRegex)!.length, 1, "1 <mirror> entries should be created.");
        assert.strictEqual(data.match(mirrorIdRegex)!.length, 1, "Only one ID entry should be created.");
        assert.strictEqual(data.match(mirrorNameRegex)!.length, 1, "Only one Name entry should be created.");
        assert.strictEqual(data.match(mirrorUrlRegex)!.length, 1, "Only one URL entry should be created.");
        assert.strictEqual(data.match(mirrorMirrorOfRegex)!.length, 1, "Only one MirrorOf entry should be created.");
        done();
    });

    it('skip existing .m2/settings.xml file', function (done: Mocha.Done) {
        this.timeout(1000);

        let tp = path.join(__dirname, 'existing-config.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tl.mkdirP(userM2FolderPath);
        const settingsXmlNameExistingMirror = path.join(__dirname, "assets", "existing-mirror.xml");
        tl.cp(settingsXmlNameExistingMirror, settingsXmlPath);

        tr.run();

        assert.strictEqual(tr.succeeded, true, 'should have succeeded');
        assert.strictEqual(tr.createdWarningIssue("The settings for the feed or repository already exists in the users settings.xml file"), true, "should skip existing settings.xml file");
        assert.strictEqual(tr.errorIssues.length, 0, "should have no errors");
        assert.strictEqual(tl.ls("", [userM2FolderPath]).length, 1, "Should have one file.");

        const settingsXmlStats = tl.stats(settingsXmlPath);
        assert(settingsXmlStats && settingsXmlStats.isFile(), "settings.xml file should be presented.");

        const mirrorIdRegex = /<id>feed-name<\/id>/mig;
        const mirrorNameRegex = /<name>existing mirror<\/name>/mig;
        const mirrorUrlRegex = /<url>https:\/\/pkgs.dev.azure.com\/existing<\/url>/mig;
        const mirrorMirrorOfRegex = /<mirrorOf>existing<\/mirrorOf>/mig;

        const data = fs.readFileSync(settingsXmlPath, 'utf-8');
        assert.strictEqual(data.match(mirrorsRegex)!.length, 1, "Only one <mirrors> entry should be created.");
        assert.strictEqual(data.match(mirrorRegex)!.length, 1, "1 <mirror> entries should be created.");
        assert.strictEqual(data.match(mirrorIdRegex)!.length, 1, "Only one ID entry should be created.");
        assert.strictEqual(data.match(mirrorNameRegex)!.length, 1, "Only one Name entry should be created.");
        assert.strictEqual(data.match(mirrorUrlRegex)!.length, 1, "Only one URL entry should be created.");
        assert.strictEqual(data.match(mirrorMirrorOfRegex)!.length, 1, "Only one MirrorOf entry should be created.");
        done();
    });

    it('add mirror into existing .m2/settings.xml file', function (done: Mocha.Done) {
        this.timeout(1000);

        let tp = path.join(__dirname, 'existing-config.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tl.mkdirP(userM2FolderPath);
        const settingsXmlNameNoMirror = path.join(__dirname, "assets", "no-mirrors.xml");
        tl.cp(settingsXmlNameNoMirror, settingsXmlPath);

        tr.run();

        assert.strictEqual(tr.succeeded, true, 'should have succeeded');
        assert.strictEqual(tr.warningIssues.length, 0, "should have no warnings");
        assert.strictEqual(tr.errorIssues.length, 0, "should have no errors");
        assert.strictEqual(tl.ls("", [userM2FolderPath]).length, 1, "Should have one file.");

        const settingsXmlStats = tl.stats(settingsXmlPath);
        assert(settingsXmlStats && settingsXmlStats.isFile(), "settings.xml file should be presented.");

        const mirrorIdRegex = /<id>feed-name<\/id>/mig;
        const mirrorNameRegex = /<name>feed-name mirror<\/name>/mig;
        const mirrorUrlRegex = /<url>https:\/\/pkgs.dev.azure.com\/organization\/project\/_packaging\/feed-name\/maven\/v1<\/url>/mig;
        const mirrorMirrorOfRegex = /<mirrorOf>central<\/mirrorOf>/mig;

        const data = fs.readFileSync(settingsXmlPath, 'utf-8');
        assert.strictEqual(data.match(mirrorsRegex)!.length, 1, "Only one <mirrors> entry should be created.");
        assert.strictEqual(data.match(mirrorRegex)!.length, 1, "1 <mirror> entries should be created.");
        assert.strictEqual(data.match(mirrorIdRegex)!.length, 1, "Only one ID entry should be created.");
        assert.strictEqual(data.match(mirrorNameRegex)!.length, 1, "Only one Name entry should be created.");
        assert.strictEqual(data.match(mirrorUrlRegex)!.length, 1, "Only one URL entry should be created.");
        assert.strictEqual(data.match(mirrorMirrorOfRegex)!.length, 1, "Only one MirrorOf entry should be created.");
        done();
    });
});
