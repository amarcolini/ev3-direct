import cmdc from "./cmdcodes";
import { clampToRange, p, pm } from "./cmdutils";
import { EV3Base } from "./EV3Base";
import opc from "./opcodes";
import * as devices from "./devices/devices"

export class EV3 extends EV3Base {

    public async doNothing() {
        // preserve returning Promise<void>
        await this.sendRequest([opc.nop]);
    }

    public async getBatteryCurrent() {
        const resp = await this.sendRequest([
            opc.uiRead,
            cmdc.uiRead.GET_IBATT,
            pm(4, "float", "global"),
        ]);

        return resp[0].value as number;
    }

    public async getBatteryPercent() {
        const resp = await this.sendRequest([
            opc.uiRead,
            cmdc.uiRead.GET_LBATT,
            pm(1, "int", "global"),
        ]);

        return resp[0].value as number;
    }

    public async getBatteryVoltage() {
        const resp = await this.sendRequest([
            opc.uiRead,
            cmdc.uiRead.GET_VBATT,
            pm(4, "float", "global"),
        ]);

        return resp[0].value as number;
    }

    public async getBrickname() {
        const resp = await this.sendRequest([
            opc.comGet,
            cmdc.comGet.GET_BRICKNAME,
            p(0, 30),
            pm(30, "string", "global"),
        ]);

        return resp[0].value as string;
    }

    public async getFWVersion() {
        const resp = await this.sendRequest([
            opc.uiRead,
            cmdc.uiRead.GET_FW_VERS,
            p(0, 30),
            pm(30, "string", "global"),
        ]);

        return resp[0].value as string;
    }

    public async getHWVersion() {
        const resp = await this.sendRequest([
            opc.uiRead,
            cmdc.uiRead.GET_HW_VERS,
            p(0, 30),
            pm(30, "string", "global"),
        ]);

        return resp[0].value as string;
    }

    public async getOSVersion() {
        const resp = await this.sendRequest([
            opc.uiRead,
            cmdc.uiRead.GET_OS_VERS,
            p(0, 30),
            pm(30, "string", "global"),
        ]);

        return resp[0].value as string;
    }

    /**
     * Get total size of the file/folder in kB
     * @param path file path
     */
    public async getFileSize(path: string) {
        const resp = await this.sendRequest([
            opc.filename,
            cmdc.filename.TOTALSIZE,
            path,
            pm(4, "int", "global"),
            pm(4, "int", "global"),
        ]);

        return resp[2].value as number;
    }

    public async getSubfolders(path: string) {
        const count = await this.getSubfolderCount(path);
        const subs: string[] = [];

        for (let i = 0; i < count; i++) {
            subs.push(await this.getSubfolderName(path, i + 1));
        }

        return subs;
    }

    public async getSubfolderCount(path: string) {
        const resp = await this.sendRequest([
            opc.file,
            cmdc.file.GET_FOLDERS,
            path,
            pm(1, "int", "global"),
        ]);

        return resp[0].value as number;
    }

    public async getSubfolderName(dirPath: string, index: number) {
        const resp = await this.sendRequest([
            opc.file,
            cmdc.file.GET_SUBFOLDER_NAME,
            dirPath,
            p(1, index),
            p(1, 64),
            pm(64, "string", "global"),
        ]);

        return resp[0].value as string;
    }

    public async fileExists(path: string) {
        const resp = await this.sendRequest([
            opc.filename,
            cmdc.filename.EXIST,
            path,
            pm(1, "int", "global"),
        ]);

        return (resp[0].value as number) === 1;
    }

    /**
     * Set Brick button backlight color
     * @param color backlight color
     * @param cycle lighting effect
     */
    public async setButtonLight(color: "off" | "green" | "orange" | "red", cycle: "still" | "flash" | "pulse" = "still") {
        let flag: number;

        if (color === "off") {
            flag = 0;
        } else {
            flag = color === "green" ? 1 : color === "red" ? 2 : 3;
            flag += cycle === "still" ? 0 : cycle === "flash" ? 3 : 6;
        }

        await this.sendRequest([
            opc.uiWrite,
            cmdc.uiWrite.LED,
            p(1, flag),
        ]);
    }

    /**
     * Set Brick volume
     * @param percent volume 0 - 100%
     */
    public async setVolume(percent: number) {
        if (percent < 0 || percent > 100) { throw new RangeError("Argument 'percent' must be >= 0 and <= 100."); }
        await this.sendRequest([
            opc.info,
            cmdc.info.SET_VOLUME,
            p(1, percent),
        ]);
    }

    public async waitBrick(milliseconds: number, thread: number = 0) {
        const corrected = clampToRange(milliseconds, 0, null)
        await this.sendRequest([
            opc.timerWait,
            p(4, corrected),
            p(4, thread),
            opc.timerReady,
            p(4, thread)
        ])
    }

    /**
     * Plays a tone on the Brick
     * @param volume 0 - 100%
     * @param frequency 250 - 10,000Hz
     * @param duration in milliseconds
     */
    public async makeTone(volume: number, frequency: number, duration: number) {
        const correctedVolume = clampToRange(volume, 0, 100)
        const correctedFrequency = clampToRange(frequency, 250, 10_000)
        const correctedDuration = clampToRange(duration, 0, null)
        await this.sendRequest([
            opc.sound,
            cmdc.sound.TONE,
            p(1, correctedVolume),
            p(2, correctedFrequency),
            p(2, correctedDuration)
        ])
    }

    public getEV3LargeMotor(port: devices.MotorPort): devices.EV3LargeMotor {
        return new devices.EV3LargeMotor(this, port)
    }

    public getEV3MediumMotor(port: devices.MotorPort): devices.EV3MediumMotor {
        return new devices.EV3MediumMotor(this, port)
    }

    public getEV3TouchSensor(port: devices.EV3Port): devices.EV3TouchSensor {
        return new devices.EV3TouchSensor(this, port)
    }

    public getEV3UltrasonicSensor(port: devices.EV3Port): devices.EV3UltrasonicSensor {
        return new devices.EV3UltrasonicSensor(this, port)
    }

    public getEV3ColorSensor(port: devices.EV3Port): devices.EV3ColorSensor {
        return new devices.EV3ColorSensor(this, port)
    }

    public getEV3Gyro(port: devices.EV3Port): devices.EV3Gyro {
        return new devices.EV3Gyro(this, port)
    }

    /**
     * Creates a motor pair that runs both motors in sync. Good for drive bases.
     * @param motor1 
     * @param motor2
     */
    public getMotorPairFrom(motor1: devices.MotorPort, motor2: devices.MotorPort): devices.MotorPair {
        return devices.MotorPair.fromMotors(this, motor1, motor2)
    }

    /**
     * Creates a motor pair that runs both motors in sync. Good for drive bases.
     * @param port  
     */
    public getMotorPair(port: devices.MotorPairs) {
        return new devices.MotorPair(this, port)
    }
}