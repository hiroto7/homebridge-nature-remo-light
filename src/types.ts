export interface Appliance {
  id: string;
  model: Model | null;
  type: string;
  nickname: string;
  signals: Signal[];
  light?: Light;
  image: string;
}

export interface Model {
  id: string;
  name: string;
  manufacturer: string;
}

export type Image =
  | "ico_on"
  | "ico_off"
  | "ico_lightup"
  | "ico_lightdown"
  | "ico_light_night";

export interface Signal {
  id: string;
  name: string;
  image: Image;
}

export interface Light {
  buttons: LightButton[];
  state: LightState;
}

export type LightButtonName =
  | "on"
  | "off"
  | "bright-up"
  | "bright-down"
  | "night";

export interface LightButton {
  image: Image;
  name: LightButtonName;
}

export interface LightState {
  brightness: string;
  power: "off" | "on";
}
