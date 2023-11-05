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

  constructor(
    private readonly platform: ExampleHomebridgePlatform,
    private readonly accessory: PlatformAccessory<{ isOn?: boolean }>,
    private readonly appliance: Appliance,
  ) {
    // set accessory information
    if (appliance.model) {
      accessory
        .getService(platform.Service.AccessoryInformation)!
        .setCharacteristic(
          platform.Characteristic.Manufacturer,
          appliance.model.manufacturer,
        )
        .setCharacteristic(platform.Characteristic.Model, appliance.model.name)
        .setCharacteristic(
          platform.Characteristic.SerialNumber,
          appliance.model.id,
        );
    }

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service =
      accessory.getService(this.platform.Service.Lightbulb) ||
      accessory.addService(this.platform.Service.Lightbulb);

    this.service.setCharacteristic(
      platform.Characteristic.Name,
      appliance.nickname,
    );

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this)) // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this)); // GET - bind to the `getOn` method below
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    const headers = {
      Authorization: `Bearer ${this.platform.config["token"]}`,
    };

    if (this.appliance.light) {
      const response = await fetch(
        `https://api.nature.global/1/appliances/${this.appliance.id}/light`,
        {
          method: "POST",
          headers,
          body: new URLSearchParams({ button: value ? "on" : "off" }),
        },
      );

      if (!response.ok) {
        throw await response.json();
      }

      this.appliance.light.state = (await response.json()) as LightState;
      delete this.accessory.context.isOn;
    } else {
      const signal = this.appliance.signals.find(
        ({ image }) => image === (value ? "ico_on" : "ico_off"),
      );

      const response = await fetch(
        `https://api.nature.global/1/signals/${signal?.id}/send`,
        { method: "POST", headers },
      );

      if (!response.ok) {
        throw await response.json();
      }

      this.accessory.context.isOn = value as boolean;
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
    const isOn = this.appliance.light
      ? this.appliance.light.state.power === "on"
      : this.accessory.context.isOn ?? false;

    this.platform.log.debug("Get Characteristic On ->", isOn);

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return isOn;
  }
}
