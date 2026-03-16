export interface LaundryMachine {
  id: string;
  name: string;
  power: "on" | "off";
  elapsedSeconds?: number;
  startTime?: string;
}

export interface LaundryStatus {
  machines: LaundryMachine[];
  lastUpdated: string;
}
