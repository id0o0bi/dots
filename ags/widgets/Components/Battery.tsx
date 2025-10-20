import Gtk from "gi://Gtk?version=4.0";
import AstalBattery from "gi://AstalBattery";
import AstalPowerProfiles from "gi://AstalPowerProfiles";
import { createBinding, createComputed } from "ags";
import { createPoll } from "ags/time";
import { formatSeconds } from "../../services/util";
import { CENTER, END, HORIZONTAL, START, VERTICAL } from "../../services/vars";
import app from "ags/gtk4/app";

export default function Battery() {
  const battery = AstalBattery.get_default();
  const powerprofiles = AstalPowerProfiles.get_default();

  const icon = createBinding(battery, "iconName");
  const uptime = createPoll("", 60000, "uptime");
  const charge = createComputed(
    [createBinding(battery, "charging"), createBinding(battery, "timeToEmpty")],
    (c, r) => {
      if (c) return "󱐋 Charging";
      return `󱦟 ${formatSeconds(r, "%hhh:%mmm")}`;
    },
  );
  const percent = createBinding(
    battery,
    "percentage",
  )((p) => `${Math.floor(p * 100)}%`);

  const setProfile = (profile: string) =>
    powerprofiles.set_active_profile(profile);

  const zhmap: Record<string, string> = {
    performance: "性能",
    balanced: "平衡",
    "power-saver": "节能",
  };

  return (
    <Gtk.MenuButton class="unset" visible={createBinding(battery, "isPresent")}>
      <Gtk.Box tooltipText={percent}>
        <Gtk.Image iconName={icon} />
      </Gtk.Box>
      <Gtk.Popover hasArrow={false}>
        <Gtk.Box orientation={VERTICAL}>
          <Gtk.Box css="margin-bottom:8px;" orientation={HORIZONTAL}>
            <Gtk.Image iconName={icon} css="margin-right:8px;" pixelSize={48} />
            <Gtk.Box hexpand valign={CENTER} orientation={VERTICAL}>
              <Gtk.Label
                sensitive={false}
                halign={START}
                label={uptime((t) => "󰔚 " + t.match(/up ([^,]+),/)?.[1])}
              />
              <Gtk.Label
                sensitive={false}
                css="margin-top:8px;"
                halign={START}
                label={charge}
              />
            </Gtk.Box>
            <Gtk.Button
              halign={END}
              valign={CENTER}
              class="round-btn"
              iconName="system-shutdown-symbolic"
              onClicked={() => app.toggle_window("powermenu")}
            />
          </Gtk.Box>
          <Gtk.Separator />
          <Gtk.Box css="margin-top:8px;" class="linked">
            {powerprofiles.get_profiles().map(({ profile }) => (
              <Gtk.ToggleButton
                active={createBinding(
                  powerprofiles,
                  "activeProfile",
                )((p) => p === profile)}
                tooltipText={zhmap[profile] || profile}
                iconName={`power-profile-${profile}-symbolic`}
                hexpand={true}
                onClicked={() => setProfile(profile)}
              />
            ))}
          </Gtk.Box>
        </Gtk.Box>
      </Gtk.Popover>
    </Gtk.MenuButton>
  );
}
