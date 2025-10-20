import { Gtk } from "ags/gtk4";
import { getFromCache, getFromWttrIn } from "../../services/vendors/WttrIn";
import {
  ASSETS,
  CENTER,
  CONFIG,
  END,
  START,
  VERTICAL,
  WTTR_ICONS,
} from "../../services/vars";
import { WeatherData, WeatherItem } from "../../services/type";
import { createComputed, createState, For } from "ags";
import { sh, to24HM } from "../../services/util";

const icon_file = {
  na: `${ASSETS}/wttr/na.svg`,
  tp: `${ASSETS}/wttr/thermometer.svg`,
  hu: `${ASSETS}/wttr/humidity.svg`,
  ba: `${ASSETS}/wttr/barometer.svg`,
  wi: `${ASSETS}/wttr/wind.svg`,
  ho: `${ASSETS}/wttr/horizon.svg`,
  sr: `${ASSETS}/wttr/sunrise.svg`,
  mr: `${ASSETS}/wttr/moonrise.svg`,
  ss: `${ASSETS}/wttr/sunset.svg`,
  ms: `${ASSETS}/wttr/moonset.svg`,
};

export const [weather, setWeather] = createState<WeatherData>(getFromCache());
// setInterval(getFromWttrIn, 30000); // 30s for debug
setInterval(getFromWttrIn, 1800000); // 30mins for use

// 分时天气信息：近18(6✖️3)小时内天气信息, 可能跨天
const hourDetail = createComputed([weather], (weather) => {
  let time = sh(["date +'%Y-%m-%d %H:%M'"]);
  let list: Array<WeatherItem> = [];
  let [date, hour] = time.split(" ");

  weather.forcast?.forEach((f) => {
    if (f.date < date) return;
    if (f.date == date && f.hour < parseInt(hour.slice(0, 2))) return;
    if (list.length < 6) list.push(f);
  });

  return list;
});

const nowDetail = createComputed([weather], (weather) =>
  _getNowWeatherItem(weather),
);

// get if now is night time, computed from sunrise/sunset data
export const isNight = createComputed([weather], (w) => {
  let night = true;
  let time = sh(["date +'%H:%M'"]);
  let item = _getNowWeatherItem(w);
  if (item && item.date)
    night = time < to24HM(item.sunrise) || time > to24HM(item.sunset);

  // console.log(item.sunrise, night);
  return night;
});

const rewriteTime = (timeStr: string): string => {
  const match = timeStr.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2} [APM]{2})/);

  if (!match) return timeStr; // Return original if format doesn't match
  const [_, year, month, day, time] = match;

  return `${to24HM(time)} ${day}/${month}`;
};

export function TodayIcon() {
  return (
    <Gtk.Image
      class="todayIcon"
      file={nowDetail((d) =>
        _getWeatherCode(d.weatherCode ?? 113, isNight.get()),
      )}
    />
  );
}

export function DashWeatherInfo() {
  return (
    <Gtk.Box class="weatherInfo" orientation={VERTICAL}>
      <Gtk.Box class="infoBox">
        <TodayIcon />
        <Gtk.Box homogeneous={true} hexpand={true}>
          <Gtk.Box valign={CENTER} orientation={VERTICAL}>
            <Gtk.Box class="infoItem">
              <Gtk.Image file={`${icon_file["sr"]}`} />
              <Gtk.Label
                sensitive={false}
                label={nowDetail((d) => d.sunrise ?? "N/A")}
              />
            </Gtk.Box>
            <Gtk.Box class="infoItem">
              <Gtk.Image file={`${icon_file["mr"]}`} />
              <Gtk.Label
                sensitive={false}
                label={nowDetail((d) => d.sunset ?? "N/A")}
              />
            </Gtk.Box>
          </Gtk.Box>
          <Gtk.Box valign={CENTER} orientation={VERTICAL}>
            <Gtk.Box class="infoItem">
              <Gtk.Image file={`${icon_file["hu"]}`} />
              <Gtk.Label
                sensitive={false}
                label={nowDetail((d) => `${d.humidity ?? ""}%`)}
              />
            </Gtk.Box>
            <Gtk.Box class="infoItem">
              <Gtk.Image file={`${icon_file["tp"]}`} />
              <Gtk.Label
                sensitive={false}
                label={nowDetail((d) => `${d.temp ?? ""}°C`)}
              />
            </Gtk.Box>
          </Gtk.Box>
        </Gtk.Box>
      </Gtk.Box>
      <Gtk.Box class="infoStatus">
        <Gtk.Label
          sensitive={false}
          tooltipText={weather((w) => rewriteTime(w.location?.update ?? "N/A"))}
          label="󰋽 "
        />
        <Gtk.Label
          sensitive={false}
          hexpand={true}
          halign={START}
          label={nowDetail((d) => `${d.weatherDesc ?? "N/A"}`)}
        />
        <Gtk.Label
          halign={END}
          sensitive={false}
          label={weather((w) => ` ${w.location?.city ?? "N/A"}`)}
        />
      </Gtk.Box>
    </Gtk.Box>
  );
}

export function DashWeatherForcast() {
  return (
    <Gtk.Box class="forcast" homogeneous={true}>
      <For each={hourDetail}>
        {(h) => (
          <Gtk.Box orientation={Gtk.Orientation.VERTICAL}>
            <Gtk.Image sensitive={false} file={_getWeatherItemIcon(h)} />
            <Gtk.Label
              sensitive={false}
              label={`${h.hour.toString().padStart(2, "0")}:00`}
            />
            <Gtk.Label sensitive={false} label={`${h.temp}°C`} />
          </Gtk.Box>
        )}
      </For>
    </Gtk.Box>
  );
}

function _getNowWeatherItem(data: WeatherData): WeatherItem {
  let time = sh(["date +'%Y-%m-%d %H:%M'"]);
  let [date, hour] = time.split(" ");

  if (!data.forcast) return {} as WeatherItem;

  let hInt = parseInt(hour.slice(0, 2));
  return data.forcast.find(
    (f) => f.date == date && f.hour <= hInt && f.hour + 3 > hInt,
  ) as WeatherItem;
}

function _getWeatherItemIcon(data: WeatherItem): string {
  let hour = `${data.hour.toString().padStart(2, "0")}:00`;
  let night = hour < to24HM(data.sunrise) || hour > to24HM(data.sunset);

  return _getWeatherCode(data.weatherCode, night);
}

function _getWeatherCode(code: number, isNight: boolean): any {
  let iconName = WTTR_ICONS[code] ?? "na";
  let iconPath = `${CONFIG}/assets/wttr/${iconName}.svg`;
  return iconPath.replace("??", isNight ? "night" : "day");
}
