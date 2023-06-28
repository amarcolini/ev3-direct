import { p, pm } from "../cmdutils"
import opc from "../opcodes"
import cmdc from "../cmdcodes"
import { EV3 } from "../EV3"

export type EV3Port = 0 | 1 | 2 | 3

enum types {
    EV3Touch = 16,
    EV3Color = 29,
    EV3Ultrasonic = 30,
    EV3Gyro = 32
}

const modes = Object.freeze({
    EV3Touch: {
        touch: 0,
        bump: 1
    },
    EV3Color: {
        reflected: 0,
        ambient: 1,
        color: 2,
        rawReflected: 3,
        rawRGB: 4,
        colorCalibration: 5
    },
    EV3Ultrasonic: {
        cm: 0,
        in: 1,
        listen: 2,
        SI_cm: 3,
        SI_in: 4,
        DC_cm: 5,
        DC_in: 6
    },
    EV3Gyro: {
        angle: 0,
        rate: 1,
        fast: 2,
        rateAndAngle: 3,
        calibration: 4
    }
})

export { types, modes }

export enum MotorPort {
    A = 1,
    B = 2,
    C = 4,
    D = 8
}

export enum MotorPairs {
    A_B = 1,
    A_C = 5,
    B_C = 6,
    A_D = 9,
    B_D = 10,
    C_D = 12
}

export enum BrakeMode {
    BRAKE = 1,
    FLOAT = 0
}

export abstract class Sensor {
    protected constructor(protected readonly brick: EV3, public readonly port: EV3Port, public readonly type: types) {
        (async () => {
            const result = await brick.sendRequest([
                opc.inputDevice,
                cmdc.inputDevice.GET_TYPEMODE,
                p(1, 0),
                p(1, port),
                pm(1, "int", "global"),
                pm(1, "int", "global")
            ])
            if (result[0].value != type) throw TypeError(`Sensor type of port ${port} is not ${types[type]}.`)
        })()
    }
}