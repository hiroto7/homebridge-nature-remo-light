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

export interface Signal {
  id: string;
  name: string;
  image: string;
}

export interface Light {
  state: LightState;
}

export interface LightState {
  brightness: string;
  power: "off" | "on";
}
