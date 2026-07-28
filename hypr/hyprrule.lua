-- Window rules & layer rules
-- https://wiki.hypr.land/Configuring/Basics/Window-Rules/

-- Smart gaps: zero border/rounding on video/fullscreen workspaces
hl.window_rule({
  name  = "no-gaps-wtv1",
  match = { float = false, workspace = "w[tv1]" },
  border_size = 0,
  rounding    = 0,
})
hl.window_rule({
  name  = "no-gaps-f1",
  match = { float = false, workspace = "f[1]" },
  border_size = 0,
  rounding    = 0,
})

-- Tagging float
hl.window_rule({ match = { class = "blueberry.py" },                                tag = "+float" })
hl.window_rule({ match = { class = "org.gnome.Settings" },                          tag = "+float" })
hl.window_rule({ match = { class = "Color Picker" },                                tag = "+float" })
hl.window_rule({ match = { class = "org.kde.polkit-kde-authentication-agent-1" },   tag = "+float" })
hl.window_rule({ match = { class = "^steam$", title = "Friends List" },             tag = "+float" })

-- Tagging w800f (800x480 float)
hl.window_rule({ match = { class = "blueman-manager" },       tag = "+w800f" })
hl.window_rule({ match = { class = "nm-connection-editor" },  tag = "+w800f" })
hl.window_rule({ match = { class = "mpv" },                   tag = "+w800f" })
hl.window_rule({ match = { class = "org.pulseaudio.pavucontrol" },                tag = "+w800f" })
hl.window_rule({ match = { initial_class = "^firefox$", initial_title = "negative:^Mozilla Firefox$" },                 tag = "+w800f" })
hl.window_rule({ match = { initial_class = "^firefox-developer-edition$", initial_title = "negative:^Firefox Developer Edition$" }, tag = "+w800f" })

-- Tagging w999f (999x640 float)
hl.window_rule({ match = { class = "org.gnome.Nautilus" },    tag = "+w999f" })
hl.window_rule({ match = { class = "org.gnome.Calculator" },  tag = "+w999f" })
hl.window_rule({ match = { class = "org.gnome.Maps" },        tag = "+w999f" })
hl.window_rule({ match = { class = "org.gnome.Weather" },     tag = "+w999f" })
hl.window_rule({ match = { class = "xdg-desktop-portal-gtk" },   tag = "+w999f" })
hl.window_rule({ match = { class = "xdg-desktop-portal" },       tag = "+w999f" })
hl.window_rule({ match = { class = "xdg-desktop-portal-gnome" }, tag = "+w999f" })
hl.window_rule({ match = { class = "transmission-gtk" },      tag = "+w999f" })

-- Tagging wechat: fix border shadow
hl.window_rule({ match = { initial_class = "wechat", initial_title = "negative:Weixin" }, tag = "+wechat" })

-- Tag-based effects
hl.window_rule({ match = { tag = "float" },  float = true, center = true })
hl.window_rule({ match = { tag = "w800f" },  float = true, center = true, size = {800, 480} })
hl.window_rule({ match = { tag = "w999f" },  float = true, center = true, size = {999, 640} })
hl.window_rule({ match = { tag = "wechat" }, float = true, border_size = 0, no_blur = true, no_shadow = true })

-- AGS layer rules (commented out -- uncomment if needed)
-- hl.layer_rule({ name = "ags-blur",  match = { namespace = "ags" }, blur = true })
-- hl.layer_rule({ name = "ags-alpha", match = { namespace = "ags" }, ignore_alpha = 0 })
