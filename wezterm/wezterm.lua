local wezterm = require 'wezterm'
-- Rose Pine, kept for reference. To go back: restore the commented `colors` /
-- `window_frame` lines below and drop `color_scheme`.
local theme = require('theme').main

-- Translucent tab bar, as the Rose Pine theme had. The colours are Tokyo
-- Night's own tab palette at the same 0.6 alpha, so window_background_opacity
-- shows through: #1a1b26/#7aa2f7 active, #16161e/#545c7e inactive.
local active_tab = {
    bg_color = 'rgba(26, 27, 38, 0.6)',
    fg_color = 'rgba(122, 162, 247, 0.6)',
}
local inactive_tab = {
    bg_color = 'rgba(22, 22, 30, 0.6)',
    fg_color = 'rgba(84, 92, 126, 0.6)',
}

return {
    -- dpi = 384.0,
    color_scheme = 'Tokyo Night',
    keys = require('keys'),
    colors = {
        tab_bar = {
            background = inactive_tab.bg_color,
            active_tab = active_tab,
            inactive_tab = inactive_tab,
            inactive_tab_hover = active_tab,
            new_tab = inactive_tab,
            new_tab_hover = active_tab,
            inactive_tab_edge = inactive_tab.fg_color, -- (Fancy tab bar only)
        },
    },
    -- window_frame = theme.window_frame(),
    -- font = wezterm.font 'Twitter Color Emoji',
    font = wezterm.font_with_fallback {
        'Maple Mono NF CN',
        'Twitter Color Emoji',
    },
    font_size = 12.5,
    default_cursor_style = 'BlinkingBlock',

    window_close_confirmation = 'NeverPrompt',
    hide_tab_bar_if_only_one_tab = true,
    tab_bar_at_bottom = false,
    tab_max_width = 20,

    enable_scroll_bar = false,
    use_fancy_tab_bar = false,
    window_padding = {
        top    = '0',
        right  = '0',
        bottom = '0',
        left   = '0',
    },

    enable_wayland = true,
    inactive_pane_hsb = {
        saturation = 0.6,
        brightness = 0.6,
    },

    window_background_opacity = 0.6,
    text_background_opacity = 1.0,
}
