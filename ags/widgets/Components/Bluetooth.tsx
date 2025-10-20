import Gtk from "gi://Gtk?version=4.0";
import { createBinding, createConnection } from "ags";
import AstalBluetooth from "gi://AstalBluetooth?version=0.1";
import { checkIcon } from "../../services/util";
import { CENTER, END, HORIZONTAL, VERTICAL } from "../../services/vars";

export default function Bluetooth() {
  const bt = AstalBluetooth.get_default();

  const getBtIcon = () => {
    return bt.isConnected
      ? "blueman-active-symbolic"
      : bt.isPowered
        ? "blueman-symbolic"
        : "blueman-disabled-symbolic";
  };

  const icon = createConnection(
    getBtIcon(),
    [bt, "notify::is-powered", getBtIcon],
    [bt, "notify::is-connected", getBtIcon],
  );

  return (
    <Gtk.MenuButton class="unset">
      <Gtk.Image iconName={icon} />
      <Gtk.Popover hasArrow={false}>
        <Gtk.Box orientation={VERTICAL}>
          <Gtk.Box css="margin-bottom:8px;" orientation={HORIZONTAL}>
            <Gtk.Box hexpand={true}>
              <Gtk.Image iconName={icon} pixelSize={48} />
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
                iconName={createBinding(bt, "isPowered")(checkIcon)}
                onClicked={() => bt.toggle()}
              />
              <Gtk.Button
                iconName="bluetooth-acquiring-symbolic"
                class="round-btn"
                tooltipText="Scan"
                onClicked={() => {}}
              />
            </Gtk.Box>
          </Gtk.Box>
          <Gtk.Separator />
          <Gtk.Box
            css="margin-top:8px;"
            orientation={VERTICAL}
            class="linked vertical"
          >
            {bt.devices.map((device) => (
              <Gtk.ToggleButton
                active={createBinding(device, "connected")}
                hexpand={true}
                onClicked={() =>
                  device.connected
                    ? device.disconnect_device(null)
                    : device.connect_device(null)
                }
              >
                <Gtk.Box class="devices">
                  <Gtk.Image
                    css="margin-right:4px;"
                    tooltipText={createBinding(device, "batteryPercentage").as(
                      (p) => (p >= 0 ? `${Math.round(p * 100)}%` : "N/A"),
                    )}
                    iconName={createBinding(device, "icon")}
                  />
                  <Gtk.Separator
                    orientation={VERTICAL}
                    css="margin-right:4px;"
                  />
                  <Gtk.Label label={device.name} />
                  <Gtk.Image
                    iconName="object-select-symbolic"
                    css="margin-left:4px;"
                    visible={createBinding(device, "connected")}
                  />
                </Gtk.Box>
              </Gtk.ToggleButton>
            ))}
          </Gtk.Box>
        </Gtk.Box>
      </Gtk.Popover>
    </Gtk.MenuButton>
  );
}
