import { EV3 } from "../EV3"
import { p, pm } from "../cmdutils"
import { EV3Port, Sensor, modes, types } from "./common"
import opc from "../opcodes"
import cmdc from "../cmdcodes"

export class EV3Gyro extends Sensor {
    /**
     * @internal
     */
    constructor(brick: EV3, port: EV3Port) {
        super(brick, port, types.EV3Gyro)
    }

    private offset = 0

    /**
     * 
     * @returns The current angle and angular velocity, in degrees
     */
    public async getState(): Promise<GyroState> {
        const result = (await this.brick.sendRequest([
            opc.inputDevice,
            cmdc.inputDevice.READY_RAW,
            p(1, 0),
            p(1, this.port),
            p(1, this.type),
            p(1, modes.EV3Gyro.rateAndAngle),
            p(1, 2),
            pm(2, "int", "global"),
            pm(2, "int", "global"),
        ]))
        return {
            angle: result[0].value as number + this.offset,
            angVel: result[1].value as number
        }
    }

    /**
     * Creates an offset to effectively reset the gyro value. Note that
     * this makes a hardware call.
     * @param value the new angle in degrees
     */
    public async setAngle(value: number) {
        this.offset += (await this.getState()).angle - value
    }
}

type GyroState = {
    angle: number,
    angVel: number
}