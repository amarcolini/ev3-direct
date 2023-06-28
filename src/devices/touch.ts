import { EV3 } from "../EV3"
import { p, pm } from "../cmdutils"
import { EV3Port, Sensor, modes, types } from "./common"
import opc from "../opcodes"
import cmdc from "../cmdcodes"

export class EV3TouchSensor extends Sensor {
    /**
         * @internal
         */
    constructor(brick: EV3, port: EV3Port) {
        super(brick, port, types.EV3Touch)
    }

    public async isPressed() {
        return (await this.brick.sendRequest([
            opc.inputDevice,
            cmdc.inputDevice.READY_SI,
            p(1, 0),
            p(1, this.port),
            p(1, types.EV3Touch),
            p(1, modes.EV3Touch.touch),
            p(1, 1),
            pm(4, "int", "global")
        ]))[0].value as number > 0
    }

    /**
     * @returns Number of times this sensor has been pressed since last reset.
     */
    public async bumps() {
        return (await this.brick.sendRequest([
            opc.inputDevice,
            cmdc.inputDevice.READY_SI,
            p(1, 0),
            p(1, this.port),
            p(1, types.EV3Touch),
            p(1, modes.EV3Touch.bump),
            p(1, 1),
            pm(1, "int", "global")
        ]))[0].value
    }
    
    public async clearBumps() {
        (await this.brick.sendRequest([
            opc.inputDevice,
            cmdc.inputDevice.CLR_CHANGES,
            p(1, 0),
            p(1, this.port)
        ]))
    }
}