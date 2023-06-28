import { EV3 } from "../EV3"
import { p, pm } from "../cmdutils"
import { EV3Port, Sensor, modes, types } from "./common"
import opc from "../opcodes"
import cmdc from "../cmdcodes"

export class EV3UltrasonicSensor extends Sensor {
    /**
     * @internal
     */
    constructor(brick: EV3, port: EV3Port) {
        super(brick, port, types.EV3Ultrasonic)
    }

    /**
     * 
     * @param single Whether or not to make a single measurement.
     * @returns 
     */
    public async getCM(single: boolean = false) {
        return (await this.brick.sendRequest([
            opc.inputDevice,
            cmdc.inputDevice.READY_RAW,
            p(1, 0),
            p(1, this.port),
            p(1, types.EV3Ultrasonic),
            p(1, !single ? modes.EV3Ultrasonic.cm : modes.EV3Ultrasonic.SI_cm),
            p(1, 1),
            pm(2, "int", "global")
        ]))[0].value as number / 10
    }

    /**
     * 
     * @param single Whether or not to make a single measurement.
     * @returns 
     */
    public async getIN(single: boolean = false) {
        return (await this.brick.sendRequest([
            opc.inputDevice,
            cmdc.inputDevice.READY_RAW,
            p(1, 0),
            p(1, this.port),
            p(1, types.EV3Ultrasonic),
            p(1, !single ? modes.EV3Ultrasonic.in : modes.EV3Ultrasonic.SI_in),
            p(1, 1),
            pm(4, "int", "global")
        ]))[0].value as number
    }
}