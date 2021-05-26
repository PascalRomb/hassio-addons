[global]
   netbios name = {{ env "HOSTNAME" }}
   workgroup = {{ .workgroup }}
   server string = Samba Home Assistant

   security = user
   ntlm auth = yes

   load printers = no
   disable spoolss = yes

   log level = 2

   bind interfaces only = yes
   interfaces = {{ .interface }}
   hosts allow = {{ .allow_hosts | join " " }}

   {{ if .compatibility_mode }}
   client min protocol = NT1
   server min protocol = NT1
   {{ end }}

[nas]
   browseable = yes
   writeable = yes
   path = /nas

   valid user = {{ .username }}
   force user = root
   force group = root
   veto_files = /{{ .veto_files | join "/" }}/
   delete veto files = {{ eq (len .veto_files) 0 | ternary "no" "yes" }}
