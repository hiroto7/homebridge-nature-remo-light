import { Service, PlatformAccessory, CharacteristicValue } from "homebridge";
import { ExampleHomebridgePlatform } from "./platform";
import { Appliance, LightState } from "./types";

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ExamplePlatformAccessory {
  private service: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private exampleStates = {
    On: false,
    Brightness: 100,
  };

  constructor(
    private readonly platform: ExampleHomebridgePlatform,
    private readonly accessory: PlatformAccessory<Appliance>,
  ) {
    // set accessory information
    if (accessory.context.model) {
      accessory
        .getService(platform.Service.AccessoryInformation)!
        .setCharacteristic(
          platform.Characteristic.Manufacturer,
          accessory.context.model.manufacturer,
        )
        .setCharacteristic(
          platform.Characteristic.Model,
          accessory.context.model.name,
        )
        .setCharacteristic(
          platform.Characteristic.SerialNumber,
          accessory.context.model.id,
        );
    }

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service =
      accessory.getService(this.platform.Service.Lightbulb) ||
      accessory.addService(this.platform.Service.Lightbulb);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(
      platform.Characteristic.Name,
      accessory.context.nickname,
    );

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this)) // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this)); // GET - bind to the `getOn` method below

    // register handlers for the Brightness Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this)); // SET - bind to the 'setBrightness` method below
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    // implement your own code to turn your device on/off
    this.exampleStates.On = value as boolean;

    const headers = {
      Authorization: `Bearer ${this.platform.config["token"]}`,
    };

    if (this.accessory.context.light) {
      const response = await fetch(
        `https://api.nature.global/1/appliances/${this.accessory.context.id}/light`,
        {
          method: "POST",
          headers,
          body: new URLSearchParams({ button: value ? "on" : "off" }),
        },
      );

      if (!response.ok) {
        throw await response.json();
      }

      const state = (await response.json()) as LightState;
      this.accessory.context.light.state = state;
    } else {
      const signal = this.accessory.context.signals.find(
        ({ image }) => image === (value ? "ico_on" : "ico_off"),
      );

      const response = await fetch(
        `https://api.nature.global/1/signals/${signal?.id}/send`,
        { method: "POST", headers },
      );

      if (!response.ok) {
        throw await response.json();
      }
    }

    this.platform.log.debug("Set Characteristic On ->", value);
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getOn(): Promise<CharacteristicValue> {
    // implement your own code to check if the device is on
    const isOn = this.accessory.context.light?.state.power === "on";

    this.platform.log.debug("Get Characteristic On ->", isOn);

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return isOn;
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, changing the Brightness
   */
  async setBrightness(value: CharacteristicValue) {
    // implement your own code to set the brightness
    this.exampleStates.Brightness = value as number;

    this.platform.log.debug("Set Characteristic Brightness -> ", value);
  }
}
