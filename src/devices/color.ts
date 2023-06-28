import { EV3 } from "../EV3"
import { p, pm } from "../cmdutils"
import { EV3Port, Sensor, modes, types } from "./common"
import opc from "../opcodes"
import cmdc from "../cmdcodes"

export class EV3ColorSensor extends Sensor {
    /**
     * @internal
     */
    constructor(brick: EV3, port: EV3Port) {
        super(brick, port, types.EV3Color)
    }

    public async getReflected() {
        return (await this.brick.sendRequest([
            opc.inputDevice,
            cmdc.inputDevice.READY_PCT,
            p(1, 0),
            p(1, this.port),
            p(1, this.type),
            p(1, modes.EV3Color.reflected),
            p(1, 1),
            pm(1, "int", "global")
        ]))[0].value as number
    }

    public async getAmbient() {
        return (await this.brick.sendRequest([
            opc.inputDevice,
            cmdc.inputDevice.READY_PCT,
            p(1, 0),
            p(1, this.port),
            p(1, this.type),
            p(1, modes.EV3Color.ambient),
            p(1, 1),
            pm(1, "int", "global")
        ]))[0].value as number
    }

    public readonly colors = ["none", "black", "blue", "green", "yellow", "red", "white", "brown"]

    /**
     * Gets the color detected by the sensor.
     * @returns A number, 0-7, representing the color.
     * 
     * 0 = none
     * 
     * 1 = black 
     * 
     * 2 = blue 
     * 
     * 3 = green 
     * 
     * 4 = yellow 
     * 
     * 5 = red 
     * 
     * 6 = white 
     * 
     * 7 = brown 
     */
    public async getColor() {
        return (await this.brick.sendRequest([
            opc.inputDevice,
            cmdc.inputDevice.READY_RAW,
            p(1, 0),
            p(1, this.port),
            p(1, this.type),
            p(1, modes.EV3Color.color),
            p(1, 1),
            pm(1, "int", "global")
        ]))[0].value as number
    }

    public async getRGB(): Promise<[number, number, number]> {
        return (await this.brick.sendRequest([
            opc.inputDevice,
            cmdc.inputDevice.READY_RAW,
            p(1, 0),
            p(1, this.port),
            p(1, this.type),
            p(1, modes.EV3Color.rawRGB),
            p(1, 3),
            pm(1, "int", "global"),
            pm(1, "int", "global"),
            pm(1, "int", "global")
        ])).map((e) => e.value as number) as [number, number, number]
    }
}