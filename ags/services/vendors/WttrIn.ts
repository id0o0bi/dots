import { readFile, writeFileAsync } from "ags/file";
import { WTTR_CACHE } from "../vars";
import { WeatherData } from "../type";
import { shAsync } from "../util";
import { setWeather } from "../../widgets/Components/Weather";

const CMD = "curl -m 10 wttr.in/?format=j1 2>/dev/null";

export function getFromWttrIn(): void {
  try {
    shAsync([CMD])
      .then((out) => {
        out = out.trim();
        if (out === "") return;
        setWeather(_convWttrData(JSON.parse(out)));
        writeFileAsync(WTTR_CACHE, out);
      })
      .catch((e) => {
        console.log(e);
        throw new Error(e);
      });
  } catch (e) {
    console.error("failed", e);
  }
}

export function getFromCache(): WeatherData {
  try {
    let text = readFile(WTTR_CACHE);
    if (!text) return {} as WeatherData;

    return _convWttrData(JSON.parse(text.trim()));
  } catch (e) {
    console.error(e);
  }
  return {} as WeatherData;
}

const _convWttrData = (data: any): WeatherData => ({
  location: {
    city: data.nearest_area[0].areaName?.[0].value ?? "N/A",
    country: data.nearest_area[0].country?.[0].value ?? "N/A",
    latitude: data.nearest_area[0].latitude ?? "",
    longitude: data.nearest_area[0].longitude ?? "",
    update: data.current_condition[0].localObsDateTime ?? "",
    timezone: "Asia/Shanghai",
  },
  forcast: data.weather
    .map((w: any) => {
      return w.hourly.map((h: any) => ({
        date: w.date,
        sunrise: w.astronomy[0].sunrise,
        sunset: w.astronomy[0].sunset,
        hour: parseInt(h.time) / 100,
        temp: h.tempC ?? "",
        wind: h.WindGustKmph ?? "",
        uvIndex: h.uvIndex ?? "",
        humidity: h.humidity ?? "",
        weatherCode: parseInt(h.weatherCode ?? 0),
        weatherDesc: h.weatherDesc[0].value.trim() ?? "",
      }));
    })
    .flat(),
});
