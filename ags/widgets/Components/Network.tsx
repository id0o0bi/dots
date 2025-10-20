import { createBinding, For, With } from "ags";
import { Gtk } from "ags/gtk4";
import { execAsync } from "ags/process";
import AstalNetwork from "gi://AstalNetwork";
import { checkIcon } from "../../services/util";
import { CENTER, END, HORIZONTAL, VERTICAL } from "../../services/vars";

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
              <Gtk.Image iconName={createBinding(wifi, "iconName")} />
              <Gtk.Popover hasArrow={false}>
                <Gtk.Box orientation={VERTICAL}>
                  <Gtk.Box css="margin-bottom: 8px;" orientation={HORIZONTAL}>
                    <Gtk.Box hexpand={true}>
                      <Gtk.Image
                        iconName={createBinding(wifi, "iconName")}
                        pixelSize={48}
                      />
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
