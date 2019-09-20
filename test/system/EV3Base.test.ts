import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import "mocha";
import sinon from "sinon";
import { EV3Base } from "../../src/EV3Base";

import MockBinding from "@serialport/binding-mock";
import SerialPort from "@serialport/stream";

chai.use(chaiAsPromised);
const expect = chai.expect;

const portName = "/dev/TESTPORT";

describe("class EV3Base", () => {

    beforeEach(() => {
        SerialPort.Binding = MockBinding;
        MockBinding.createPort(portName, {
            echo: false,
            readyData: Buffer.from([]),
            record: true,
        });
    });

    afterEach(() => {
        MockBinding.reset();
    });

    it("should be an EV3Base instance", () => {
        const brick = new EV3Base(new SerialPort(portName, { autoOpen: false }));
        expect(brick).to.be.instanceOf(EV3Base);
    });

    it("should be able to open and close the serial port", async () => {
        const brick = new EV3Base(new SerialPort(portName, { autoOpen: false }));
        // should be closed before that
        expect(brick.isConnected()).to.equal(false);

        await expect(brick.connect()).to.be.fulfilled;

        // should be now open
        expect(brick.isConnected()).to.equal(true);

        await expect(brick.disconnect()).to.be.fulfilled;

        // should be closed at the end
        expect(brick.isConnected()).to.equal(false);
    });

    it("should be able send a request", async () => {
        const brick = new EV3Base(new SerialPort(portName));
        await expect(brick.sendRequest([0x01], false)).to.be.fulfilled;
    });

    it("should be able send a request and receive a response", async () => {
        const port = new SerialPort(portName, { autoOpen: false });
        const brick = new EV3Base(port);
        // open the port
        await brick.connect();

        // mock the port so it makes a response
        const stub = sinon.stub(port, "write");
        stub.callsFake(async (_, callback) => {
            callback();
            process.nextTick(() => {
                port.binding.emitData(Buffer.from([0x03, 0, 0, 0, 0x02]));
            });
        });

        const resp = await brick.sendRequest([0x01]);
        expect(resp).to.be.an("array");
        expect(resp).to.have.lengthOf(0);

        // cleanup
        stub.reset();
        await brick.disconnect();
    });
});
