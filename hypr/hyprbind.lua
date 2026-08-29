-- Keybindings
-- https://wiki.hypr.land/Configuring/Basics/Binds/

local mod = "SUPER"

-- AGS
hl.bind(mod .. " + SHIFT + R", hl.dsp.exec_cmd("ags quit; ags run"))
hl.bind(mod .. " + R",         hl.dsp.exec_cmd("ags toggle launcher"))
hl.bind(mod .. " + Escape",    hl.dsp.exec_cmd("ags toggle powermenu"))
hl.bind(mod .. " + Tab",       hl.dsp.exec_cmd("ags request switcher"), { repeating = false })

-- Laptop media keys
hl.bind("XF86MonBrightnessUp",   hl.dsp.exec_cmd("brightnessctl set +5%"),       { repeating = true })
hl.bind("XF86MonBrightnessDown", hl.dsp.exec_cmd("brightnessctl set 5%-"),       { repeating = true })
hl.bind("XF86AudioRaiseVolume",  hl.dsp.exec_cmd("wpctl set-volume -l 1.2 @DEFAULT_AUDIO_SINK@ 5%+"), { repeating = true })
hl.bind("XF86AudioLowerVolume",  hl.dsp.exec_cmd("wpctl set-volume -l 1.2 @DEFAULT_AUDIO_SINK@ 5%-"),  { repeating = true })
hl.bind("F4",                    hl.dsp.exec_cmd("wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle"),          { repeating = true })
hl.bind("XF86AudioMicMute",      hl.dsp.exec_cmd("wpctl set-mute @DEFAULT_SOURCE@ toggle"),              { locked = true })
-- hl.bind("XF86AudioMute", hl.dsp.exec_cmd("wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle"), { locked = true })

-- Launchers
hl.bind(mod .. " + Return", hl.dsp.exec_cmd("wezterm"))
hl.bind(mod .. " + W",      hl.dsp.exec_cmd("firefox-developer-edition"))
-- hl.bind(mod .. " + W",   hl.dsp.exec_cmd("chromium"))
hl.bind(mod .. " + E",      hl.dsp.exec_cmd("nautilus"))
hl.bind(mod .. " + X",      hl.dsp.exec_cmd("wezterm"))
hl.bind(mod .. " + C",      hl.dsp.exec_cmd("zeditor"))
hl.bind(mod .. " + SHIFT + L", hl.dsp.exec_cmd("hyprlock"))

-- Screenshots
hl.bind(mod .. " + SHIFT + S",     hl.dsp.exec_cmd("grim -g \"$(slurp)\" ~/Pictures/Screenshots/$(date +\\%Y\\%m\\%d\\%H\\%m\\%S).png"))
hl.bind(mod .. " + SHIFT + ALT + S", hl.dsp.exec_cmd("grim ~/Pictures/Screenshots/$(date +\\%Y\\%m\\%d\\%H\\%m\\%S).png"))

-- System
hl.bind("CTRL + ALT + Delete", hl.dsp.exit())
hl.bind("CTRL + ALT + Q",      hl.dsp.window.close())
hl.bind(mod .. " + F",         hl.dsp.window.float({ action = "toggle" }))
hl.bind(mod .. " + P",         hl.dsp.window.pin())
hl.bind(mod .. " + Z",         hl.dsp.window.fullscreen())
hl.bind(mod .. " + SHIFT + Z", hl.dsp.window.fullscreen_state({ internal = 0, client = 3 }))
hl.bind(mod .. " + G",         hl.dsp.group.toggle())
-- hl.bind(mod .. " + TAB",       hl.dsp.group.next())
-- hl.bind(mod .. " + SHIFT + TAB", hl.dsp.group.prev())

-- Focus (vim-style hjkl)
hl.bind(mod .. " + k", hl.dsp.focus({ direction = "up" }))
hl.bind(mod .. " + j", hl.dsp.focus({ direction = "down" }))
hl.bind(mod .. " + l", hl.dsp.focus({ direction = "right" }))
hl.bind(mod .. " + h", hl.dsp.focus({ direction = "left" }))

-- Workspace switching
hl.bind(mod .. " + left",  hl.dsp.focus({ workspace = "e-1" }))
hl.bind(mod .. " + right", hl.dsp.focus({ workspace = "e+1" }))
for i = 1, 9 do
  hl.bind(mod .. " + " .. i, hl.dsp.focus({ workspace = i }))
end

-- Move active window to workspace
hl.bind(mod .. " + SHIFT + left",  hl.dsp.window.move({ workspace = "e-1" }))
hl.bind(mod .. " + SHIFT + right", hl.dsp.window.move({ workspace = "e+1" }))
for i = 1, 9 do
  hl.bind(mod .. " + SHIFT + " .. i, hl.dsp.window.move({ workspace = i }))
end

-- Resize active window
hl.bind(mod .. " + CTRL + k", hl.dsp.window.resize({ x = 0, y = -20, relative = true }), { repeating = true })
hl.bind(mod .. " + CTRL + j", hl.dsp.window.resize({ x = 0, y = 20,  relative = true }), { repeating = true })
hl.bind(mod .. " + CTRL + l", hl.dsp.window.resize({ x = 20,  y = 0, relative = true }), { repeating = true })
hl.bind(mod .. " + CTRL + h", hl.dsp.window.resize({ x = -20, y = 0, relative = true }), { repeating = true })

-- Move active window (float)
hl.bind(mod .. " + ALT + k", hl.dsp.window.move({ x = 0, y = -20, relative = true }), { repeating = true })
hl.bind(mod .. " + ALT + j", hl.dsp.window.move({ x = 0, y = 20,  relative = true }), { repeating = true })
hl.bind(mod .. " + ALT + l", hl.dsp.window.move({ x = 20,  y = 0, relative = true }), { repeating = true })
hl.bind(mod .. " + ALT + h", hl.dsp.window.move({ x = -20, y = 0, relative = true }), { repeating = true })

-- Mouse binds: move / resize windows
hl.bind(mod .. " + mouse:272", hl.dsp.window.drag(),   { mouse = true })
hl.bind(mod .. " + mouse:273", hl.dsp.window.resize(), { mouse = true })
