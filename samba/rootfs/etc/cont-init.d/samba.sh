#!/usr/bin/with-contenv bashio
# ==============================================================================
# Prepare the Samba service for running
# ==============================================================================
declare password
declare username
declare interface
declare disk
export HOSTNAME

# Check Login data
if ! bashio::config.has_value 'username' || ! bashio::config.has_value 'password'; then
    bashio::exit.nok "Setting a username and password is required!"
fi

# Read hostname from API or setting default "hassio"
HOSTNAME=$(bashio::info.hostname)
if bashio::var.is_empty "${HOSTNAME}"; then
    bashio::log.warning "Can't read hostname, using default."
    HOSTNAME="hassio"
fi

# Get default interface
interface=$(bashio::network.name)

bashio::log.info "Using hostname=${HOSTNAME} interface=${interface}"

#mount disks
bashio::log.info "Protection Mode is $(bashio::addon.protected)"
if $(bashio::addon.protected) && bashio::config.has_value 'disk' ; then
     bashio::log.warning "disk ignored because ADDON in Protected Mode!"
     bashio::config.suggest "protected" "disk only work when Protection mode is disabled"
elif bashio::config.has_value 'disk'; then
     bashio::log.warning "MoreDisk option found!"

    disk=$(bashio::config 'disk')
    bashio::log.info "Disk mounting.. ${disk}"
    
    mkdir nas/ && \
    mount -t auto /dev/disk/by-label/$disk /nas -o nosuid,relatime,noexec && \
    bashio::log.info "Success!"
fi

# Generate Samba configuration.
jq ".interface = \"${interface}\"" /data/options.json \
    | tempio \
      -template /usr/share/tempio/smb.gtpl \
      -out /etc/samba/smb.conf

# Init user
username=$(bashio::config 'username')
password=$(bashio::config 'password')
addgroup "${username}"
adduser -D -H -G "${username}" -s /bin/false "${username}"
# shellcheck disable=SC1117
echo -e "${password}\n${password}" \
    | smbpasswd -a -s -c "/etc/samba/smb.conf" "${username}"
