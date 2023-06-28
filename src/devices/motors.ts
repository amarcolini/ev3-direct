import { EV3 } from "../EV3"
import { BrakeMode, EV3Port, MotorPairs, MotorPort } from "./common"
import { clampToRange, p, pm, rangeCheck } from "../cmdutils"
import opc from "../opcodes"

export abstract class Motor {
    public readonly encoderPort: EV3Port

    constructor(protected readonly brick: EV3, public readonly port: MotorPort, protected readonly type: number) {
        const tempPort = Object.keys(MotorPort).indexOf(port.toString())
        rangeCheck("encoderPort", tempPort, 0, 3)
        this.encoderPort = tempPort as EV3Port
        // brick.sendRequest([
        //     opc.outputSetType,
        //     p(1, 0),
        //     p(1, port),
        //     p(1, type)
        // ])
    }

    /**
     * Sets the raw voltage to the motor.
     * @param power the desired power, from -1.0 to 1.0.
     */
    async setPower(power: number) {
        const corrected = Math.round(clampToRange(power, -1.0, 1.0) * 100)
        await this.brick.sendRequest([
            opc.outputPower,
            p(1, 0),
            p(1, this.port),
            p(1, corrected),
            opc.outputStart,
            p(1, 0),
            p(1, this.port),
        ])
    }

    /**
     * Uses an internal controller to achieve the desired speed.
     * @param speed the desired speed, from -1.0 to 1.0.
     */
    async setSpeed(speed: number) {
        const corrected = Math.round(clampToRange(speed, -1.0, 1.0) * 100)
        await this.brick.sendRequest([
            opc.outputSpeed,
            p(1, 0),
            p(1, this.port),
            p(1, corrected),
            opc.outputStart,
            p(1, 0),
            p(1, this.port),
        ])
    }

    async stop(brakeMode: BrakeMode) {
        await this.brick.sendRequest([
            opc.outputStop,
            p(1, 0),
            p(1, this.port),
            p(1, brakeMode)
        ])
    }

    async currentPosition(): Promise<number> {
        return (await this.brick.sendRequest([
            opc.outputGetCount,
            p(1, 0),
            p(1, this.encoderPort),
            pm(4, "int", "global")
        ]))[0].value as number
    }

    async resetEncoder() {
        await this.brick.sendRequest([
            opc.outputClrCount,
            p(1, 0),
            p(1, this.encoderPort)
        ])
    }

    combineWith(other: Motor) {
        return MotorPair.fromMotors(this.brick, this.port, other.port)
    }
}

export class EV3LargeMotor extends Motor {
    /**
     * @internal
     */
    constructor(brick: EV3, public readonly port: MotorPort) {
        super(brick, port, 7)
    }
}

export class EV3MediumMotor extends Motor {
    /**
     * @internal
     */
    constructor(brick: EV3, public readonly port: MotorPort) {
        super(brick, port, 8)
    }
}

export class MotorPair {
    public readonly port1: MotorPort
    public readonly port2: MotorPort
    public readonly encoderPort1: EV3Port
    public readonly encoderPort2: EV3Port

    /**
     * @internal
     */
    constructor(private readonly brick: EV3, public readonly port: MotorPairs, ) {
        let result: [MotorPort, MotorPort];
        switch (port) {
            case MotorPairs.A_B: result = [MotorPort.A, MotorPort.B]
            break;
            case MotorPairs.A_C: result = [MotorPort.A, MotorPort.C]
            break;
            case MotorPairs.A_D: result = [MotorPort.A, MotorPort.D]
            break;
            case MotorPairs.B_C: result = [MotorPort.B, MotorPort.C]
            break;
            case MotorPairs.B_D: result = [MotorPort.B, MotorPort.D]
            break;
            case MotorPairs.C_D: result = [MotorPort.C, MotorPort.D]
            break;
        }
        this.port1 = result[0]
        this.port2 = result[1]
        this.encoderPort1 = Object.keys(MotorPort).indexOf(this.port1.toString()) as EV3Port
        this.encoderPort2 = Object.keys(MotorPort).indexOf(this.port2.toString()) as EV3Port
    }

    static fromMotors(brick: EV3, port1: MotorPort, port2: MotorPort) {
        let port;
        if (port1 == MotorPort.A && port2 == MotorPort.B || port1 == MotorPort.B && port2 == MotorPort.A) port = MotorPairs.A_B
        else if (port1 == MotorPort.A && port2 == MotorPort.C || port1 == MotorPort.C && port2 == MotorPort.A) port = MotorPairs.A_C
        else if (port1 == MotorPort.A && port2 == MotorPort.D || port1 == MotorPort.D && port2 == MotorPort.A) port = MotorPairs.A_D
        else if (port1 == MotorPort.C && port2 == MotorPort.B || port1 == MotorPort.B && port2 == MotorPort.C) port = MotorPairs.B_C
        else if (port1 == MotorPort.D && port2 == MotorPort.B || port1 == MotorPort.B && port2 == MotorPort.D) port = MotorPairs.B_D
        else if (port1 == MotorPort.C && port2 == MotorPort.D || port1 == MotorPort.D && port2 == MotorPort.C) port = MotorPairs.C_D
        else throw EvalError(`Cannot construct a motor pair from ports ${port1} and ${port2}.`)
        return new MotorPair(brick, port)
    }

    /**
     * Sets the speed of both motors. Good for drive bases.
     * @param speed The speed of both motors in the range [-1.0, 1.0]
     * @param turnRatio The turn ratio in the range [-2.0, 2.0]. (0 is straight ahead)
     */
    public async setSpeed(speed: number, turnRatio: number = 0) {
        const correctedSpeed = Math.round(clampToRange(speed, -1.0, 1.0) * 100)
        const correctedRatio = Math.round(clampToRange(turnRatio, -2.0, 2.0) * 100)

        await this.brick.sendRequest([
            opc.outputTimeSync,
            p(1, 0),
            p(1, this.port),
            p(1, correctedSpeed),
            p(2, correctedRatio),
            p(4, 0),
            p(1, 0)
        ])
    }
    
/**
     * Sets the speed of both motors for the specified tacho counts. Good for drive bases.
     * @param speed The speed of both motors in the range [-1.0, 1.0]
     * @param counts Number of tacho counts (0 is infinite)
     * @param turnRatio The turn ratio in the range [-2.0, 2.0]. (0 is straight ahead)
     */
    public async driveByTacho(speed: number, counts: number, turnRatio: number = 0) {
        const correctedSpeed = Math.round(clampToRange(speed, -1.0, 1.0) * 100)
        const correctedRatio = Math.round(clampToRange(turnRatio, -2.0, 2.0) * 100)
        const correctedCounts = clampToRange(counts, 0)

        await this.brick.sendRequest([
            opc.outputStepSync,
            p(1, 0),
            p(1, this.port),
            p(1, correctedSpeed),
            p(2, correctedRatio),
            p(4, correctedCounts),
            p(1, 0)
        ])
    }

    /**
     * Returns the positions of both motors in alphabetical order of their ports.
     * @returns 
     */
    public async getPositions() {
        return (await this.brick.sendRequest([
            opc.outputGetCount,
            p(1, 0),
            p(1, this.encoderPort1),
            pm(4, "int", "global"),
            opc.outputGetCount,
            p(1, 0),
            p(1, this.encoderPort2),
            pm(4, "int", "global")
        ])).map((i) => i.value as number) as [number, number]
    }

    public async resetEncoders() {
        (await this.brick.sendRequest([
            opc.outputClrCount,
            p(1, 0),
            p(1, this.encoderPort1),
            opc.outputClrCount,
            p(1, 0),
            p(1, this.encoderPort2),
        ]))
    }

    /**
     * Stops both motors. Good for drive bases.
     */
    public async stop(brakeMode: BrakeMode) {
        await this.brick.sendRequest([
            opc.outputTimeSync,
            p(1, 0),
            p(1, this.port),
            p(1, 0),
            p(2, 0),
            p(4, 0),
            p(1, brakeMode)
        ])
    }
}