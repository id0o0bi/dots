# My Dotfiles
> Aesthetic Hyprland + AGS setup with Rosé Pine 🌸

A personalized dotfiles collection featuring a Wayland workflow built around [Hyprland](https://github.com/hyprwm/Hyprland) and [AGS](https://github.com/Aylur/ags), themed with the beautiful [Rosé Pine](https://rosepinetheme.com/) color palette.

# Preview

<details>
<summary>Click to show/hide screenshot 📸</summary>

<img src="./ags/assets/screenshot.jpeg" alt="Desktop screenshot" align="right" width="450px">

</details>

# Components

- **WM**        : [Hyprland](https://github.com/hyprwm/Hyprland) :art: WM for Wayland
- **Colors**    : [Rosé Pine](https://rosepinetheme.com/) :rainbow: Something beautiful
- **Shell**     : [fish](https://fishshell.com/) :fish: Finally, a command line shell for the 90s
- **Terminal**  : [wezterm](https://wezterm.org/) :computer: A powerful terminal emulator and multiplexer
- **Desktop**   : [AGS](https://github.com/Aylur/ags) :rocket: Framework for crafting Wayland Desktop Shells
- **Wallpaper** : [wbg](https://codeberg.org/dnkl/wbg) :framed_picture: Super simple wallpaper application

# Prerequisites

```bash
# Arch Linux (main packages)
sudo pacman -S hyprland fish wezterm

# AGS (from AUR or build from source)
yay -S ags-hyprland-git
# or
paru -S ags-hyprland-git
```

# Installation

```bash
# Clone the repository
git clone https://github.com/derren/dots ~/.dotfiles
cd ~/.dotfiles

# Symlink configurations
ln -s $(pwd)/ags ~/.config/ags
ln -s $(pwd)/fish ~/.config/fish
ln -s $(pwd)/wezterm ~/.config/wezterm
ln -s $(pwd)/hypr ~/.config/hypr
# Add more as needed...
```

# Fonts

Install these fonts (AUR: [Nerd Fonts Group](https://archlinux.org/groups/any/nerd-fonts/)):

- Ubuntu Nerd Font
- JetBrains Mono Nerd Font
- Twitter Color Emoji

```bash
yay -S ttf-ubuntu-nerd ttf-jetbrains-mono-nerd ttf-twemoji-color
```

# License

MIT - Feel free to use anything here! 🎉

# Credits

- [Rosé Pine](https://rosepinetheme.com/) for the amazing color palette
- [Hyprland](https://github.com/hyprwm/Hyprland) team for the fantastic WM
- [Aylur/AGS](https://github.com/Aylur/ags) for the desktop shell framework
