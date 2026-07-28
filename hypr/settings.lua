-- Environment variables
hl.env("GTK_IM_MODULE",                       "fcitx5")
hl.env("SDL_IM_MODULE",                       "fcitx5")
hl.env("QT_IM_MODULE",                        "fcitx5")
hl.env("XMODIFIERS",                          "@im=fcitx5")
hl.env("GDK_SCALE",                           "2")
hl.env("QT_SCALE_FACTOR",                     "1")
hl.env("QT_AUTO_SCREEN_SCALE_FACTOR",         "0")
hl.env("QT_ENABLE_HIGHDPI_SCALING",           "1")
hl.env("QT_SCALE_FACTOR_ROUNDING_POLICY",     "RoundPreferFloor")
hl.env("XCURSOR_SIZE",                        "24")
hl.env("QT_WAYLAND_DISABLE_WINDOWDECORATION", "1")
hl.env("GDK_BACKEND",                         "wayland,x11")
hl.env("XCURSOR_THEME",                       "Bibata-Modern-Amber")

-- General & input
hl.config({
  general = {
    resize_on_border = true,
    gaps_in  = 2,
    gaps_out = 6,
    border_size = 1,
    layout = "dwindle",
  },

  misc = {
    layers_hog_keyboard_focus = true,
    disable_splash_rendering  = true,
    force_default_wallpaper   = 0,
    disable_hyprland_logo     = true,
  },

  binds = {
    allow_workspace_cycles = true,
  },

  dwindle = {
    preserve_split = true,
  },

  group = {
    groupbar = {
      enabled       = true,
      col = {
        active   = "rgb(DAA520)",
        inactive = "rgb(eeeeee)",
      },
      render_titles = false,
      height  = 0,
      font_size = 0,
    },
  },

  xwayland = {
    force_zero_scaling = true,
  },

  input = {
    kb_layout   = "us",
    follow_mouse = 1,
    sensitivity = 0,

    touchpad = {
      disable_while_typing = false,
      natural_scroll       = true,
      scroll_factor        = 0.5,
      clickfinger_behavior = false,
      tap_to_click         = true,
      drag_lock            = false,
    },
  },
})

-- Workspace rules: zero gaps for video/fullscreen workspaces
hl.workspace_rule({ workspace = "w[tv1]", gaps_out = 0, gaps_in = 0 })
hl.workspace_rule({ workspace = "f[1]",   gaps_out = 0, gaps_in = 0 })

-- Gesture: 3-finger swipe for workspace switching
hl.gesture({
  fingers   = 3,
  direction = "horizontal",
  action    = "workspace",
})
