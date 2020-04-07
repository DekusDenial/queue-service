'use strict';

const chai = require('chai');
const { assert } = chai;
const hapi = require('@hapi/hapi');
const mockery = require('mockery');
const sinon = require('sinon');

sinon.assert.expose(assert, { prefix: '' });

describe('test shutdown plugin', () => {
    let plugin;
    let server;

    before(() => {
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });
    });

    beforeEach(async () => {
        /* eslint-disable global-require */
        plugin = require('../../plugins/shutdown');
        /* eslint-enable global-require */

        const svcConfig = { port: 12347 };

        server = new hapi.Server(svcConfig);

        await server.register({
            plugin
        });
    });

    afterEach(() => {
        server = null;
        mockery.deregisterAll();
        mockery.resetCache();
    });

    after(() => {
        mockery.disable();
    });

    it('registers the plugin', () => {
        assert.isOk(server.registrations.shutdown);
    });
});

describe('test graceful shutdown', () => {
    before(() => {
        sinon.stub(process, 'exit');
    });

    after(() => {
        process.exit.restore();
    });

    it('should catch the SIGTERM signal', () => {
        /* eslint-disable global-require */
        const plugin = require('../../plugins/shutdown');
        /* eslint-enable global-require */
        const options = {
            terminationGracePeriod: 30
        };
        let stopCalled = false;
        const server = new hapi.Server({
            port: 1234
        });

        server.stop = () => {
            stopCalled = true;
        };
        server.expose = sinon.stub();

        plugin.register(server, options, () => {});

        process.exit(1);
        process.exit.callsFake(() => {
            assert.isTrue(stopCalled);
        });
        assert(process.exit.isSinonProxy);
        sinon.assert.called(process.exit);
        sinon.assert.calledWith(process.exit, 1);
    });
});
