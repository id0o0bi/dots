// {
//   package: "linux-zen",
//   version: ["6.14-0", "6.15-1"]
// }
export interface ArchUpdate {
  package: string;
  version: Array<string>;
}

export interface WeatherLocation {
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  timezone: string;
  update: string;
}

export interface WeatherItem {
  date: string;
  sunrise: string;
  sunset: string;
  hour: number;
  temp: string;
  wind: string;
  uvIndex: string;
  humidity: string;
  weatherCode: number;
  weatherDesc: string;
}

export interface WeatherData {
  location: WeatherLocation;
  forcast: [WeatherItem];
}
