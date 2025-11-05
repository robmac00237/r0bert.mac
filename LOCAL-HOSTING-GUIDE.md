# 🖥️ Local Hosting Guide
## Run Family Scheduler on Your Old Laptop

This guide will help you turn your old laptop into a dedicated web server for your Family Scheduler app!

---

## Table of Contents
1. [Why Host Locally?](#why-host-locally)
2. [What You Need](#what-you-need)
3. [Ubuntu/Linux Setup](#ubuntulinux-setup)
4. [Windows Setup](#windows-setup)
5. [Mac Setup](#mac-setup)
6. [Network Configuration](#network-configuration)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Why Host Locally?

**Benefits:**
- ✅ **Complete Privacy** - Data never leaves your home
- ✅ **No Monthly Costs** - No hosting fees
- ✅ **Full Control** - You own everything
- ✅ **Fast** - Local network = super fast
- ✅ **Secure** - Only accessible from your home WiFi

**Perfect For:**
- Family apps (like this one!)
- Testing and development
- Private projects

---

## What You Need

### Hardware
- Old laptop (even 10+ years old works!)
- Minimum 2GB RAM
- 10GB free disk space
- WiFi or ethernet connection

### Software
- Ubuntu, Windows, or Mac OS
- Basic terminal/command line knowledge

---

## Ubuntu/Linux Setup

### Step 1: Install Apache Web Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Apache
sudo apt install apache2 -y

# Start Apache
sudo systemctl start apache2

# Enable Apache to start on boot
sudo systemctl enable apache2

# Check Apache is running
sudo systemctl status apache2
```

### Step 2: Copy Your App Files

```bash
# Navigate to web server directory
cd /var/www/html

# Remove default Apache page
sudo rm index.html

# Copy your app files here
# Option A: If files are on USB drive
sudo cp -r /path/to/your/r0bert.mac/* /var/www/html/

# Option B: Clone from GitHub
sudo git clone https://github.com/robmac00237/r0bert.mac.git /var/www/html/temp
sudo mv /var/www/html/temp/* /var/www/html/
sudo rm -rf /var/www/html/temp

# Set proper permissions
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
```

### Step 3: Find Your Server's IP Address

```bash
# Get your local IP address
hostname -I

# Output will be something like: 192.168.1.100
# Write this down - you'll need it!
```

### Step 4: Access the App

From any device on your home WiFi:
```
http://192.168.1.100
```

Replace `192.168.1.100` with your actual IP address!

---

## Windows Setup

### Step 1: Install XAMPP

1. Download XAMPP from: https://www.apachefriends.org/
2. Install XAMPP (choose default options)
3. Run XAMPP Control Panel as Administrator
4. Click "Start" next to Apache

### Step 2: Copy Your App Files

1. Open File Explorer
2. Navigate to: `C:\xampp\htdocs\`
3. Delete the default files in this folder
4. Copy all your app files into `C:\xampp\htdocs\`

Your structure should look like:
```
C:\xampp\htdocs\
├── index.html
├── dashboard.html
├── setup.html
├── css/
├── js/
└── ...
```

### Step 3: Find Your IP Address

1. Press `Windows + R`
2. Type `cmd` and press Enter
3. Type `ipconfig` and press Enter
4. Look for "IPv4 Address" under your WiFi adapter
5. Write down the IP (e.g., `192.168.1.100`)

### Step 4: Configure Windows Firewall

1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Find "Apache HTTP Server" and check both Private and Public
4. Click OK

### Step 5: Access the App

From any device on your home WiFi:
```
http://192.168.1.100
```

---

## Mac Setup

### Step 1: Enable Apache (Built-in!)

Mac has Apache pre-installed!

```bash
# Start Apache
sudo apachectl start

# Verify it's running
curl http://localhost
```

### Step 2: Copy Your App Files

```bash
# Navigate to web directory
cd /Library/WebServer/Documents

# Remove default file
sudo rm index.html.en

# Copy your files
sudo cp -r ~/path/to/your/r0bert.mac/* /Library/WebServer/Documents/

# Set permissions
sudo chmod -R 755 /Library/WebServer/Documents
```

### Step 3: Find Your IP Address

```bash
# Get your local IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Or use the GUI:
# System Preferences → Network → Your connection → IP Address
```

### Step 4: Access the App

From any device on your home WiFi:
```
http://192.168.1.x
```

---

## Network Configuration

### Option 1: Use IP Address (Simple)

**Pros:** Easy, no configuration needed
**Cons:** IP might change, hard to remember

Access via: `http://192.168.1.100`

### Option 2: Set Static IP (Recommended)

This prevents your laptop's IP from changing.

#### Ubuntu:
```bash
# Edit netplan configuration
sudo nano /etc/netplan/01-netcfg.yaml

# Add static IP configuration:
network:
  version: 2
  ethernets:
    enp0s3:  # Replace with your interface name
      dhcp4: no
      addresses: [192.168.1.100/24]
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]

# Apply changes
sudo netplan apply
```

#### Windows:
1. Control Panel → Network and Sharing Center
2. Change adapter settings
3. Right-click your connection → Properties
4. Select "Internet Protocol Version 4 (TCP/IPv4)"
5. Click Properties
6. Select "Use the following IP address"
7. Enter:
   - IP address: `192.168.1.100`
   - Subnet mask: `255.255.255.0`
   - Default gateway: `192.168.1.1`
   - Preferred DNS: `8.8.8.8`

#### Mac:
1. System Preferences → Network
2. Select your connection → Advanced
3. TCP/IP tab
4. Configure IPv4: Manually
5. Enter IP address: `192.168.1.100`
6. Subnet mask: `255.255.255.255.0`
7. Router: `192.168.1.1`

### Option 3: Custom Domain Name (Advanced)

Make your app accessible at `http://family.local` instead of IP!

#### Ubuntu (using Avahi):
```bash
# Install Avahi
sudo apt install avahi-daemon -y

# Set hostname
sudo hostnamectl set-hostname family

# Now accessible at: http://family.local
```

#### Windows/Mac:
Use router's DNS settings or hosts file editing.

---

## Security Best Practices

### 1. Laptop Physical Security
- Keep laptop in a secure location
- Set strong login password
- Enable disk encryption

### 2. Network Security
```bash
# Only allow access from local network
# Ubuntu Apache configuration:
sudo nano /etc/apache2/apache2.conf

# Add this section:
<Directory /var/www/html>
    Require ip 192.168.1.0/24
</Directory>

# Restart Apache
sudo systemctl restart apache2
```

### 3. Firewall Configuration
```bash
# Ubuntu: Allow only local network
sudo ufw allow from 192.168.1.0/24 to any port 80
sudo ufw enable
```

### 4. Automatic Backups
```bash
# Create backup script
nano ~/backup-family-app.sh

# Add this content:
#!/bin/bash
DATE=$(date +%Y-%m-%d)
tar -czf ~/backups/family-app-$DATE.tar.gz /var/www/html/
find ~/backups/ -name "family-app-*.tar.gz" -mtime +30 -delete

# Make executable
chmod +x ~/backup-family-app.sh

# Add to crontab (daily backup at 2 AM)
crontab -e
# Add line:
0 2 * * * ~/backup-family-app.sh
```

### 5. Keep System Updated
```bash
# Ubuntu: Auto-updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## Advanced Features

### Auto-Start on Boot

#### Ubuntu:
Apache starts automatically after `systemctl enable apache2`

#### Windows:
XAMPP Control Panel → Config → Service Settings → Install Apache as Service

#### Mac:
```bash
# Create launch daemon
sudo nano /Library/LaunchDaemons/org.apache.httpd.plist

# Apache will start automatically
```

### Keep Laptop Awake

#### Ubuntu:
```bash
# Disable suspend when lid is closed
sudo nano /etc/systemd/logind.conf

# Change:
HandleLidSwitch=ignore

# Restart service
sudo systemctl restart systemd-logind
```

#### Windows:
Control Panel → Power Options → Choose when to turn off display → Set to Never

#### Mac:
System Preferences → Energy Saver → Prevent computer from sleeping automatically

### Monitor Server Health

```bash
# Create monitoring script
nano ~/check-server.sh

#!/bin/bash
if ! curl -s http://localhost > /dev/null; then
    sudo systemctl restart apache2
    echo "Server restarted at $(date)" >> ~/server-log.txt
fi

# Run every 5 minutes
crontab -e
# Add:
*/5 * * * * ~/check-server.sh
```

---

## Troubleshooting

### "Can't access from phone"
1. Make sure phone is on same WiFi network
2. Check firewall isn't blocking port 80
3. Try IP address instead of hostname
4. Disable VPN on phone

### "IP address keeps changing"
- Set static IP (see Network Configuration section)

### "Server stops when laptop sleeps"
- Disable sleep mode (see Keep Laptop Awake section)

### "Slow performance"
```bash
# Check Apache status
sudo systemctl status apache2

# Check system resources
htop

# If RAM is low, close unnecessary programs
```

### "Can't write to storage"
```bash
# Fix permissions (Ubuntu)
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
```

---

## Google Maps API Setup

Since you're hosting locally, you'll need to:

1. Get API key from Google Cloud Console
2. Open `js/maps-config.js`
3. Replace `YOUR_API_KEY_HERE` with your actual key
4. Restrict API key to your local IP range:
   - In Google Cloud Console
   - API Credentials → Edit API key
   - Application restrictions: HTTP referrers
   - Add: `192.168.1.*`

---

## Accessing from Outside Home (Optional)

⚠️ **WARNING:** This makes your app accessible from the internet!

### Using Port Forwarding (Not Recommended for Beginners)

1. Log into your router (usually `192.168.1.1`)
2. Find "Port Forwarding" or "Virtual Servers"
3. Forward external port 8080 to internal port 80 of your laptop's IP
4. Access via your public IP (find at: https://whatismyip.com)

**Security concerns:**
- Your app is now public
- Risk of unauthorized access
- Use strong authentication
- Consider VPN instead

### Using Tailscale VPN (Recommended)

Tailscale creates a secure private network:

1. Install Tailscale on laptop and devices
2. Access securely from anywhere
3. No port forwarding needed
4. Much more secure

https://tailscale.com/

---

## Performance Tips

1. **Use SSD if possible** - Faster than HDD
2. **Close unnecessary programs** - Free up RAM
3. **Use lightweight Linux** - Ubuntu Server uses less resources
4. **Enable caching** - Apache mod_cache
5. **Optimize images** - Compress icon files

---

## Estimated Costs

**Hardware:**
- Old laptop: FREE (you already have it!)
- Power usage: ~$2-5/month electricity

**Total: $2-5/month** (Much cheaper than cloud hosting!)

---

## Quick Reference

| Task | Ubuntu Command | Windows | Mac |
|------|---------------|---------|-----|
| Start server | `sudo systemctl start apache2` | XAMPP → Start Apache | `sudo apachectl start` |
| Stop server | `sudo systemctl stop apache2` | XAMPP → Stop Apache | `sudo apachectl stop` |
| Restart server | `sudo systemctl restart apache2` | XAMPP → Restart | `sudo apachectl restart` |
| Check status | `sudo systemctl status apache2` | XAMPP Control Panel | `sudo apachectl status` |
| Find IP | `hostname -I` | `ipconfig` | `ifconfig` |
| Web files location | `/var/www/html` | `C:\xampp\htdocs` | `/Library/WebServer/Documents` |

---

## Need Help?

1. Check server logs:
   - Ubuntu: `/var/log/apache2/error.log`
   - Windows: `C:\xampp\apache\logs\error.log`
   - Mac: `/var/log/apache2/error_log`

2. Test if server is running:
   ```bash
   curl http://localhost
   ```

3. Test from another device:
   ```bash
   ping 192.168.1.100  # Your laptop's IP
   ```

---

**Congratulations!** 🎉

Your old laptop is now a dedicated family web server!

Access your app from any device on your home WiFi at:
```
http://YOUR-LAPTOP-IP
```

Enjoy your private, secure family scheduler!
