import { Accessor, createBinding, createConnection, For, With } from "ags";
import { Gtk } from "ags/gtk4";
import { execAsync } from "ags/process";
import AstalNetwork from "gi://AstalNetwork";
import { checkIcon } from "../../services/util";
import { CENTER, END, HORIZONTAL, VERTICAL } from "../../services/vars";

const signalIcons: [number, string][] = [
  [80, "network-wireless-signal-excellent-symbolic"],
  [60, "network-wireless-signal-good-symbolic"],
  [40, "network-wireless-signal-ok-symbolic"],
  [20, "network-wireless-signal-weak-symbolic"],
  [0, "network-wireless-signal-none-symbolic"],
];

/**
 * astal only recomputes `Wifi.iconName` when the NM device/client notifies, never when the signal
 * strength changes, and it falls back to Adwaita's `network-wireless-connected-symbolic` - which is
 * drawn with fill-opacity 0.35, i.e. grey - whenever it cannot resolve the active access point.
 * Both leave a perfectly healthy connection looking washed out, so derive the icon here instead.
 */
export function wifiIcon(wifi: AstalNetwork.Wifi): string {
  if (!wifi.enabled) return "network-wireless-disabled-symbolic";
  if (wifi.internet === AstalNetwork.Internet.CONNECTING)
    return "network-wireless-acquiring-symbolic";
  if (wifi.internet !== AstalNetwork.Internet.CONNECTED)
    return "network-wireless-offline-symbolic";

  const ap = wifi.activeAccessPoint;
  if (!ap) return "network-wireless-symbolic";
  return signalIcons.find(([min]) => ap.strength >= min)![1];
}

function WifiImage({
  wifi,
  pixelSize,
}: {
  wifi: AstalNetwork.Wifi;
  pixelSize?: number;
}) {
  const refresh = () => wifiIcon(wifi);
  const iconName: Accessor<string> = createConnection(
    refresh(),
    [wifi, "notify::enabled", refresh],
    [wifi, "notify::internet", refresh],
    [wifi, "notify::strength", refresh],
    [wifi, "notify::active-access-point", refresh],
  );
  return <Gtk.Image iconName={iconName} pixelSize={pixelSize ?? -1} />;
}

export default function Wireless() {
  const network = AstalNetwork.get_default();
  const wifi = createBinding(network, "wifi");

  const sorted = (arr: Array<AstalNetwork.AccessPoint>) => {
    return arr
      .filter((ap: AstalNetwork.AccessPoint) => !!ap.ssid)
      .filter((v, i, a) => a.findIndex((t) => t.ssid === v.ssid) === i)
      .sort(
        (a: AstalNetwork.AccessPoint, b: AstalNetwork.AccessPoint) =>
          b.strength - a.strength,
      );
  };

  async function connect(ap: AstalNetwork.AccessPoint) {
    // connecting to ap is not yet supported
    // https://github.com/Aylur/astal/pull/13
    try {
      await execAsync(`nmcli d wifi connect ${ap.bssid}`);
    } catch (error) {
      // you can implement a popup asking for password here
      console.error(error);
    }
  }

  return (
    <Gtk.Box visible={wifi(Boolean)}>
      <With value={wifi}>
        {(wifi) =>
          wifi && (
            <Gtk.MenuButton class="unset">
              <WifiImage wifi={wifi} />
              <Gtk.Popover hasArrow={false}>
                <Gtk.Box orientation={VERTICAL}>
                  <Gtk.Box css="margin-bottom: 8px;" orientation={HORIZONTAL}>
                    <Gtk.Box hexpand={true}>
                      <WifiImage wifi={wifi} pixelSize={48} />
                    </Gtk.Box>
                    <Gtk.Box
                      hexpand={false}
                      halign={END}
                      valign={CENTER}
                      orientation={HORIZONTAL}
                    >
                      <Gtk.Button
                        hexpand={false}
                        vexpand={false}
                        class="round-btn"
                        tooltipText="On/Off"
                        iconName={createBinding(wifi, "enabled")(checkIcon)}
                        onClicked={() => wifi.set_enabled(!wifi.enabled)}
                      />
                      <Gtk.Button
                        iconName="network-wireless-acquiring-symbolic"
                        // sensitive={createBinding(wifi, "scanning")}
                        class="round-btn"
                        tooltipText="Scan"
                        onClicked={() => (wifi.scanning ? null : wifi.scan())}
                      />
                    </Gtk.Box>
                  </Gtk.Box>
                  <Gtk.Separator css="margin-bottom: 8px;" />
                  <Gtk.Box orientation={VERTICAL} class="linked vertical">
                    <For each={createBinding(wifi, "accessPoints")(sorted)}>
                      {(ap: AstalNetwork.AccessPoint) => (
                        <Gtk.ToggleButton
                          onClicked={() => connect(ap)}
                          active={createBinding(
                            wifi,
                            "activeAccessPoint",
                          )((active) => active?.ssid === ap.ssid)}
                        >
                          <Gtk.Box vexpand={false} valign={CENTER} spacing={4}>
                            <Gtk.Overlay class="wifiIcons">
                              <Gtk.Image
                                // vexpand={false}
                                // valign={CENTER}
                                iconName={createBinding(ap, "iconName")}
                              />
                              <Gtk.Label
                                $type="overlay"
                                halign={END}
                                valign={END}
                                class="pass"
                                label={createBinding(ap, "requiresPassword").as(
                                  (r) => (r ? "󰌾" : ""),
                                )}
                              />
                            </Gtk.Overlay>
                            <Gtk.Label
                              class="ssid"
                              label={createBinding(ap, "ssid")}
                            />
                            <Gtk.Image
                              iconName="object-select-symbolic"
                              visible={createBinding(
                                wifi,
                                "activeAccessPoint",
                              )((active) => active?.ssid === ap.ssid)}
                            />
                          </Gtk.Box>
                        </Gtk.ToggleButton>
                      )}
                    </For>
                  </Gtk.Box>
                </Gtk.Box>
              </Gtk.Popover>
            </Gtk.MenuButton>
          )
        }
      </With>
    </Gtk.Box>
  );
}
